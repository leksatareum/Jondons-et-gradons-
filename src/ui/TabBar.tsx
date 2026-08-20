/**
 * La barre d'onglets de la fiche.
 *
 * Fixe, en pied d'écran, pleine largeur — comme Instagram ou Amazon, plutôt
 * que la pilule flottante d'avant. Celle-ci recouvrait le contenu qui défile
 * en dessous (un « Niveau + » du MJ par-dessus une carte de sort, illisible
 * l'un comme l'autre) : une barre docké ne recouvre jamais rien, elle
 * réserve sa place une fois pour toutes.
 */

export type MainTab = 'combat' | 'fiche' | 'grimoire' | 'inventaire' | 'repos' | 'parametres';

const TABS: [MainTab, string][] = [
  ['combat', 'Combat'],
  ['fiche', 'Fiche'],
  ['grimoire', 'Grimoire'],
  ['inventaire', 'Sac'],
  ['repos', 'Repos'],
  ['parametres', 'Réglages'],
];

/** Hauteur réservée par la barre, à ajouter en `padding-bottom` de chaque écran. */
export const TAB_BAR_CLEARANCE = 'calc(58px + env(safe-area-inset-bottom))';

export function TabBar({ actif, onChanger }: { actif: MainTab; onChanger: (onglet: MainTab) => void }) {
  return (
    <nav
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20,
        display: 'flex',
        background: 'var(--surface-raised)', borderTop: '1px solid var(--line)',
        boxShadow: 'var(--raise)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(([clef, libelle]) => (
        <button
          key={clef}
          onClick={() => onChanger(clef)}
          aria-current={actif === clef ? 'page' : undefined}
          style={{
            flex: 1, minHeight: 58, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            color: actif === clef ? 'var(--accent)' : 'var(--muted)',
          }}
        >
          <span
            className="lbl"
            style={{ fontSize: 9.5, fontWeight: actif === clef ? 700 : 600, letterSpacing: 0.2 }}
          >
            {libelle}
          </span>
        </button>
      ))}
    </nav>
  );
}
