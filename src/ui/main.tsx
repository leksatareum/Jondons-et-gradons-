import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import { App } from './App';
import { DemoScreens } from './DemoScreens';
import { createJgClient, readConfig } from '../sync/supabase-client';
import { installerServiceWorker } from '../sync/service-worker';

/**
 * Point de montage.
 *
 * Sans configuration Supabase, on ne plante pas : on montre les écrans sur des
 * données inventées, avec un bandeau qui dit pourquoi. Regarder une maquette
 * ne doit pas exiger une base de données, et une erreur muette au démarrage
 * est le pire accueil possible.
 */
function racine() {
  try {
    const client = createJgClient(readConfig(import.meta.env as unknown as Record<string, unknown>));
    return <App client={client} />;
  } catch (cause) {
    console.warn(cause);
    return (
      <>
        {/* Une ligne, pas cinq : ce bandeau vole de la hauteur à l'écran
            qu'il sert justement à montrer. Le détail va dans la console. */}
        <div style={bandeau}>Mode démonstration — aucune configuration Supabase</div>
        <DemoScreens />
      </>
    );
  }
}

const bandeau: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 30,
  padding: '6px 12px', paddingTop: 'calc(6px + env(safe-area-inset-top))',
  background: 'var(--accent-wash)', color: 'var(--accent)',
  fontSize: 11, lineHeight: 1.4, textAlign: 'center',
  borderBottom: '1px solid var(--line)',
};

createRoot(document.getElementById('root')!).render(<StrictMode>{racine()}</StrictMode>);

// Après le rendu, jamais avant : ce qu'il installe sert à la PROCHAINE
// ouverture, pas à celle-ci, et rien ici ne doit retarder le premier écran.
installerServiceWorker();
