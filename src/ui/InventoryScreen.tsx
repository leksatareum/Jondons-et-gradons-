import { useState } from 'react';
import type { CharacterSheet, InventoryItem } from '../model/character';
import { TAB_BAR_CLEARANCE } from './TabBar';
import { resolveHealingItem } from '../domain/consumable-ownership';
import type { JetDeDes } from '../domain/dice';

/**
 * Le sac.
 *
 * Ce que le joueur possède est une décision, pas un calcul : cet écran ne
 * dérive ni poids ni prix, il ne fait qu'écrire une liste et un nombre de
 * pièces d'or, tels que le joueur les tient à jour lui-même.
 *
 * Donner un objet à quelqu'un d'autre passe par un relais (voir
 * `sync/mutations.ts`, `createItemTransfer`) : la RLS interdit d'écrire la
 * fiche d'un autre joueur, donc cet écran ne fait que retirer l'objet d'ICI
 * et déposer ce qu'il envoie — jamais l'inverse d'ajouter directement chez
 * quelqu'un d'autre.
 */

/** Quelqu'un à qui l'on peut donner un objet — un autre personnage de la table, jamais le MJ, qui n'a pas de sac. */
export interface DestinataireDon {
  id: string;
  nom: string;
}

const champ: React.CSSProperties = {
  minHeight: 'var(--tap)', padding: '0 12px', borderRadius: 'var(--radius-sm)',
  // 16px ou plus : en dessous, iOS zoome sur le champ à la mise au point,
  // et l'écran reste zoomé après — il faut alors pincer pour dézoomer.
  border: '1px solid var(--gold-dim)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 16,
};

const carte: React.CSSProperties = {
  padding: '10px 12px', borderRadius: 'var(--radius)',
  display: 'flex', alignItems: 'center', gap: 10,
};

