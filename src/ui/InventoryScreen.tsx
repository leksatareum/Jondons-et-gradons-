import { useState } from 'react';
import type { CharacterSheet, InventoryItem } from '../model/character';
import { TAB_BAR_CLEARANCE } from './TabBar';

/**
 * Le sac.
 *
 * Ce que le joueur possède est une décision, pas un calcul : cet écran ne
 * dérive ni poids ni prix, il ne fait qu'écrire une liste et un nombre de
 * pièces d'or, tels que le joueur les tient à jour lui-même.
 */

const champ: React.CSSProperties = {
  minHeight: 'var(--tap)', padding: '0 12px', borderRadius: 'var(--radius-sm)',
  // 16px ou plus : en dessous, iOS zoome sur le champ à la mise au point,
  // et l'écran reste zoomé après — il faut alors pincer pour dézoomer.
  border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 16,
};

const carte: React.CSSProperties = {
  padding: '10px 12px', borderRadius: 'var(--radius)',
  border: '1px solid var(--line)', background: 'var(--surface)',
  display: 'flex', alignItems: 'center', gap: 10,
};

function Pas({ onClick, children, label }: { onClick: () => void; children: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        border: '1px solid var(--line)', color: 'var(--ink)', fontSize: 16, fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

function LigneObjet({ item, onQty, onRetirer }: {
  item: InventoryItem;
  onQty: (qty: number) => void;
  onRetirer: () => void;
}) {
  return (
    <div style={carte}>
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</div>
        {item.note && <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>{item.note}</div>}
      </div>
      <Pas onClick={() => onQty(item.qty - 1)} label={`Retirer un ${item.name}`}>−</Pas>
      <div className="num" style={{ width: 28, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>
        {item.qty}
      </div>
      <Pas onClick={() => onQty(item.qty + 1)} label={`Ajouter un ${item.name}`}>+</Pas>
      <button
        onClick={onRetirer}
        aria-label={`Supprimer ${item.name} du sac`}
        style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, color: 'var(--muted)', fontSize: 16 }}
      >
        ✕
      </button>
    </div>
  );
}

export function InventoryScreen({ sheet, onAjouter, onQty, onRetirer, onOr }: {
  sheet: CharacterSheet;
  onAjouter: (item: { name: string; qty: number }) => void;
  onQty: (itemId: string, qty: number) => void;
  onRetirer: (itemId: string) => void;
  onOr: (gold: number) => void;
}) {
  const [nom, setNom] = useState('');
  const [orEnEdition, setOrEnEdition] = useState<string | null>(null);

  const ajouter = () => {
    if (!nom.trim()) return;
    onAjouter({ name: nom.trim(), qty: 1 });
    setNom('');
  };

  return (
    <main style={{
      flexGrow: 1, padding: `12px 14px calc(${TAB_BAR_CLEARANCE} + 8px)`,
      display: 'flex', flexDirection: 'column', gap: 10,
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      <h2 className="ttl" style={{ fontSize: 17 }}>Sac</h2>

      <div style={{ ...carte, justifyContent: 'space-between' }}>
        <div className="lbl">Bourse</div>
        {orEnEdition === null ? (
          <button
            onClick={() => setOrEnEdition(String(sheet.gold))}
            className="num"
            style={{ fontSize: 17, fontWeight: 700 }}
          >
            {sheet.gold} po
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number" inputMode="numeric" autoFocus
              value={orEnEdition}
              onChange={(event) => setOrEnEdition(event.target.value)}
              onBlur={() => { onOr(Number(orEnEdition) || 0); setOrEnEdition(null); }}
              style={{ ...champ, width: 90, textAlign: 'right' }}
            />
            <span className="lbl">po</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') ajouter(); }}
          placeholder="Ajouter un objet…"
          autoComplete="off"
          style={{ ...champ, flexGrow: 1 }}
        />
        <button
          onClick={ajouter}
          disabled={!nom.trim()}
          style={{
            minHeight: 'var(--tap)', padding: '0 16px', borderRadius: 'var(--radius-sm)',
            background: nom.trim() ? 'var(--accent)' : 'var(--surface)',
            color: nom.trim() ? 'var(--accent-ink)' : 'var(--muted)',
            border: nom.trim() ? 'none' : '1px solid var(--line)', fontWeight: 700, fontSize: 14,
          }}
        >
          Ajouter
        </button>
      </div>

      {sheet.inventory.length === 0 ? (
        <p className="lbl" style={{ textTransform: 'none', color: 'var(--muted)' }}>Le sac est vide.</p>
      ) : (
        sheet.inventory.map((item) => (
          <LigneObjet
            key={item.id}
            item={item}
            onQty={(qty) => onQty(item.id, qty)}
            onRetirer={() => onRetirer(item.id)}
          />
        ))
      )}
    </main>
  );
}
