import { useMemo, useState } from 'react';
import { PHB_CREATURES } from '../content/creatures';
import { xpDuFP } from '../domain/encounter-generator';
import { butinDuGroupe, tresorDeReserve, type ButinTire, type ReserveTiree } from '../domain/tresor';
import type { Combatant } from '../domain/encounter';

/**
 * Ce qu'on fait à la fin d'un combat : compter les PX, distribuer le butin.
 *
 * Les deux se font sinon à la main, après coup, avec le livre ouvert — et se
 * font donc rarement. Or l'appli a déjà tout ce qu'il faut : elle sait quelles
 * créatures étaient là, et depuis peu d'où elles viennent (`templateId`), donc
 * leur facteur de puissance.
 *
 * Le geste reste au MJ. Rien n'est écrit sur les fiches : ni PX, ni pièces.
 * L'écran DIT ce que le livre prescrit, le MJ décide — un combat fui rapporte
 * autant qu'un combat gagné, une rencontre résolue en parlant peut ne rien
 * rapporter du tout, et aucune de ces décisions n'appartient à un calcul.
 */

/** Regroupe les créatures par profil : un jet de butin pour tout le groupe, comme le Guide l'autorise. */
type Groupe = { nom: string; cr: string; nombre: number; xpUnitaire: number };

function grouperParProfil(combatants: readonly Combatant[]): { groupes: Groupe[]; sansProfil: number } {
  const parProfil = new Map<string, Groupe>();
  let sansProfil = 0;
  for (const combatant of combatants) {
    if (combatant.side !== 'creature') continue;
    const template = PHB_CREATURES.find((creature) => creature.id === combatant.templateId);
    if (!template) {
      sansProfil += 1;
      continue;
    }
    const existant = parProfil.get(template.id);
    if (existant) existant.nombre += 1;
    else parProfil.set(template.id, { nom: template.name, cr: template.cr, nombre: 1, xpUnitaire: xpDuFP(template.cr) });
  }
  return { groupes: [...parProfil.values()].sort((a, b) => b.xpUnitaire - a.xpUnitaire), sansProfil };
}

const monnaieLisible = (montant: number, monnaie: 'po' | 'pp') =>
  `${montant.toLocaleString('fr-FR')} ${monnaie}`;

