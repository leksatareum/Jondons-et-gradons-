import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { GmCombatScreen } from './GmCombatScreen';
import { SheetView, type SheetTab } from './SheetView';
import { SignInScreen } from './SignInScreen';
import { SyncBanner } from './SyncBanner';
import { useCampaign } from './useCampaign';
import { observerCompte, seConnecter, seDeconnecter, type CompteConnecte } from '../sync/session';
import { chargerAppartenances, choisirCampagne, type Appartenance } from '../sync/membership';
import { withParty } from './roster';
import { createEncounter, saveEncounter } from '../sync/mutations';
import type { CampaignSnapshot, CampaignSync } from '../sync/campaign-sync';
import type { EncounterState } from '../domain/encounter';

/**
 * L'enchaînement des écrans.
 *
 * Trois portes successives, dans cet ordre : est-on connecté, à quelle table,
 * et de quel côté de l'écran. Chacune a son état d'attente et son état
 * d'échec — un écran vide qui ne dit pas pourquoi il est vide est la panne la
 * plus pénible à diagnostiquer à distance, un soir de partie.
 */

export function App({ client }: { client: SupabaseClient }) {
  const [compte, setCompte] = useState<CompteConnecte | null | undefined>(undefined);

  useEffect(() => observerCompte(client, setCompte), [client]);

  const connecter = useCallback(
    async (email: string, motDePasse: string) => { await seConnecter(client, email, motDePasse); },
    [client],
  );

  if (compte === undefined) return <Attente>Ouverture…</Attente>;
  if (compte === null) return <SignInScreen onSubmit={connecter} />;
  return <Connecte client={client} compte={compte} />;
}

function Connecte({ client, compte }: { client: SupabaseClient; compte: CompteConnecte }) {
  const [appartenances, setAppartenances] = useState<Appartenance[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [choisie, setChoisie] = useState<string | null>(null);

  useEffect(() => {
    let vivant = true;
    chargerAppartenances(client, compte.userId)
      .then((liste) => { if (vivant) setAppartenances(liste); })
      .catch((cause: unknown) => { if (vivant) setErreur(String(cause)); });
    return () => { vivant = false; };
  }, [client, compte.userId]);

  if (erreur) return <Echec titre="Impossible de lire tes tables" detail={erreur} client={client} />;
  if (!appartenances) return <Attente>Recherche de ta table…</Attente>;

  const choix = choisirCampagne(appartenances);

  if (choix.quoi === 'aucune') {
    return (
      <Echec
        titre="Aucune table"
        detail={`Le compte ${compte.email} n'est rattaché à aucune campagne. C'est au MJ de t'enrôler.`}
        client={client}
      />
    );
  }

  const campagne = choix.quoi === 'une'
    ? choix.campagne
    : choix.campagnes.find((c) => c.campaignId === choisie);

  if (!campagne) {
    return (
      <Liste
        campagnes={choix.quoi === 'plusieurs' ? choix.campagnes : []}
        onChoisir={setChoisie}
      />
    );
  }

  return <Table client={client} compte={compte} campagne={campagne} />;
}

function Table({ client, compte, campagne }: {
  client: SupabaseClient;
  compte: CompteConnecte;
  campagne: Appartenance;
}) {
  const { snapshot, sync } = useCampaign(client, campagne.campaignId);
  const [onglet, setOnglet] = useState<SheetTab>('combat');
  /** Fiche que le MJ regarde. `null` : il est sur sa liste d'initiative. */
  const [ficheOuverte, setFicheOuverte] = useState<string | null>(null);

  // La fiche du joueur, c'est la sienne — la propriété vient de la base, pas
  // d'un choix d'écran.
  const maFiche = useMemo(
    () => snapshot.sheets.find((fiche) => fiche.ownerId === compte.userId) ?? null,
    [snapshot.sheets, compte.userId],
  );

  const bandeau = <SyncBanner status={snapshot.status} onRefresh={() => sync.refresh()} />;
  const rencontre = snapshot.encounter?.state;

  if (campagne.estMj) {
    const ouverte = snapshot.sheets.find((fiche) => fiche.id === ficheOuverte);
    if (ouverte) {
      return (
        <SheetView
          client={client}
          sync={sync}
          fiche={ouverte}
          rencontre={rencontre}
          onglet={onglet}
          onOnglet={setOnglet}
          entete={<BandeauMj nom={ouverte.data.name} onRetour={() => setFicheOuverte(null)} />}
        />
      );
    }
    return (
      <>
        {bandeau}
        <EcranMj
          client={client}
          sync={sync}
          campaignId={campagne.campaignId}
          snapshot={snapshot}
          onOuvrirFiche={setFicheOuverte}
        />
      </>
    );
  }

  if (!maFiche) {
    return (
      <>
        {bandeau}
        <Echec
          titre="Pas encore de personnage"
          detail={`Aucune fiche ne t'appartient dans « ${campagne.nom} ».`}
          client={client}
        />
      </>
    );
  }

  return (
    <SheetView
      client={client}
      sync={sync}
      fiche={maFiche}
      rencontre={rencontre}
      onglet={onglet}
      onOnglet={setOnglet}
      entete={bandeau}
    />
  );
}

/**
 * Le bandeau que voit le MJ sur la fiche d'un autre.
 *
 * Il dit en permanence de qui est la fiche ouverte. Sans lui, le MJ qui
 * applique des dégâts sur un écran identique à celui d'un joueur n'a aucun
 * moyen de savoir qu'il s'est trompé de personnage — et il ne s'en apercevrait
 * qu'au moment où le joueur, lui, verrait ses points de vie fondre.
 */
function BandeauMj({ nom, onRetour }: { nom: string; onRetour: () => void }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 15,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', paddingTop: 'calc(8px + env(safe-area-inset-top))',
      background: 'var(--accent-wash)', borderBottom: '1px solid var(--accent)',
    }}>
      <button
        onClick={onRetour}
        className="lbl"
        style={{
          minHeight: 36, padding: '0 12px', borderRadius: 999,
          border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 700,
        }}
      >
        ← Combat
      </button>
      <div className="lbl" style={{ color: 'var(--accent)', textTransform: 'none' }}>
        Tu modifies la fiche de <strong>{nom}</strong>
      </div>
    </div>
  );
}

