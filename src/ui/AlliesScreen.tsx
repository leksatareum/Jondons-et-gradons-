import { useState } from 'react';
import {
  activeWildShapeStatBlock, eligibleForms, hasRoomToLearn, knownForms, wildShapeAccess,
} from '../model/wild-shape';
import { availableCompanions } from '../model/companions';
import type { LinkedCreature, CharacterSheet } from '../model/character';
import type { DerivedCharacter } from '../model/derive';
import type { WildShapeProfile } from '../domain/wild-shape';
import type { LinkedCreatureOption } from '../domain/linked-creatures';

/**
 * Formes et créatures liées.
 *
 * Deux mécaniques qui n'ont en commun que d'être « autre chose à jouer que sa
 * propre fiche » — une transformation du personnage pour l'une, une créature
 * séparée pour l'autre — réunies dans un même écran plutôt que dispersées,
 * pour la même raison que le grimoire regroupe sorts et sorts mineurs : elles
 * ne concernent souvent qu'une poignée de personnages, et leur donner chacune
 * son onglet aurait vidé la barre pour la plupart des joueurs.
 *
 * L'onglet lui-même n'apparaît que si l'une des deux sections a quelque chose
 * à montrer — voir `hasAllies` dans `SheetView`.
 */

const CR_LABEL: Record<string, string> = { '0': '0' };
const crLabel = (cr: string): string => CR_LABEL[cr] ?? cr;

