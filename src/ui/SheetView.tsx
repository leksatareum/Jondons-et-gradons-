import { useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CombatScreen } from './CombatScreen';
import { SpellbookScreen } from './SpellbookScreen';
import { JournalScreen } from './JournalScreen';
import { cardsFromCharacter } from './spell-cards';
import { deriveCharacter } from '../model/derive';
import {
  createJournalEntry, createNote, deleteJournalEntry, deleteNote, saveNote, saveSheet,
} from '../sync/mutations';
import { GrantSpellDialog } from './GrantSpellDialog';
import { RestDialog } from './RestDialog';
import { LevelUpDialog } from './LevelUpDialog';
import { rest, type RestKind } from '../model/rest';
import { withGrant, withoutGrant } from '../model/spell-grants';
import { spellById } from '../content/spell-catalogue';
import { AlliesScreen } from './AlliesScreen';
import { learnForm, revert as revenirDeForme, swapForm, transform, wildShapeAccess } from '../model/wild-shape';
import { applyCompanionDamage, availableCompanions, bondCompanion, dismissCompanion } from '../model/companions';
import type { CharacterSheet, SpellGrant } from '../model/character';
import type { CampaignSync, JournalEntry, Note, StoredSheet } from '../sync/campaign-sync';
import type { EncounterState } from '../domain/encounter';

/**
 * La vue d'une fiche : combat et grimoire.
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

export type SheetTab = 'combat' | 'grimoire' | 'allies' | 'journal';

/**
 * Hauteur du pied de page de `CombatScreen`, plus une marge de respiration.
 * 11px de marge haute + le bouton (`--tap`, 44px) + 14px de marge basse.
 */
const PIED_DE_PAGE_COMBAT = 'calc(83px + env(safe-area-inset-bottom))';

