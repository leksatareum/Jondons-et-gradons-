/**
 * La barre d'onglets de la fiche.
 *
 * Fixe, en pied d'écran, pleine largeur — comme Instagram ou Amazon. Cinq
 * onglets, pas sept : une barre n'accueille que des LIEUX où l'on vit. Le
 * repos est une action qu'on fait à son personnage, les réglages un
 * utilitaire qu'on ouvre une fois par mois — les deux vivent désormais dans
 * la Fiche, comme les réglages d'Instagram vivent dans le profil. À sept,
 * les libellés tombaient à 8,5px : illisibles, et il restait des écrans à
 * ajouter.
 *
 * Icône + libellé : l'icône se reconnaît du coin de l'œil en pleine partie,
 * le libellé lève le doute des premières séances.
 */

export type MainTab =
  | 'combat' | 'fiche' | 'grimoire' | 'inventaire' | 'journal' | 'repos' | 'parametres' | 'regles';

/** Trait continu, hérite de la couleur du texte : actif = accent, sinon éteint. */
const icone = (d: string, extra?: React.ReactNode) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
    {extra}
  </svg>
);

const ICONES: Record<string, React.ReactNode> = {
  // Une épée droite : pointe en haut, garde, poignée, pommeau. En diagonale
  // avec la garde en travers, la silhouette se lisait comme un « X » à 21px.
  combat: icone('M12 3 V15 M8.4 15 H15.6 M12 15 V18.6', <circle cx="12" cy="20" r="1.4" />),
  // Une silhouette : la fiche, c'est le personnage.
  fiche: icone('M5.5 19.5 c0-3.5 2.9-5.7 6.5-5.7 s6.5 2.2 6.5 5.7', <circle cx="12" cy="8.2" r="3.4" />),
  // Un livre ouvert.
  grimoire: icone('M12 6.4 C10 4.8 7 4.5 4.5 5.3 V17.8 C7 17 10 17.3 12 18.8 C14 17.3 17 17 19.5 17.8 V5.3 C17 4.5 14 4.8 12 6.4 Z M12 6.4 V18.8'),
  // Une sacoche à anse.
  inventaire: icone('M7 9.5 h10 l1.3 8 a2.2 2.2 0 0 1 -2.2 2.5 h-8.2 a2.2 2.2 0 0 1 -2.2 -2.5 Z M9 9.5 a3 3 0 0 1 6 0'),
  // Une plume.
  journal: icone('M19.3 4.7 c-4.3-.8-8.8 1.6-10.7 6 L6.3 17.7 l7-2.3 c4.3-1.9 6.7-6.4 6-10.7 Z M6.3 17.7 C9.2 12.3 12.6 8.9 16 6.8'),
};

const TABS: [MainTab, string][] = [
  ['combat', 'Combat'],
  ['fiche', 'Fiche'],
  ['grimoire', 'Grimoire'],
  ['inventaire', 'Sac'],
  ['journal', 'Journal'],
];

/** Hauteur réservée par la barre, à ajouter en `padding-bottom` de chaque écran. */
export const TAB_BAR_CLEARANCE = 'calc(60px + env(safe-area-inset-bottom))';

export function TabBar({ actif, onChanger }: { actif: MainTab; onChanger: (onglet: MainTab) => void }) {
  // Repos et Réglages s'ouvrent depuis la Fiche : quand on y est, c'est
  // l'onglet Fiche qui reste allumé — on n'a pas quitté son personnage.
  const surligne: MainTab = TABS.some(([clef]) => clef === actif) ? actif : 'fiche';
  return (
    <nav
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20,
        display: 'flex',
        background: 'linear-gradient(180deg, var(--surface-raised), var(--bg))',
        borderTop: '1.5px solid var(--gold-dim, var(--line))',
        boxShadow: 'var(--raise)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        // Bug WebKit connu : un élément `position: fixed` posé à côté d'un
        // conteneur en défilement inertiel (`-webkit-overflow-scrolling:
        // touch`, sur tous les écrans de la fiche) peut se faire « emporter »
        // par le défilement pendant une glissade rapide — il réapparaît alors
        // au milieu du contenu, décalé de sa vraie position tant que
        // l'affichage n'a pas rattrapé le retard. Le geste tombe alors à côté
        // : on croit taper la barre, on tape le contenu resté dessous. Le
        // forcer sur son propre calque GPU (`translateZ(0)`) évite que
        // Safari ne le laisse en retard du défilement.
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      {TABS.map(([clef, libelle]) => (
        <button
          key={clef}
          onClick={() => onChanger(clef)}
          aria-current={surligne === clef ? 'page' : undefined}
          style={{
            position: 'relative', flex: 1, minHeight: 58, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            color: surligne === clef ? 'var(--accent)' : 'var(--muted)',
          }}
        >
          {surligne === clef && (
            <span aria-hidden style={{
              position: 'absolute', top: 4, width: 4, height: 4, borderRadius: '50%',
              background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)',
            }} />
          )}
          {ICONES[clef]}
          <span
            className="lbl"
            style={{ fontSize: 9.5, fontWeight: surligne === clef ? 700 : 600, whiteSpace: 'nowrap' }}
          >
            {libelle}
          </span>
        </button>
      ))}
    </nav>
  );
}
