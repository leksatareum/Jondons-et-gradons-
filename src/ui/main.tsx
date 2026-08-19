import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';
import { CombatScreen } from './CombatScreen';
import { demoCards, demoSheet } from './demo-data';

/**
 * Point d'entrée provisoire : il monte l'écran de combat sur une fiche
 * d'exemple pour pouvoir le regarder et le manipuler. Il sera remplacé par la
 * vraie navigation et le branchement Supabase quand la couche de données
 * arrivera — la synchronisation est déjà écrite et testée dans `src/sync`.
 */
function App() {
  const [sheet, setSheet] = useState(demoSheet);
  const [isYourTurn, setYourTurn] = useState(true);

  const changeHp = (delta: number) => setSheet((current: typeof demoSheet) => ({
    ...current,
    live: { ...current.live, damageTaken: Math.max(0, current.live.damageTaken - delta) },
  }));

  return (
    <>
      <CombatScreen
        sheet={sheet}
        cards={demoCards}
        isYourTurn={isYourTurn}
        turnHolder="Brannoc"
        onSpendHp={changeHp}
      />
      {/* Bascule de mise au point, pour voir le réordonnancement des deux côtés. */}
      <button
        onClick={() => setYourTurn((value) => !value)}
        style={{
          position: 'fixed', right: 10, bottom: 'calc(70px + env(safe-area-inset-bottom))',
          padding: '7px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: 'var(--surface-raised)', border: '1px solid var(--line)', color: 'var(--muted)',
        }}
      >
        {isYourTurn ? 'voir : pas mon tour' : 'voir : à moi'}
      </button>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