export function SheetView({
  client, sync, fiche, rencontre, onglet, onOnglet, entete, estMj, campaignId, userId, journalEntries, notes,
}: {
  client: SupabaseClient;
  sync: CampaignSync;
  fiche: StoredSheet;
  rencontre: EncounterState | undefined;
  onglet: SheetTab;
  onOnglet: (onglet: SheetTab) => void;
  /** Rendu au-dessus de l'écran : bandeau de synchronisation, retour du MJ… */
  entete?: React.ReactNode;
  /** Ouvre les pouvoirs qui n'appartiennent qu'au MJ : accorder, révoquer. */
  estMj?: boolean;
  campaignId: string;
  /** Qui regarde l'écran — pour signer une entrée de journal ou une note, jamais pour filtrer : la RLS s'en charge déjà. */
  userId: string;
  journalEntries: JournalEntry[];
  /**
   * Côté joueur : les siennes — la RLS ne renvoie jamais celles d'un autre.
   * Côté MJ : celles du personnage de `fiche`, déjà filtrées par l'appelant
   * (le MJ lit toute sa table, mais un onglet ne montre qu'une fiche à la fois).
   */
  notes: Note[];
}) {
  const [donEnCours, setDonEnCours] = useState(false);
  const [reposEnCours, setReposEnCours] = useState(false);
  const [niveauEnCours, setNiveauEnCours] = useState(false);
  const [aRevoquer, setARevoquer] = useState<string | null>(null);
  const derivee = useMemo(() => deriveCharacter(fiche.data), [fiche.data]);
  const cartes = useMemo(() => cardsFromCharacter(fiche.data, derivee), [fiche.data, derivee]);

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
    const subis = Math.max(0, Math.min(derivee.maxHp, fiche.data.live.damageTaken - delta));
    if (subis === fiche.data.live.damageTaken) return;
    void saveSheet(client, sync, fiche.id, {
      ...fiche.data,
      live: { ...fiche.data.live, damageTaken: subis },
    });
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
    setReposEnCours(false);
  };

  const monterDeNiveau = (suivante: CharacterSheet) => {
    void saveSheet(client, sync, fiche.id, suivante);
    setNiveauEnCours(false);
  };

  // L'onglet Formes n'existe que s'il a quelque chose à montrer : la plupart
  // des personnages n'ont ni Forme sauvage ni créature liée, et un onglet vide
  // serait une case de plus à ignorer sur un écran déjà chargé.
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

  /**
   * Les pouvoirs du MJ, disponibles sur les deux onglets. Ils vivent ici et
   * non dans chaque écran : monter de niveau n'est ni une action de combat ni
   * une affaire de sorts, et l'accrocher à l'un des deux le rendrait
   * introuvable depuis l'autre.
   */
  const barreMj = estMj ? (
    <div style={{
      position: 'fixed', zIndex: 10,
      left: 14,
      bottom: onglet === 'combat' ? PIED_DE_PAGE_COMBAT : 'calc(14px + env(safe-area-inset-bottom))',
      display: 'flex', gap: 6,
    }}>
      <button
        onClick={() => setNiveauEnCours(true)}
        className="lbl"
        style={{
          minHeight: 38, padding: '0 12px', borderRadius: 999,
          border: '1px solid var(--line)', background: 'var(--surface-raised)',
          color: 'var(--muted)', boxShadow: 'var(--raise)', fontWeight: 700,
        }}
      >
        Niveau +
      </button>
    </div>
  ) : null;

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

  if (onglet === 'journal') {
    return (
      <>
        {entete}
        <JournalScreen
          entries={journalEntries}
          notes={notes}
          estMj={Boolean(estMj)}
          notesOwnerName={estMj ? fiche.data.name : undefined}
          onAjouterEntree={estMj ? ajouterEntreeJournal : undefined}
          onSupprimerEntree={estMj ? supprimerEntreeJournal : undefined}
          onAjouterNote={estMj ? undefined : ajouterNote}
          onModifierNote={estMj ? undefined : modifierNote}
          onSupprimerNote={estMj ? undefined : supprimerNote}
        />
        <Onglets onglet={onglet} onChanger={onOnglet} avecAllies={aDesFormesOuCompagnons} />
        {barreMj}
        {dialogues}
      </>
    );
  }

  if (onglet === 'allies') {
    return (
      <>
        {entete}
        <AlliesScreen
          sheet={fiche.data}
          derived={derivee}
          onTransformer={transformerEnForme}
          onRevenir={revenirDeLaForme}
          onApprendre={apprendreForme}
          onEchanger={echangerForme}
          onLier={lierCompagnon}
          onDegatsCompagnon={degatsCompagnon}
          onDetacherCompagnon={detacherCompagnon}
        />
        <Onglets onglet={onglet} onChanger={onOnglet} avecAllies={aDesFormesOuCompagnons} />
        {barreMj}
        {dialogues}
      </>
    );
  }

  if (onglet === 'grimoire') {
    const vise = (fiche.data.grants ?? []).find((grant) => grant.id === aRevoquer);
    return (
      <>
        {entete}
        <SpellbookScreen
          sheet={fiche.data}
          derived={derivee}
          onToggle={basculerSort}
          dons={estMj
            ? { onAccorder: () => setDonEnCours(true), onRevoquer: setARevoquer }
            : undefined}
        />
        <Onglets onglet={onglet} onChanger={onOnglet} avecAllies={aDesFormesOuCompagnons} />
        {barreMj}
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

  const enCombat = rencontre != null && rencontre.turnIndex >= 0;
  const actif = enCombat ? rencontre.combatants[rencontre.turnIndex] : undefined;

  return (
    <>
      {entete}
      <CombatScreen
        sheet={fiche.data}
        cards={cartes}
        onSpendHp={soignerOuBlesser}
        onRest={() => setReposEnCours(true)}
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
      <Onglets onglet={onglet} onChanger={onOnglet} degagement avecAllies={aDesFormesOuCompagnons} />
      {barreMj}
      {dialogues}
      {reposEnCours && (
        <RestDialog
          sheet={fiche.data}
          derived={derivee}
          onRepos={prendreRepos}
          onFermer={() => setReposEnCours(false)}
        />
      )}
    </>
  );
}

/**
 * Le passage d'un écran à l'autre.
 *
 * Flottant au-dessus du contenu plutôt qu'en barre fixe : les deux écrans
 * gèrent déjà leur propre hauteur, et leur en retirer une bande obligerait à
 * reprendre les deux mises en page pour un bouton.
 */
function Onglets({ onglet, onChanger, degagement, avecAllies }: {
  onglet: SheetTab;
  onChanger: (onglet: SheetTab) => void;
  /**
   * Distance additionnelle au-dessus du bas de l'écran, pour dégager le pied
   * de page de `CombatScreen` — son bouton « Repos »/« Fin du tour » occupe
   * toute la largeur du pied, et un onglet flottant posé au même niveau
   * s'affiche dessus plutôt qu'à côté. Le grimoire n'a pas ce pied de page :
   * il n'a besoin d'aucun dégagement.
   */
  degagement?: boolean;
  /** Absent pour la plupart des personnages : ni Forme sauvage, ni créature liée. */
  avecAllies?: boolean;
}) {
  const items: [SheetTab, string][] = [['combat', 'Combat'], ['grimoire', 'Sorts']];
  if (avecAllies) items.push(['allies', 'Formes']);
  items.push(['journal', 'Journal']);
  return (
    <nav style={{
      position: 'fixed', zIndex: 10,
      right: 14,
      bottom: degagement ? PIED_DE_PAGE_COMBAT : 'calc(14px + env(safe-area-inset-bottom))',
      display: 'flex', gap: 4, padding: 4,
      borderRadius: 999, border: '1px solid var(--line)',
      background: 'var(--surface-raised)', boxShadow: 'var(--raise)',
    }}>
      {items.map(([clef, libelle]) => (
        <button
          key={clef}
          onClick={() => onChanger(clef)}
          className="lbl"
          style={{
            minHeight: 38, padding: '0 14px', borderRadius: 999,
            background: onglet === clef ? 'var(--accent)' : 'transparent',
            color: onglet === clef ? 'var(--accent-ink)' : 'var(--muted)',
            fontWeight: 700,
          }}
        >
          {libelle}
        </button>
      ))}
    </nav>
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