function ProfilCard({ profile, action }: { profile: WildShapeProfile; action: React.ReactNode }) {
  return (
    <div className="card" style={{
      padding: '10px 12px', borderRadius: 'var(--radius)',
      border: '1px solid var(--line)', background: 'var(--surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{profile.name}</div>
          <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>
            FP {crLabel(profile.cr)} · CA {profile.ac} · {profile.hp} PV · {profile.speed}
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}

function BoutonAction({ label, onClick, accent, disabled }: {
  label: string; onClick: () => void; accent?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="lbl"
      style={{
        flexShrink: 0, minHeight: 'var(--tap)', padding: '0 12px', borderRadius: 10,
        border: `1px solid ${accent ? 'var(--accent)' : 'var(--line)'}`,
        color: disabled ? 'var(--muted)' : accent ? 'var(--accent)' : 'var(--ink)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

function SectionFormeSauvage({ sheet, derived, onTransformer, onRevenir, onApprendre, onEchanger }: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  onTransformer: (formId: string) => void;
  onRevenir: () => void;
  onApprendre: (formId: string) => void;
  onEchanger: (fromId: string, toId: string) => void;
}) {
  const [echangeDe, setEchangeDe] = useState<string | null>(null);
  const acces = wildShapeAccess(sheet, derived);
  if (acces.knownLimit === 0) return null;

  const actif = activeWildShapeStatBlock(sheet, derived);
  const charge = derived.resources.find((entry) => entry.key === 'druide:forme-sauvage');
  const connues = knownForms(sheet, derived);
  const eligibles = eligibleForms(sheet, derived);
  const apprenables = eligibles.filter((profile) => !connues.includes(profile.id));
  const fenetreOuverte = Boolean(sheet.live.wildShapeSwapOpen);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div className="lbl" style={{ flexGrow: 1 }}>
          Forme sauvage {acces.moon ? '· Cercle de la Lune' : ''}
        </div>
        {charge && (
          <div className="num lbl" style={{ color: charge.remaining > 0 ? 'var(--ink)' : 'var(--accent)' }}>
            {charge.remaining}/{charge.max}
          </div>
        )}
      </div>

      {actif ? (
        <div className="card" style={{
          padding: '12px 14px', borderRadius: 'var(--radius)',
          border: '1px solid var(--accent)', background: 'var(--accent-wash)',
        }}>
          <div className="ttl" style={{ fontSize: 17 }}>{actif.profile.name}</div>
          <div className="lbl" style={{ textTransform: 'none', marginTop: 3 }}>
            CA {actif.armorClass} · {actif.profile.hp} PV · {actif.temporaryHp} temporaires · {actif.profile.speed}
          </div>
          {actif.profile.senses && (
            <div className="lbl" style={{ textTransform: 'none', marginTop: 4 }}>{actif.profile.senses}</div>
          )}
          {actif.profile.attacks.map((attack) => (
            <div key={attack.id} style={{ fontSize: 13, marginTop: 6 }}>
              <strong>{attack.name}</strong>
              {attack.toHit !== undefined && ` · +${attack.toHit} au toucher`}
              {attack.dice && ` · ${attack.dice} ${attack.type ?? ''}`}
              {attack.props && <span style={{ color: 'var(--muted)' }}> — {attack.props}</span>}
            </div>
          ))}
          {actif.profile.traits?.map((trait) => (
            <div key={trait} style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>{trait}</div>
          ))}
          <button
            onClick={onRevenir}
            style={{
              width: '100%', minHeight: 44, marginTop: 12, borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 14, fontWeight: 700,
            }}
          >
            Reprendre forme humanoïde
          </button>
        </div>
      ) : (
        <>
          {connues.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0' }}>
              Aucune forme apprise pour l’instant.
            </p>
          )}
          {connues.map((id) => {
            const profile = eligibles.find((entry) => entry.id === id);
            if (!profile) return null;
            if (echangeDe === id) {
              return (
                <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="lbl" style={{ color: 'var(--accent)' }}>Échanger {profile.name} contre —</div>
                  {apprenables.map((remplacement) => (
                    <ProfilCard
                      key={remplacement.id}
                      profile={remplacement}
                      action={<BoutonAction label="Choisir" accent onClick={() => { onEchanger(id, remplacement.id); setEchangeDe(null); }} />}
                    />
                  ))}
                  <BoutonAction label="Annuler l’échange" onClick={() => setEchangeDe(null)} />
                </div>
              );
            }
            return (
              <ProfilCard
                key={id}
                profile={profile}
                action={(
                  <div style={{ display: 'flex', gap: 6 }}>
                    {fenetreOuverte && <BoutonAction label="Échanger" onClick={() => setEchangeDe(id)} />}
                    <BoutonAction
                      label="Se transformer" accent
                      disabled={!charge || charge.remaining <= 0}
                      onClick={() => onTransformer(id)}
                    />
                  </div>
                )}
              />
            );
          })}
        </>
      )}

      {apprenables.length > 0 && (
        <details>
          <summary className="lbl" style={{ cursor: 'pointer', minHeight: 34, display: 'flex', alignItems: 'center' }}>
            {hasRoomToLearn(sheet, derived)
              ? `Apprendre une forme — ${apprenables.length} au choix`
              : `Plafond atteint — voir les ${apprenables.length} autres formes`}
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {apprenables.map((profile) => (
              <ProfilCard
                key={profile.id}
                profile={profile}
                action={hasRoomToLearn(sheet, derived)
                  ? <BoutonAction label="Apprendre" accent onClick={() => onApprendre(profile.id)} />
                  : <span className="lbl" style={{ color: 'var(--muted)' }}>plafond</span>}
              />
            ))}
          </div>
        </details>
      )}
    </>
  );
}

function CarteCompagnon({ companion, onDegats, onDetacher }: {
  companion: LinkedCreature;
  onDegats: (delta: number) => void;
  onDetacher: () => void;
}) {
  return (
    <div className="card" style={{
      padding: '12px 14px', borderRadius: 'var(--radius)',
      border: '1px solid var(--ok)', background: 'var(--surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div className="ttl" style={{ fontSize: 17, flexGrow: 1 }}>{companion.name}</div>
        <div className="lbl" style={{ color: 'var(--ok)' }}>{companion.sourceLabel}</div>
      </div>
      <div className="lbl" style={{ textTransform: 'none', marginTop: 4 }}>
        CA {companion.ac} · {companion.speed}
        {companion.attackBonus !== undefined && ` · attaque +${companion.attackBonus}`}
        {companion.damageFormula && ` · ${companion.damageFormula}`}
        {companion.saveDc !== undefined && ` · DD ${companion.saveDc}`}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <button onClick={() => onDegats(1)} aria-label={`Retirer un point de vie à ${companion.name}`}
          style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--line)' }}>−</button>
        <div className="num" style={{ fontSize: 16, fontWeight: 700, minWidth: 56, textAlign: 'center' }}>
          {companion.hp}<span style={{ fontSize: 12, color: 'var(--muted)' }}>/{companion.hpMax}</span>
        </div>
        <button onClick={() => onDegats(-1)} aria-label={`Rendre un point de vie à ${companion.name}`}
          style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--line)' }}>+</button>
        <div style={{ flexGrow: 1 }} />
        <BoutonAction label="Détacher" onClick={onDetacher} />
      </div>

      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {companion.rules.map((regle) => (
          <div key={regle} style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{regle}</div>
        ))}
      </div>
    </div>
  );
}

function SectionCompagnon({ sheet, onLier, onDegats, onDetacher }: {
  sheet: CharacterSheet;
  onLier: (optionId: string) => void;
  onDegats: (companionId: string, delta: number) => void;
  onDetacher: (companionId: string) => void;
}) {
  const options = availableCompanions(sheet);
  const lies = sheet.companions ?? [];
  if (options.length === 0 && lies.length === 0) return null;

  return (
    <>
      <div className="lbl" style={{ marginTop: 4 }}>Créature liée</div>
      {lies.map((companion) => (
        <CarteCompagnon
          key={companion.id}
          companion={companion}
          onDegats={(delta) => onDegats(companion.id, delta)}
          onDetacher={() => onDetacher(companion.id)}
        />
      ))}
      {lies.length === 0 && options.length > 0 && (
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0' }}>
          Aucune créature liée pour l’instant.
        </p>
      )}
      {options.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((option: LinkedCreatureOption) => (
            <div key={option.id} className="card" style={{
              padding: '10px 12px', borderRadius: 'var(--radius)',
              border: '1px solid var(--line)', background: 'var(--surface)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{option.name}</div>
                <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>
                  {option.sourceLabel} · CA {option.ac} · {option.hp} PV
                </div>
              </div>
              <BoutonAction label="Lier" accent onClick={() => onLier(option.id)} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function AlliesScreen({ sheet, derived, onTransformer, onRevenir, onApprendre, onEchanger, onLier, onDegatsCompagnon, onDetacherCompagnon }: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  onTransformer: (formId: string) => void;
  onRevenir: () => void;
  onApprendre: (formId: string) => void;
  onEchanger: (fromId: string, toId: string) => void;
  onLier: (optionId: string) => void;
  onDegatsCompagnon: (companionId: string, delta: number) => void;
  onDetacherCompagnon: (companionId: string) => void;
}) {
  return (
    <main style={{
      flexGrow: 1, padding: '12px 14px calc(76px + env(safe-area-inset-bottom))',
      display: 'flex', flexDirection: 'column', gap: 8,
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      <SectionFormeSauvage
        sheet={sheet} derived={derived}
        onTransformer={onTransformer} onRevenir={onRevenir}
        onApprendre={onApprendre} onEchanger={onEchanger}
      />
      <SectionCompagnon
        sheet={sheet}
        onLier={onLier}
        onDegats={onDegatsCompagnon}
        onDetacher={onDetacherCompagnon}
      />
    </main>
  );
}
