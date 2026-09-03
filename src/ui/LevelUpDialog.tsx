import { useMemo, useState } from 'react';
import { applyLevelUp, levelUpBlockers, levelUpPlan, type LevelUpChoice } from '../model/level-up';
import { eligibleFeats } from '../content/feats';
import { ABILITY_IDS, type AbilityId } from '../content/feats';
import { deriveCharacter } from '../model/derive';
import type { CharacterSheet } from '../model/character';
import {
  arcanumChoisis, invocationsChoisies, peutRetirerInvocation, sortsArcanumPossibles,
} from '../model/invocations';
import { invocationByOptionId } from '../content/eldritch-invocations';
import { spellById } from '../content/spell-catalogue';

/**
 * Monter d'un niveau.
 *
 * L'écran ne demande que ce que le niveau ne dit pas — le jet, la sous-classe,
 * l'augmentation. Tout le reste est montré, pas demandé : emplacements, sorts
 * préparables et capacités se dérivent du niveau, et les afficher avant/après
 * évite d'avoir à croire sur parole que la montée a fait quelque chose.
 */

/** Le nom lisible d'une invocation, y compris quand elle vise un sort mineur. */
const nomInvocation = (optionId: string): string => {
  const base = invocationByOptionId(optionId);
  const [, cible] = optionId.split('@');
  const sort = cible ? spellById(cible)?.name : null;
  return [base?.name ?? optionId, sort].filter(Boolean).join(' · ');
};

const NOM_CARAC: Record<AbilityId, string> = {
  str: 'Force', dex: 'Dextérité', con: 'Constitution',
  int: 'Intelligence', wis: 'Sagesse', cha: 'Charisme',
};

