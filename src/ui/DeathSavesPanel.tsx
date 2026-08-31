import { useState } from 'react';
import type { EtatDeMort, ResultatJet } from '../model/death-state';
import { NombreQuiRoule } from './NombreQuiRoule';

/**
 * À 0 point de vie : les jets de sauvegarde contre la mort.
 *
 * Deux façons de s'en servir, parce que les tables ne jouent pas pareil :
 * on lance le dé DANS l'appli (mêmes probabilités qu'un vrai d20, voir
 * `model/death-state.ts`), ou on tape soi-même le résultat d'un dé lancé sur
 * la table. Les pastilles ne sont donc pas qu'un affichage : chacune
 * enregistre un jet.
 *
 * Le DD est rappelé en toutes lettres (10) : c'est le seul jet du jeu dont
 * le DD ne dépend de rien, et c'est celui qu'on oublie quand on le fait pour
 * la première fois de sa vie de joueur.
 *
 * Rien ne se décide ici : le panneau appelle, `SheetView` applique la règle
 * (trois succès, trois échecs, 1 et 20 naturels) via le domaine.
 */

const PASTILLE = 26;

function Pastille({ rempli, couleur, onClick, label }: {
  rempli: boolean; couleur: string; onClick?: () => void; label: string;
}) {
  const contenu = (
    <span
      aria-hidden
      style={{
        display: 'block', width: PASTILLE, height: PASTILLE, borderRadius: '50%',
        border: `2px solid ${rempli ? couleur : 'var(--gold-dim)'}`,
        background: rempli ? couleur : 'transparent',
        boxShadow: rempli ? `0 0 10px -2px ${couleur}` : 'inset 0 2px 5px rgba(0,0,0,.6)',
      }}
    />
  );
  if (!onClick) return <span title={label}>{contenu}</span>;
  return (
    <button
      onClick={onClick}
      aria-label={label}
      // La pastille fait 26px mais la cible tactile en fait 44 : c'est la
      // règle de l'appli (`--tap`), et ici plus qu'ailleurs — on y touche les
      // mains moites, au moment où le personnage risque de mourir.
      style={{
        width: 'var(--tap)', height: 'var(--tap)', display: 'grid', placeItems: 'center',
      }}
    >
      {contenu}
    </button>
  );
}

