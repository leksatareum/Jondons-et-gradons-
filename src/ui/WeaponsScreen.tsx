import { useState } from 'react';
import { armesEquipables, attaquesDuPersonnage, attaquesParAction, boucleirEquipe } from '../model/weapons';
import { isProficientWithWeapon } from '../domain/weapon-proficiency';
import { meilleurBouclier } from '../domain/armor-ownership';
import type { CharacterSheet } from '../model/character';
import type { DerivedCharacter } from '../model/derive';

/**
 * L'arme en main : ce que le personnage attaque avec, une seule à la fois,
 * parmi ce qu'il possède réellement — reconnu dans son sac, équipement de
 * départ ou trouvaille en jeu. Jamais le catalogue entier, jamais deux armes
 * ensemble : on ne combat pas avec une arme qu'on n'a jamais eue, ni avec
 * une épée longue ET un arc en même temps.
 *
 * Ici, changer d'arme est libre — on ajuste son équipement entre deux
 * scènes. EN combat, le même choix passe par une carte « Équiper » dans
 * l'écran de combat, qui coûte l'Action du tour.
 *
 * Avant cet écran, l'application ne savait montrer QUE des sorts en combat —
 * un guerrier, un rôdeur n'avaient jamais de bonus au toucher ni de dégâts
 * affichés, seulement le texte de leurs éventuels sorts.
 */

const sign = (value: number): string => (value >= 0 ? `+${value}` : `${value}`);

export function WeaponsScreen({ sheet, derived, onEquiper, onDegainer, onEquiperBouclier, onRetirerBouclier }: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  onEquiper: (weaponId: string) => void;
  onDegainer: () => void;
  onEquiperBouclier: () => void;
  onRetirerBouclier: () => void;
}) {
  const [choix, setChoix] = useState('');
  const attaques = attaquesDuPersonnage(sheet, derived);
  const parAction = attaquesParAction(sheet);
  const classIds = sheet.classLevels.map((entry) => entry.classId);
  const equipable = armesEquipables(sheet);
  const arme = attaques.find((attaque) => attaque.id !== 'mains-nues');
  const bouclier = meilleurBouclier(sheet.inventory);
  const boucleirActif = boucleirEquipe(sheet);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div className="lbl" style={{ flexGrow: 1 }}>Arme en main</div>
        {parAction > 1 && <div className="lbl" style={{ color: 'var(--accent)' }}>{parAction} attaques par Action</div>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {attaques.map((attaque) => (
          <div key={attaque.id} className="card" style={{
            padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{attaque.name}</div>
                <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>
                  {attaque.melee ? 'corps à corps' : 'à distance'} · touche {sign(attaque.toHit)} · {attaque.damage}
                  {!attaque.proficient && ' · non maîtrisée'}
                </div>
              </div>
              {attaque.id === arme?.id && (
                <button
                  onClick={onDegainer}
                  className="lbl"
                  style={{ minHeight: 'var(--tap)', padding: '0 10px', borderRadius: 10, border: '1px solid var(--gold-dim)' }}
                >
                  Dégainer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {equipable.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <select
            value={choix}
            onChange={(e) => setChoix(e.target.value)}
            style={{
              flexGrow: 1, minHeight: 'var(--tap)', padding: '0 10px', borderRadius: 10,
              border: '1px solid var(--gold-dim)', background: 'var(--surface)', fontSize: 14,
            }}
          >
            <option value="">{arme ? 'Changer d’arme…' : 'Équiper une arme…'}</option>
            {equipable.map((weapon) => (
              <option key={weapon.id} value={weapon.id}>
                {weapon.name}{!isProficientWithWeapon(classIds, weapon) ? ' (non maîtrisée)' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={() => { if (choix) { onEquiper(choix); setChoix(''); } }}
            disabled={!choix}
            className="lbl"
            style={{
              flexShrink: 0, minHeight: 'var(--tap)', padding: '0 14px', borderRadius: 10,
              border: '1px solid var(--accent)', color: choix ? 'var(--accent)' : 'var(--muted)',
              opacity: choix ? 1 : 0.5,
            }}
          >
            {arme ? 'Changer' : 'Équiper'}
          </button>
        </div>
      ) : !arme && (
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 0' }}>
          Aucune arme reconnue dans ton sac pour l’instant — ajoute-la au Sac (équipement de départ ou trouvaille en jeu) pour pouvoir l’équiper ici.
        </p>
      )}

      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.4 }}>
        Changer d’arme ici est libre. En combat, ça passe par une carte « Équiper » qui coûte l’Action du tour.
      </p>

      {/* Le bouclier n'est proposé que s'il y en a un dans le sac — sinon
          rien à équiper. Rester dans le sac, à sa place, sans compter dans la
          CA : c'est exactement l'inverse de ce qui se passait avant, où le
          bonus tenait tout seul, qu'il soit au bras ou juste rangé.

          Le nom et le bonus affichés sont ceux du bouclier vraiment reconnu
          — « Bouclier +1 » plutôt qu'un « Bouclier » et un « +2 » figés qui
          mentiraient dès que le sac en contient un autre. */}
      {bouclier && (
        <div className="card" style={{
          marginTop: 12, padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{bouclier.name}</div>
              <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>
                {boucleirActif ? `+${bouclier.bonus} à la CA, au bras` : 'Dans le sac, pas au bras'}
              </div>
            </div>
            <button
              onClick={boucleirActif ? onRetirerBouclier : onEquiperBouclier}
              className="lbl"
              style={{
                minHeight: 'var(--tap)', padding: '0 12px', borderRadius: 10,
                border: `1px solid ${boucleirActif ? 'var(--gold-dim)' : 'var(--accent)'}`,
                color: boucleirActif ? 'var(--ink)' : 'var(--accent)',
              }}
            >
              {boucleirActif ? 'Reposer' : 'Équiper'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
