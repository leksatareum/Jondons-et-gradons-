import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Fabrique du client Supabase.
 *
 * La configuration est lue une fois, au démarrage, et son absence est une
 * erreur bruyante. Une clé manquante qui laisse passer produit une app qui
 * s'ouvre normalement et échoue à la première lecture, en pleine partie — le
 * pire moment pour découvrir un fichier `.env` oublié.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export class ConfigurationManquante extends Error {
  constructor(clefs: string[]) {
    super(
      `Configuration Supabase incomplète : ${clefs.join(', ')}. `
      + 'Renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans un fichier .env.local.',
    );
    this.name = 'ConfigurationManquante';
  }
}

export function readConfig(source: Record<string, unknown>): SupabaseConfig {
  const url = String(source.VITE_SUPABASE_URL ?? '').trim();
  const anonKey = String(source.VITE_SUPABASE_ANON_KEY ?? '').trim();
  const manquantes = [
    ...(url ? [] : ['VITE_SUPABASE_URL']),
    ...(anonKey ? [] : ['VITE_SUPABASE_ANON_KEY']),
  ];
  if (manquantes.length > 0) throw new ConfigurationManquante(manquantes);
  return { url, anonKey };
}

export function createJgClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      // La partie dure quatre heures : personne ne doit se reconnecter au
      // milieu parce qu'un jeton a expiré.
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      // Le tour par tour se joue à quelques messages par seconde au pire ;
      // le défaut de 10/s est calibré pour bien plus bavard que nous.
      params: { eventsPerSecond: 5 },
    },
  });
}
