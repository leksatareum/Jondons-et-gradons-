import { useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CombatScreen } from './CombatScreen';
import { SpellbookScreen } from './SpellbookScreen';
import { FicheScreen } from './FicheScreen';
import { JournalScreen, type Correspondant } from './JournalScreen';
import { InventoryScreen } from './InventoryScreen';
import { RestScreen } from './RestScreen';
import { RulesScreen } from './RulesScreen';
import { SettingsScreen } from './SettingsScreen';
import { TabBar, type MainTab } from './TabBar';
import { cardsFromCharacter, concentre } from './spell-cards';
import { weaponCardsFromCharacter } from './weapon-cards';
import type { PlayableCard } from './combat-layout';
import { deriveCharacter } from '../model/derive';
import { restoreResource, spendResource } from '../model/cast';
import { choisirDeClasse } from '../model/choix-de-classe';
import { recuperationNaturelle, type ChoixRecuperation } from '../model/druide';
import { finMarque, marquer, MARQUE_CHASSEUR_SPELL_ID, transfererMarque, type CibleMarquee } from '../model/rodeur';
import { BENEDICTION_TENEBREUX_CARD_ID, benedictionDuTenebreux, RUSE_MAGIQUE_KEY, utiliserRuseMagique } from '../model/occultiste';
import { heal, takeDamage } from '../model/damage';
import { addItem, removeItem, setGold, setItemQty } from '../model/inventory';
import {
  createJournalEntry, createMessage, createNote, deleteJournalEntry, deleteMessage,
  deleteNote, saveNote, saveSheet,
} from '../sync/mutations';
import { uploadPortrait } from '../sync/portraits';
import { seDeconnecter } from '../sync/session';
import { GrantSpellDialog } from './GrantSpellDialog';
import { LevelUpDialog } from './LevelUpDialog';
import { rest, type RestKind } from '../model/rest';
import { withGrant, withoutGrant } from '../model/spell-grants';
import { spellById } from '../content/spell-catalogue';
import { themeDeClasse } from '../content/class-themes';
import {
  bonusConcentrationEclatLunaire, learnForm, revert as revenirDeForme, swapForm, transform, wildShapeAccess,
} from '../model/wild-shape';
import { applyCompanionDamage, availableCompanions, bondCompanion, dismissCompanion, ramenerCompagnon } from '../model/companions';
import { degainerArme, equiperArme } from '../model/weapons';
import type { CharacterSheet, SpellGrant } from '../model/character';
import type { CampaignSync, JournalEntry, Message, Note, StoredSheet } from '../sync/campaign-sync';
import { activeCombatant, type EncounterState } from '../domain/encounter';
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
  /** Un jet de sauvegarde de concentration à faire à la table, DD déjà calculé. */
  const [jetConcentration, setJetConcentration] = useState<{ dd: number; bonusSagesse: number } | null>(null);
  const [niveauEnCours, setNiveauEnCours] = useState(false);
  const [aRevoquer, setARevoquer] = useState<string | null>(null);
  const derivee = useMemo(() => deriveCharacter(fiche.data), [fiche.data]);
  // La matière « Braise et fer » : posée ici, une fois, elle retombe sur
  // TOUS les écrans de cette fiche par héritage CSS — Combat, Fiche,
  // Grimoire, Sac, Journal — sans que chacun ait à la recalculer.
  const theme = useMemo(() => themeDeClasse(fiche.data.classLevels), [fiche.data.classLevels]);
  const cartes = useMemo(
    () => [...weaponCardsFromCharacter(fiche.data, derivee), ...cardsFromCharacter(fiche.data, derivee)],
    [fiche.data, derivee],
  );

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
    // Encaisser des dégâts en étant concentré appelle une sauvegarde — le jet
    // se fait à la table comme toujours, mais rien ne rappelait jusqu'ici
    // qu'il fallait le faire, ni son DD. `delta` est ce qui vient d'être tapé
    // (avant absorption par les PV temporaires) : c'est ce montant-là, pas ce
    // qui a atteint les PV, que la règle prend en compte.
    if (delta < 0 && fiche.data.live.concentration) {
      const degats = Math.max(0, Math.floor(-delta));
      setJetConcentration({
        dd: Math.min(30, Math.max(10, Math.floor(degats / 2))),
        // Éclat lunaire (Cercle de la Lune 6) ajoute la Sagesse à CE jet
        // précis, tant que la Forme sauvage dure — jamais affiché ailleurs.
        bonusSagesse: bonusConcentrationEclatLunaire(fiche.data, derivee.modifiers.wis),
      });
    }
    void saveSheet(client, sync, fiche.id, suivante);
  };

  /**
   * La table répond au jet de sauvegarde qu'on vient de lui rappeler : un
   * échec rompt la concentration ici même, sans repasser par le bouton
   * « Rompre » du bandeau.
   */
  const repondreJetConcentration = (reussi: boolean) => {
    setJetConcentration(null);
    if (!reussi) rompreConcentration();
  };

  /**
   * Une carte payante vient d'être jouée : le sort ou le pouvoir se joue à
   * la table (jets compris) comme toujours, cet écran ne fait que retenir
   * ce qui a payé — l'emplacement ou la ressource — pour que la pastille et
   * les repos restent justes.
   */
  const jouerCarte = (card: PlayableCard, resourceKey: string, cible?: CibleMarquee) => {
    // Bénédiction du Ténébreux (Occultiste · Patron Fiélon) : un déclencheur,
    // pas un sort payé sur emplacement — les deux circonstances possibles
    // (l'Occultiste réduit l'ennemi, ou il est à portée) ne changent rien au
    // montant, une seule suffit à l'ouvrir. `spendResource` n'a rien à faire
    // ici : il n'y a pas de ressource, seulement des PV temporaires à écrire.
    if (card.id === BENEDICTION_TENEBREUX_CARD_ID) {
      const suivante = benedictionDuTenebreux(fiche.data, { reduitParLOccultiste: true, aPortee: false });
      if (suivante !== fiche.data) void saveSheet(client, sync, fiche.id, suivante);
      return;
    }
    let suivante = spendResource(fiche.data, resourceKey);
    const sort = spellById(card.id);
    // Marque du chasseur ne se contente pas de coûter : elle pose un état —
    // cible, concentration, provenance, durée — dont dépendent trois
    // capacités du Rôdeur. Le rang payé décide de la durée.
    if (card.id === MARQUE_CHASSEUR_SPELL_ID && cible) {
      suivante = marquer(suivante, cible, { key: resourceKey, slotLevel: rangPaye(resourceKey) });
    } else if (sort && concentre(sort)) {
      // N'importe quel autre sort de concentration : lancer un nouveau
      // remplace l'ancien (une seule concentration à la fois, comme la
      // règle), et l'écran de combat peut désormais l'afficher et la rompre.
      //
      // Ça ne pose PAS l'état correspondant (Invisible…) sur le combattant de
      // la rencontre : cette écriture-là appartient au MJ (RLS
      // `jg_encounters_write`), jamais au joueur qui lance son propre sort —
      // un premier essai qui écrivait directement échouait en silence. La
      // concentration reste donc visible ici, sur la fiche, et le MJ la voit
      // sans rien écrire : la liste d'initiative lit `sheet.live.concentration`
      // de chaque joueur (voir `GmCombatScreen`).
      suivante = { ...suivante, live: { ...suivante.live, concentration: { spellId: sort.id } } };
    }
    void saveSheet(client, sync, fiche.id, suivante);
  };

  /**
   * Rompt la concentration en cours, hors Marque du chasseur — qui a déjà son
   * propre bouton « Fin » dans son bloc dédié. Ne retire pas l'état auto-posé
   * (Invisible…) : sa fin dépend de la situation à la table, c'est au MJ de
   * la trancher via la liste d'états, déjà fonctionnelle pour ça.
   */
  const rompreConcentration = () => {
    void saveSheet(client, sync, fiche.id, { ...fiche.data, live: { ...fiche.data.live, concentration: null } });
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

  /**
   * Le pisteur de ressources de l'écran de combat : une réserve entamée hors
   * du fil d'une carte jouable (Connaissance de la pierre, Contact du
   * patron…) ou une correction manuelle d'un appui de trop.
   */
  const depenserRessource = (resourceKey: string) => {
    // Ruse magique (Occultiste 2+) ne se contente pas de cocher une case :
    // elle rend de vrais emplacements de pacte dépensés. La traiter comme une
    // réserve générique la marquait « utilisée » sans jamais toucher
    // `pactSlotsSpent` — la capacité de niveau 2 ne rendait rien du tout.
    if (resourceKey === RUSE_MAGIQUE_KEY) {
      const { sheet } = utiliserRuseMagique(fiche.data, derivee);
      if (sheet !== fiche.data) void saveSheet(client, sync, fiche.id, sheet);
      return;
    }
    void saveSheet(client, sync, fiche.id, spendResource(fiche.data, resourceKey));
  };
  const restaurerRessource = (resourceKey: string) => {
    void saveSheet(client, sync, fiche.id, restoreResource(fiche.data, resourceKey));
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

  const prendreRepos = (kind: RestKind, recuperation?: ChoixRecuperation) => {
    const apresRepos = rest(fiche.data, derivee, kind).sheet;
    // Récupération naturelle se résout à la FIN du repos court : le repos
    // rend d'abord ce qu'il rend, la capacité récupère ensuite.
    const suivante = recuperation
      ? recuperationNaturelle(apresRepos, deriveCharacter(apresRepos), recuperation)
      : apresRepos;
    void saveSheet(client, sync, fiche.id, suivante);
  };

  const monterDeNiveau = (suivante: CharacterSheet) => {
    // La montée effectuée referme la porte que le MJ avait ouverte : sans ce
    // même geste, elle resterait proposée pour toujours.
    void saveSheet(client, sync, fiche.id, { ...suivante, live: { ...suivante.live, levelUpUnlocked: false } });
    setNiveauEnCours(false);
  };

  /**
   * Le MJ décide QUAND une montée de niveau est possible ; les choix qui vont
   * avec (jet de vie, sous-classe, don ou augmentation, invocations…)
   * restent au joueur, jamais au MJ. `levelUpUnlocked` n'est donc qu'un
   * déclencheur, synchronisé comme le reste de la fiche : l'écran du joueur
   * le voit apparaître en temps réel, sans qu'il ait à rafraîchir quoi que
   * ce soit.
   */
  const niveauDisponible = Boolean(fiche.data.live.levelUpUnlocked);
  const basculerNiveauDisponible = () => {
    void saveSheet(client, sync, fiche.id, {
      ...fiche.data,
      live: { ...fiche.data.live, levelUpUnlocked: !niveauDisponible },
    });
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
  const lierCompagnon = (optionId: string, nom?: string) =>
    void saveSheet(client, sync, fiche.id, bondCompanion(fiche.data, optionId, nom));
  const degatsCompagnon = (companionId: string, delta: number) =>
    void saveSheet(client, sync, fiche.id, applyCompanionDamage(fiche.data, companionId, delta));
  const detacherCompagnon = (companionId: string) =>
    void saveSheet(client, sync, fiche.id, dismissCompanion(fiche.data, companionId));
  const ramenerCompagnonLie = (companionId: string, rang: number) =>
    void saveSheet(client, sync, fiche.id, ramenerCompagnon(fiche.data, companionId, rang));
  const equiperUneArme = (weaponId: string) =>
    void saveSheet(client, sync, fiche.id, equiperArme(fiche.data, weaponId));
  const degainerUneArme = () =>
    void saveSheet(client, sync, fiche.id, degainerArme(fiche.data));
  // L'envoi peut échouer (réseau, format refusé côté bucket) : on laisse
  // l'erreur remonter jusqu'au médaillon, qui l'affiche — saveSheet, elle,
  // n'a plus de raison d'échouer une fois l'URL obtenue.
  const choisirPortrait = async (file: File) => {
    const url = await uploadPortrait(client, fiche.id, file);
    await saveSheet(client, sync, fiche.id, { ...fiche.data, portraitUrl: url });
  };

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
      {jetConcentration && (
        <div style={{
          position: 'fixed', left: 12, right: 12, bottom: 'calc(12px + env(safe-area-inset-bottom))',
          zIndex: 40, background: 'var(--surface-raised)', border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--raise)', padding: '13px 14px',
        }}>
          <div className="lbl" style={{ color: 'var(--accent)' }}>Sauvegarde de concentration</div>
          <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.45 }}>
            Dégâts reçus{spellById(fiche.data.live.concentration?.spellId ?? '')?.name
              ? ` en te concentrant sur ${spellById(fiche.data.live.concentration?.spellId ?? '')?.name}` : ''}
            {' '}— sauvegarde de Constitution <strong className="num">DD {jetConcentration.dd}</strong> à la table.
          </div>
          {jetConcentration.bonusSagesse > 0 && (
            <div style={{ fontSize: 13, marginTop: 4, color: 'var(--accent)', lineHeight: 1.4 }}>
              Éclat lunaire : ajoute ta Sagesse (+{jetConcentration.bonusSagesse}) à ce jet, tant que tu es transformé.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => repondreJetConcentration(true)}
              style={{
                flexGrow: 1, minHeight: 'var(--tap)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--ok)', color: 'var(--ok)', fontSize: 14, fontWeight: 700,
              }}
            >
              Réussie
            </button>
            <button
              onClick={() => repondreJetConcentration(false)}
              style={{
                flexGrow: 1, minHeight: 'var(--tap)', borderRadius: 'var(--radius-sm)',
                background: 'var(--vital)', color: 'var(--accent-ink)', fontSize: 14, fontWeight: 700,
              }}
            >
              Ratée
            </button>
          </div>
        </div>
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
          onRamenerCompagnon={ramenerCompagnonLie}
          onEquiperArme={equiperUneArme}
          onDegainerArme={degainerUneArme}
          niveauDisponible={niveauDisponible}
          onNiveauSuperieur={estMj
            ? basculerNiveauDisponible
            : (niveauDisponible ? () => setNiveauEnCours(true) : undefined)}
          onRepos={() => onOnglet('repos')}
          onReglages={() => onOnglet('parametres')}
          onRegles={() => onOnglet('regles')}
          onChoixDeClasse={enregistrerChoixDeClasse}
          onChoisirPortrait={choisirPortrait}
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
      return <RestScreen sheet={fiche.data} derived={derivee} onRepos={prendreRepos} onRetour={() => onOnglet('fiche')} estMj={estMj} />;
    }

    if (onglet === 'regles') {
      return <RulesScreen onRetour={() => onOnglet('fiche')} />;
    }

    if (onglet === 'parametres') {
      return <SettingsScreen email={userEmail} onDeconnexion={() => void seDeconnecter(client)} onRetour={() => onOnglet('fiche')} />;
    }

    const enCombat = rencontre != null && rencontre.turnIndex >= 0;
    // `turnIndex` pointe dans la liste TRIÉE par initiative (`orderedCombatants`,
    // voir `activeCombatant`), pas dans `rencontre.combatants` tel qu'il est
    // stocké (ordre d'ajout). L'indexer directement désignait le mauvais
    // combattant dès que l'ordre d'ajout différait de l'ordre d'initiative —
    // la fiche affichait alors « Tour de » quelqu'un d'autre que le combattant
    // réellement actif côté MJ.
    const actif = enCombat ? activeCombatant(rencontre) : undefined;
    // Le combattant de CE personnage, pour lire les états que le MJ y a
    // posés. Même clé que `isYourTurn` : le nom, seul lien commun tant qu'un
    // combattant n'est pas rattaché à une fiche côté base.
    const monCombattant = rencontre?.combatants.find((c) => c.name === fiche.data.name);
    return (
      <CombatScreen
        sheet={fiche.data}
        cards={cartes}
        onSpendHp={soignerOuBlesser}
        onPlayCard={jouerCarte}
        onEquiperArme={equiperUneArme}
        cibles={ciblesMarquables}
        etats={monCombattant?.conditions ?? []}
        onFinMarque={finDeMarque}
        onTransfererMarque={deplacerMarque}
        onDepenserRessource={depenserRessource}
        onRestaurerRessource={restaurerRessource}
        onRompreConcentration={rompreConcentration}
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
    <div
      style={{
        display: 'contents',
        // `--accent-wash` reste OPAQUE : la moitié de l'appli (bandeau MJ,
        // compétence maîtrisée, sort préparé…) s'en sert comme fond, pas
        // comme halo — un fond translucide y laisse transparaître ce qu'il
        // devrait couvrir. `--accent-glow` est le jeton fait pour ça.
        ...({
          '--accent': theme.accent,
          '--accent-wash': theme.accentWash,
          '--accent-glow': theme.accentGlow,
          '--gold': theme.gold,
          '--gold-bright': theme.goldBright,
          '--gold-dim': theme.goldDim,
        } as React.CSSProperties),
      }}
    >
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
    </div>
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
