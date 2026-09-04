import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { GmCombatScreen } from './GmCombatScreen';
import { SheetView, type SheetTab } from './SheetView';
import { JournalScreen } from './JournalScreen';
import { SettingsScreen } from './SettingsScreen';
import { ToastStack, useToastsDeCampagne } from './notifications-toast';
import { PreparedEncountersScreen } from './PreparedEncountersScreen';
import { SignInScreen } from './SignInScreen';
import { NewPasswordScreen } from './NewPasswordScreen';
import { SyncBanner } from './SyncBanner';
import { useCampaign } from './useCampaign';
import {
  definirMotDePasse, demanderReinitialisation, lireLienDeRecuperation, observerCompte,
  observerRecuperation, seConnecter, seDeconnecter,
  type CompteConnecte, type EtatRecuperation,
} from '../sync/session';
import { chargerAppartenances, choisirCampagne, type Appartenance } from '../sync/membership';
import {
  ecrireAppartenances, lireAppartenances, oublierTout, stockageDuNavigateur,
} from '../sync/cache-local';
import { withParty } from './roster';
import {
  createEncounter, createEncounterTemplate, createItemTransfer, createJournalEntry, createMessage, deleteEncounterTemplate,
  deleteItemTransfer, deleteJournalEntry, deleteMessage, saveEncounter, saveEncounterTemplate, saveJournalEntry,
  saveSheet,
} from '../sync/mutations';
import { addItem, recevoirItem, setGold } from '../model/inventory';
import { routeDuDon } from '../domain/don-du-mj';
import type { ButinPrepare } from '../domain/butin-prepare';
import type { CampaignSnapshot, CampaignSync } from '../sync/campaign-sync';
import { addCombatants, replaceCombatant, type Combatant, type EncounterState } from '../domain/encounter';
import { spellById } from '../content/spell-catalogue';
import { poserEtat } from '../model/etats';
import { ETAT_AUTO_AU_LANCER } from '../model/spell-self-etat';
import { heal, takeDamage } from '../model/damage';
import { deriveCharacter } from '../model/derive';
import { abilityModifier, effectiveAbilities, totalLevel } from '../model/character';
import { GmRestDialog, reposDeGroupe } from './GmRestDialog';

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
  /**
   * Retour d'un lien « mot de passe oublié ».
   *
   * Lu à la PREMIÈRE image, avant tout abonnement : le client Supabase digère
   * l'URL puis la nettoie, et l'événement `PASSWORD_RECOVERY` peut partir
   * avant qu'on soit là pour l'entendre (`observerRecuperation` reste branché
   * en second filet). Sans cette lecture, le lien ouvrirait simplement une
   * session — on entrerait dans sa fiche sans avoir changé quoi que ce soit,
   * et le mot de passe oublié le resterait.
   */
  const [recuperation, setRecuperation] = useState<EtatRecuperation>(
    () => lireLienDeRecuperation(window.location.hash, window.location.search),
  );

  useEffect(() => observerCompte(client, setCompte), [client]);
  useEffect(
    () => observerRecuperation(client, () => setRecuperation('a-choisir')),
    [client],
  );

  const connecter = useCallback(
    async (email: string, motDePasse: string) => { await seConnecter(client, email, motDePasse); },
    [client],
  );

  const oublier = useCallback(
    async (email: string) => {
      // Le retour se fait sur CETTE origine : le mail est lu sur le téléphone
      // qui a demandé le lien, c'est là que la session doit s'ouvrir.
      await demanderReinitialisation(client, email, window.location.origin);
    },
    [client],
  );

  const changerMotDePasse = useCallback(
    async (motDePasse: string) => {
      await definirMotDePasse(client, motDePasse);
      // Le lien a déjà ouvert la session : une fois le mot de passe posé, il
      // n'y a plus rien à faire qu'entrer normalement.
      setRecuperation('aucune');
    },
    [client],
  );

  const abandonnerLaRecuperation = useCallback(async () => {
    setRecuperation('aucune');
    // La session ouverte par le lien n'a servi qu'à ça : on la referme, sinon
    // « Annuler » ferait entrer dans l'appli sans mot de passe connu.
    await seDeconnecter(client);
  }, [client]);

  if (recuperation === 'a-choisir') {
    return <NewPasswordScreen onValider={changerMotDePasse} onAbandonner={abandonnerLaRecuperation} />;
  }
  if (compte === undefined) return <Attente>Ouverture…</Attente>;
  if (compte === null) {
    return (
      <SignInScreen
        onSubmit={connecter}
        onMotDePasseOublie={oublier}
        avis={recuperation === 'lien-expire'
          ? 'Ce lien a expiré ou a déjà servi. Demande-en un nouveau.'
          : null}
      />
    );
  }
  return <Connecte client={client} compte={compte} />;
}

