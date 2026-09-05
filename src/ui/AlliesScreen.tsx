import { useState } from 'react';
import {
  activeWildShapeStatBlock, CONSTELLATIONS, type Constellation, courrouxDeLaMerDes,
  eclatLunaireActif, eligibleForms, estCercleDeLaMer, estCercleDesEtoiles, formeStellaireDes,
  hasRoomToLearn, knownForms, WILD_SHAPE_RESOURCE_KEY, wildShapeAccess,
} from '../model/wild-shape';
import { availableCompanions, type CompanionPayment } from '../model/companions';
import type { LinkedCreature, CharacterSheet } from '../model/character';
import type { DerivedCharacter, DerivedSlot } from '../model/derive';
import type { WildShapeProfile } from '../domain/wild-shape';
import type { LinkedCreatureOption } from '../domain/linked-creatures';
import { normaliserNom } from '../domain/nom-normalise';

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
      padding: '10px 12px',
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
        border: `1px solid ${accent ? 'var(--accent)' : 'var(--gold-dim)'}`,
        color: disabled ? 'var(--muted)' : accent ? 'var(--accent)' : 'var(--ink)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

function SectionFormeSauvage({
  sheet, derived, onTransformer, onRevenir, onApprendre, onEchanger,
  onCourrouxDeLaMer, onFinCourrouxDeLaMer, onFormeStellaire, onFinFormeStellaire,
}: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  onTransformer: (formId: string) => void;
  onRevenir: () => void;
  onApprendre: (formId: string) => void;
  onEchanger: (fromId: string, toId: string) => void;
  onCourrouxDeLaMer: () => void;
  onFinCourrouxDeLaMer: () => void;
  onFormeStellaire: (constellation: Constellation) => void;
  onFinFormeStellaire: () => void;
}) {
  const [echangeDe, setEchangeDe] = useState<string | null>(null);
  const [constellationChoisie, setConstellationChoisie] = useState<Constellation>('archer');
  const acces = wildShapeAccess(sheet, derived);
  if (acces.knownLimit === 0) return null;

  const actif = activeWildShapeStatBlock(sheet, derived);
  const charge = derived.resources.find((entry) => entry.key === 'druide:forme-sauvage');
  const connues = knownForms(sheet, derived);
  const eligibles = eligibleForms(sheet, derived);
  const apprenables = eligibles.filter((profile) => !connues.includes(profile.id));
  const fenetreOuverte = Boolean(sheet.live.wildShapeSwapOpen);
  const mer = estCercleDeLaMer(sheet);
  const etoiles = estCercleDesEtoiles(sheet);
  const courrouxActif = Boolean(sheet.live.courrouxDeLaMer);
  const formeActive = sheet.live.formeStellaire ?? null;
  // Les trois usages de la même réserve sont exclusifs : dès qu'un des trois
  // est engagé, les cartes des deux autres n'ont plus rien à proposer.
  const uneAutreFormeEnCours = Boolean(actif) || courrouxActif || formeActive !== null;

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
        <div className="card card-accent" style={{
          padding: '12px 14px',
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
          {eclatLunaireActif(sheet) && (
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6, lineHeight: 1.4 }}>
              Éclat lunaire : chaque coup peut infliger des dégâts radiants à la place des dégâts habituels — à
              choisir à chaque attaque. Ta Sagesse s’ajoute aussi à ta sauvegarde de concentration tant que tu es transformé.
            </div>
          )}
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
      ) : courrouxActif ? (
        <div className="card card-accent" style={{
          padding: '12px 14px',
        }}>
          <div className="ttl" style={{ fontSize: 17 }}>Courroux de la mer</div>
          <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>
            En action bonus — à l’activation puis à chacun de tes tours suivants : une créature visible dans
            l’émanation (1,50 m) fait une sauvegarde de Constitution ; en cas d’échec, {courrouxDeLaMerDes(derived.modifiers.wis)}d6 dégâts
            de froid et, si Grand ou moins, repoussée jusqu’à 4,50 m.
          </div>
          <button
            onClick={onFinCourrouxDeLaMer}
            style={{
              width: '100%', minHeight: 44, marginTop: 12, borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 14, fontWeight: 700,
            }}
          >
            Terminer Courroux de la mer
          </button>
        </div>
      ) : formeActive ? (
        <div className="card card-accent" style={{
          padding: '12px 14px',
        }}>
          <div className="ttl" style={{ fontSize: 17 }}>
            Forme stellaire · {CONSTELLATIONS.find((c) => c.id === formeActive.constellation)?.name}
          </div>
          <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>
            {formeActive.constellation === 'dragon'
              ? CONSTELLATIONS.find((c) => c.id === 'dragon')!.desc
              : `À l’activation puis en action bonus à tes tours suivants : ${formeStellaireDes(sheet)}d8 + Sagesse `
                + (formeActive.constellation === 'archer' ? 'dégâts radiants (attaque de sort à distance, 18 m).' : 'PV rendus (avec un sort qui en rend, à toi ou une créature visible à 9 m).')}
          </div>
          <button
            onClick={onFinFormeStellaire}
            style={{
              width: '100%', minHeight: 44, marginTop: 12, borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 14, fontWeight: 700,
            }}
          >
            Terminer la Forme stellaire
          </button>
        </div>
      ) : (
        <>
          {connues.length === 0 && !mer && !etoiles && (
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

          {mer && (
            <div className="card" style={{
              padding: '10px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Courroux de la mer</div>
                  <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>
                    Émanation d’embruns · {courrouxDeLaMerDes(derived.modifiers.wis)}d6 froid
                  </div>
                </div>
                <BoutonAction
                  label="Activer" accent
                  disabled={!charge || charge.remaining <= 0}
                  onClick={onCourrouxDeLaMer}
                />
              </div>
            </div>
          )}

          {etoiles && (
            <div className="card" style={{
              padding: '10px 12px',
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Forme stellaire</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {CONSTELLATIONS.map((constellation) => (
                  <label
                    key={constellation.id}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="constellation"
                      checked={constellationChoisie === constellation.id}
                      onChange={() => setConstellationChoisie(constellation.id)}
                      style={{ marginTop: 3 }}
                    />
                    <span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{constellation.name}</span>
                      <span className="lbl" style={{ textTransform: 'none', display: 'block', marginTop: 1 }}>
                        {constellation.desc}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => onFormeStellaire(constellationChoisie)}
                disabled={!charge || charge.remaining <= 0}
                style={{
                  width: '100%', minHeight: 'var(--tap)', marginTop: 10, borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--accent)',
                  color: (!charge || charge.remaining <= 0) ? 'var(--muted)' : 'var(--accent)',
                  opacity: (!charge || charge.remaining <= 0) ? 0.5 : 1,
                  fontSize: 14, fontWeight: 700,
                }}
              >
                Activer
              </button>
            </div>
          )}
        </>
      )}

      {!uneAutreFormeEnCours && apprenables.length > 0 && (
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

/**
 * Ramener à la vie : ne propose que les rangs d'emplacement encore
 * disponibles — jamais un rang déjà épuisé, jamais la réserve de pacte
 * (hors du champ de la règle du compagnon primordial).
 */
function RamenerALaVie({ nom, slots, onRamener }: {
  nom: string;
  slots: DerivedSlot[];
  onRamener: (rang: number) => void;
}) {
  const disponibles = slots.filter((slot) => !slot.pact && slot.remaining > 0);
  return (
    <div style={{
      marginTop: 8, padding: '9px 10px', borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--vital)',
    }}>
      <div className="lbl" style={{ textTransform: 'none', color: 'var(--vital)' }}>
        {nom} est morte — si c'est depuis moins d'une heure, un emplacement de sort la ramène à pleins PV.
      </div>
      {disponibles.length === 0 ? (
        <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 6 }}>
          Aucun emplacement disponible.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
          {disponibles.map((slot) => (
            <button
              key={slot.level}
              onClick={() => onRamener(slot.level)}
              className="lbl"
              style={{
                minHeight: 32, padding: '0 10px', borderRadius: 999,
                border: '1px solid var(--vital)', color: 'var(--vital)', fontWeight: 700,
              }}
            >
              Rang {slot.level} ({slot.remaining})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Ce qui paie l'invocation d'un Compagnon sauvage — PHB 2024 : une
 * utilisation de Forme sauvage OU un emplacement de sort, jamais gratuit
 * (à la différence des trois autres sources de créature liée). N'affiche
 * que ce qui est vraiment disponible, comme `RamenerALaVie`.
 */
function PaiementCompagnonSauvage({ charge, slots, onPayer }: {
  charge?: { remaining: number; max: number };
  slots: DerivedSlot[];
  onPayer: (payment: CompanionPayment) => void;
}) {
  const rangsDisponibles = slots.filter((slot) => !slot.pact && slot.remaining > 0);
  return (
    <div style={{
      marginTop: 8, padding: '9px 10px', borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--accent)',
    }}>
      <div className="lbl" style={{ textTransform: 'none', color: 'var(--accent)' }}>
        Une utilisation de Forme sauvage ou un emplacement de sort paie l'invocation.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
        <button
          onClick={() => onPayer({ type: 'forme-sauvage' })}
          disabled={!charge || charge.remaining <= 0}
          className="lbl"
          style={{
            minHeight: 32, padding: '0 10px', borderRadius: 999,
            border: '1px solid var(--accent)',
            color: charge && charge.remaining > 0 ? 'var(--accent)' : 'var(--muted)',
            opacity: charge && charge.remaining > 0 ? 1 : 0.5, fontWeight: 700,
          }}
        >
          Forme sauvage {charge ? `(${charge.remaining})` : ''}
        </button>
        {rangsDisponibles.map((slot) => (
          <button
            key={slot.level}
            onClick={() => onPayer({ type: 'emplacement', rang: slot.level })}
            className="lbl"
            style={{
              minHeight: 32, padding: '0 10px', borderRadius: 999,
              border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 700,
            }}
          >
            Rang {slot.level} ({slot.remaining})
          </button>
        ))}
      </div>
    </div>
  );
}

function CarteCompagnon({ companion, slots, onDegats, onDetacher, onRamener }: {
  companion: LinkedCreature;
  slots: DerivedSlot[];
  onDegats: (delta: number) => void;
  onDetacher: () => void;
  /** Absent pour un familier : ramener à la vie via un emplacement de sort est propre au compagnon primordial. */
  onRamener?: (rang: number) => void;
}) {
  return (
    <div className="card" style={{
      padding: '12px 14px',
      border: '1px solid var(--ok)',
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
          style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--gold-dim)' }}>−</button>
        <div className="num" style={{ fontSize: 16, fontWeight: 700, minWidth: 56, textAlign: 'center' }}>
          {companion.hp}<span style={{ fontSize: 12, color: 'var(--muted)' }}>/{companion.hpMax}</span>
        </div>
        <button onClick={() => onDegats(-1)} aria-label={`Rendre un point de vie à ${companion.name}`}
          style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--gold-dim)' }}>+</button>
        <div style={{ flexGrow: 1 }} />
        <BoutonAction label="Détacher" onClick={onDetacher} />
      </div>

      {companion.hp === 0 && companion.family === 'primal-companion' && onRamener && (
        <RamenerALaVie nom={companion.name} slots={slots} onRamener={onRamener} />
      )}

      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {companion.rules.map((regle) => (
          <div key={regle} style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{regle}</div>
        ))}
      </div>
    </div>
  );
}

function SectionCompagnon({ sheet, derived, onLier, onDegats, onDetacher, onRamener }: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  onLier: (optionId: string, nom?: string, paiement?: CompanionPayment) => void;
  onDegats: (companionId: string, delta: number) => void;
  onDetacher: (companionId: string) => void;
  onRamener: (companionId: string, rang: number) => void;
}) {
  const [nom, setNom] = useState('');
  // Le Compagnon sauvage n'est pas gratuit : cliquer « Lier » ouvre le choix
  // du paiement au lieu de lier tout de suite. Les autres sources n'ont pas
  // ce détour — elles n'ont rien à payer.
  const [paiementOuvertPour, setPaiementOuvertPour] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const options = availableCompanions(sheet);
  const lies = sheet.companions ?? [];
  if (options.length === 0 && lies.length === 0) return null;
  // Le Pacte de la Chaîne à lui seul propose déjà une bonne vingtaine de
  // familiers, patron compris — chercher un nom vite tapé bat le défilement
  // dès qu'il y en a plus qu'une poignée. Insensible aux accents et à la
  // casse : on tape « corbeau » comme on veut.
  const optionsFiltrees = recherche.trim()
    ? options.filter((option) => normaliserNom(option.name).includes(normaliserNom(recherche)))
    : options;
  const chargeFormeSauvage = derived.resources.find((entry) => entry.key === WILD_SHAPE_RESOURCE_KEY);

  return (
    <>
      <div className="lbl" style={{ marginTop: 4 }}>Créature liée</div>
      {lies.map((companion) => (
        <CarteCompagnon
          key={companion.id}
          companion={companion}
          slots={derived.spellcasting.slots}
          onDegats={(delta) => onDegats(companion.id, delta)}
          onDetacher={() => onDetacher(companion.id)}
          onRamener={(rang) => onRamener(companion.id, rang)}
        />
      ))}
      {lies.length === 0 && options.length > 0 && (
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0' }}>
          Aucune créature liée pour l’instant.
        </p>
      )}
      {options.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Un nom pour le RP — Loup, Fenrir…"
            style={{
              minHeight: 'var(--tap)', padding: '0 12px', borderRadius: 10,
              border: '1px solid var(--gold-dim)', background: 'var(--surface)', fontSize: 14,
            }}
          />
          {options.length > 6 && (
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={`Chercher parmi ${options.length}…`}
              aria-label="Chercher une créature à lier"
              style={{
                minHeight: 'var(--tap)', padding: '0 12px', borderRadius: 10,
                border: '1px solid var(--gold-dim)', background: 'var(--surface)', fontSize: 14,
              }}
            />
          )}
          {optionsFiltrees.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0' }}>Rien de ce nom.</p>
          )}
          {optionsFiltrees.map((option: LinkedCreatureOption) => {
            const payant = option.source === 'wild-companion';
            return (
              <div key={option.id} className="card" style={{
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{option.name}</div>
                    <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>
                      {option.sourceLabel} · CA {option.ac} · {option.hp} PV
                    </div>
                  </div>
                  <BoutonAction
                    label="Lier" accent
                    onClick={() => {
                      if (!payant) { onLier(option.id, nom.trim() || undefined); setNom(''); return; }
                      setPaiementOuvertPour(paiementOuvertPour === option.id ? null : option.id);
                    }}
                  />
                </div>
                {payant && paiementOuvertPour === option.id && (
                  <PaiementCompagnonSauvage
                    charge={chargeFormeSauvage}
                    slots={derived.spellcasting.slots}
                    onPayer={(paiement) => {
                      onLier(option.id, nom.trim() || undefined, paiement);
                      setNom('');
                      setPaiementOuvertPour(null);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export function AlliesScreen({
  sheet, derived, onTransformer, onRevenir, onCourrouxDeLaMer, onFinCourrouxDeLaMer,
  onFormeStellaire, onFinFormeStellaire, onApprendre, onEchanger, onLier,
  onDegatsCompagnon, onDetacherCompagnon, onRamenerCompagnon,
}: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  onTransformer: (formId: string) => void;
  onRevenir: () => void;
  onCourrouxDeLaMer: () => void;
  onFinCourrouxDeLaMer: () => void;
  onFormeStellaire: (constellation: Constellation) => void;
  onFinFormeStellaire: () => void;
  onApprendre: (formId: string) => void;
  onEchanger: (fromId: string, toId: string) => void;
  onLier: (optionId: string, nom?: string, paiement?: CompanionPayment) => void;
  onDegatsCompagnon: (companionId: string, delta: number) => void;
  onDetacherCompagnon: (companionId: string) => void;
  onRamenerCompagnon: (companionId: string, rang: number) => void;
}) {
  // Ni `<main>` ni défilement propre : ce bloc est destiné à être empilé dans
  // le rouleau unique de `FicheScreen`, qui possède seul la zone de scroll.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SectionFormeSauvage
        sheet={sheet} derived={derived}
        onTransformer={onTransformer} onRevenir={onRevenir}
        onCourrouxDeLaMer={onCourrouxDeLaMer} onFinCourrouxDeLaMer={onFinCourrouxDeLaMer}
        onFormeStellaire={onFormeStellaire} onFinFormeStellaire={onFinFormeStellaire}
        onApprendre={onApprendre} onEchanger={onEchanger}
      />
      <SectionCompagnon
        sheet={sheet}
        derived={derived}
        onLier={onLier}
        onDegats={onDegatsCompagnon}
        onDetacher={onDetacherCompagnon}
        onRamener={onRamenerCompagnon}
      />
    </div>
  );
}
