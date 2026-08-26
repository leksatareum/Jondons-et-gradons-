import { describe, expect, it } from 'vitest';
import { PortraitError, uploadPortrait, validerPortrait } from './portraits';

const fichier = (type: string, taille: number, nom = 'portrait.png') => {
  const file = new File([new Uint8Array(taille)], nom, { type });
  return file;
};

describe('validation avant envoi', () => {
  it('refuse un format qui n’est ni PNG, ni JPEG, ni WebP', () => {
    expect(() => validerPortrait(fichier('image/gif', 100))).toThrow(PortraitError);
    expect(() => validerPortrait(fichier('application/pdf', 100))).toThrow(/Formats acceptés/);
  });

  it('refuse une image de plus de 5 Mo', () => {
    expect(() => validerPortrait(fichier('image/png', 5 * 1024 * 1024 + 1))).toThrow(/trop lourde/);
  });

  it('accepte PNG, JPEG et WebP sous la limite', () => {
    expect(() => validerPortrait(fichier('image/png', 1000))).not.toThrow();
    expect(() => validerPortrait(fichier('image/jpeg', 1000))).not.toThrow();
    expect(() => validerPortrait(fichier('image/webp', 1000))).not.toThrow();
  });
});

/** Doublure du client de stockage — même esprit que celle de `mutations.test.ts` : ce qui compte, c'est ce qui part sur le réseau. */
function fakeStorageClient(uploadResult: { error: { message: string } | null }, publicUrl: string) {
  const appels: { chemin: string; options: unknown }[] = [];
  const client: any = {
    storage: {
      from: (bucket: string) => ({
        upload: async (chemin: string, _file: unknown, options: unknown) => {
          appels.push({ chemin, options });
          return uploadResult;
        },
        getPublicUrl: (chemin: string) => ({ data: { publicUrl: `${publicUrl}/${bucket}/${chemin}` } }),
      }),
    },
  };
  return { client, appels };
}

describe('envoi du portrait', () => {
  it('range le fichier sous <sheetId>/<horodatage>.<extension> et rend l’URL publique', async () => {
    const { client, appels } = fakeStorageClient({ error: null }, 'https://cdn.exemple');
    const url = await uploadPortrait(client, 'fiche-1', fichier('image/png', 1000));
    expect(appels[0]?.chemin).toMatch(/^fiche-1\/\d+\.png$/);
    expect(url).toBe(`https://cdn.exemple/portraits/${appels[0]?.chemin}`);
  });

  it('choisit l’extension du type MIME réel, pas du nom de fichier', async () => {
    const { client, appels } = fakeStorageClient({ error: null }, 'https://cdn.exemple');
    await uploadPortrait(client, 'fiche-1', fichier('image/jpeg', 1000, 'photo.png'));
    expect(appels[0]?.chemin).toMatch(/\.jpg$/);
  });

  it('n’écrase jamais un fichier existant — chaque envoi a son propre nom', async () => {
    const { client, appels } = fakeStorageClient({ error: null }, 'https://cdn.exemple');
    await uploadPortrait(client, 'fiche-1', fichier('image/png', 1000));
    expect((appels[0]?.options as { upsert: boolean }).upsert).toBe(false);
  });

  it('remonte l’erreur du stockage plutôt que de la ravaler', async () => {
    const { client } = fakeStorageClient({ error: { message: 'quota dépassé' } }, 'https://cdn.exemple');
    await expect(uploadPortrait(client, 'fiche-1', fichier('image/png', 1000)))
      .rejects.toThrow(/quota dépassé/);
  });

  it('valide avant d’envoyer : un mauvais format n’ouvre aucune connexion', async () => {
    const { client, appels } = fakeStorageClient({ error: null }, 'https://cdn.exemple');
    await expect(uploadPortrait(client, 'fiche-1', fichier('image/gif', 1000))).rejects.toThrow(PortraitError);
    expect(appels).toHaveLength(0);
  });
});
