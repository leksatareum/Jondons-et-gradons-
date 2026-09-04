import { useEffect, useMemo, useState } from 'react';
import {
  fpMaximalPourAllie, loyauteDuGroupe, MOUVEMENTS_DE_LOYAUTE,
  REGLE_ALLIE_PROGRESSION, REGLE_LOYAUTE_BORNES, REGLE_LOYAUTE_SECRET,
  sensDeLaLoyaute, STYLES_DE_NOM,
} from '../content/pnj';
import {
  deplacerLoyaute, ecrireCarnet, lireCarnet, tirerPnj, type PnjDuCarnet,
} from '../domain/carnet-pnj';
import { stockageDuNavigateur } from '../sync/cache-local';

/**
 * Le carnet de PNJ : tirer quelqu'un en trois secondes, puis suivre sa loyauté.
 *
 * ═══ Ce que ça résout ═══
 *
 * Les joueurs parlent à un garde qui n'était pas prévu. Le MJ improvise, et ce
 * qu'il improvise le moins bien c'est le DÉTAIL — l'apparence qui rend le type
 * mémorable, et le secret qui lui donne une raison d'exister. Le Guide donne
 * les deux tables ; les avoir sous le pouce évite le « euh… un homme, la
 * quarantaine » qui rend tous les PNJ identiques.
 *
 * ═══ La loyauté, et pourquoi elle ne se saisit pas ═══
 *
 * Le maximum et le point de départ se calculent sur le Charisme du groupe, que
 * l'appli connaît déjà par les fiches. Le MJ ne tape aucun chiffre : il appuie
 * sur un mouvement du Guide, le dé est lancé, le score reste dans ses bornes.
 *
 * Le carnet est gardé sur ce téléphone, jamais en base — la raison est dans
 * `carnet-pnj.ts` : un score qui doit rester caché des joueurs n'a rien à faire
 * dans une table qu'ils synchronisent.
 */

