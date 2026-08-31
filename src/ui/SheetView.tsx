import { useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CombatScreen } from './CombatScreen';
import { SpellbookScreen } from './SpellbookScreen';
import { FicheScreen } from './FicheScreen';
import { JournalScreen, type Correspondant } from './JournalScreen';
import { InventoryScreen, type DestinataireDon } from './InventoryScreen';
import { RestScreen } from './RestScreen';
import { RulesScreen } from './RulesScreen';
import { SettingsScreen } from './SettingsScreen';
import { TabBar, type MainTab } from './TabBar';
import { cardsFromCharacter, concentre } from './spell-cards';
import { weaponCardsFromCharacter } from './weapon-cards';
import { itemCardsFromCharacter } from './item-cards';
import type { PlayableCard } from './combat-layout';
import { deriveCharacter } from '../model/derive';
import { restoreResource, spendResource } from '../model/cast';
import { choisirDeClasse } from '../model/choix-de-classe';
import { recuperationNaturelle, type ChoixRecuperation } from '../model/druide';
import { finMarque, marquer, MARQUE_CHASSEUR_SPELL_ID, transfererMarque, type CibleMarquee } from '../model/rodeur';
import { BENEDICTION_TENEBREUX_CARD_ID, benedictionDuTenebreux, RUSE_MAGIQUE_KEY, utiliserRuseMagique } from '../model/occultiste';
import { heal, takeDamage } from '../model/damage';
import { addItem, donnerItem, removeItem, setGold, setItemQty, useActionItem, useHealingItem } from '../model/inventory';
import {
  createItemTransfer, createJournalEntry, createMessage, createNote, deleteJournalEntry, deleteMessage,
  deleteNote, saveJournalEntry, saveNote, saveSheet,
} from '../sync/mutations';
import { uploadPortrait } from '../sync/portraits';
import { seDeconnecter } from '../sync/session';
import { GrantSpellDialog } from './GrantSpellDialog';
import { LevelUpDialog } from './LevelUpDialog';
import { LevelUpCelebration } from './LevelUpCelebration';
import { rest, type RestKind } from '../model/rest';
import { withGrant, withoutGrant } from '../model/spell-grants';
import { spellById } from '../content/spell-catalogue';
import { themeDeClasse } from '../content/class-themes';
import {
  activerCourrouxDeLaMer, activerFormeStellaire, bonusConcentrationEclatLunaire, type Constellation,
  finCourrouxDeLaMer, finFormeStellaire, learnForm, revert as revenirDeForme, swapForm, transform, wildShapeAccess,
} from '../model/wild-shape';
import {
  applyCompanionDamage, availableCompanions, bondCompanion, dismissCompanion, ramenerCompagnon,
  type CompanionPayment,
} from '../model/companions';
import { degainerArme, equiperArme, equiperBouclier, retirerBouclier } from '../model/weapons';
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
  campaignId, userId, userEmail, gmId, journalEntries, notes, messages, correspondants, destinatairesDon,
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
  /** Id du MJ — pour router le jet discret du Journal vers lui. Absent côté MJ, il n'en a pas besoin. */
  gmId?: string;
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
  /**
   * À qui l'on peut donner un objet du sac — les autres personnages de la
   * table, jamais le MJ, qui n'a pas de sac. Vide côté fiche que le MJ
   * consulte : ce n'est pas à lui de donner les objets d'un joueur.
   */
  destinatairesDon?: DestinataireDon[];
}) {
  const [donEnCours, setDonEnCours] = useState(false);
  /** Un jet de sauvegarde de concentration à faire à la table, DD déjà calculé. */
  const [jetConcentration, setJetConcentration] = useState<{ dd: number; bonusSagesse: number } | null>(null);
  const [niveauEnCours, setNiveauEnCours] = useState(false);
  /** L'écran de célébration qui suit une montée de niveau — voir `monterDeNiveau`. */
  const [celebration, setCelebration] = useState<{
    nom: string; theme: ReturnType<typeof themeDeClasse>; niveau: number;
    gains: { label: string; avant: string; apres: string }[];
  } | null>(null);
  const [aRevoquer, setARevoquer] = useState<string | null>(null);

  /**
   * Le brouillon local : la fiche telle qu'on vient de la modifier, avant que
   * l'écho du serveur ne revienne la confirmer. Sans lui, chaque geste relit
   * `fiche.data` — la DERNIÈRE ligne confirmée par la base, pas celle qu'on
   * vient tout juste d'écrire par-dessus. Deux appuis rapprochés (le curseur
   * de PV qu'on tape trois fois, un aller-retour réseau qui traîne) calculent
   * alors chacun leur delta depuis le MÊME état de départ : le second écrase
   * le premier au lieu de s'y ajouter, et l'un des deux gestes disparaît sans
   * message d'erreur. C'est exactement le motif déjà résolu pour la rencontre
   * du MJ (`App.tsx`, `changer`/`brouillon`) — la fiche du joueur n'avait pas
   * son équivalent.
   *
   * Le brouillon s'efface dès que la ligne confirmée change de version : c'est
   * elle qui fait foi, jamais une divergence silencieuse.
   */
  const [brouillon, setBrouillon] = useState<CharacterSheet | null>(null);
  useEffect(() => { setBrouillon(null); }, [fiche.version]);
  const donnees = brouillon ?? fiche.data;

  /**
   * Écrit un geste : le brouillon avance tout de suite (le prochain geste
   * partira de lui, pas de la ligne pas encore confirmée), puis la fiche part
   * en base. Un échec réseau efface le brouillon plutôt que de laisser
   * l'écran mentir sur ce qui a réellement été enregistré.
   */
  const enregistrer = (suivante: CharacterSheet) => {
    if (suivante === donnees) return;
    setBrouillon(suivante);
    void saveSheet(client, sync, fiche.id, suivante).catch(() => setBrouillon(null));
  };

  const derivee = useMemo(() => deriveCharacter(donnees), [donnees]);
  // La matière « Braise et fer » : posée ici, une fois, elle retombe sur
  // TOUS les écrans de cette fiche par héritage CSS — Combat, Fiche,
  // Grimoire, Sac, Journal — sans que chacun ait à la recalculer.
  const theme = useMemo(() => themeDeClasse(donnees.classLevels), [donnees.classLevels]);
  const cartes = useMemo(
    () => [...weaponCardsFromCharacter(donnees, derivee), ...cardsFromCharacter(donnees, derivee), ...itemCardsFromCharacter(donnees)],
    [donnees, derivee],
  );

  /**
   * Les cibles marquables : les combattants de la rencontre, moins soi-même.
   * On ne restreint pas aux créatures du MJ — Marque du chasseur ne le fait
   * pas non plus, et une partie où l'on se retourne contre un allié existe.
   */
  const ciblesMarquables = useMemo<CibleMarquee[]>(
    () => (rencontre?.combatants ?? [])
      .filter((combattant) => combattant.name !== donnees.name)
      .map((combattant) => ({ id: combattant.id, name: combattant.name })),
    [rencontre, donnees.name],
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
      const present = donnees.cantrips.some((mineur) => mineur.id === spellId);
      enregistrer({
        ...donnees,
        cantrips: present
          ? donnees.cantrips.filter((mineur) => mineur.id !== spellId)
          : [...donnees.cantrips, { id: spellId, sourceClass: classId }],
      });
      return;
    }
    const present = donnees.spells.some((sort) => sort.id === spellId);
    enregistrer({
      ...donnees,
      spells: present
        ? donnees.spells.filter((sort) => sort.id !== spellId)
        : [...donnees.spells, { id: spellId, sourceClass: classId, prepared: true }],
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
      ? takeDamage(donnees, derivee, -delta).sheet
      : heal(donnees, delta);
    if (suivante === donnees) return;
    if (suivante.live.damageTaken === donnees.live.damageTaken
      && suivante.live.temporaryHp === donnees.live.temporaryHp) return;
    // Encaisser des dégâts en étant concentré appelle une sauvegarde — le jet
    // se fait à la table comme toujours, mais rien ne rappelait jusqu'ici
    // qu'il fallait le faire, ni son DD. `delta` est ce qui vient d'être tapé
    // (avant absorption par les PV temporaires) : c'est ce montant-là, pas ce
    // qui a atteint les PV, que la règle prend en compte.
    if (delta < 0 && donnees.live.concentration) {
      const degats = Math.max(0, Math.floor(-delta));
      setJetConcentration({
        dd: Math.min(30, Math.max(10, Math.floor(degats / 2))),
        // Éclat lunaire (Cercle de la Lune 6) ajoute la Sagesse à CE jet
        // précis, tant que la Forme sauvage dure — jamais affiché ailleurs.
        bonusSagesse: bonusConcentrationEclatLunaire(donnees, derivee.modifiers.wis),
      });
    }
    enregistrer(suivante);
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
      const suivante = benedictionDuTenebreux(donnees, { reduitParLOccultiste: true, aPortee: false });
      if (suivante !== donnees) enregistrer(suivante);
      return;
    }
    let suivante = spendResource(donnees, resourceKey);
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
    enregistrer(suivante);
  };

  /**
   * Rompt la concentration en cours, hors Marque du chasseur — qui a déjà son
   * propre bouton « Fin » dans son bloc dédié. Ne retire pas l'état auto-posé
   * (Invisible…) : sa fin dépend de la situation à la table, c'est au MJ de
   * la trancher via la liste d'états, déjà fonctionnelle pour ça.
   */
  const rompreConcentration = () => {
    enregistrer({ ...donnees, live: { ...donnees.live, concentration: null } });
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
      const { sheet } = utiliserRuseMagique(donnees, derivee);
      if (sheet !== donnees) enregistrer(sheet);
      return;
    }
    enregistrer(spendResource(donnees, resourceKey));
  };
  const restaurerRessource = (resourceKey: string) => {
    enregistrer(restoreResource(donnees, resourceKey));
  };

  const finDeMarque = () => {
    enregistrer(finMarque(donnees));
  };

  const deplacerMarque = (cible: CibleMarquee) => {
    enregistrer(transfererMarque(donnees, cible));
  };

  /**
   * Une décision de classe est une décision de PERSONNAGE, pas de l'état
   * vivant : elle part en base comme la préparation d'un sort.
   */
  const enregistrerChoixDeClasse = (classId: string, key: string, optionId: string) => {
    // Un choix définitif ne se reprend que par le MJ : le modèle refuse le
    // reste. L'écran ne propose « Corriger » qu'à lui, mais c'est ici que la
    // règle s'applique — un joueur ne doit pas pouvoir la contourner.
    const suivante = choisirDeClasse(donnees, classId, key, optionId, { parLeMj: Boolean(estMj) });
    if (suivante === donnees) return;
    enregistrer(suivante);
  };

  const accorder = (grant: SpellGrant) => {
    enregistrer(withGrant(donnees, grant));
    setDonEnCours(false);
  };

  const revoquer = (grantId: string) => {
    enregistrer(withoutGrant(donnees, grantId));
    setARevoquer(null);
  };

  const prendreRepos = (kind: RestKind, recuperation?: ChoixRecuperation) => {
    const apresRepos = rest(donnees, derivee, kind).sheet;
    // Récupération naturelle se résout à la FIN du repos court : le repos
    // rend d'abord ce qu'il rend, la capacité récupère ensuite.
    const suivante = recuperation
      ? recuperationNaturelle(apresRepos, deriveCharacter(apresRepos), recuperation)
      : apresRepos;
    enregistrer(suivante);
  };

  const monterDeNiveau = (suivante: CharacterSheet) => {
    // Les stats « avant » se lisent sur `donnees` avant qu'`enregistrer` ne
    // les remplace — les capturer après serait déjà trop tard.
    const avant = deriveCharacter(donnees);
    const apres = deriveCharacter(suivante);
    const classeMontee = suivante.classLevels.find((niveau) => {
      const avantNiveau = donnees.classLevels.find((n) => n.classId === niveau.classId);
      return !avantNiveau || avantNiveau.level !== niveau.level;
    });
    setCelebration({
      nom: suivante.name,
      theme: themeDeClasse(suivante.classLevels),
      niveau: classeMontee?.level ?? suivante.classLevels[0]?.level ?? 1,
      gains: [
        { label: 'PV max', avant: String(avant.maxHp), apres: String(apres.maxHp) },
        { label: 'Maîtrise', avant: `+${avant.proficiencyBonus}`, apres: `+${apres.proficiencyBonus}` },
        ...(apres.spellcasting.slots.length > 0 ? [{
          label: 'Emplacements',
          avant: avant.spellcasting.slots.map((slot) => slot.max).join('/') || '—',
          apres: apres.spellcasting.slots.map((slot) => slot.max).join('/') || '—',
        }] : []),
      ],
    });
    // La montée effectuée referme la porte que le MJ avait ouverte : sans ce
    // même geste, elle resterait proposée pour toujours.
    enregistrer({ ...suivante, live: { ...suivante.live, levelUpUnlocked: false } });
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
  const niveauDisponible = Boolean(donnees.live.levelUpUnlocked);
  const basculerNiveauDisponible = () => {
    enregistrer({
      ...donnees,
      live: { ...donnees.live, levelUpUnlocked: !niveauDisponible },
    });
  };

  // L'onglet Fiche montre les formes/créature liée seulement si elles ont
  // quelque chose à afficher : la plupart des personnages n'ont ni Forme
  // sauvage ni créature liée.
  const aDesFormesOuCompagnons = wildShapeAccess(donnees, derivee).knownLimit > 0
    || availableCompanions(donnees).length > 0
    || (donnees.companions?.length ?? 0) > 0;

  const transformerEnForme = (formId: string) =>
    enregistrer(transform(donnees, derivee, formId));
  const revenirDeLaForme = () =>
    enregistrer(revenirDeForme(donnees));
  const activerCourroux = () =>
    enregistrer(activerCourrouxDeLaMer(donnees, derivee));
  const terminerCourroux = () =>
    enregistrer(finCourrouxDeLaMer(donnees));
  const activerEtoiles = (constellation: Constellation) =>
    enregistrer(activerFormeStellaire(donnees, derivee, constellation));
  const terminerEtoiles = () =>
    enregistrer(finFormeStellaire(donnees));
  const apprendreForme = (formId: string) =>
    enregistrer(learnForm(donnees, derivee, formId));
  const echangerForme = (fromId: string, toId: string) =>
    enregistrer(swapForm(donnees, derivee, fromId, toId));
  const lierCompagnon = (optionId: string, nom?: string, paiement?: CompanionPayment) =>
    enregistrer(bondCompanion(donnees, derivee, optionId, nom, paiement));
  const degatsCompagnon = (companionId: string, delta: number) =>
    enregistrer(applyCompanionDamage(donnees, companionId, delta));
  const detacherCompagnon = (companionId: string) =>
    enregistrer(dismissCompanion(donnees, companionId));
  const ramenerCompagnonLie = (companionId: string, rang: number) =>
    enregistrer(ramenerCompagnon(donnees, companionId, rang));
  const equiperUneArme = (weaponId: string) =>
    enregistrer(equiperArme(donnees, weaponId));
  const degainerUneArme = () =>
    enregistrer(degainerArme(donnees));
  const equiperLeBouclier = () =>
    enregistrer(equiperBouclier(donnees));
  const retirerLeBouclier = () =>
    enregistrer(retirerBouclier(donnees));
  // L'envoi peut échouer (réseau, format refusé côté bucket) : on laisse
  // l'erreur remonter jusqu'au médaillon, qui l'affiche — le brouillon
  // s'efface au même titre qu'un échec de `saveSheet` ordinaire.
  const choisirPortrait = async (file: File) => {
    const url = await uploadPortrait(client, fiche.id, file);
    const suivante = { ...donnees, portraitUrl: url };
    setBrouillon(suivante);
    try {
      await saveSheet(client, sync, fiche.id, suivante);
    } catch (erreur) {
      setBrouillon(null);
      throw erreur;
    }
  };

  // Taille et historique : deux décisions de création qui n'avaient nulle
  // part où vivre à l'écran — jusqu'ici stockées (`sheet.size`) ou même pas
  // (`sheet.history` n'existait pas), sans qu'aucune fiche ne les affiche
  // ni ne permette de les remplir.
  const choisirTaille = (taille: string) =>
    enregistrer({ ...donnees, size: taille });
  const modifierHistorique = (history: string) =>
    enregistrer({ ...donnees, history });

  // Journal : seul le MJ écrit, la RLS le rappellerait de toute façon à qui
  // s'y essaierait sans l'être.
  const ajouterEntreeJournal = (entree: { title: string | null; chapter: string | null; body: string }) =>
    void createJournalEntry(client, sync, campaignId, userId, entree);
  const modifierEntreeJournal = (id: string, entree: { title: string | null; chapter: string | null; body: string }) =>
    void saveJournalEntry(client, sync, id, entree);
  const supprimerEntreeJournal = (id: string) => void deleteJournalEntry(client, sync, id);

  // Notes : toujours celles de qui regarde l'écran — jamais celles d'un
  // joueur dont le MJ consulterait la fiche.
  const ajouterNote = (note: { title: string | null; chapter: string | null; body: string }) =>
    void createNote(client, sync, campaignId, userId, note);
  const modifierNote = (id: string, note: { title: string | null; chapter: string | null; body: string }) =>
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
    enregistrer(addItem(donnees, item));
  const quantiteObjet = (itemId: string, qty: number) =>
    enregistrer(setItemQty(donnees, itemId, qty));
  const retirerObjet = (itemId: string) =>
    enregistrer(removeItem(donnees, itemId));
  const fixerOr = (gold: number) =>
    enregistrer(setGold(donnees, gold));
  // Donner : on retire d'abord de son propre sac (une écriture qu'on a le
  // droit de faire), puis on dépose un relais que le destinataire consomme
  // lui-même — la RLS interdit d'écrire directement dans son sac à lui.
  const donnerObjet = (itemId: string, recipientId: string, qty: number) => {
    const { sheet: suivante, envoye } = donnerItem(donnees, itemId, qty);
    if (!envoye) return;
    enregistrer(suivante);
    void createItemTransfer(client, sync, campaignId, userId, { recipientId, ...envoye });
  };
  // Boire une potion de soins : le jet se fait ici, avec les mêmes
  // probabilités qu'un vrai dé (`domain/dice.ts`) — jamais une moyenne.
  const boireSoin = (itemId: string) => {
    const resultat = useHealingItem(donnees, itemId, Math.random);
    if (!resultat) return null;
    enregistrer(resultat.sheet);
    return resultat.jet;
  };
  // Le raccourci de l'écran de Combat : même geste que « Boire » pour un
  // soignant, sinon une simple consommation — voir `model/inventory.ts`,
  // `useActionItem`.
  const utiliserObjet = (itemId: string) => {
    const resultat = useActionItem(donnees, itemId, Math.random);
    if (!resultat) return null;
    enregistrer(resultat.sheet);
    return { itemName: resultat.itemName, jet: resultat.jet };
  };

  const dialogues = (
    <>
      {niveauEnCours && (
        <LevelUpDialog
          sheet={donnees}
          onMonter={monterDeNiveau}
          onFermer={() => setNiveauEnCours(false)}
        />
      )}
      {celebration && (
        <LevelUpCelebration
          nom={celebration.nom}
          theme={celebration.theme}
          niveau={celebration.niveau}
          gains={celebration.gains}
          onContinuer={() => setCelebration(null)}
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
            Dégâts reçus{spellById(donnees.live.concentration?.spellId ?? '')?.name
              ? ` en te concentrant sur ${spellById(donnees.live.concentration?.spellId ?? '')?.name}` : ''}
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
          sheet={donnees}
          derived={derivee}
          avecAllies={aDesFormesOuCompagnons}
          estMj={Boolean(estMj)}
          onTransformer={transformerEnForme}
          onRevenir={revenirDeLaForme}
          onCourrouxDeLaMer={activerCourroux}
          onFinCourrouxDeLaMer={terminerCourroux}
          onFormeStellaire={activerEtoiles}
          onFinFormeStellaire={terminerEtoiles}
          onApprendre={apprendreForme}
          onEchanger={echangerForme}
          onLier={lierCompagnon}
          onDegatsCompagnon={degatsCompagnon}
          onDetacherCompagnon={detacherCompagnon}
          onRamenerCompagnon={ramenerCompagnonLie}
          onEquiperArme={equiperUneArme}
          onDegainerArme={degainerUneArme}
          onEquiperBouclier={equiperLeBouclier}
          onRetirerBouclier={retirerLeBouclier}
          niveauDisponible={niveauDisponible}
          onNiveauSuperieur={estMj
            ? basculerNiveauDisponible
            : (niveauDisponible ? () => setNiveauEnCours(true) : undefined)}
          onRepos={() => onOnglet('repos')}
          onReglages={() => onOnglet('parametres')}
          onRegles={() => onOnglet('regles')}
          onChoixDeClasse={enregistrerChoixDeClasse}
          onChoisirPortrait={choisirPortrait}
          onChoisirTaille={choisirTaille}
          onModifierHistorique={modifierHistorique}
        />
      );
    }

    if (onglet === 'journal') {
      return (
        <JournalScreen
          entries={journalEntries}
          notes={notes}
          estMj={Boolean(estMj)}
          notesOwnerName={estMj ? donnees.name : undefined}
          moi={userId}
          gmId={gmId}
          correspondants={correspondants}
          messages={messages}
          onAjouterEntree={estMj ? ajouterEntreeJournal : undefined}
          onModifierEntree={estMj ? modifierEntreeJournal : undefined}
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
          sheet={donnees}
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
          sheet={donnees}
          destinataires={destinatairesDon ?? []}
          onAjouter={ajouterObjet}
          onQty={quantiteObjet}
          onRetirer={retirerObjet}
          onOr={fixerOr}
          onDonner={donnerObjet}
          onBoire={boireSoin}
        />
      );
    }

    if (onglet === 'repos') {
      return <RestScreen sheet={donnees} derived={derivee} onRepos={prendreRepos} onRetour={() => onOnglet('fiche')} estMj={estMj} />;
    }

    if (onglet === 'regles') {
      return <RulesScreen onRetour={() => onOnglet('fiche')} />;
    }

    if (onglet === 'parametres') {
      return (
        <SettingsScreen
          client={client}
          userId={userId}
          email={userEmail}
          onDeconnexion={() => void seDeconnecter(client)}
          onRetour={() => onOnglet('fiche')}
        />
      );
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
    const monCombattant = rencontre?.combatants.find((c) => c.name === donnees.name);
    return (
      <CombatScreen
        sheet={donnees}
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
        onUtiliserObjet={utiliserObjet}
        turnId={turnIdentity(encounterId, rencontre)}
        turn={
          enCombat
            ? {
                mode: 'combat',
                // Le lien fiche ↔ combattant se fait par le nom du personnage :
                // c'est la seule clé commune tant qu'un combattant n'est pas
                // rattaché à une fiche côté base.
                isYourTurn: actif?.name === donnees.name,
                holder: actif?.name,
              }
            : { mode: 'libre' }
        }
      />
    );
  };

  const vise = onglet === 'grimoire' ? (donnees.grants ?? []).find((grant) => grant.id === aRevoquer) : undefined;

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
          sheet={donnees}
          derived={derivee}
          onAccorder={accorder}
          onFermer={() => setDonEnCours(false)}
        />
      )}
      {vise && (
        <Confirmation
          question={`Révoquer « ${spellById(vise.spellId)?.name ?? vise.spellId} » ?`}
          detail={`Accordé à ${donnees.name} par ${vise.source}. `
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