function Connecte({ client, compte }: { client: SupabaseClient; compte: CompteConnecte }) {
  const [appartenances, setAppartenances] = useState<Appartenance[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [choisie, setChoisie] = useState<string | null>(null);

  useEffect(() => {
    let vivant = true;
    const stockage = stockageDuNavigateur();
    chargerAppartenances(client, compte.userId)
      .then((liste) => {
        if (!vivant) return;
        setAppartenances(liste);
        // Gardée pour le prochain démarrage sans réseau : sans elle, l'appli
        // s'ouvrirait bien hors ligne mais ne saurait pas à quelle table.
        if (stockage) ecrireAppartenances(stockage, compte.userId, liste);
      })
      .catch((cause: unknown) => {
        if (!vivant) return;
        const gardees = stockage ? lireAppartenances(stockage, compte.userId) : null;
        // Le réseau manque, mais on sait déjà à quelle table on joue : autant
        // entrer et laisser la campagne montrer ce qu'elle a gardé, plutôt
        // que d'afficher un échec là où il y a quelque chose à lire.
        if (gardees && gardees.length > 0) setAppartenances(gardees);
        else setErreur(String(cause));
      });
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
  // Le pop-up d'une nouvelle entrée de journal, d'un message ou d'un
  // secret — l'équivalent, quand l'appli est déjà ouverte, de la
  // notification push qui réveille le téléphone quand elle est fermée.
  // Avant tout retour anticipé : c'est un hook, il se lit à chaque rendu.
  const { toasts, fermer } = useToastsDeCampagne(snapshot, compte.userId);
  const pileDeToasts = <ToastStack toasts={toasts} onFermer={fermer} />;
  const [onglet, setOnglet] = useState<SheetTab>('combat');
  /** Fiche que le MJ regarde. `null` : il est sur sa liste d'initiative. */
  const [ficheOuverte, setFicheOuverte] = useState<string | null>(null);
  /** Écran principal du MJ, hors fiche ouverte : son combat, le journal, ou ses réglages. */
  const [ecranMj, setEcranMj] = useState<'combat' | 'rencontres' | 'journal' | 'reglages'>('combat');
  /** Le dialogue de repos du MJ — couvre toute la table ou une partie, en un geste. */
  const [reposEnCours, setReposEnCours] = useState(false);

  // La fiche du joueur, c'est la sienne — la propriété vient de la base, pas
  // d'un choix d'écran.
  const maFiche = useMemo(
    () => snapshot.sheets.find((fiche) => fiche.ownerId === compte.userId) ?? null,
    [snapshot.sheets, compte.userId],
  );

  const bandeau = (
    <SyncBanner
      status={snapshot.status}
      onRefresh={() => sync.refresh()}
      depuisLeCache={snapshot.depuisLeCache}
      dateDuCache={snapshot.dateDuCache}
    />
  );
  const rencontre = snapshot.encounter?.state;

  /**
   * À qui un joueur peut écrire : le MJ, et les autres personnages de la
   * table — jamais soi-même. Les noms viennent des fiches, parce que c'est
   * sous ces noms-là qu'on se connaît à la table, pas sous des adresses mail.
   */
  const correspondantsDuJoueur = useMemo(() => [
    ...(campagne.gmId === compte.userId ? [] : [{ id: campagne.gmId, nom: 'le MJ' }]),
    ...snapshot.sheets
      .filter((f) => f.ownerId !== compte.userId && f.ownerId !== campagne.gmId)
      .map((f) => ({ id: f.ownerId, nom: f.data.name })),
  ], [snapshot.sheets, compte.userId, campagne.gmId]);

  /** Depuis son écran principal, le MJ écrit à n'importe qui de sa table. */
  const correspondantsDeLaTable = useMemo(
    () => snapshot.sheets
      .filter((f) => f.ownerId !== compte.userId)
      .map((f) => ({ id: f.ownerId, nom: f.data.name })),
    [snapshot.sheets, compte.userId],
  );

  /**
   * À qui un joueur peut donner un objet de son sac : les autres personnages
   * de la table, jamais le MJ — il n'a pas de sac où le déposer.
   */
  const autresPersonnages = useMemo(
    () => snapshot.sheets
      .filter((f) => f.ownerId !== compte.userId && f.ownerId !== campagne.gmId)
      .map((f) => ({ id: f.ownerId, nom: f.data.name })),
    [snapshot.sheets, compte.userId, campagne.gmId],
  );

  /**
   * Réception automatique des dons : dès qu'un relais (`jg_item_transfers`)
   * m'attend, l'objet rejoint mon sac et le relais s'efface. Toutes les
   * lignes en attente sont pliées dans UNE seule écriture de fiche — les
   * traiter une par une partirait chacune de la même fiche non encore
   * confirmée et s'écraseraient l'une l'autre.
   *
   * `enCoursDeReception` évite de retraiter un relais dont la suppression
   * n'est pas encore revenue de la base : sans lui, un rendu entre-temps
   * redéposerait le même objet une seconde fois.
   */
  const enCoursDeReception = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!maFiche) return;
    const aRecevoir = snapshot.itemTransfers.filter(
      (t) => t.recipientId === compte.userId && !enCoursDeReception.current.has(t.id),
    );
    if (aRecevoir.length === 0) return;
    for (const t of aRecevoir) enCoursDeReception.current.add(t.id);
    const suivante = aRecevoir.reduce(
      (fiche, t) => recevoirItem(fiche, { name: t.itemName, qty: t.qty, note: t.itemNote ?? undefined, catalogId: t.itemCatalogId ?? undefined }),
      maFiche.data,
    );
    void saveSheet(client, sync, maFiche.id, suivante)
      .then(() => Promise.all(aRecevoir.map((t) => deleteItemTransfer(client, sync, t.id))))
      .finally(() => { for (const t of aRecevoir) enCoursDeReception.current.delete(t.id); });
  }, [snapshot.itemTransfers, maFiche, client, sync, compte.userId]);

  if (campagne.estMj) {
    const ouverte = snapshot.sheets.find((fiche) => fiche.id === ficheOuverte);
    if (ouverte) {
      return (
        <>
          {pileDeToasts}
          <SheetView
            client={client}
            sync={sync}
            fiche={ouverte}
            rencontre={rencontre}
            encounterId={snapshot.encounter?.id}
            onglet={onglet}
            onOnglet={setOnglet}
            entete={<BandeauMj nom={ouverte.data.name} onRetour={() => setFicheOuverte(null)} />}
            estMj
            campaignId={campagne.campaignId}
            userId={compte.userId}
            userEmail={compte.email}
            gmId={campagne.gmId}
            journalEntries={snapshot.journalEntries}
            // Le MJ lit les notes de toute sa table (RLS `jg_is_gm`), mais
            // l'onglet Journal d'une fiche ne montre que celles de cette
            // fiche-là : celles d'un autre joueur n'ont rien à faire ici.
            notes={snapshot.notes.filter((note) => note.ownerId === ouverte.ownerId)}
            messages={snapshot.messages}
            // Sur la fiche d'un joueur, le MJ n'écrit qu'à celui-là : c'est sa
            // conversation avec lui qu'il ouvre, pas une boîte d'envoi générale.
            correspondants={[{ id: ouverte.ownerId, nom: ouverte.data.name }]}
          />
        </>
      );
    }
    return (
      <>
        {pileDeToasts}
        {bandeau}
        <MjOnglets
          valeur={ecranMj}
          onChanger={setEcranMj}
          droite={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setReposEnCours(true)}
                className="lbl"
                style={{
                  minHeight: 32, padding: '0 14px', borderRadius: 999,
                  border: '1px solid var(--line)', color: 'var(--muted)', fontWeight: 700,
                }}
              >
                Repos
              </button>
              {/* Seul chemin du MJ vers ses réglages — et sa déconnexion, qui n'y
                  vivait auparavant que sur l'écran d'erreur : le MJ n'ouvre pas
                  systématiquement une fiche de joueur pour se déconnecter. */}
              <button
                onClick={() => setEcranMj('reglages')}
                aria-label="Réglages"
                style={{
                  width: 32, height: 32, borderRadius: 999, flexShrink: 0,
                  border: '1px solid var(--line)', color: 'var(--muted)', display: 'grid', placeItems: 'center',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="3.2" />
                  <path d="M12 2.8 v2.6 M12 18.6 v2.6 M2.8 12 h2.6 M18.6 12 h2.6 M5.5 5.5 l1.85 1.85 M16.65 16.65 l1.85 1.85 M18.5 5.5 l-1.85 1.85 M7.35 16.65 L5.5 18.5" />
                </svg>
              </button>
            </div>
          }
        />
        {reposEnCours && (
          <GmRestDialog
            sheets={snapshot.sheets}
            onAppliquer={(kind, sheetIds) => {
              for (const { id, suivante } of reposDeGroupe(snapshot.sheets, kind, sheetIds)) {
                void saveSheet(client, sync, id, suivante);
              }
              setReposEnCours(false);
            }}
            onFermer={() => setReposEnCours(false)}
          />
        )}
        {ecranMj === 'combat' || ecranMj === 'rencontres' ? (
          <EcranMj
            client={client}
            sync={sync}
            campaignId={campagne.campaignId}
            mjUserId={compte.userId}
            snapshot={snapshot}
            onOuvrirFiche={setFicheOuverte}
            vue={ecranMj}
            onDeclencher={() => setEcranMj('combat')}
          />
        ) : ecranMj === 'reglages' ? (
          <SettingsScreen
            client={client}
            userId={compte.userId}
            email={compte.email}
            onDeconnexion={() => void seDeconnecter(client)}
            onRetour={() => setEcranMj('combat')}
            retourVers="Combat"
          />
        ) : (
          <JournalScreen
            entries={snapshot.journalEntries}
            // Les notes appartiennent à un personnage : elles se lisent sur sa
            // fiche, pas dans une pile où l'on ne saurait plus de qui elles sont.
            notes={[]}
            estMj
            moi={compte.userId}
            correspondants={correspondantsDeLaTable}
            messages={snapshot.messages}
            onAjouterEntree={(entree) => void createJournalEntry(client, sync, campagne.campaignId, compte.userId, entree)}
            onModifierEntree={(id, entree) => void saveJournalEntry(client, sync, id, entree)}
            onSupprimerEntree={(id) => void deleteJournalEntry(client, sync, id)}
            onEnvoyerMessage={(message) => void createMessage(client, sync, campagne.campaignId, compte.userId, message)}
            onSupprimerMessage={(id) => void deleteMessage(client, sync, id)}
          />
        )}
      </>
    );
  }

  if (!maFiche) {
    return (
      <>
        {pileDeToasts}
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
    <>
      {pileDeToasts}
      <SheetView
        client={client}
        sync={sync}
        fiche={maFiche}
        rencontre={rencontre}
        encounterId={snapshot.encounter?.id}
        onglet={onglet}
        onOnglet={setOnglet}
        entete={bandeau}
        campaignId={campagne.campaignId}
        userId={compte.userId}
        userEmail={compte.email}
        gmId={campagne.gmId}
        journalEntries={snapshot.journalEntries}
        notes={snapshot.notes}
        messages={snapshot.messages}
        correspondants={correspondantsDuJoueur}
        destinatairesDon={autresPersonnages}
      />
    </>
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

/**
 * Le choix du MJ entre son combat et le journal, hors de toute fiche ouverte.
 *
 * En flux normal sous le bandeau, pas flottant : `GmCombatScreen` occupe déjà
 * tout le bas de l'écran avec ses propres contrôles, et un onglet flottant
 * posé par-dessus a déjà causé un recouvrement une fois (voir le correctif du
 * pied de page de combat) — inutile de reproduire le même piège ici.
 */
function MjOnglets({ valeur, onChanger, droite }: {
  /** Les réglages ne sont pas un onglet — ils s'ouvrent à part (voir `droite`) et n'allument aucun de ceux-ci. */
  valeur: 'combat' | 'rencontres' | 'journal' | 'reglages';
  onChanger: (valeur: 'combat' | 'rencontres' | 'journal') => void;
  /** Action indépendante des onglets (ex. Repos, Réglages) — rendue à part, poussée à droite. */
  droite?: React.ReactNode;
}) {
  const items: ['combat' | 'rencontres' | 'journal', string][] = [
    ['combat', 'Combat'], ['rencontres', 'Rencontres'], ['journal', 'Journal'],
  ];
  return (
    <nav className="jg-onglets" style={{ alignItems: 'center', padding: '0 14px' }}>
      {items.map(([clef, libelle]) => (
        <button
          key={clef}
          onClick={() => onChanger(clef)}
          aria-pressed={valeur === clef}
          className="jg-onglet"
        >
          <span className="ttl" style={{ fontSize: 12, letterSpacing: '.01em' }}>{libelle}</span>
        </button>
      ))}
      {/* L'action de droite (Repos, Réglages) ne prend pas sa part de la
          largeur : `flex: none` la sort du partage égal des onglets. */}
      {droite && <div style={{ flex: 'none', marginLeft: 'auto', paddingLeft: 10 }}>{droite}</div>}
    </nav>
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
function EcranMj({ client, sync, campaignId, mjUserId, snapshot, onOuvrirFiche, vue, onDeclencher }: {
  client: SupabaseClient;
  sync: CampaignSync;
  campaignId: string;
  /** Le compte du MJ : c'est lui qui SIGNE le transfert d'un objet donné. */
  mjUserId: string;
  snapshot: CampaignSnapshot;
  onOuvrirFiche: (sheetId: string) => void;
  /** Combat en cours, ou composition des rencontres préparées — les deux partagent la même rencontre en cours. */
  vue: 'combat' | 'rencontres';
  /**
   * Appelé après qu'une rencontre préparée a rejoint le combat en cours —
   * pour basculer sur l'onglet Combat, où ça se voit. Sans lui, « Déclencher »
   * ne change rien à l'écran : plusieurs appuis coup sur coup (le temps de
   * comprendre que ça a marché) ajoutaient le même lot plusieurs fois.
   */
  onDeclencher?: () => void;
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

  // Certains sorts sur soi se traduisent directement par un état de combat
  // (Invisibilité → « Invisible »). Le joueur qui les lance n'a pas le droit
  // d'écrire sur la rencontre (RLS `jg_encounters_write`, MJ seulement) : cet
  // effet tourne donc sur le CLIENT DU MJ, qui lit les fiches déjà
  // synchronisées et pose l'état à sa place — sans qu'il ait à s'en souvenir.
  // Idempotent par construction (`poserEtat` ne retire jamais) : rejouer sur
  // un état déjà posé ne fait rien, pas de boucle.
  useEffect(() => {
    let suivant = affiche;
    let modifie = false;
    for (const fiche of snapshot.sheets) {
      const spellId = fiche.data.live.concentration?.spellId;
      const etatAuto = spellId ? ETAT_AUTO_AU_LANCER[spellId] : undefined;
      if (!etatAuto) continue;
      const combattant = suivant.combatants.find((c) => c.name === fiche.data.name);
      if (!combattant || combattant.conditions.includes(etatAuto)) continue;
      suivant = replaceCombatant(suivant, { ...combattant, conditions: poserEtat(combattant.conditions, etatAuto) });
      modifie = true;
    }
    if (modifie) changer(suivant);
  }, [snapshot.sheets, affiche, changer]);

  // La concentration vit sur la fiche (`live.concentration`), pas sur le
  // combattant : le joueur qui lance son propre sort n'a pas le droit
  // d'écrire sur la rencontre (RLS `jg_encounters_write`, MJ seulement). La
  // liste du MJ la lit donc directement depuis les fiches, sans rien y
  // écrire — le nom du personnage reste le seul lien entre les deux.
  const concentrationParNom = useMemo(() => {
    const table: Record<string, string> = {};
    for (const fiche of snapshot.sheets) {
      const spellId = fiche.data.live.concentration?.spellId;
      if (!spellId) continue;
      table[fiche.data.name] = spellById(spellId)?.name ?? spellId;
    }
    return table;
  }, [snapshot.sheets]);

  /**
   * Le groupe réel, tel que la campagne le connaît — pour que la jauge de
   * difficulté des rencontres n'ait rien à demander au MJ.
   *
   * Le niveau retenu est le niveau MOYEN, arrondi : le budget du Guide du
   * Maître suppose un groupe homogène, et c'est la seule lecture honnête
   * quand un personnage traîne d'un niveau. Une campagne sans fiche donne un
   * effectif nul, et la jauge le dit au lieu de calculer sur du vide.
   */
  const groupe = useMemo(() => {
    const niveaux = snapshot.sheets.map((fiche) => totalLevel(fiche.data)).filter((n) => n > 0);
    // Deux règles du Guide se calculent sur les caractéristiques du groupe, et
    // aucune des deux ne doit se saisir à la main : la loyauté d'un PNJ suit le
    // plus haut CHARISME (p. 89), et les Pointes d'une poursuite valent
    // 3 + le modificateur de CONSTITUTION de chacun (p. 52). On prend les
    // scores EFFECTIFS, augmentations comprises — ceux que le joueur lit sur sa
    // fiche.
    const personnages = snapshot.sheets.map((fiche) => {
      const scores = effectiveAbilities(fiche.data);
      // `id` est celui de la FICHE : c'est par lui que le MJ écrit dans un sac.
      return { id: fiche.id, nom: fiche.data.name, cha: scores.cha, con: abilityModifier(scores.con) };
    });
    if (niveaux.length === 0) return { niveau: 0, taille: 0, personnages };
    const moyenne = niveaux.reduce((somme, n) => somme + n, 0) / niveaux.length;
    return { niveau: Math.round(moyenne), taille: niveaux.length, personnages };
  }, [snapshot.sheets]);

  /**
   * Déclencher une rencontre préparée : ses créatures rejoignent la rencontre
   * en cours — celle-là même que `GmCombatScreen` édite, avec le groupe déjà
   * dedans (`affiche`). Marche aussi bien avant que le combat ne soit lancé
   * (on enrichit la préparation) qu'en plein combat (on corse la rencontre).
   */
  const declencher = (combatants: Combatant[]) => {
    changer(addCombatants(affiche, combatants));
    onDeclencher?.();
  };

  /**
   * Le pavé de dégâts/soins du MJ, pour un JOUEUR : écrit directement sa
   * vraie fiche, jamais la copie de la rencontre — celle-là n'est relue
   * nulle part. `combatantId` est l'id de la fiche pour un membre du groupe
   * (`roster.ts`, `combatantFromSheet`), le même lien qu'`onOuvrirFiche`.
   *
   * Une première version fermait ce pavé pour les joueurs plutôt que de le
   * relier ici : le MJ perdait le geste le plus utile en plein combat, pour
   * un aller-retour vers chaque fiche à la place.
   */
  const appliquerVitalJoueur = (combatantId: string, delta: number) => {
    const fiche = snapshot.sheets.find((entry) => entry.id === combatantId);
    if (!fiche) return;
    const suivante = delta < 0
      ? takeDamage(fiche.data, deriveCharacter(fiche.data), -delta).sheet
      : heal(fiche.data, delta);
    if (suivante === fiche.data) return;
    void saveSheet(client, sync, fiche.id, suivante);
  };

  /**
   * Le MJ glisse un objet dans le sac d'un joueur.
   *
   * Écrit la vraie fiche, comme les dégâts — pas une copie. Le joueur voit la
   * ligne apparaître dans son sac sans rien avoir à taper, et un consommable
   * y arrive fonctionnel (voir `catalogIdPourLeSac`).
   */
  const donnerObjet = (
    ficheId: string,
    ligne: { name: string; qty: number; catalogId?: string },
    mot?: string,
  ) => {
    const fiche = snapshot.sheets.find((entry) => entry.id === ficheId);
    if (!fiche) return;
    const route = routeDuDon(fiche, mjUserId);
    if (route.voie === 'transfert') {
      // Le même chemin qu'un objet donné entre joueurs : il porte un mot, il
      // se reçoit, et il fait apparaître un pop-up. Écrire la fiche
      // directement le posait en SILENCE dans le sac.
      void createItemTransfer(client, sync, campaignId, mjUserId, {
        recipientId: route.destinataire,
        name: ligne.name,
        qty: ligne.qty,
        ...(ligne.catalogId ? { catalogId: ligne.catalogId } : {}),
        ...(mot?.trim() ? { note: mot.trim() } : {}),
      });
      return;
    }
    // Fiche sans propriétaire, ou fiche du MJ : personne à prévenir, donc
    // écriture directe (voir `don-du-mj.ts`).
    void saveSheet(client, sync, fiche.id, addItem(fiche.data, ligne));
  };

  /**
   * L'or que le MJ verse à un joueur : il s'AJOUTE à sa bourse, il ne la
   * remplace pas. Écraser le total ferait disparaître ce que le joueur avait
   * mis de côté.
   */
  const donnerOr = (ficheId: string, montant: number) => {
    const fiche = snapshot.sheets.find((entry) => entry.id === ficheId);
    if (!fiche || montant <= 0) return;
    void saveSheet(client, sync, fiche.id, setGold(fiche.data, (fiche.data.gold ?? 0) + montant));
  };

  const creerRencontre = (name: string, combatants: Combatant[], butin: ButinPrepare) => {
    void createEncounterTemplate(client, sync, campaignId, name, combatants, butin);
  };
  const modifierRencontre = (id: string, name: string, combatants: Combatant[], butin: ButinPrepare) => {
    void saveEncounterTemplate(client, sync, id, { name, combatants, butin });
  };
  const supprimerRencontre = (id: string) => {
    void deleteEncounterTemplate(client, sync, id);
  };

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
      {vue === 'combat' ? (
        <GmCombatScreen
          state={affiche}
          campaignId={campaignId}
          groupe={groupe}
          onChange={changer}
          onDegatsJoueur={appliquerVitalJoueur}
          onDonnerObjet={donnerObjet}
          concentrationParNom={concentrationParNom}
          onOpenSheet={(combatantId) => {
            // L'identifiant du combattant issu du groupe EST celui de la fiche
            // (voir `withParty`) : une créature, elle, n'en a pas.
            if (snapshot.sheets.some((fiche) => fiche.id === combatantId)) onOuvrirFiche(combatantId);
          }}
        />
      ) : (
        <PreparedEncountersScreen
          templates={snapshot.encounterTemplates}
          groupe={groupe}
          personnages={groupe.personnages}
          onDonnerObjet={donnerObjet}
          onDonnerOr={donnerOr}
          onCreer={creerRencontre}
          onModifier={modifierRencontre}
          onSupprimer={supprimerRencontre}
          onDeclencher={declencher}
        />
      )}
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