function Pas({ onClick, disabled, children, label }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        border: '1px solid var(--gold-dim)', color: 'var(--gold)', fontSize: 16, fontWeight: 700,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function LigneObjet({ item, onQty, onRetirer, destinataires, onDonner, onBoire }: {
  item: InventoryItem;
  onQty: (qty: number) => void;
  onRetirer: () => void;
  /** Vide : personne à qui donner pour l'instant — le lien « Donner » ne s'affiche pas. */
  destinataires: DestinataireDon[];
  onDonner?: (recipientId: string, qty: number) => void;
  /** Objet reconnu comme un soin (Potion de soins…) — absent sinon, le lien « Boire » ne s'affiche pas. */
  onBoire?: () => void;
}) {
  const [donOuvert, setDonOuvert] = useState(false);
  const [destinataire, setDestinataire] = useState(destinataires[0]?.id ?? '');
  const [quantite, setQuantite] = useState(1);

  const ouvrirDon = () => {
    setDestinataire(destinataires[0]?.id ?? '');
    setQuantite(1);
    setDonOuvert(true);
  };

  const envoyer = () => {
    if (!destinataire) return;
    onDonner?.(destinataire, quantite);
    setDonOuvert(false);
  };

  return (
    <div className="jg-tile" style={{ borderRadius: 'var(--radius)' }}>
      <div style={carte}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</div>
          {item.note && <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>{item.note}</div>}
          <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
            {onBoire && (
              <button onClick={onBoire} className="lbl" style={{ color: 'var(--ok)' }}>
                Boire
              </button>
            )}
            {destinataires.length > 0 && (
              <button
                onClick={() => (donOuvert ? setDonOuvert(false) : ouvrirDon())}
                className="lbl"
                style={{ color: 'var(--accent)' }}
              >
                {donOuvert ? 'Annuler' : 'Donner'}
              </button>
            )}
          </div>
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

      {donOuvert && (
        <div style={{
          padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <select
            value={destinataire}
            onChange={(event) => setDestinataire(event.target.value)}
            style={{ ...champ, fontSize: 15 }}
          >
            {destinataires.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Pas
              onClick={() => setQuantite((q) => Math.max(1, q - 1))}
              disabled={quantite <= 1}
              label="Diminuer la quantité à donner"
            >
              −
            </Pas>
            <div className="num" style={{ width: 28, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>
              {quantite}
            </div>
            <Pas
              onClick={() => setQuantite((q) => Math.min(item.qty, q + 1))}
              disabled={quantite >= item.qty}
              label="Augmenter la quantité à donner"
            >
              +
            </Pas>
            <button
              onClick={envoyer}
              className="jg-btn-hot"
              style={{ flexGrow: 1, minHeight: 'var(--tap)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: 14 }}
            >
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function InventoryScreen({ sheet, destinataires, onAjouter, onQty, onRetirer, onOr, onDonner, onBoire }: {
  sheet: CharacterSheet;
  /** Les autres personnages de la table à qui l'on peut donner un objet — jamais le MJ. */
  destinataires: DestinataireDon[];
  onAjouter: (item: { name: string; qty: number }) => void;
  onQty: (itemId: string, qty: number) => void;
  onRetirer: (itemId: string) => void;
  onOr: (gold: number) => void;
  onDonner?: (itemId: string, recipientId: string, qty: number) => void;
  /**
   * Tire les dés et applique le soin d'un coup (`model/inventory.ts`,
   * `useHealingItem`) — synchrone, pour que cet écran affiche le jet dès
   * l'appui, sans attendre l'aller-retour réseau. `null` si l'objet visé
   * n'est plus un soin reconnu (déjà consommé par ailleurs, par exemple).
   */
  onBoire?: (itemId: string) => JetDeDes | null;
}) {
  const [nom, setNom] = useState('');
  const [orEnEdition, setOrEnEdition] = useState<string | null>(null);
  // L'objet qui a bu peut disparaître du sac au même geste (dernière potion)
  // — ce résultat vit donc ici, pas dans la ligne qui l'a déclenché, sinon
  // il disparaîtrait avec elle avant que le joueur ait pu le lire.
  const [dernierSoin, setDernierSoin] = useState<{ nom: string; jet: JetDeDes } | null>(null);

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

      {dernierSoin && (
        <div
          className="jg-tile"
          style={{
            ...carte, justifyContent: 'space-between',
            border: '1px solid var(--ok)', background: 'var(--surface)',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ok)' }}>
              {dernierSoin.nom} — {dernierSoin.jet.total} PV
            </div>
            <div className="lbl" style={{ textTransform: 'none', marginTop: 2, color: 'var(--muted)' }}>
              {dernierSoin.jet.des.join(' + ')}
              {dernierSoin.jet.bonus ? ` ${dernierSoin.jet.bonus > 0 ? '+' : '−'} ${Math.abs(dernierSoin.jet.bonus)}` : ''}
            </div>
          </div>
          <button
            onClick={() => setDernierSoin(null)}
            aria-label="Fermer"
            style={{ flexShrink: 0, width: 32, height: 32, color: 'var(--muted)', fontSize: 16 }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="jg-tile" style={{ ...carte, justifyContent: 'space-between' }}>
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
          className={nom.trim() ? 'jg-btn-hot' : undefined}
          style={{
            minHeight: 'var(--tap)', padding: '0 16px', borderRadius: 'var(--radius-sm)',
            background: nom.trim() ? undefined : 'var(--surface)',
            color: nom.trim() ? undefined : 'var(--muted)',
            border: nom.trim() ? 'none' : '1px solid var(--gold-dim)', fontWeight: 700, fontSize: 14,
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
            destinataires={destinataires}
            onQty={(qty) => onQty(item.id, qty)}
            onRetirer={() => onRetirer(item.id)}
            onDonner={onDonner ? (recipientId, qty) => onDonner(item.id, recipientId, qty) : undefined}
            onBoire={onBoire && resolveHealingItem(item) ? () => {
              const jet = onBoire(item.id);
              if (jet) setDernierSoin({ nom: item.name, jet });
            } : undefined}
          />
        ))
      )}
    </main>
  );
}
