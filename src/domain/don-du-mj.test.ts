import { describe, expect, it } from 'vitest';
import { RAISON_ECRITURE_DIRECTE, routeDuDon } from './don-du-mj';

const MJ = 'user-mj';

describe('par où passe le don du MJ', () => {
  it('passe par le transfert quand la fiche appartient à un joueur', () => {
    // C'est le cas normal, et le seul qui prévienne le joueur.
    expect(routeDuDon({ ownerId: 'user-veya' }, MJ)).toEqual({
      voie: 'transfert', destinataire: 'user-veya',
    });
  });

  it('écrit directement une fiche sans propriétaire', () => {
    // Un transfert s'adresse à un compte : sans propriétaire, il n'irait
    // nulle part.
    for (const sans of [undefined, null, '', '   ']) {
      expect(routeDuDon({ ownerId: sans }, MJ), String(sans)).toEqual({
        voie: 'directe', pourquoi: 'sans-proprietaire',
      });
    }
  });

  it('écrit directement la fiche du MJ lui-même', () => {
    // Sinon le MJ s'enverrait l'objet à lui-même, et il n'arriverait jamais
    // dans le sac visé.
    expect(routeDuDon({ ownerId: MJ }, MJ)).toEqual({
      voie: 'directe', pourquoi: 'fiche-du-mj',
    });
  });

  it('dit au MJ pourquoi personne ne sera prévenu', () => {
    for (const pourquoi of ['sans-proprietaire', 'fiche-du-mj'] as const) {
      expect(RAISON_ECRITURE_DIRECTE[pourquoi], pourquoi).toBeTruthy();
    }
  });
});
