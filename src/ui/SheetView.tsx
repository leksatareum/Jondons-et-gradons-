import { useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CombatScreen } from './CombatScreen';
import { SpellbookScreen } from './SpellbookScreen';
import { FicheScreen } from './FicheScreen';
import { JournalScreen, type Correspondant } from './JournalScreen';
import { InventoryScreen } from './InventoryScreen';
import { RestScreen } from './RestScreen';
import { SettingsScreen } from './SettingsScreen';
import { TabBar, type MainTab } from './TabBar';
import { cardsFromCharacter } from './spell-cards';
import type { PlayableCard } from './combat-layout';
import { deriveCharacter } from '../model/derive';
import { spendResource } from '../model/cast';
import { choisirDeClasse } from '../model/choix-de-classe';
import { finMarque, marquer, MARQUE_CHASSEUR_SPELL_ID, transfererMarque, type CibleMarquee } from '../model/rodeur';
import { heal, takeDamage } from '../model/damage';
import { addItem, removeItem, setGold, setItemQty } from '../model/inventory';
import {
  createJournalEntry, createMessage, createNote, deleteJournalEntry, deleteMessage,
  deleteNote, saveNote, saveSheet,
} from '../sync/mutations';
import { seDeconnecter } from '../sync/session';
import { GrantSpellDialog } from './GrantSpellDialog';
import { LevelUpDialog } from './LevelUpDialog';
import { rest, type RestKind } from '../model/rest';
import { withGrant, withoutGrant } from '../model/spell-grants';
import { spellById } from '../content/spell-catalogue';
import { learnForm, revert as revenirDeForme, swapForm, transform, wildShapeAccess } from '../model/wild-shape';
import { applyCompanionDamage, availableCompanions, bondCompanion, dismissCompanion } from '../model/companions';
import type { CharacterSheet, SpellGrant } from '../model/character';
import type { CampaignSync, JournalEntry, Message, Note, StoredSheet } from '../sync/campaign-sync';
import type { EncounterState } from '../domain/encounter';
import { turnIdentity } from '../domain/turn-identity';

/**
 * La vue d'une fiche : combat, fiche, grimoire, sac, repos, réglages.
 *
 * La même pour le joueur sur sa fiche et pour le MJ sur celle d'un autre. Une
 * seconde version « pour le MJ » aurait divergé au premier changement de règle,
 * et c'est toujours celle qu'on oublie de corriger qui finit par mentir en
 * pleine partie.
 *
 * Ce qui change entre les deux n'est pas l'écran mais le droit d'écrire, et il
 * est tenu par la RLS : un joueur n'écrit que sa fiche, le MJ écrit toutes
 * celles de sa campagne. L'écran n'a donc rien à vérifier — il propose, la base
 * tranche.
 */

export type SheetTab = MainTab;

