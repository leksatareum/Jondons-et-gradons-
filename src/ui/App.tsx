import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CombatScreen } from './CombatScreen';
import { GmCombatScreen } from './GmCombatScreen';
import { SignInScreen } from './SignInScreen';
import { SyncBanner } from './SyncBanner';
import { useCampaign } from './useCampaign';
import { observerCompte, seConnecter, seDeconnecter, type CompteConnecte } from '../sync/session';
import { chargerAppartenances, choisirCampagne, type Appartenance } from '../sync/membership';
import { demoCards } from './demo-data';
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

  // La fiche du joueur, c'est la sienne — la propriété vient de la base, pas
  // d'un choix d'écran.
  const maFiche = useMemo(
    () => snapshot.sheets.find((fiche) => fiche.ownerId === compte.userId) ?? null,
    [snapshot.sheets, compte.userId],
  );

  const bandeau = <SyncBanner status={snapshot.status} onRefresh={() => sync.refresh()} />;

  if (campagne.estMj) {
    return (
      <>
        {bandeau}
        <GmCombatScreen initial={snapshot.encounter?.state ?? vide} />
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

  const rencontre = snapshot.encounter?.state;
  const enCombat = rencontre != null && rencontre.turnIndex >= 0;
  const actif = enCombat ? rencontre.combatants[rencontre.turnIndex] : undefined;

  return (
    <>
      {bandeau}
      <CombatScreen
        sheet={maFiche.data}
        cards={demoCards}
        turn={
          enCombat
            ? {
                mode: 'combat',
                // Le lien fiche ↔ combattant se fait par le nom du personnage :
                // c'est la seule clé commune tant qu'un combattant n'est pas
                // rattaché à une fiche côté base.
                isYourTurn: actif?.name === maFiche.data.name,
                holder: actif?.name,
              }
            : { mode: 'libre' }
        }
      />
    </>
  );
}

/** Rencontre par défaut : le combat n'est pas lancé, personne n'est en tour par tour. */
const vide: EncounterState = { turnIndex: -1, round: 0, combatants: [] };

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
