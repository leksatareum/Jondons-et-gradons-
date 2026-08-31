/**
 * Le petit badge de type de dégâts sur une carte de sort.
 *
 * Treize types, treize couleurs et treize silhouettes — jamais la seule
 * couleur : deux joueurs daltoniens à la même table ne doivent pas perdre
 * l'information. Chaque badge porte aussi un `title` (l'infobulle) et un
 * `aria-label`, pour que « quel type ? » ait toujours une réponse en texte,
 * pas seulement en dessin.
 *
 * Les silhouettes restent volontairement simples — flocon, éclair, flamme —
 * dans le même esprit que les icônes de `TabBar.tsx` : reconnaissables du
 * coin de l'œil à 16px, pas des illustrations.
 */

interface DamageTypeSpec {
  /** Fond du badge. */
  fond: string;
  /** Trait/remplissage de la silhouette — toujours un contraste net sur `fond`. */
  trait: string;
  /** Le dessin lui-même, dans un viewBox 0 0 16 16. */
  dessin: React.ReactNode;
}

const SPECS: Record<string, DamageTypeSpec> = {
  feu: {
    fond: '#f97316', trait: '#fff7ed',
    dessin: <path d="M8 2.2c.6 1.6-.4 2.3-1 3.2-.8 1.1-1.1 2-.6 3 .3-.9 1-1.2 1.5-1.7-.2 1 .1 1.6.8 2 .5-.5.5-1 .3-1.6.9.6 1.4 1.5 1.2 2.6-.3 1.6-1.8 2.5-3.4 2.2C4.9 11.5 3.9 10 4.2 8.3c.3-1.7 1.6-2.5 2.3-3.6.5-.8.8-1.6 1.5-2.5Z" fill="currentColor" />,
  },
  froid: {
    fond: '#7dd3fc', trait: '#082f49',
    dessin: (
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <path d="M8 2.5v11M3.4 4.75l9.2 6.5M12.6 4.75l-9.2 6.5" />
        <path d="M8 2.5 6.7 3.9M8 2.5l1.3 1.4M8 13.5 6.7 12.1M8 13.5l1.3-1.4" />
        <path d="M3.4 4.75 5 4.5m-1.6.25.3 1.6M12.6 4.75 11 4.5m1.6.25-.3 1.6" />
        <path d="M3.4 11.25 5 11.5m-1.6-.25.3-1.6M12.6 11.25 11 11.5m1.6-.25-.3-1.6" />
      </g>
    ),
  },
  foudre: {
    fond: '#60a5fa', trait: '#0c1c3d',
    dessin: <path d="M8.6 1.8 3.6 9h3l-1.2 5.2L11.6 7H8.4l1.2-5.2Z" fill="currentColor" />,
  },
  tonnerre: {
    fond: '#a1a1aa', trait: '#18181b',
    dessin: (
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
        <path d="M8 3.2v1.6M8 11.2v1.6M12.8 8h-1.6M4.8 8H3.2M11.4 4.6l-1.1 1.1M5.7 10.3l-1.1 1.1M11.4 11.4l-1.1-1.1M5.7 5.7 4.6 4.6" />
      </g>
    ),
  },
  acide: {
    fond: '#a3e635', trait: '#1a2e05',
    dessin: <path d="M8 2c1.8 2.6 4 5.4 4 7.6a4 4 0 1 1-8 0C4 7.4 6.2 4.6 8 2Z" fill="currentColor" />,
  },
  poison: {
    fond: '#c026d3', trait: '#fdf4ff',
    dessin: (
      <g fill="currentColor">
        <circle cx="8" cy="7.5" r="4" />
        <circle cx="6.3" cy="6.9" r="0.85" fill="#c026d3" />
        <circle cx="9.7" cy="6.9" r="0.85" fill="#c026d3" />
        <path d="M6.1 10.2c.5.4 1.2.6 1.9.6s1.4-.2 1.9-.6" stroke="#c026d3" strokeWidth=".8" fill="none" strokeLinecap="round" />
        <path d="M8 11.3v2.4M6.4 12.7l-1.1 1M9.6 12.7l1.1 1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </g>
    ),
  },
  nécrotiques: {
    fond: '#4c1d5b', trait: '#e9d5ff',
    dessin: (
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" fill="none">
        <path d="M8 2.6c-2.6 1.6-3.8 3.8-3.2 6.6.3 1.5 1.4 2.7 1.4 4.2" />
        <path d="M8 2.6c2.6 1.6 3.8 3.8 3.2 6.6-.3 1.5-1.4 2.7-1.4 4.2" />
        <path d="M6.2 13.4h3.6" />
      </g>
    ),
  },
  radiants: {
    fond: '#fbbf24', trait: '#451a03',
    dessin: (
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <circle cx="8" cy="8" r="2.3" fill="currentColor" stroke="none" />
        <path d="M8 2.4v1.7M8 11.9v1.7M13.6 8h-1.7M4.1 8H2.4M11.8 4.2l-1.2 1.2M5.4 10.4l-1.2 1.2M11.8 11.8l-1.2-1.2M5.4 5.6 4.2 4.4" />
      </g>
    ),
  },
  psychiques: {
    fond: '#f472b6', trait: '#500724',
    dessin: <path d="M8 2.4a5.2 5.2 0 0 1 1.4 10.2c-.9.25-1.6-.35-1.4-1.1a2.9 2.9 0 1 0-1.6-3.9c-.4.8-1.5.7-1.7-.15A5.2 5.2 0 0 1 8 2.4Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />,
  },
  force: {
    fond: '#a78bfa', trait: '#2e1065',
    dessin: <path d="M8 1.8 9.3 6.3 13.8 8 9.3 9.7 8 14.2 6.7 9.7 2.2 8 6.7 6.3Z" fill="currentColor" />,
  },
  contondants: {
    fond: '#a8a29e', trait: '#1c1917',
    dessin: (
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <rect x="5.6" y="2.6" width="4.8" height="4.2" rx="1.1" fill="currentColor" stroke="none" />
        <path d="M8 6.8v6.4" />
      </g>
    ),
  },
  perforants: {
    fond: '#94a3b8', trait: '#0f172a',
    dessin: <path d="M8 1.8 10 7.4H8.9v6.8H7.1V7.4H6Z" fill="currentColor" />,
  },
  tranchants: {
    fond: '#71717a', trait: '#f4f4f5',
    dessin: <path d="m3.4 12.4 8-9 1.2 1.2-8 9Zm7-8 1.6.4.4 1.6-2.6-.4Z" fill="currentColor" />,
  },
};

/** Nom lisible, tel qu'affiché dans l'infobulle — mêmes mots que `DAMAGE_TYPES`. */
export const damageTypeLabel = (type: string): string => type;

export function DamageTypeIcon({ type, size = 16 }: { type: string; size?: number }) {
  const spec = SPECS[type.toLocaleLowerCase('fr')];
  if (!spec) return null;
  return (
    <span
      title={`Dégâts ${type}`}
      aria-label={`Dégâts ${type}`}
      role="img"
      style={{
        display: 'inline-flex', flexShrink: 0, width: size, height: size, borderRadius: '50%',
        background: spec.fond, color: spec.trait, alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 1px rgba(0,0,0,.35)',
      }}
    >
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 16 16" aria-hidden>
        {spec.dessin}
      </svg>
    </span>
  );
}

/** Une ligne de badges — l'ordre du texte, jamais réordonné. */
export function DamageTypeIcons({ types, size }: { types: string[] | undefined; size?: number }) {
  if (!types?.length) return null;
  return (
    <span style={{ display: 'inline-flex', gap: 3, flexShrink: 0 }}>
      {types.map((type) => <DamageTypeIcon key={type} type={type} size={size} />)}
    </span>
  );
}
