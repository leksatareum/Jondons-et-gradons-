import { useState } from 'react';
import {
  ajouterAuButin, ajouterLigneLibre, changerOr, changerQuantite, ficheDeLaLigne,
  partDeChacun, retirerDuButin, type ButinPrepare,
} from '../domain/butin-prepare';
import { ChoisirUnObjet } from './ChoisirUnObjet';

/**
 * Le butin d'une rencontre, composé en même temps qu'elle.
 *
 * Rangé sous les créatures dans l'éditeur, et pas dans un écran à part : on
 * sait ce que garde le chef gobelin au moment où on décide qu'il y a un chef
 * gobelin. Le séparer obligerait à revenir sur ses pas.
 *
 * L'or affiche sa division par tête pendant qu'on le tape — c'est le calcul
 * qu'on fait de toute façon, et le faire à l'avance évite de le faire à voix
 * haute devant la table.
 */
export function EditeurDeButin({ butin, taille, onChanger }: {
  butin: ButinPrepare;
  /** L'effectif du groupe, pour montrer la part de chacun. */
  taille: number;
  onChanger: (suivant: ButinPrepare) => void;
}) {
  const [choix, setChoix] = useState(false);
  const partage = partDeChacun(butin.or, taille);

  return (
    <>
      <div className="lbl" style={{ marginTop: 22, fontSize: 9, color: 'var(--gold)' }}>Le butin</div>
      <p style={{ margin: '5px 0 9px', fontSize: 11.5, lineHeight: 1.45, color: 'var(--muted)' }}>
        Ce que la rencontre laisse derrière elle. Préparé maintenant, il se distribue d’un appui
        une fois le combat fini.
      </p>

      {butin.objets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 9 }}>
          {butin.objets.map((ligne) => {
            const fiche = ficheDeLaLigne(ligne);
            return (
              <div
                key={ligne.id}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px' }}
              >
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <div className="ttl" style={{ fontSize: 13.5 }}>{ligne.nom}</div>
                  <div className="lbl" style={{ fontSize: 8, marginTop: 2 }}>
                    {fiche ? fiche.detail : 'écrit à la main'}
                  </div>
                </div>
                <button
                  onClick={() => onChanger(changerQuantite(butin, ligne.id, ligne.qty - 1))}
                  aria-label={`Un ${ligne.nom} de moins`}
                  className="jg-rond"
                  style={{ width: 32, height: 32, flexShrink: 0, fontSize: 15 }}
                >
                  −
                </button>
                <span className="ttl num" style={{ minWidth: 20, textAlign: 'center', fontSize: 15 }}>
                  {ligne.qty}
                </span>
                <button
                  onClick={() => onChanger(changerQuantite(butin, ligne.id, ligne.qty + 1))}
                  aria-label={`Un ${ligne.nom} de plus`}
                  className="jg-rond"
                  style={{ width: 32, height: 32, flexShrink: 0, fontSize: 15 }}
                >
                  +
                </button>
                <button
                  onClick={() => onChanger(retirerDuButin(butin, ligne.id))}
                  aria-label={`Retirer ${ligne.nom} du butin`}
                  style={{ flexShrink: 0, padding: '4px 4px', fontSize: 14, color: 'var(--muted)' }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setChoix(true)}
        style={{
          width: '100%', minHeight: 42, borderRadius: 9, fontSize: 13,
          border: '1px dashed var(--gold-dim)', background: 'transparent', color: 'var(--muted)',
        }}
      >
        + Ajouter un objet
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 11 }}>
        <span className="lbl" style={{ fontSize: 9, flexShrink: 0 }}>Pièces d’or</span>
        <input
          value={butin.or === 0 ? '' : String(butin.or)}
          onChange={(evenement) => onChanger(changerOr(butin, Number(evenement.target.value.replace(/\D/g, '')) || 0))}
          inputMode="numeric"
          placeholder="0"
          aria-label="Pièces d’or du butin"
          className="num"
          style={{
            width: 92, minHeight: 38, padding: '0 11px', borderRadius: 9, fontSize: 15,
            border: '1px solid var(--line)', background: 'rgba(255,255,255,.04)', color: 'inherit',
          }}
        />
        {butin.or > 0 && taille > 0 && (
          <span style={{ fontSize: 11.5, lineHeight: 1.4, color: 'var(--muted)' }}>
            <span className="num" style={{ color: 'var(--gold-bright)' }}>{partage.part} po</span> chacun
            {partage.reste > 0 && `, il reste ${partage.reste}`}
          </span>
        )}
      </div>

      {choix && (
        <ChoisirUnObjet
          onChoisir={(objet) => { onChanger(ajouterAuButin(butin, objet)); setChoix(false); }}
          onLigneLibre={(nom) => { onChanger(ajouterLigneLibre(butin, nom)); setChoix(false); }}
          onFermer={() => setChoix(false)}
        />
      )}
    </>
  );
}