export function FinDeCombat({ combatants, joueurs, niveauGroupe, onTerminer, onFermer }: {
  combatants: readonly Combatant[];
  /** Nombre de personnages qui se partagent les PX. */
  joueurs: number;
  /** Niveau moyen du groupe — sert de FP pour une récompense de quête (Guide p. 121). */
  niveauGroupe: number;
  /** Clôt vraiment la rencontre. */
  onTerminer: () => void;
  onFermer: () => void;
}) {
  const { groupes, sansProfil } = useMemo(() => grouperParProfil(combatants), [combatants]);
  const xpTotal = groupes.reduce((total, groupe) => total + groupe.xpUnitaire * groupe.nombre, 0);
  const parJoueur = joueurs > 0 ? Math.floor(xpTotal / joueurs) : 0;

  const [butins, setButins] = useState<Record<string, ButinTire | null>>({});
  const [reserve, setReserve] = useState<ReserveTiree | null>(null);

  const lancerButin = (groupe: Groupe) => {
    setButins((actuel) => ({ ...actuel, [groupe.nom]: butinDuGroupe(groupe.cr, groupe.nombre) }));
  };

  const totalButin = Object.values(butins).reduce(
    (totaux, butin) => {
      if (!butin) return totaux;
      return { ...totaux, [butin.monnaie]: (totaux[butin.monnaie] ?? 0) + butin.montant };
    },
    {} as Record<string, number>,
  );

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
        <h2 className="ttl" style={{ margin: 0, fontSize: 18, flexGrow: 1 }}>Fin du combat</h2>
        <button onClick={onFermer} aria-label="Revenir au combat" className="jg-rond" style={{ fontSize: 18 }}>✕</button>
      </header>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '14px 16px calc(20px + env(safe-area-inset-bottom))',
      }}>
        {/* ───── Les points d'expérience ───── */}
        <div className="card" style={{ padding: '12px 14px' }}>
          <div className="lbl" style={{ fontSize: 9 }}>Expérience</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <div className="ttl" style={{ fontSize: 26, color: 'var(--gold-bright)' }}>
              {parJoueur.toLocaleString('fr-FR')}
            </div>
            <div className="lbl" style={{ fontSize: 9 }}>
              par personnage · {joueurs} joueur{joueurs > 1 ? 's' : ''}
            </div>
          </div>
          <div className="lbl" style={{ textTransform: 'none', marginTop: 4, fontSize: 11 }}>
            {xpTotal.toLocaleString('fr-FR')} PX au total, à partager.
          </div>
          {sansProfil > 0 && (
            <div style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--muted)', marginTop: 8 }}>
              {sansProfil} créature{sansProfil > 1 ? 's' : ''} saisie{sansProfil > 1 ? 's' : ''} à la main :
              sans profil du bestiaire, son facteur de puissance est inconnu et elle ne compte pas.
            </div>
          )}
        </div>

        {/* ───── Le butin, profil par profil ───── */}
        <div className="lbl" style={{ marginTop: 18, fontSize: 9 }}>Butin sur les corps</div>
        <div style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--muted)', margin: '4px 0 8px' }}>
          Un seul jet par profil, multiplié par le nombre de créatures — c’est ce que le Guide autorise,
          plutôt que dix jets pour dix gobelins.
        </div>

        {groupes.length === 0 ? (
          <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)' }}>
            Aucune créature du bestiaire dans ce combat.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {groupes.map((groupe) => {
              const butin = butins[groupe.nom];
              const lance = groupe.nom in butins;
              return (
                <div key={groupe.nom} className="card" style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div className="ttl" style={{ fontSize: 15 }}>
                        {groupe.nombre > 1 ? `${groupe.nombre} × ` : ''}{groupe.nom}
                      </div>
                      <div className="lbl" style={{ textTransform: 'none', marginTop: 2, fontSize: 10 }}>
                        FP {groupe.cr} · {(groupe.xpUnitaire * groupe.nombre).toLocaleString('fr-FR')} PX
                      </div>
                    </div>
                    <button
                      onClick={() => lancerButin(groupe)}
                      className="jg-btn-cold"
                      style={{ flexShrink: 0, minHeight: 36, padding: '0 12px', borderRadius: 9, fontSize: 12, fontWeight: 700 }}
                    >
                      {lance ? 'Relancer' : 'Butin'}
                    </button>
                  </div>
                  {lance && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--line)' }}>
                      {butin ? (
                        <>
                          <div className="ttl" style={{ fontSize: 17, color: 'var(--gold-bright)' }}>
                            {monnaieLisible(butin.montant, butin.monnaie)}
                          </div>
                          <div className="lbl" style={{ textTransform: 'none', marginTop: 2, fontSize: 10 }}>
                            {butin.formule}
                            {butin.jet.des.length > 0 && ` · ${butin.jet.des.join(' + ')} = ${butin.jet.total}`}
                            {groupe.nombre > 1 && ` × ${groupe.nombre}`}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.45 }}>
                          Le Guide ne donne pas de ligne lisible au-delà du FP 16 dans notre exemplaire :
                          rien n’est tiré plutôt qu’un montant inventé.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {Object.keys(totalButin).length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 10, justifyContent: 'flex-end' }}>
            <span className="lbl" style={{ fontSize: 9 }}>Total</span>
            {Object.entries(totalButin).map(([monnaie, montant]) => (
              <span key={monnaie} className="ttl" style={{ fontSize: 15, color: 'var(--gold-bright)' }}>
                {monnaieLisible(montant, monnaie as 'po' | 'pp')}
              </span>
            ))}
          </div>
        )}

        {/* ───── Le magot du repaire ───── */}
        <div className="lbl" style={{ marginTop: 20, fontSize: 9 }}>Magot du repaire</div>
        <div style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--muted)', margin: '4px 0 8px' }}>
          Pour un coffre, une réserve, ou la récompense d’une quête — le Guide recommande
          d’y passer environ une fois par séance, pas à chaque combat.
        </div>
        <button
          onClick={() => setReserve(tresorDeReserve(String(niveauGroupe)))}
          className="jg-btn-cold"
          style={{ width: '100%', minHeight: 'var(--tap)', borderRadius: 10, fontSize: 13, fontWeight: 700 }}
        >
          {reserve ? 'Relancer le magot' : `Tirer un magot (niveau ${niveauGroupe})`}
        </button>
        {reserve && (
          <div className="card" style={{ marginTop: 8, padding: '11px 13px' }}>
            <div className="ttl" style={{ fontSize: 20, color: 'var(--gold-bright)' }}>
              {monnaieLisible(reserve.montant, reserve.monnaie)}
            </div>
            <div className="lbl" style={{ textTransform: 'none', marginTop: 2, fontSize: 10 }}>
              {reserve.formule}
              {reserve.jet.des.length > 0 && ` · ${reserve.jet.des.join(' + ')} = ${reserve.jet.total}`}
            </div>
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--line)' }}>
              <div className="ttl" style={{ fontSize: 15 }}>
                {reserve.objets} objet{reserve.objets > 1 ? 's' : ''} magique{reserve.objets > 1 ? 's' : ''}
              </div>
              <div className="lbl" style={{ textTransform: 'none', marginTop: 2, fontSize: 10 }}>
                {reserve.formuleObjets}
                {reserve.jetObjets.des.length > 0 && ` · ${reserve.jetObjets.des.join(' + ')}`}
                {reserve.objets === 0 && ' — rien cette fois'}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer style={{
        flexShrink: 0, padding: '11px 16px',
        paddingBottom: 'calc(11px + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--line)', display: 'flex', gap: 9,
      }}>
        <button
          onClick={onFermer}
          className="jg-btn-cold"
          style={{ flexShrink: 0, minHeight: 'var(--tap)', padding: '0 16px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}
        >
          Revenir
        </button>
        <button
          onClick={onTerminer}
          className="jg-btn-hot"
          style={{ flexGrow: 1, minHeight: 'var(--tap)', borderRadius: 10, fontSize: 14, fontWeight: 700 }}
        >
          Terminer le combat
        </button>
      </footer>
    </div>
  );
}
