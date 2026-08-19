import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import { CombatScreen } from './CombatScreen';
import { demoCards, demoEncounter, demoSheet } from './demo-data';
import { GmCombatScreen } from './GmCombatScreen';

/**
 * Point d'entrée provisoire : il monte l'écran de combat sur une fiche
 * d'exemple pour pouvoir le regarder et le manipuler. Il sera remplacé par la
 * vraie navigation et le branchement Supabase quand la couche de données
 * arrivera — la synchronisation est déjà écrite et testée dans `src/sync`.
 */
const switcher: React.CSSProperties = {
  position: 'fixed', right: 10, bottom: 'calc(70px + env(safe-area-inset-bottom))',
  padding: '7px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700,
  background: 'var(--surface-raised)', border: '1px solid var(--line)', color: 'var(--muted)',
};

function App() {
  const [sheet, setSheet] = useState(demoSheet);
  const [isYourTurn, setYourTurn] = useState(true);
  const [view, setView] = useState<'joueur' | 'mj'>('joueur');

  const changeHp = (delta: number) => setSheet((current: typeof demoSheet) => ({
    ...current,
    live: { ...current.live, damageTaken: Math.max(0, current.live.damageTaken - delta) },
  }));

  if (view === 'mj') {
    return (
      <>
        <GmCombatScreen initial={demoEncounter} />
        <button onClick={() => setView('joueur')} style={switcher}>vue joueur</button>
      </>
    );
  }

  return (
    <>
      <CombatScreen
        sheet={sheet}
        cards={demoCards}
        isYourTurn={isYourTurn}
        turnHolder="Brannoc"
        onSpendHp={changeHp}
      />
      {/* Bascules de mise au point, le temps qu'il n'y ait pas de navigation. */}
      <button onClick={() => setYourTurn((value) => !value)} style={{ ...switcher, right: 100 }}>
        {isYourTurn ? 'pas mon tour' : 'à moi'}
      </button>
      <button onClick={() => setView('mj')} style={switcher}>vue MJ</button>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