export function DeathSavesPanel({ etat, dernierDe, onNoter, onLancer, onStabiliser, onReinitialiser }: {
  etat: EtatDeMort;
  /** Le dernier d20 lancé DANS l'appli, à montrer tel quel. */
  dernierDe: { de: number; resultat: ResultatJet; cle: number } | null;
  onNoter: (resultat: ResultatJet) => void;
  onLancer: () => void;
  onStabiliser: () => void;
  onReinitialiser: () => void;
}) {
  const [detail, setDetail] = useState(false);
  const fini = etat.statut === 'dead' || etat.statut === 'stable';

  const titre = etat.statut === 'dead' ? 'Mort'
    : etat.statut === 'stable' ? 'Stabilisé'
      : 'À terre, inconscient';
  const couleurTitre = etat.statut === 'dead' ? 'var(--vital)'
    : etat.statut === 'stable' ? 'var(--ok)'
      : 'var(--vital)';

  return (
    <div
      className="jg-tile jg-anim-pop"
      style={{ padding: '13px 14px', borderRadius: 'var(--radius)', border: `1.5px solid ${couleurTitre}` }}
    >
      {/* Titre et sous-titre EMPILÉS, pas côte à côte : sur 390 px de large,
          « À terre, inconscient » passait à la ligne et venait se cogner au
          libellé posé en face. Un état ne peut pas dépendre de la longueur de
          son propre nom pour rester lisible. */}
      <div className="ttl" style={{ fontSize: 16, color: couleurTitre }}>{titre}</div>
      <div className="lbl" style={{ marginTop: 2 }}>sauvegardes contre la mort · DD 10</div>

      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {([
          { clef: 'succes', mot: 'Succès', compte: etat.succes, couleur: 'var(--ok)' },
          { clef: 'echec', mot: 'Échecs', compte: etat.echecs, couleur: 'var(--vital)' },
        ] as const).map((ligne) => (
          <div key={ligne.clef} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div className="lbl" style={{ width: 54, flexShrink: 0 }}>{ligne.mot}</div>
            {[0, 1, 2].map((index) => (
              <Pastille
                key={index}
                rempli={index < ligne.compte}
                couleur={ligne.couleur}
                label={`${ligne.mot} ${index + 1} sur 3`}
                // Une case déjà cochée ne se décoche pas : pour corriger une
                // erreur il y a « Repartir de zéro », qui le dit franchement.
                // Sinon un appui de trop passerait pour une règle.
                onClick={fini || index < ligne.compte ? undefined : () => onNoter(ligne.clef === 'succes' ? 'succes' : 'echec')}
              />
            ))}
          </div>
        ))}
      </div>

      {dernierDe && (
        <div
          key={dernierDe.cle}
          className="jg-anim-pop"
          style={{
            marginTop: 8, padding: '8px 11px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--gold-dim)', background: 'rgba(0,0,0,.35)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <div className="num" style={{
            fontSize: 26, fontWeight: 800, lineHeight: 1, minWidth: 38, textAlign: 'center',
            color: dernierDe.resultat === 'nat20' ? 'var(--ok)'
              : dernierDe.resultat === 'nat1' ? 'var(--vital)' : 'var(--gold-bright)',
          }}>
            <NombreQuiRoule total={dernierDe.de} plage={{ min: 1, max: 20 }} />
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.4, color: 'var(--muted)' }}>
            {dernierDe.resultat === 'nat20' ? '20 naturel — tu reprends conscience à 1 PV.'
              : dernierDe.resultat === 'nat1' ? '1 naturel — deux échecs d’un coup.'
                : dernierDe.resultat === 'succes' ? 'Réussite.' : 'Échec.'}
          </div>
        </div>
      )}

      {!fini && (
        <button
          onClick={onLancer}
          className="jg-btn-hot"
          style={{
            width: '100%', minHeight: 'var(--tap)', marginTop: 10,
            borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 700,
          }}
        >
          Lancer le dé
        </button>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {!fini && (
          <button
            onClick={() => setDetail((ouvert) => !ouvert)}
            className="lbl"
            style={{ minHeight: 38, padding: '0 12px', borderRadius: 999, border: '1px solid var(--gold-dim)' }}
          >
            Dé lancé à la table
          </button>
        )}
        {etat.statut === 'dying' && (
          <button
            onClick={onStabiliser}
            className="lbl"
            style={{ minHeight: 38, padding: '0 12px', borderRadius: 999, border: '1px solid var(--ok)', color: 'var(--ok)' }}
          >
            Stabilisé
          </button>
        )}
        <button
          onClick={onReinitialiser}
          className="lbl"
          style={{ minHeight: 38, padding: '0 12px', borderRadius: 999, border: '1px solid var(--gold-dim)', color: 'var(--muted)' }}
        >
          Repartir de zéro
        </button>
      </div>

      {detail && !fini && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {([
            ['succes', 'Réussite'], ['echec', 'Échec'],
            ['nat20', '20 naturel'], ['nat1', '1 naturel'],
          ] as const).map(([clef, mot]) => (
            <button
              key={clef}
              onClick={() => { onNoter(clef); setDetail(false); }}
              className="lbl"
              style={{
                minHeight: 38, padding: '0 12px', borderRadius: 999,
                border: '1px solid var(--gold-dim)', textTransform: 'none',
              }}
            >
              {mot}
            </button>
          ))}
        </div>
      )}

      <div className="lbl" style={{ textTransform: 'none', marginTop: 9, color: 'var(--muted)', lineHeight: 1.45 }}>
        {etat.statut === 'dead'
          ? 'Trois échecs. Seul le MJ décide de la suite.'
          : etat.statut === 'stable'
            ? 'Plus de jets à faire. Le moindre dégât te remet à terre.'
            : 'Trois réussites te stabilisent, trois échecs te tuent. Recevoir des dégâts à terre ajoute un échec.'}
      </div>
    </div>
  );
}
