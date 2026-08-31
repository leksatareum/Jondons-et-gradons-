import { describe, expect, it } from 'vitest';
import { addItem, donnerItem, recevoirItem, removeItem, setGold, setItemQty, useActionItem, useHealingItem } from './inventory';
import { EMPTY_LIVE_STATE, type CharacterSheet } from './character';

const fiche = (over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: 'f', name: 'Fixture', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 16 },
  alignment: null,
  classLevels: [{ classId: 'magicien', level: 1, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 10,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

describe('ajouter un objet', () => {
  it('l’ajoute avec un identifiant propre, sans toucher au reste du sac', () => {
    const depart = fiche({ inventory: [{ id: 'x', name: 'Corde', qty: 1 }] });
    const suivante = addItem(depart, { name: 'Torche', qty: 3 });
    expect(suivante.inventory).toHaveLength(2);
    expect(suivante.inventory[1]).toMatchObject({ name: 'Torche', qty: 3 });
    expect(suivante.inventory[0]).toEqual(depart.inventory[0]);
  });

  it('une quantité nulle ou négative devient 1 — un objet ajouté existe', () => {
    expect(addItem(fiche(), { name: 'Dague', qty: 0 }).inventory[0]?.qty).toBe(1);
    expect(addItem(fiche(), { name: 'Dague', qty: -3 }).inventory[0]?.qty).toBe(1);
  });
});

describe('changer une quantité', () => {
  it('met à jour la quantité de l’objet visé, sans toucher aux autres', () => {
    const depart = fiche({ inventory: [{ id: 'a', name: 'Flèche', qty: 20 }, { id: 'b', name: 'Corde', qty: 1 }] });
    const suivante = setItemQty(depart, 'a', 15);
    expect(suivante.inventory).toEqual([{ id: 'a', name: 'Flèche', qty: 15 }, { id: 'b', name: 'Corde', qty: 1 }]);
  });

  it('une quantité à 0 ou en dessous retire l’objet — un « 0 » n’a rien à faire dans un sac', () => {
    const depart = fiche({ inventory: [{ id: 'a', name: 'Flèche', qty: 3 }] });
    expect(setItemQty(depart, 'a', 0).inventory).toEqual([]);
    expect(setItemQty(depart, 'a', -1).inventory).toEqual([]);
  });
});

describe('retirer un objet', () => {
  it('retire uniquement l’objet visé', () => {
    const depart = fiche({ inventory: [{ id: 'a', name: 'Flèche', qty: 3 }, { id: 'b', name: 'Corde', qty: 1 }] });
    expect(removeItem(depart, 'a').inventory).toEqual([{ id: 'b', name: 'Corde', qty: 1 }]);
  });
});

describe('la bourse', () => {
  it('fixe l’or, jamais sous zéro', () => {
    expect(setGold(fiche(), 42).gold).toBe(42);
    expect(setGold(fiche(), -5).gold).toBe(0);
  });
});

describe('donner un objet — vers le sac de quelqu’un d’autre', () => {
  it('retire la quantité envoyée, garde le reste', () => {
    const depart = fiche({ inventory: [{ id: 'a', name: 'Flèche', qty: 20 }] });
    const { sheet, envoye } = donnerItem(depart, 'a', 5);
    expect(sheet.inventory).toEqual([{ id: 'a', name: 'Flèche', qty: 15 }]);
    expect(envoye).toEqual({ name: 'Flèche', qty: 5, note: undefined, catalogId: undefined });
  });

  it('envoyer tout ce qu’il y en a retire l’objet du sac', () => {
    const depart = fiche({ inventory: [{ id: 'a', name: 'Potion de soins', qty: 1 }] });
    const { sheet, envoye } = donnerItem(depart, 'a', 1);
    expect(sheet.inventory).toEqual([]);
    expect(envoye?.qty).toBe(1);
  });

  it('ne peut pas envoyer plus qu’il n’en reste — la quantité est plafonnée', () => {
    const depart = fiche({ inventory: [{ id: 'a', name: 'Flèche', qty: 3 }] });
    const { sheet, envoye } = donnerItem(depart, 'a', 999);
    expect(sheet.inventory).toEqual([]);
    expect(envoye?.qty).toBe(3);
  });

  it('un objet inconnu ou une quantité nulle ne fait rien', () => {
    const depart = fiche({ inventory: [{ id: 'a', name: 'Flèche', qty: 3 }] });
    expect(donnerItem(depart, 'rien-du-tout', 1)).toEqual({ sheet: depart, envoye: null });
    expect(donnerItem(depart, 'a', 0)).toEqual({ sheet: depart, envoye: null });
    expect(donnerItem(depart, 'a', -2)).toEqual({ sheet: depart, envoye: null });
  });

  it('garde la note et le catalogId de l’objet envoyé', () => {
    const depart = fiche({ inventory: [{ id: 'a', name: 'Potion de soins', qty: 1, note: 'Rend 2d4+2 PV', catalogId: 'potion-soins' }] });
    const { envoye } = donnerItem(depart, 'a', 1);
    expect(envoye).toMatchObject({ note: 'Rend 2d4+2 PV', catalogId: 'potion-soins' });
  });
});

describe('recevoir un objet — depuis le sac de quelqu’un d’autre', () => {
  it('l’ajoute en nouvelle ligne, sans toucher au reste du sac', () => {
    const depart = fiche({ inventory: [{ id: 'x', name: 'Corde', qty: 1 }] });
    const suivante = recevoirItem(depart, { name: 'Flèche', qty: 5 });
    expect(suivante.inventory).toHaveLength(2);
    expect(suivante.inventory[1]).toMatchObject({ name: 'Flèche', qty: 5 });
    expect(suivante.inventory[0]).toEqual(depart.inventory[0]);
  });

  it('ne fond jamais dans une pile existante — deux lignes distinctes, comme addItem', () => {
    const depart = fiche({ inventory: [{ id: 'a', name: 'Flèche', qty: 10 }] });
    const suivante = recevoirItem(depart, { name: 'Flèche', qty: 5 });
    expect(suivante.inventory).toHaveLength(2);
  });

  it('reprend la note et le catalogId transmis', () => {
    const suivante = recevoirItem(fiche(), { name: 'Potion de soins', qty: 1, note: 'Rend 2d4+2 PV', catalogId: 'potion-soins' });
    expect(suivante.inventory[0]).toMatchObject({ note: 'Rend 2d4+2 PV', catalogId: 'potion-soins' });
  });

  it('un aller-retour donnerItem → recevoirItem ne perd ni ne crée d’objet', () => {
    const donateur = fiche({ inventory: [{ id: 'a', name: 'Potion de soins', qty: 3 }] });
    const beneficiaire = fiche();
    const { sheet: donateurApres, envoye } = donnerItem(donateur, 'a', 2);
    const beneficiaireApres = recevoirItem(beneficiaire, envoye!);
    expect(donateurApres.inventory[0].qty).toBe(1);
    expect(beneficiaireApres.inventory[0]).toMatchObject({ name: 'Potion de soins', qty: 2 });
  });
});

describe('boire une potion de soins — jet automatique, mêmes probabilités qu’un vrai dé', () => {
  const blesse = (pv: number) => fiche({
    inventory: [{ id: 'p', name: 'Potion de soins', qty: 2 }],
    live: { ...fiche().live, damageTaken: pv },
  });

  it('tire 2d4+2, jamais une moyenne — soigne exactement ce que les dés donnent', () => {
    const resultat = useHealingItem(blesse(20), 'p', () => 0); // chaque d4 au plus bas : 1+1+2 = 4
    expect(resultat?.jet).toEqual({ total: 4, des: [1, 1], bonus: 2 });
    expect(resultat?.sheet.live.damageTaken).toBe(16);
  });

  it('un jet au plafond soigne le maximum de la formule', () => {
    const resultat = useHealingItem(blesse(20), 'p', () => 0.999); // chaque d4 au plus haut : 4+4+2 = 10
    expect(resultat?.jet.total).toBe(10);
    expect(resultat?.sheet.live.damageTaken).toBe(10);
  });

  it('consomme une seule potion, garde le reste', () => {
    const resultat = useHealingItem(blesse(20), 'p', () => 0.5);
    expect(resultat?.sheet.inventory).toEqual([{ id: 'p', name: 'Potion de soins', qty: 1 }]);
  });

  it('la dernière potion bue disparaît du sac', () => {
    const uneSeule = fiche({ inventory: [{ id: 'p', name: 'Potion de soins', qty: 1 }] });
    const resultat = useHealingItem(uneSeule, 'p', () => 0.5);
    expect(resultat?.sheet.inventory).toEqual([]);
  });

  it('un objet inconnu, ou qui n’est pas une potion de soins, ne renvoie rien', () => {
    const sheet = fiche({ inventory: [{ id: 'c', name: 'Corde', qty: 1 }] });
    expect(useHealingItem(sheet, 'p')).toBeNull(); // aucune potion dans ce sac
    expect(useHealingItem(sheet, 'c')).toBeNull(); // « Corde » n'est pas reconnue comme un soin
  });

  it('ne dépasse jamais le maximum — heal() plafonne déjà, ce n’est pas à boire une potion de le refaire', () => {
    const presqueGueri = blesse(2); // 2 PV manquants, la potion en rend au moins 4
    const resultat = useHealingItem(presqueGueri, 'p', () => 0);
    expect(resultat?.sheet.live.damageTaken).toBe(0); // jamais négatif
  });
});

describe('utiliser un objet — le raccourci de l’écran de Combat', () => {
  it('un soignant se résout exactement comme useHealingItem, jet compris', () => {
    const sheet = fiche({
      inventory: [{ id: 'p', name: 'Potion de soins', qty: 1 }],
      live: { ...fiche().live, damageTaken: 20 },
    });
    const resultat = useActionItem(sheet, 'p', () => 0);
    expect(resultat?.jet).toEqual({ total: 4, des: [1, 1], bonus: 2 });
    expect(resultat?.sheet.live.damageTaken).toBe(16);
    expect(resultat?.sheet.inventory).toEqual([]);
  });

  it('un objet sans dés à tirer (Antitoxine…) se consomme sans jet', () => {
    const sheet = fiche({ inventory: [{ id: 'a', name: 'Antitoxine', qty: 3 }] });
    const resultat = useActionItem(sheet, 'a');
    expect(resultat?.jet).toBeNull();
    expect(resultat?.sheet.inventory).toEqual([{ id: 'a', name: 'Antitoxine', qty: 2 }]);
  });

  it('la dernière unité consommée disparaît du sac', () => {
    const sheet = fiche({ inventory: [{ id: 'a', name: 'Poison simple', qty: 1 }] });
    const resultat = useActionItem(sheet, 'a');
    expect(resultat?.sheet.inventory).toEqual([]);
  });

  it('un objet consommable mais sans action de combat (papier, rations…) ne renvoie rien', () => {
    const sheet = fiche({ inventory: [{ id: 'r', name: 'Rations (1 jour)', qty: 1 }] });
    expect(useActionItem(sheet, 'r')).toBeNull();
  });

  it('un objet inconnu du sac ne renvoie rien', () => {
    expect(useActionItem(fiche(), 'rien')).toBeNull();
  });
});