export function SheetView({
  client, sync, fiche, rencontre, encounterId, onglet, onOnglet, entete, estMj,
  campaignId, userId, userEmail, journalEntries, notes, messages, correspondants,
}: {
  client: SupabaseClient;
  sync: CampaignSync;
  fiche: StoredSheet;
  rencontre: EncounterState | undefined;
  /** Pour identifier le tour en cours — l'économie d'action s'y raccroche. */
  encounterId?: string;
  onglet: SheetTab;
  onOnglet: (onglet: SheetTab) => void;
  /** Rendu au-dessus de l'écran : bandeau de synchronisation, retour du MJ… */
  entete?: React.ReactNode;
  /** Ouvre les pouvoirs qui n'appartiennent qu'au MJ : accorder, révoquer, monter de niveau. */
  estMj?: boolean;
  campaignId: string;
  /** Qui regarde l'écran — pour signer une entrée de journal ou une note, jamais pour filtrer : la RLS s'en charge déjà. */
  userId: string;
  /** Pour l'onglet Réglages : le compte connecté, pas celui de la fiche. */
  userEmail: string;
  journalEntries: JournalEntry[];
  /**
   * Côté joueur : les siennes — la RLS ne renvoie jamais celles d'un autre.
   * Côté MJ : celles du personnage de `fiche`, déjà filtrées par l'appelant
   * (le MJ lit toute sa table, mais un onglet ne montre qu'une fiche à la fois).
   */
  notes: Note[];
  messages: Message[];
  /** À qui l'on peut écrire depuis cette fiche : le MJ et les autres joueurs, ou le seul joueur dont le MJ regarde la fiche. */
  correspondants: Correspondant[];
}) {
  const [donEnCours, setDonEnCours] = useState(false);
  const [niveauEnCours, setNiveauEnCours] = useState(false);
  const [aRevoquer, setARevoquer] = useState<string | null>(null);
  const derivee = useMemo(() => deriveCharacter(fiche.data), [fiche.data]);
  const cartes = useMemo(() => cardsFromCharacter(fiche.data, derivee), [fiche.data, derivee]);

  /**
   * Les cibles marquables : les combattants de la rencontre, moins soi-même.
   * On ne restreint pas aux créatures du MJ — Marque du chasseur ne le fait
   * pas non plus, et une partie où l'on se retourne contre un allié existe.
   */
  const ciblesMarquables = useMemo<CibleMarquee[]>(
    () => (rencontre?.combatants ?? [])
      .filter((combattant) => combattant.name !== fiche.data.name)
      .map((combattant) => ({ id: combattant.id, name: combattant.name })),
    [rencontre, fiche.data.name],
  );

  /**
   * Préparer un sort est une écriture comme une autre : la fiche part en base
   * et la ligne renvoyée fait foi. La règle qui dit *quand* c'est permis vit
   * dans le modèle ; l'écran ne fait que proposer ce qu'elle autorise.
   */
  const basculerSort = (spellId: string, classId: string) => {
    // Un sort mineur n'a pas de rang et ne se prépare pas : il vit dans
    // `cantrips`, avec son propre quota. Le ranger dans `spells` le ferait
    // compter dans le budget des sorts préparés et disparaître de sa section.
    const estMineur = spellById(spellId)?.level === 0;
    if (estMineur) {
      const present = fiche.data.cantrips.some((mineur) => mineur.id === spellId);
      void saveSheet(client, sync, fiche.id, {
        ...fiche.data,
        cantrips: present
          ? fiche.data.cantrips.filter((mineur) => mineur.id !== spellId)
          : [...fiche.data.cantrips, { id: spellId, sourceClass: classId }],
      });
      return;
    }
    const present = fiche.data.spells.some((sort) => sort.id === spellId);
    void saveSheet(client, sync, fiche.id, {
      ...fiche.data,
      spells: present
        ? fiche.data.spells.filter((sort) => sort.id !== spellId)
        : [...fiche.data.spells, { id: spellId, sourceClass: classId, prepared: true }],
    });
  };

  /**
   * Les points de vie ne sont pas stockés : c'est la blessure qui l'est. Le
   * maximum reste dérivé, donc une règle qui le change demain s'applique
   * rétroactivement sans toucher aux fiches.
   */
  const soignerOuBlesser = (delta: number) => {
    // Jamais d'écriture directe sur `damageTaken` : les dégâts passent par la
    // transition canonique, qui consomme d'abord les PV temporaires. L'écran
    // les affichait sans qu'ils n'absorbent quoi que ce soit.
    const suivante = delta < 0
      ? takeDamage(fiche.data, derivee, -delta).sheet
      : heal(fiche.data, delta);
    if (suivante === fiche.data) return;
    if (suivante.live.damageTaken === fiche.data.live.damageTaken
      && suivante.live.temporaryHp === fiche.data.live.temporaryHp) return;
    void saveSheet(client, sync, fiche.id, suivante);
  };

  /**
   * Une carte payante vient d'être jouée : le sort ou le pouvoir se joue à
   * la table (jets compris) comme toujours, cet écran ne fait que retenir
   * ce qui a payé — l'emplacement ou la ressource — pour que la pastille et
   * les repos restent justes.
   */
  const jouerCarte = (card: PlayableCard, resourceKey: string, cible?: CibleMarquee) => {
    let suivante = spendResource(fiche.data, resourceKey);
    // Marque du chasseur ne se contente pas de coûter : elle pose un état —
    // cible, concentration, provenance, durée — dont dépendent trois
    // capacités du Rôdeur. Le rang payé décide de la durée.
    if (card.id === MARQUE_CHASSEUR_SPELL_ID && cible) {
      suivante = marquer(suivante, cible, { key: resourceKey, slotLevel: rangPaye(resourceKey) });
    }
    void saveSheet(client, sync, fiche.id, suivante);
  };

  /** Rang de l'emplacement dépensé, `null` pour un lancement gratuit. */
  const rangPaye = (resourceKey: string): number | null => {
    const emplacement = /^emplacement-(\d+)$/.exec(resourceKey);
    if (emplacement) return Number(emplacement[1]);
    if (resourceKey === 'pacte') {
      return derivee.spellcasting.slots.find((slot) => slot.pact)?.level ?? 1;
    }
    return null;
  };

  const finDeMarque = () => {
    void saveSheet(client, sync, fiche.id, finMarque(fiche.data));
  };

  const deplacerMarque = (cible: CibleMarquee) => {
    void saveSheet(client, sync, fiche.id, transfererMarque(fiche.data, cible));
  };

  /**
   * Une décision de classe est une décision de PERSONNAGE, pas de l'état
   * vivant : elle part en base comme la préparation d'un sort.
   */
  const enregistrerChoixDeClasse = (classId: string, key: string, optionId: string) => {
    // Un choix définitif ne se reprend que par le MJ : le modèle refuse le
    // reste. L'écran ne propose « Corriger » qu'à lui, mais c'est ici que la
    // règle s'applique — un joueur ne doit pas pouvoir la contourner.
    const suivante = choisirDeClasse(fiche.data, classId, key, optionId, { parLeMj: Boolean(estMj) });
    if (suivante === fiche.data) return;
    void saveSheet(client, sync, fiche.id, suivante);
  };

  const accorder = (grant: SpellGrant) => {
    void saveSheet(client, sync, fiche.id, withGrant(fiche.data, grant));
    setDonEnCours(false);
  };

  const revoquer = (grantId: string) => {
    void saveSheet(client, sync, fiche.id, withoutGrant(fiche.data, grantId));
    setARevoquer(null);
  };

  const prendreRepos = (kind: RestKind) => {
    void saveSheet(client, sync, fiche.id, rest(fiche.data, derivee, kind).sheet);
  };

  const monterDeNiveau = (suivante: CharacterSheet) => {
    void saveSheet(client, sync, fiche.id, suivante);
    setNiveauEnCours(false);
  };

  // L'onglet Fiche montre les formes/créature liée seulement si elles ont
  // quelque chose à afficher : la plupart des personnages n'ont ni Forme
  // sauvage ni créature liée.
  const aDesFormesOuCompagnons = wildShapeAccess(fiche.data, derivee).knownLimit > 0
    || availableCompanions(fiche.data).length > 0
    || (fiche.data.companions?.length ?? 0) > 0;

  const transformerEnForme = (formId: string) =>
    void saveSheet(client, sync, fiche.id, transform(fiche.data, derivee, formId));
  const revenirDeLaForme = () =>
    void saveSheet(client, sync, fiche.id, revenirDeForme(fiche.data));
  const apprendreForme = (formId: string) =>
    void saveSheet(client, sync, fiche.id, learnForm(fiche.data, derivee, formId));
  const echangerForme = (fromId: string, toId: string) =>
    void saveSheet(client, sync, fiche.id, swapForm(fiche.data, derivee, fromId, toId));
  const lierCompagnon = (optionId: string) =>
    void saveSheet(client, sync, fiche.id, bondCompanion(fiche.data, optionId));
  const degatsCompagnon = (companionId: string, delta: number) =>
    void saveSheet(client, sync, fiche.id, applyCompanionDamage(fiche.data, companionId, delta));
  const detacherCompagnon = (companionId: string) =>
    void saveSheet(client, sync, fiche.id, dismissCompanion(fiche.data, companionId));

  // Journal : seul le MJ écrit, la RLS le rappellerait de toute façon à qui
  // s'y essaierait sans l'être.
  const ajouterEntreeJournal = (entree: { title: string | null; body: string }) =>
    void createJournalEntry(client, sync, campaignId, userId, entree);
  const supprimerEntreeJournal = (id: string) => void deleteJournalEntry(client, sync, id);

  // Notes : toujours celles de qui regarde l'écran — jamais celles d'un
  // joueur dont le MJ consulterait la fiche.
  const ajouterNote = (note: { title: string | null; body: string }) =>
    void createNote(client, sync, campaignId, userId, note);
  const modifierNote = (id: string, note: { title: string | null; body: string }) =>
    void saveNote(client, sync, id, note);
  const supprimerNote = (id: string) => void deleteNote(client, sync, id);

  // Messages et secrets : on signe toujours de son propre nom. La RLS refuse
  // un secret qui ne viendrait pas du MJ, cet écran ne fait que le proposer
  // là où il a un sens.
  const envoyerMessage = (message: { recipientId: string; body: string; kind: 'message' | 'secret' }) =>
    void createMessage(client, sync, campaignId, userId, message);
  const supprimerMessage = (id: string) => void deleteMessage(client, sync, id);

  // Le sac : ce que le joueur possède est une décision, jamais un calcul.
  const ajouterObjet = (item: { name: string; qty: number }) =>
    void saveSheet(client, sync, fiche.id, addItem(fiche.data, item));
  const quantiteObjet = (itemId: string, qty: number) =>
    void saveSheet(client, sync, fiche.id, setItemQty(fiche.data, itemId, qty));
  const retirerObjet = (itemId: string) =>
    void saveSheet(client, sync, fiche.id, removeItem(fiche.data, itemId));
  const fixerOr = (gold: number) =>
    void saveSheet(client, sync, fiche.id, setGold(fiche.data, gold));

  const dialogues = (
    <>
      {niveauEnCours && (
        <LevelUpDialog
          sheet={fiche.data}
          onMonter={monterDeNiveau}
          onFermer={() => setNiveauEnCours(false)}
        />
      )}
    </>
  );

  const corps = () => {
    if (onglet === 'fiche') {
      return (
        <FicheScreen
          sheet={fiche.data}
          derived={derivee}
          avecAllies={aDesFormesOuCompagnons}
          estMj={Boolean(estMj)}
          onTransformer={transformerEnForme}
          onRevenir={revenirDeLaForme}
          onApprendre={apprendreForme}
          onEchanger={echangerForme}
          onLier={lierCompagnon}
          onDegatsCompagnon={degatsCompagnon}
          onDetacherCompagnon={detacherCompagnon}
          onNiveauSuperieur={estMj ? () => setNiveauEnCours(true) : undefined}
          onRepos={() => onOnglet('repos')}
          onReglages={() => onOnglet('parametres')}
          onChoixDeClasse={enregistrerChoixDeClasse}
        />
      );
    }

    if (onglet === 'journal') {
      return (
        <JournalScreen
          entries={journalEntries}
          notes={notes}
          estMj={Boolean(estMj)}
          notesOwnerName={estMj ? fiche.data.name : undefined}
          moi={userId}
          correspondants={correspondants}
          messages={messages}
          onAjouterEntree={estMj ? ajouterEntreeJournal : undefined}
          onSupprimerEntree={estMj ? supprimerEntreeJournal : undefined}
          onAjouterNote={estMj ? undefined : ajouterNote}
          onModifierNote={estMj ? undefined : modifierNote}
          onSupprimerNote={estMj ? undefined : supprimerNote}
          onEnvoyerMessage={envoyerMessage}
          onSupprimerMessage={supprimerMessage}
        />
      );
    }

    if (onglet === 'grimoire') {
      return (
        <SpellbookScreen
          sheet={fiche.data}
          derived={derivee}
          onToggle={basculerSort}
          dons={estMj
            ? { onAccorder: () => setDonEnCours(true), onRevoquer: setARevoquer }
            : undefined}
        />
      );
    }

    if (onglet === 'inventaire') {
      return (
        <InventoryScreen
          sheet={fiche.data}
          onAjouter={ajouterObjet}
          onQty={quantiteObjet}
          onRetirer={retirerObjet}
          onOr={fixerOr}
        />
      );
    }

    if (onglet === 'repos') {
      return <RestScreen sheet={fiche.data} derived={derivee} onRepos={prendreRepos} onRetour={() => onOnglet('fiche')} />;
    }

    if (onglet === 'parametres') {
      return <SettingsScreen email={userEmail} onDeconnexion={() => void seDeconnecter(client)} onRetour={() => onOnglet('fiche')} />;
    }

    const enCombat = rencontre != null && rencontre.turnIndex >= 0;
    const actif = enCombat ? rencontre.combatants[rencontre.turnIndex] : undefined;
    return (
      <CombatScreen
        sheet={fiche.data}
        cards={cartes}
        onSpendHp={soignerOuBlesser}
        onPlayCard={jouerCarte}
        cibles={ciblesMarquables}
        onFinMarque={finDeMarque}
        onTransfererMarque={deplacerMarque}
        turnId={turnIdentity(encounterId, rencontre)}
        turn={
          enCombat
            ? {
                mode: 'combat',
                // Le lien fiche ↔ combattant se fait par le nom du personnage :
                // c'est la seule clé commune tant qu'un combattant n'est pas
                // rattaché à une fiche côté base.
                isYourTurn: actif?.name === fiche.data.name,
                holder: actif?.name,
              }
            : { mode: 'libre' }
        }
      />
    );
  };

  const vise = onglet === 'grimoire' ? (fiche.data.grants ?? []).find((grant) => grant.id === aRevoquer) : undefined;

  return (
    <>
      {entete}
      {corps()}
      <TabBar actif={onglet} onChanger={onOnglet} />
      {dialogues}
      {donEnCours && (
        <GrantSpellDialog
          sheet={fiche.data}
          derived={derivee}
          onAccorder={accorder}
          onFermer={() => setDonEnCours(false)}
        />
      )}
      {vise && (
        <Confirmation
          question={`Révoquer « ${spellById(vise.spellId)?.name ?? vise.spellId} » ?`}
          detail={`Accordé à ${fiche.data.name} par ${vise.source}. `
            + 'Le sort et ses lancements disparaissent de la fiche.'}
          valider="Révoquer"
          onValider={() => revoquer(vise.id)}
          onAnnuler={() => setARevoquer(null)}
        />
      )}
    </>
  );
}

