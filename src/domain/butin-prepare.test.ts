import { describe, expect, it } from 'vitest';
import { catalogueADonner } from './don-d-objet';
import {
  ajouterAuButin, ajouterLigneLibre, BUTIN_VIDE, butinEstVide, changerOr, changerQuantite,
  ficheDeLaLigne, lignesDeSac, lireButin, partDeChacun, retirerDuButin,
} from './butin-prepare';

const potion = catalogueADonner().find((o) => o.clef === 'mag:potion-de-soins')!;
const corde = catalogueADonner().find((o) => o.provenance === 'equipement' && o.nom === 'Corde de chanvre (15 m)')
  ?? catalogueADonner().find((o) => o.provenance === 'equipement')!;

describe('composer un butin', () => {
  it('part d’un butin vide', () => {
    expect(butinEstVide(BUTIN_VIDE)).toBe(true);
  });

  it('ajoute un objet du catalogue avec son identifiant de sac', () => {
    const butin = ajouterAuButin(BUTIN_VIDE, potion);
    expect(butin.objets).toHaveLength(1);
    expect(butin.objets[0]!.nom).toBe('Potion de soins');
    // Le même soin que le don direct : la potion doit arriver buvable.
    expect(butin.objets[0]!.catalogId).toBe('av-potion-soins');
  });

  it('empile plutôt que de doubler la ligne', () => {
    // Trois potions de soins, c'est une ligne à 3 — pas trois lignes à 1.
    const butin = ajouterAuButin(ajouterAuButin(BUTIN_VIDE, potion), potion, 2);
    expect(butin.objets).toHaveLength(1);
    expect(butin.objets[0]!.qty).toBe(3);
  });

  it('garde deux objets différents sur deux lignes', () => {
    const butin = ajouterAuButin(ajouterAuButin(BUTIN_VIDE, potion), corde);
    expect(butin.objets).toHaveLength(2);
  });

  it('accepte une ligne écrite à la main', () => {
    // « La clé de la cave » n'est dans aucun catalogue et doit pouvoir y être.
    const butin = ajouterLigneLibre(BUTIN_VIDE, 'La clé de la cave');
    expect(butin.objets[0]!.nom).toBe('La clé de la cave');
    expect(butin.objets[0]!.clef).toBeUndefined();
    expect(butin.objets[0]!.catalogId).toBeUndefined();
  });

  it('refuse une ligne libre vide', () => {
    expect(ajouterLigneLibre(BUTIN_VIDE, '   ').objets).toHaveLength(0);
  });

  it('retire une ligne quand la quantité tombe à zéro', () => {
    const butin = ajouterAuButin(BUTIN_VIDE, potion);
    expect(changerQuantite(butin, butin.objets[0]!.id, 0).objets).toHaveLength(0);
    expect(retirerDuButin(butin, butin.objets[0]!.id).objets).toHaveLength(0);
  });

  it('n’accepte jamais un or négatif', () => {
    expect(changerOr(BUTIN_VIDE, -50).or).toBe(0);
    expect(changerOr(BUTIN_VIDE, 12.9).or).toBe(12);
  });

  it('retrouve la fiche du catalogue, et rien pour une ligne libre', () => {
    const butin = ajouterLigneLibre(ajouterAuButin(BUTIN_VIDE, potion), 'La clé de la cave');
    expect(ficheDeLaLigne(butin.objets[0]!)?.nom).toBe('Potion de soins');
    expect(ficheDeLaLigne(butin.objets[1]!)).toBeUndefined();
  });
});

describe('relire ce que la base rend', () => {
  it('survit à du vide et à n’importe quoi', () => {
    for (const brut of [null, undefined, 3, 'texte', [], {}]) {
      expect(lireButin(brut)).toEqual(BUTIN_VIDE);
    }
  });

  it('jette une ligne sans nom, qui ne se donnerait pas', () => {
    const lu = lireButin({ objets: [{ id: 'a', nom: '' }, { id: 'b', nom: 'Dague', qty: 2 }], or: 5 });
    expect(lu.objets).toHaveLength(1);
    expect(lu.objets[0]!.nom).toBe('Dague');
    expect(lu.or).toBe(5);
  });

  it('donne un identifiant à une ligne qui n’en a pas', () => {
    // Sans identifiant, la ligne resterait à l'écran sans pouvoir être retirée.
    const lu = lireButin({ objets: [{ nom: 'Dague' }] });
    expect(lu.objets[0]!.id).toBeTruthy();
  });

  it('redresse une quantité absurde plutôt que de l’afficher', () => {
    const lu = lireButin({ objets: [{ nom: 'Dague', qty: 0 }, { nom: 'Corde', qty: 2.7 }] });
    expect(lu.objets[0]!.qty).toBe(1);
    expect(lu.objets[1]!.qty).toBe(2);
  });

  it('refuse un or qui n’est pas un nombre', () => {
    expect(lireButin({ or: 'beaucoup' }).or).toBe(0);
    expect(lireButin({ or: -10 }).or).toBe(0);
    expect(lireButin({ or: Number.NaN }).or).toBe(0);
  });
});

describe('le partage de l’or', () => {
  it('donne à chacun sa part, et dit ce qui reste', () => {
    // 100 po à trois : 33 chacun, il reste 1. Personne ne coupe une pièce.
    expect(partDeChacun(100, 3)).toEqual({ part: 33, reste: 1 });
    expect(partDeChacun(90, 3)).toEqual({ part: 30, reste: 0 });
  });

  it('ne divise pas par zéro', () => {
    expect(partDeChacun(50, 0)).toEqual({ part: 0, reste: 50 });
  });
});

describe('ce qui part dans les sacs', () => {
  it('rend une ligne par objet, avec sa quantité et son identifiant', () => {
    const butin = ajouterLigneLibre(ajouterAuButin(BUTIN_VIDE, potion, 3), 'La clé de la cave');
    const lignes = lignesDeSac(butin);
    expect(lignes).toEqual([
      { name: 'Potion de soins', qty: 3, catalogId: 'av-potion-soins' },
      { name: 'La clé de la cave', qty: 1 },
    ]);
  });
});