const nouvelId = () => `pnj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Lance n d4. */
const d4 = (nombre: number): number => {
  let total = 0;
  for (let i = 0; i < nombre; i += 1) total += 1 + Math.floor(Math.random() * 4);
  return total;
};

/** La couleur du score : elle dit d'un coup d'œil si l'allié tient encore. */
function couleurDeLoyaute(score: number): string {
  if (score <= 0) return 'var(--vital)';
  if (score < 10) return 'var(--gold-bright)';
  return 'var(--ok)';
}

function FichePnj({ pnj, maximum, onChanger, onSupprimer }: {
  pnj: PnjDuCarnet;
  maximum: number;
  onChanger: (suivant: PnjDuCarnet) => void;
  onSupprimer: () => void;
}) {
  const [deplie, setDeplie] = useState(true);
  const style = STYLES_DE_NOM.find((entree) => entree.nom === pnj.style);

  const bouger = (delta: number) =>
    onChanger({ ...pnj, loyaute: deplacerLoyaute(pnj.loyaute, delta, maximum) });

  return (
    <div className="card" style={{ padding: '11px 13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          value={pnj.nom}
          onChange={(event) => onChanger({ ...pnj, nom: event.target.value })}
          placeholder="Son nom…"
          aria-label="Nom du personnage"
          className="ttl"
          style={{
            flexGrow: 1, minWidth: 0, fontSize: 16, color: 'var(--gold-bright)',
            background: 'transparent', border: 'none', borderBottom: '1px solid var(--line)',
            padding: '2px 0',
          }}
        />
        <button
          onClick={() => setDeplie((v) => !v)}
          aria-expanded={deplie}
          aria-label={deplie ? 'Replier' : 'Déplier'}
          style={{ flexShrink: 0, fontSize: 9, color: 'var(--muted)', padding: '4px 6px' }}
        >
          {deplie ? '▲' : '▼'}
        </button>
        <button
          onClick={onSupprimer}
          aria-label={`Retirer ${pnj.nom || 'ce personnage'} du carnet`}
          style={{ flexShrink: 0, fontSize: 14, color: 'var(--muted)', padding: '4px 4px' }}
        >
          ✕
        </button>
      </div>

      {/* La loyauté d'abord : c'est ce qu'on rouvre le carnet pour consulter,
          une fois que le PNJ existe. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 52 }}>
          <div className="ttl num" style={{ fontSize: 24, lineHeight: 1, color: couleurDeLoyaute(pnj.loyaute) }}>
            {pnj.loyaute}
          </div>
          <div className="lbl" style={{ fontSize: 8, marginTop: 2 }}>sur {maximum}</div>
        </div>
        <div style={{ flexGrow: 1, minWidth: 0, fontSize: 11.5, lineHeight: 1.4, color: 'var(--muted)' }}>
          {sensDeLaLoyaute(pnj.loyaute)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
        {MOUVEMENTS_DE_LOYAUTE.map((mouvement) => {
          const nombre = Number(mouvement.des[0]);
          const signe = mouvement.sens === 'hausse' ? 1 : -1;
          return (
            <button
              key={`${mouvement.sens}-${mouvement.des}`}
              onClick={() => bouger(signe * d4(nombre))}
              title={mouvement.quand}
              style={{
                flexGrow: 1, minHeight: 34, borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: '1px solid var(--line)', background: 'rgba(255,255,255,.03)',
                color: mouvement.sens === 'hausse' ? 'var(--ok)' : 'var(--vital)',
              }}
            >
              {mouvement.sens === 'hausse' ? '+' : '−'}{mouvement.des}
            </button>
          );
        })}
      </div>

      {deplie && (
        <div style={{ marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--line)' }}>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>
            <span className="lbl" style={{ fontSize: 8.5, color: 'var(--accent)' }}>Ce qu’on voit </span>
            {pnj.apparence}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.5 }}>
            <span className="lbl" style={{ fontSize: 8.5, color: 'var(--vital)' }}>Ce qu’il cache </span>
            {pnj.secret}
          </p>
          {style && (
            <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.45, color: 'var(--muted)' }}>
              <span className="lbl" style={{ fontSize: 8.5 }}>Nom {style.nom} </span>
              {style.exemple}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function CarnetDePnj({ campaignId, niveau, charismes, onFermer }: {
  /** Le carnet est rangé par campagne : deux tables ne partagent pas leurs PNJ. */
  campaignId: string;
  /** Le niveau du groupe — il plafonne la puissance d'un PNJ compagnon. */
  niveau: number;
  /** Les Charismes des aventuriers, lus sur les fiches. Ils fixent la loyauté. */
  charismes: number[];
  onFermer: () => void;
}) {
  const stockage = useMemo(() => stockageDuNavigateur(), []);
  const [carnet, setCarnet] = useState<PnjDuCarnet[]>(
    () => (stockage ? lireCarnet(stockage, campaignId) : []),
  );

  useEffect(() => {
    if (stockage) ecrireCarnet(stockage, campaignId, carnet);
  }, [stockage, campaignId, carnet]);

  const loyaute = loyauteDuGroupe(charismes);
  // Sans fiche, on ne peut pas calculer les bornes du Guide. Plutôt qu'un
  // maximum de 0 — qui afficherait un PNJ déjà prêt à trahir — le carnet le
  // dit et laisse quand même tirer.
  const maximum = loyaute?.maximum ?? 0;
  const depart = loyaute?.depart ?? 0;

  const tirer = () => setCarnet((liste) => [
    { id: nouvelId(), ...tirerPnj(Math.random, depart) },
    ...liste,
  ]);

  const changer = (suivant: PnjDuCarnet) =>
    setCarnet((liste) => liste.map((entree) => (entree.id === suivant.id ? suivant : entree)));

  const supprimer = (id: string) =>
    setCarnet((liste) => liste.filter((entree) => entree.id !== id));

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
          <h2 className="ttl" style={{ margin: 0, fontSize: 18 }}>Les gens</h2>
          <div className="lbl" style={{ fontSize: 9, marginTop: 2 }}>
            {loyaute
              ? `loyauté : départ ${depart}, maximum ${maximum}`
              : 'aucune fiche : la loyauté ne peut pas se calculer'}
          </div>
        </div>
        <button onClick={onFermer} aria-label="Fermer" className="jg-rond" style={{ fontSize: 18 }}>✕</button>
      </header>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '13px 16px calc(20px + env(safe-area-inset-bottom))',
      }}>
        <button
          onClick={tirer}
          className="jg-btn-hot"
          style={{ width: '100%', minHeight: 44, borderRadius: 10, fontSize: 14, fontWeight: 700 }}
        >
          Tirer quelqu’un
        </button>

        {carnet.length === 0 ? (
          <p style={{ margin: '14px 0 0', fontSize: 12.5, lineHeight: 1.55, color: 'var(--muted)' }}>
            Une apparence et un secret, tirés dans les tables du Guide. Le nom reste à toi —
            les six styles ci-dessous donnent la sonorité, à défaut des listes, qui sont
            illisibles sur notre exemplaire.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {carnet.map((pnj) => (
              <FichePnj
                key={pnj.id}
                pnj={pnj}
                maximum={maximum}
                onChanger={changer}
                onSupprimer={() => supprimer(pnj.id)}
              />
            ))}
          </div>
        )}

        <div className="lbl" style={{ marginTop: 20, fontSize: 9, color: 'var(--gold)' }}>La loyauté, dans le Guide</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 7 }}>
          {MOUVEMENTS_DE_LOYAUTE.map((mouvement) => (
            <div key={`${mouvement.sens}-${mouvement.des}`} style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
              <span
                className="num"
                style={{
                  flexShrink: 0, width: 34, fontSize: 12, fontWeight: 700,
                  color: mouvement.sens === 'hausse' ? 'var(--ok)' : 'var(--vital)',
                }}
              >
                {mouvement.sens === 'hausse' ? '+' : '−'}{mouvement.des}
              </span>
              <span style={{ fontSize: 12, lineHeight: 1.45 }}>{mouvement.quand}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
          {REGLE_LOYAUTE_BORNES}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--gold)' }}>
          {REGLE_LOYAUTE_SECRET}
        </p>

        <div className="lbl" style={{ marginTop: 20, fontSize: 9, color: 'var(--gold)' }}>S’il suit le groupe</div>
        <p style={{ margin: '7px 0 0', fontSize: 12.5, lineHeight: 1.5 }}>
          Prends un profil de facteur de puissance{' '}
          <span className="num" style={{ color: 'var(--gold-bright)', fontWeight: 700 }}>
            {fpMaximalPourAllie(niveau)} au plus
          </span>{' '}
          — la moitié du niveau du groupe. C’est la règle qui empêche l’allié de voler la vedette.
        </p>
        <p style={{ margin: '7px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
          {REGLE_ALLIE_PROGRESSION}
        </p>

        <div className="lbl" style={{ marginTop: 20, fontSize: 9, color: 'var(--gold)' }}>Les six sonorités</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 7 }}>
          {STYLES_DE_NOM.map((style) => (
            <div key={style.nom} style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
              <span className="ttl" style={{ flexShrink: 0, width: 96, fontSize: 12.5 }}>{style.nom}</span>
              <span style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--muted)' }}>{style.exemple}</span>
            </div>
          ))}
        </div>

        <p style={{ margin: '18px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
          Guide du Maître 2024, p. 84 à 89. Ce carnet est gardé sur ce téléphone, et nulle part
          ailleurs : un score de loyauté ne doit pas pouvoir arriver sur l’écran d’un joueur.
          Changer d’appareil le perd.
        </p>
      </div>
    </div>
  );
}
