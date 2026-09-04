import { useState } from 'react';
import { CombatScreen } from './CombatScreen';
import { demoCards, demoEncounter, demoSheet } from './demo-data';
import { GmCombatScreen } from './GmCombatScreen';

/**
 * Les écrans sur des données inventées.
 *
 * Sert quand aucune configuration Supabase n'est présente : on peut regarder
 * et manipuler les écrans sans base, sans compte et sans réseau. Aucune
 * donnée de la campagne réelle n'y figure.
 */
const switcher: React.CSSProperties = {
  position: 'fixed', right: 10, bottom: 'calc(70px + env(safe-area-inset-bottom))',
  padding: '7px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700,
  background: 'var(--surface-raised)', border: '1px solid var(--line)', color: 'var(--muted)',
};

export function DemoScreens() {
  const [sheet, setSheet] = useState(demoSheet);
  const [turnLabel, setTurnLabel] = useState<'libre' | 'mon-tour' | 'autre-tour'>('libre');
  const [view, setView] = useState<'joueur' | 'mj'>('joueur');
  // La démo n'a pas de base derrière elle : c'est elle qui détient la rencontre.
  const [rencontre, setRencontre] = useState(demoEncounter);

  const changeHp = (delta: number) => setSheet((current: typeof demoSheet) => ({
    ...current,
    live: { ...current.live, damageTaken: Math.max(0, current.live.damageTaken - delta) },
  }));

  if (view === 'mj') {
    return (
      <>
        <GmCombatScreen
          campaignId="demo"
          groupe={{
            niveau: 3,
            taille: 4,
            personnages: [
              { id: 'demo-1', nom: 'Alderic', cha: 15, con: 2 },
              { id: 'demo-2', nom: 'Brise', cha: 12, con: 1 },
              { id: 'demo-3', nom: 'Corvin', cha: 10, con: 0 },
              { id: 'demo-4', nom: 'Dun', cha: 8, con: -1 },
            ],
          }}
          state={rencontre}
          onChange={setRencontre}
        />
        <button onClick={() => setView('joueur')} style={switcher}>vue joueur</button>
      </>
    );
  }

  return (
    <>
      <CombatScreen
        sheet={sheet}
        cards={demoCards}
        turn={
          turnLabel === 'libre'
            ? { mode: 'libre' }
            : { mode: 'combat', isYourTurn: turnLabel === 'mon-tour', holder: 'Brannoc' }
        }
        onSpendHp={changeHp}
      />
      {/* Bascules de mise au point, le temps qu'il n'y ait pas de navigation. */}
      <button
        onClick={() => setTurnLabel((value) =>
          value === 'libre' ? 'mon-tour' : value === 'mon-tour' ? 'autre-tour' : 'libre')}
        style={{ ...switcher, right: 100 }}
      >
        {turnLabel === 'libre' ? 'hors combat' : turnLabel === 'mon-tour' ? 'à moi' : 'pas mon tour'}
      </button>
      <button onClick={() => setView('mj')} style={switcher}>vue MJ</button>
    </>
  );
}