export function LevelUpDialog({ sheet, onMonter, onFermer }: {
  sheet: CharacterSheet;
  onMonter: (suivante: CharacterSheet) => void;
  onFermer: () => void;
}) {
  const [classId, setClassId] = useState(sheet.classLevels[0]?.classId ?? '');
  const [jet, setJet] = useState<number | null>(null);
  const [sousClasse, setSousClasse] = useState<string | null>(null);
  const [amelioration, setAmelioration] = useState<Partial<Record<AbilityId, number>>>({});
  const [don, setDon] = useState<string | null>(null);
  // Occultiste : les invocations prises à ce niveau, l'échange éventuel, et
  // les Arcanum. Rien de tout cela ne se dérive — ce sont des décisions.
  const [invocations, setInvocations] = useState<string[]>([]);
  const [echange, setEchange] = useState<{ out: string; in: string } | null>(null);
  const [arcanum, setArcanum] = useState<{ rank: number; spellId: string }[]>([]);
  const [echangeArcanum, setEchangeArcanum] = useState<{ out: string; in: string } | null>(null);

  const plan = useMemo(() => levelUpPlan(sheet, classId), [sheet, classId]);
  const derivee = useMemo(() => deriveCharacter(sheet), [sheet]);

  const choix: LevelUpChoice = {
    classId,
    hitPointRoll: jet ?? 0,
    ...(sousClasse ? { subclass: sousClasse } : {}),
    ...(don ? { featId: don } : Object.keys(amelioration).length ? { improvement: amelioration } : {}),
    ...(invocations.length ? { invocations } : {}),
    ...(echange ? { invocationSwap: echange } : {}),
    ...(arcanum.length ? { arcanum } : {}),
    ...(echangeArcanum?.in ? { arcanumSwap: echangeArcanum } : {}),
  };

  const blocages = plan ? levelUpBlockers(plan, choix) : ['Cette classe ne peut pas monter.'];
  const apres = useMemo(
    () => (plan && blocages.length === 0 ? deriveCharacter(applyLevelUp(sheet, plan, choix)) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sheet, plan, jet, sousClasse, amelioration, don, invocations, echange, arcanum, echangeArcanum],
  );

  const dons = useMemo(() => {
    if (!plan?.asi) return [];
    return eligibleFeats({
      level: plan.characterLevel,
      abilities: derivee.abilities,
      spellcasting: Object.keys(derivee.spellcasting.numbers).length > 0,
      armorTraining: [],
      shieldTraining: false,
      existingFeatIds: sheet.featIds,
    }, plan.characterLevel >= 19);
  }, [plan, derivee, sheet.featIds]);

  const basculerCarac = (ability: AbilityId) => {
    setDon(null);
    setAmelioration((courante) => {
      const total = Object.values(courante).reduce((somme, n) => somme + (n ?? 0), 0);
      const actuel = courante[ability] ?? 0;
      // Un appui ajoute +1, un second monte à +2, un troisième remet à zéro.
      if (actuel >= 2) { const suite = { ...courante }; delete suite[ability]; return suite; }
      if (total >= 2) return actuel > 0 ? { [ability]: 2 } : { [ability]: 1 };
      return { ...courante, [ability]: actuel + 1 };
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(13,15,18,.95)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        flexShrink: 0, padding: '13px 16px 12px',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--gold-dim)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <h2 className="ttl" style={{ margin: 0, fontSize: 18 }}>Monter d’un niveau</h2>
          <div className="lbl" style={{ marginTop: 3, textTransform: 'none' }}>
            {sheet.name}{plan ? ` · ${plan.className} ${plan.from} → ${plan.to}` : ''}
          </div>
        </div>
        <button
          onClick={onFermer}
          aria-label="Annuler"
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: 10,
            border: '1px solid var(--gold-dim)', color: 'var(--muted)', fontSize: 18,
          }}
        >
          ✕
        </button>
      </header>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '14px 16px calc(20px + env(safe-area-inset-bottom))',
      }}>
        {sheet.classLevels.length > 1 && (
          <>
            <div className="lbl">Dans quelle classe</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {sheet.classLevels.map((niveau) => (
                <button
                  key={niveau.classId}
                  onClick={() => setClassId(niveau.classId)}
                  className="lbl"
                  style={{
                    minHeight: 40, padding: '0 12px', borderRadius: 999,
                    border: `1px solid ${niveau.classId === classId ? 'var(--accent)' : 'var(--gold-dim)'}`,
                    color: niveau.classId === classId ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {niveau.classId} {niveau.level}
                </button>
              ))}
            </div>
          </>
        )}

        {!plan ? (
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
            Niveau 20 atteint : il n’y a plus rien au-dessus.
          </p>
        ) : (
          <>
            {/* ─── Points de vie ─── */}
            <div className="lbl" style={{ marginTop: 16 }}>Jet de dé de vie (d{plan.hitDie})</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
              {Array.from({ length: plan.hitDie }, (_, index) => index + 1).map((valeur) => (
                <button
                  key={valeur}
                  onClick={() => setJet(valeur)}
                  className="num"
                  style={{
                    width: 42, minHeight: 44, borderRadius: 10,
                    border: `1px solid ${jet === valeur ? 'var(--accent)' : 'var(--gold-dim)'}`,
                    background: jet === valeur ? 'var(--accent)' : 'transparent',
                    color: jet === valeur ? 'var(--accent-ink)' : 'var(--ink)',
                    fontWeight: 700,
                  }}
                >
                  {valeur}
                </button>
              ))}
            </div>
            <button
              onClick={() => setJet(plan.average)}
              className="lbl"
              style={{
                marginTop: 8, minHeight: 38, padding: '0 12px', borderRadius: 999,
                border: '1px solid var(--gold-dim)', color: 'var(--muted)',
              }}
            >
              Prendre la moyenne ({plan.average})
            </button>

            {plan.usesOverride && (
              <div style={{
                marginTop: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--gold-dim)', fontSize: 13, lineHeight: 1.45, color: 'var(--muted)',
              }}>
                Les points de vie de cette fiche viennent de l’ancienne app, sans
                le détail des jets. Ce jet s’ajoute au total plutôt que de le
                recalculer — sinon les PV d’un personnage joué changeraient sous
                ses yeux.
              </div>
            )}

            {/* ─── Sous-classe ─── */}
            {plan.subclass && (
              <>
                <div className="lbl" style={{ marginTop: 18 }}>{plan.subclass.label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 7 }}>
                  {plan.subclass.options.map((option) => {
                    const maintenant = option.features.filter((feature) => feature.level === plan.to);
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSousClasse(option.name)}
                        className="card"
                        style={{
                          textAlign: 'left', padding: '11px 13px',
                          border: `1px solid ${sousClasse === option.name ? 'var(--accent)' : 'var(--gold-dim)'}`,
                          background: sousClasse === option.name ? 'var(--accent-wash)' : 'var(--surface)',
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{option.name}</div>
                        {maintenant.map((feature) => (
                          <div key={feature.name} style={{ marginTop: 5 }}>
                            <div className="lbl" style={{ color: 'var(--accent)' }}>{feature.name}</div>
                            <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--muted)', marginTop: 2 }}>
                              {feature.desc}
                            </div>
                          </div>
                        ))}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ─── Augmentation ou don ─── */}
            {plan.asi && (
              <>
                <div className="lbl" style={{ marginTop: 18 }}>Augmentation de caractéristique</div>
                <div className="lbl" style={{ textTransform: 'none', marginTop: 3, color: 'var(--muted)' }}>
                  +2 sur une, ou +1 sur deux. Un appui ajoute, un troisième annule.
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {ABILITY_IDS.map((ability) => {
                    const gain = amelioration[ability] ?? 0;
                    return (
                      <button
                        key={ability}
                        onClick={() => basculerCarac(ability)}
                        style={{
                          minHeight: 52, padding: '0 12px', borderRadius: 10,
                          border: `1px solid ${gain ? 'var(--accent)' : 'var(--gold-dim)'}`,
                          background: gain ? 'var(--accent-wash)' : 'transparent',
                        }}
                      >
                        <div className="lbl">{NOM_CARAC[ability].slice(0, 3)}</div>
                        <div className="num" style={{ fontWeight: 700, color: gain ? 'var(--accent)' : 'var(--ink)' }}>
                          {derivee.abilities[ability]}{gain ? ` +${gain}` : ''}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {dons.length > 0 && (
                  <>
                    <div className="lbl" style={{ marginTop: 14 }}>…ou un don à la place</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 7 }}>
                      {dons.map((feat) => (
                        <button
                          key={feat.id}
                          onClick={() => { setDon(feat.id); setAmelioration({}); }}
                          className="card"
                          style={{
                            textAlign: 'left', padding: '10px 12px',
                            border: `1px solid ${don === feat.id ? 'var(--accent)' : 'var(--gold-dim)'}`,
                            background: don === feat.id ? 'var(--accent-wash)' : 'var(--surface)',
                          }}
                        >
                          <div style={{ fontSize: 15, fontWeight: 600 }}>{feat.name}</div>
                          <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--muted)', marginTop: 2 }}>
                            {feat.summary}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ─── Occultiste : invocations et Arcanum ─── */}
            {plan.warlock && (plan.warlock.invocationsToChoose > 0 || plan.warlock.mayReplaceInvocation) && (
              <>
                <div className="lbl" style={{ marginTop: 18 }}>
                  {plan.warlock.invocationsToChoose > 0
                    ? `Invocations occultes — ${invocations.length}/${plan.warlock.invocationsToChoose}`
                    : 'Invocations occultes'}
                </div>
                {plan.warlock.mayReplaceInvocation && (
                  <div className="lbl" style={{ textTransform: 'none', marginTop: 3, color: 'var(--muted)' }}>
                    Chaque niveau d’Occultiste permet aussi d’en échanger une.
                    {echange ? ` En cours : ${nomInvocation(echange.out)} → ${nomInvocation(echange.in)}.` : ''}
                  </div>
                )}

                {/* L'échange : d'abord celle qui part, ensuite celle qui vient. */}
                {plan.warlock.mayReplaceInvocation && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {invocationsChoisies(sheet).map((id) => {
                      const retirable = peutRetirerInvocation(sheet, id);
                      const choisie = echange?.out === id;
                      return (
                        <button
                          key={id}
                          disabled={!retirable}
                          onClick={() => setEchange(choisie ? null : { out: id, in: '' })}
                          className="lbl"
                          style={{
                            minHeight: 40, padding: '0 12px', borderRadius: 999,
                            border: `1px solid ${choisie ? 'var(--accent)' : 'var(--gold-dim)'}`,
                            color: !retirable ? 'var(--muted)' : choisie ? 'var(--accent)' : 'var(--ink)',
                            opacity: retirable ? 1 : 0.45,
                            textTransform: 'none',
                          }}
                        >
                          {choisie ? '↩ ' : ''}{nomInvocation(id)}
                          {!retirable ? ' · socle' : ''}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 8 }}>
                  {plan.warlock.invocationOptions.map((option) => {
                    const prise = invocations.includes(option.id);
                    const entrante = echange?.in === option.id;
                    const enAttenteDEchange = echange != null && echange.in === '';
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          if (enAttenteDEchange) { setEchange({ out: echange.out, in: option.id }); return; }
                          if (entrante) { setEchange({ out: echange!.out, in: '' }); return; }
                          setInvocations((courantes) => (
                            prise
                              ? courantes.filter((id) => id !== option.id)
                              : courantes.length >= (plan.warlock?.invocationsToChoose ?? 0)
                                ? courantes
                                : [...courantes, option.id]
                          ));
                        }}
                        className="card"
                        style={{
                          textAlign: 'left', padding: '10px 12px',
                          border: `1px solid ${prise || entrante ? 'var(--accent)' : 'var(--gold-dim)'}`,
                          background: prise || entrante ? 'var(--accent-wash)' : 'var(--surface)',
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 600 }}>
                          {option.name}{entrante ? ' · en échange' : ''}
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--muted)', marginTop: 2 }}>
                          {option.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {plan.warlock && plan.warlock.arcanumRanks.map((rang) => (
              <div key={rang}>
                <div className="lbl" style={{ marginTop: 18 }}>Arcanum mystique — un sort de rang {rang}</div>
                <div className="lbl" style={{ textTransform: 'none', marginTop: 3, color: 'var(--muted)' }}>
                  Lançable une fois sans emplacement, rendu au repos long.
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {sortsArcanumPossibles(sheet, rang).map((spell) => {
                    const choisi = arcanum.some((entree) => entree.spellId === spell.id);
                    return (
                      <button
                        key={spell.id}
                        onClick={() => setArcanum((courants) => (
                          choisi
                            ? courants.filter((entree) => entree.spellId !== spell.id)
                            : [...courants.filter((entree) => entree.rank !== rang), { rank: rang, spellId: spell.id }]
                        ))}
                        className="lbl"
                        style={{
                          minHeight: 40, padding: '0 12px', borderRadius: 999, textTransform: 'none',
                          border: `1px solid ${choisi ? 'var(--accent)' : 'var(--gold-dim)'}`,
                          color: choisi ? 'var(--accent)' : 'var(--ink)',
                        }}
                      >
                        {spell.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {plan.warlock?.mayReplaceArcanum && (
              <>
                <div className="lbl" style={{ marginTop: 18 }}>Échanger un Arcanum</div>
                <div className="lbl" style={{ textTransform: 'none', marginTop: 3, color: 'var(--muted)' }}>
                  Contre un autre sort d’Occultiste du MÊME rang.
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {arcanumChoisis(sheet).map((entree) => {
                    const vise = echangeArcanum?.out === entree.spellId;
                    return (
                      <button
                        key={entree.spellId}
                        onClick={() => setEchangeArcanum(vise ? null : { out: entree.spellId, in: '' })}
                        className="lbl"
                        style={{
                          minHeight: 40, padding: '0 12px', borderRadius: 999, textTransform: 'none',
                          border: `1px solid ${vise ? 'var(--accent)' : 'var(--gold-dim)'}`,
                          color: vise ? 'var(--accent)' : 'var(--ink)',
                        }}
                      >
                        rang {entree.rank} · {spellById(entree.spellId)?.name ?? entree.spellId}
                      </button>
                    );
                  })}
                </div>
                {echangeArcanum && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {sortsArcanumPossibles(
                      sheet,
                      arcanumChoisis(sheet).find((e) => e.spellId === echangeArcanum.out)?.rank ?? 0,
                    ).map((spell) => (
                      <button
                        key={spell.id}
                        onClick={() => setEchangeArcanum({ out: echangeArcanum.out, in: spell.id })}
                        className="lbl"
                        style={{
                          minHeight: 40, padding: '0 12px', borderRadius: 999, textTransform: 'none',
                          border: `1px solid ${echangeArcanum.in === spell.id ? 'var(--accent)' : 'var(--gold-dim)'}`,
                          color: echangeArcanum.in === spell.id ? 'var(--accent)' : 'var(--ink)',
                        }}
                      >
                        {spell.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ─── Ce que le niveau apporte ─── */}
            {(plan.features.length > 0 || plan.subclassFeatures.length > 0) && (
              <>
                <div className="lbl" style={{ marginTop: 18 }}>Ce niveau apporte</div>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                  {plan.features.map((nom) => <li key={nom}>{nom}</li>)}
                  {plan.subclassFeatures.map((feature) => <li key={feature.name}>{feature.name}</li>)}
                </ul>
              </>
            )}

            {/* ─── Avant / après ─── */}
            {apres && (
              <div style={{
                marginTop: 18, padding: '12px 14px', borderRadius: 'var(--radius)',
                border: '1px solid var(--ok)', background: 'var(--surface)',
              }}>
                <div className="lbl" style={{ color: 'var(--ok)' }}>Après la montée</div>
                <dl style={{ margin: '8px 0 0', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 14px', fontSize: 14 }}>
                  <dt className="lbl">PV max</dt>
                  <dd className="num" style={{ margin: 0 }}>{derivee.maxHp} → <strong>{apres.maxHp}</strong></dd>
                  <dt className="lbl">Maîtrise</dt>
                  <dd className="num" style={{ margin: 0 }}>+{derivee.proficiencyBonus} → <strong>+{apres.proficiencyBonus}</strong></dd>
                  {apres.spellcasting.preparedMax[classId] !== undefined && (
                    <>
                      <dt className="lbl">Sorts préparables</dt>
                      <dd className="num" style={{ margin: 0 }}>
                        {derivee.spellcasting.preparedMax[classId] ?? 0} → <strong>{apres.spellcasting.preparedMax[classId]}</strong>
                      </dd>
                    </>
                  )}
                  <dt className="lbl">Emplacements</dt>
                  <dd className="num" style={{ margin: 0 }}>
                    {derivee.spellcasting.slots.map((slot) => slot.max).join('/') || '—'}
                    {' → '}
                    <strong>{apres.spellcasting.slots.map((slot) => slot.max).join('/') || '—'}</strong>
                  </dd>
                </dl>
              </div>
            )}

            {blocages.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {blocages.map((blocage) => (
                  <div
                    key={blocage}
                    role="alert"
                    style={{
                      padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--gold-dim)', background: 'var(--surface)',
                      fontSize: 13, lineHeight: 1.45, color: 'var(--muted)',
                    }}
                  >
                    {blocage}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => onMonter(applyLevelUp(sheet, plan, choix))}
              disabled={blocages.length > 0}
              style={{
                width: '100%', minHeight: 52, marginTop: 18, borderRadius: 'var(--radius-sm)',
                background: blocages.length > 0 ? 'var(--surface)' : 'var(--accent)',
                color: blocages.length > 0 ? 'var(--muted)' : 'var(--accent-ink)',
                border: blocages.length > 0 ? '1px solid var(--gold-dim)' : 'none',
                fontSize: 15, fontWeight: 700,
                cursor: blocages.length > 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {blocages.length > 0
                ? 'Il reste des choix à faire'
                : `Passer ${sheet.name} au niveau ${plan.to}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
