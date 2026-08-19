import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CampaignSync, type CampaignSnapshot } from '../sync/campaign-sync';
import { createBrowserEnvironment } from '../sync/browser-environment';

/**
 * Branche un écran sur la campagne.
 *
 * `useSyncExternalStore` plutôt qu'un `useState` alimenté par un abonnement :
 * React sait alors qu'il lit une source extérieure, et ne peut pas afficher un
 * instantané périmé pendant un rendu concurrent. L'instantané garde son
 * identité tant que rien ne change (voir `CampaignSync.publish`), sans quoi ce
 * crochet redessinerait tout à chaque battement de canal.
 */
export function useCampaign(client: SupabaseClient, campaignId: string): {
  snapshot: CampaignSnapshot;
  sync: CampaignSync;
} {
  const sync = useMemo(
    () => new CampaignSync({ client, campaignId, environment: createBrowserEnvironment() }),
    [client, campaignId],
  );

  useEffect(() => {
    sync.start();
    return () => sync.stop();
  }, [sync]);

  const snapshot = useSyncExternalStore(
    (listener) => sync.subscribe(listener),
    () => sync.getSnapshot(),
    () => sync.getSnapshot(),
  );

  return { snapshot, sync };
}