/** Rencontre par défaut : le combat n'est pas lancé, personne n'est en tour par tour. */
const vide: EncounterState = { turnIndex: -1, round: 0, combatants: [] };

/**
 * L'écran du MJ, branché sur la base.
 *
 * Deux choses s'y jouent, qu'il vaut mieux ne pas confondre :
 *
 * · **Ce qui s'affiche** vient de la base, complété par le groupe — le MJ voit
 *   ses joueurs dans la liste avant même qu'une rencontre existe, sans qu'on
 *   ait rien écrit pour autant. Rien n'est créé tant qu'il n'a rien fait.
 * · **Ce qu'il fait** part aussitôt en base. Le brouillon local n'existe que
 *   le temps de l'aller-retour : l'écran répond au doigt sans attendre le
 *   réseau, puis la ligne renvoyée par la base reprend la main. Sans lui, tenir
 *   « Suivant » deux fois de suite perdrait le premier appui.
 */
function EcranMj({ client, sync, campaignId, snapshot, onOuvrirFiche }: {
  client: SupabaseClient;
  sync: CampaignSync;
  campaignId: string;
  snapshot: CampaignSnapshot;
  onOuvrirFiche: (sheetId: string) => void;
}) {
  const [brouillon, setBrouillon] = useState<EncounterState | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  // Deux appuis rapprochés avant que la première création réponde créeraient
  // deux rencontres pour la même table.
  const creation = useRef<Promise<string> | null>(null);

  const stocke = snapshot.encounter;

  // Le brouillon ne survit pas à l'écho de la base : une fois la ligne revenue,
  // c'est elle qui fait foi, sinon l'écran du MJ divergerait en silence.
  useEffect(() => { setBrouillon(null); }, [stocke?.version]);

  const affiche = useMemo(
    () => withParty(brouillon ?? stocke?.state ?? vide, snapshot.sheets),
    [brouillon, stocke?.state, snapshot.sheets],
  );

  const changer = useCallback((suivant: EncounterState) => {
    setBrouillon(suivant);
    setErreur(null);
    void (async () => {
      try {
        if (stocke) {
          await saveEncounter(client, sync, stocke.id, suivant);
          return;
        }
        creation.current ??= createEncounter(client, sync, campaignId, suivant)
          .then((row) => row.id);
        const id = await creation.current;
        // La création a pu être lancée par l'appui précédent : cet appui-ci
        // doit alors se rabattre sur une mise à jour, pas sur une seconde
        // rencontre.
        if (id) await saveEncounter(client, sync, id, suivant);
      } catch (cause: unknown) {
        creation.current = null;
        setBrouillon(null);
        setErreur(String(cause));
      }
    })();
  }, [client, sync, campaignId, stocke]);

  return (
    <>
      {erreur && (
        <p role="alert" style={{
          margin: 0, padding: '8px 14px', fontSize: 12,
          background: 'var(--vital)', color: 'var(--accent-ink)',
        }}>
          {erreur}
        </p>
      )}
      <GmCombatScreen
        state={affiche}
        onChange={changer}
        onOpenSheet={(combatantId) => {
          // L'identifiant du combattant issu du groupe EST celui de la fiche
          // (voir `withParty`) : une créature, elle, n'en a pas.
          if (snapshot.sheets.some((fiche) => fiche.id === combatantId)) onOuvrirFiche(combatantId);
        }}
      />
    </>
  );
}

function Liste({ campagnes, onChoisir }: {
  campagnes: Appartenance[];
  onChoisir: (id: string) => void;
}) {
  return (
    <main style={centre}>
      <div style={{ width: '100%', maxWidth: 340, display: 'grid', gap: 10 }}>
        <h1 className="ttl" style={{ margin: '0 0 8px', fontSize: 22 }}>Quelle table ?</h1>
        {campagnes.map((campagne) => (
          <button
            key={campagne.campaignId}
            onClick={() => onChoisir(campagne.campaignId)}
            style={ligne}
          >
            <span>{campagne.nom}</span>
            {campagne.estMj && <span className="lbl" style={{ color: 'var(--accent)' }}>MJ</span>}
          </button>
        ))}
      </div>
    </main>
  );
}

function Attente({ children }: { children: React.ReactNode }) {
  return <main style={centre}><p style={{ color: 'var(--muted)', fontSize: 14 }}>{children}</p></main>;
}

function Echec({ titre, detail, client }: { titre: string; detail: string; client: SupabaseClient }) {
  return (
    <main style={centre}>
      <div style={{ maxWidth: 340, textAlign: 'center' }}>
        <h1 className="ttl" style={{ margin: 0, fontSize: 20 }}>{titre}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5 }}>{detail}</p>
        <button onClick={() => void seDeconnecter(client)} style={secondaire}>Se déconnecter</button>
      </div>
    </main>
  );
}

const centre: React.CSSProperties = {
  minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24,
};

const ligne: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  minHeight: 'var(--tap)', padding: '0 14px',
  borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)',
  background: 'var(--surface)', fontSize: 15, textAlign: 'left',
};

const secondaire: React.CSSProperties = {
  minHeight: 'var(--tap)', padding: '0 16px', marginTop: 8,
  borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)',
  color: 'var(--muted)', fontSize: 13,
};
