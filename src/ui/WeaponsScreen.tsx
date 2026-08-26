import { useState } from 'react';
import { armesAAjouter, attaquesDuPersonnage, attaquesParAction } from '../model/weapons';
import { isProficientWithWeapon } from '../domain/weapon-proficiency';
import type { CharacterSheet } from '../model/character';
import type { DerivedCharacter } from '../model/derive';

/**
 * Les armes en main : ce que le personnage attaque avec, parmi ce qu'il
 * possède réellement — reconnu dans son sac, équipement de départ ou
 * trouvaille en jeu. Jamais le catalogue entier : on ne combat pas avec une
 * arme qu'on n'a jamais eue.
 *
 * Avant cet écran, l'application ne savait montrer QUE des sorts en combat —
 * un guerrier, un rôdeur n'avaient jamais de bonus au toucher ni de dégâts
 * affichés, seulement le texte de leurs éventuels sorts.
 */

const sign = (value: number): string => (value >= 0 ? `+${value}` : `${value}`);

export function WeaponsScreen({ sheet, derived, onAjouter, onRetirer }: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  onAjouter: (weaponId: string) => void;
  onRetirer: (weaponId: string) => void;
}) {
  const [choix, setChoix] = useState('');
  const attaques = attaquesDuPersonnage(sheet, derived);
  const parAction = attaquesParAction(sheet);
  const classIds = sheet.classLevels.map((entry) => entry.classId);
  const disponibles = armesAAjouter(sheet);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div className="lbl" style={{ flexGrow: 1 }}>Armes en main</div>
        {parAction > 1 && <div className="lbl" style={{ color: 'var(--accent)' }}>{parAction} attaques par Action</div>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {attaques.map((attaque) => (
          <div key={attaque.id} className="card" style={{
            padding: '10px 12px', borderRadius: 'var(--radius)',
            border: '1px solid var(--line)', background: 'var(--surface)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{attaque.name}</div>
                <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>
                  {attaque.melee ? 'corps à corps' : 'à distance'} · touche {sign(attaque.toHit)} · {attaque.damage}
                  {!attaque.proficient && ' · non maîtrisée'}
                </div>
              </div>
              {attaque.id !== 'mains-nues' && (
                <button
                  onClick={() => onRetirer(attaque.id.replace(/^arme-/, ''))}
                  className="lbl"
                  style={{ minHeight: 'var(--tap)', padding: '0 10px', borderRadius: 10, border: '1px solid var(--line)' }}
                >
                  Retirer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {disponibles.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <select
            value={choix}
            onChange={(e) => setChoix(e.target.value)}
            style={{
              flexGrow: 1, minHeight: 'var(--tap)', padding: '0 10px', borderRadius: 10,
              border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 14,
            }}
          >
            <option value="">Ajouter une arme…</option>
            {disponibles.map((weapon) => (
              <option key={weapon.id} value={weapon.id}>
                {weapon.name}{!isProficientWithWeapon(classIds, weapon) ? ' (non maîtrisée)' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={() => { if (choix) { onAjouter(choix); setChoix(''); } }}
            disabled={!choix}
            className="lbl"
            style={{
              flexShrink: 0, minHeight: 'var(--tap)', padding: '0 14px', borderRadius: 10,
              border: '1px solid var(--accent)', color: choix ? 'var(--accent)' : 'var(--muted)',
              opacity: choix ? 1 : 0.5,
            }}
          >
            Ajouter
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 0' }}>
          Aucune arme reconnue dans ton sac pour l’instant — ajoute-la au Sac (équipement de départ ou trouvaille en jeu) pour pouvoir la mettre en main ici.
        </p>
      )}
    </>
  );
}