/**
 * Une confirmation, pour les gestes qu'on ne veut pas faire du pouce par
 * accident. Elle nomme la cible : « Révoquer ? » ne dit pas de quoi ni à qui.
 */
function Confirmation({ question, detail, valider, onValider, onAnnuler }: {
  question: string;
  detail: string;
  valider: string;
  onValider: () => void;
  onAnnuler: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 40, display: 'grid', placeItems: 'end center',
        background: 'rgb(0 0 0 / 0.55)', padding: 16,
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 360, padding: '16px 16px 14px',
        borderRadius: 'var(--radius)', background: 'var(--surface-raised)',
        border: '1px solid var(--line)', boxShadow: 'var(--raise)',
      }}>
        <div className="ttl" style={{ fontSize: 17 }}>{question}</div>
        <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--muted)', margin: '8px 0 0' }}>
          {detail}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            onClick={onAnnuler}
            style={{
              flexGrow: 1, minHeight: 48, borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)', color: 'var(--muted)', fontSize: 15,
            }}
          >
            Annuler
          </button>
          <button
            onClick={onValider}
            style={{
              flexGrow: 1, minHeight: 48, borderRadius: 'var(--radius-sm)',
              background: 'var(--vital)', color: 'var(--accent-ink)',
              fontSize: 15, fontWeight: 700,
            }}
          >
            {valider}
          </button>
        </div>
      </div>
    </div>
  );
}
