import { describe, expect, it } from 'vitest';
import { ConfigurationManquante, readConfig } from './supabase-client';

describe('lecture de la configuration', () => {
  it('accepte une configuration complète', () => {
    expect(readConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: 'clef' }))
      .toEqual({ url: 'https://x.supabase.co', anonKey: 'clef' });
  });

  it('nomme précisément ce qui manque — chercher à l’aveugle en pleine partie n’est pas une option', () => {
    expect(() => readConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co' }))
      .toThrow(/VITE_SUPABASE_ANON_KEY/);
    expect(() => readConfig({})).toThrow(ConfigurationManquante);
  });

  it('une valeur vide ou blanche vaut absente', () => {
    expect(() => readConfig({ VITE_SUPABASE_URL: '  ', VITE_SUPABASE_ANON_KEY: 'clef' }))
      .toThrow(/VITE_SUPABASE_URL/);
  });
});
