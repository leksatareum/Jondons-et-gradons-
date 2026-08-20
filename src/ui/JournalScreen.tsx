import { useState } from 'react';
import type { JournalEntry, Note } from '../sync/campaign-sync';

/**
 * Journal et notes.
 *
 * Deux registres qui ne se mélangent jamais. Le journal est écrit par le MJ
 * et lu par toute la table — la RLS le fait respecter, cet écran ne fait que
 * proposer ce qu'elle autorise. Les notes sont personnelles : même le MJ ne
 * les voit pas. Ce que `notes` contient ici est donc déjà, par construction,
 * exactement les notes de qui regarde l'écran — la RLS ne renvoie jamais
 * celles d'un autre, il n'y a rien à filtrer côté client.
 *
 * Les notes n'apparaissent que hors du regard du MJ (`!estMj`) : quand le MJ
 * consulte la fiche d'un joueur, ce ne sont ni ses notes à lui, ni les leurs
 * à montrer — ce sont celles, à personne, que cet écran ne détient jamais.
 */

const champ: React.CSSProperties = {
  width: '100%', minHeight: 'var(--tap)', marginTop: 8,
  padding: '0 12px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--line)', background: 'var(--surface)',
  color: 'var(--ink)', fontSize: 15,
};

const zone: React.CSSProperties = {
  ...champ, minHeight: 88, padding: '10px 12px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
};

const carte: React.CSSProperties = {
  padding: '11px 13px', borderRadius: 'var(--radius)',
  border: '1px solid var(--line)', background: 'var(--surface)',
};

const dateCourte = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
};

/** Plus récent d'abord — c'est un journal, pas une liste à parcourir depuis le début. */
const parDateDecroissante = <T extends { createdAt: string }>(lignes: T[]): T[] =>
  [...lignes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

function EntreeJournal({ entree, onSupprimer }: { entree: JournalEntry; onSupprimer?: () => void }) {
  return (
    <div className="card" style={carte}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        {entree.title && <div className="ttl" style={{ fontSize: 15, flexGrow: 1 }}>{entree.title}</div>}
        <div className="lbl" style={entree.title ? undefined : { flexGrow: 1, textAlign: 'right' }}>
          {dateCourte(entree.createdAt)}
        </div>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{entree.body}</p>
      {onSupprimer && (
        <button onClick={onSupprimer} className="lbl" style={{ marginTop: 8, color: 'var(--muted)' }}>
          Supprimer
        </button>
      )}
    </div>
  );
}

export function JournalScreen({
  entries, notes, estMj, notesOwnerName,
  onAjouterEntree, onSupprimerEntree,
  onAjouterNote, onModifierNote, onSupprimerNote,
}: {
  entries: JournalEntry[];
  /**
   * Côté joueur : les siennes. Côté MJ : celles du personnage dont la fiche
   * est ouverte — la RLS l'autorise à les lire, jamais à les écrire, donc
   * aucun contrôle d'édition ne lui est proposé ici.
   */
  notes: Note[];
  estMj: boolean;
  /** Nom du personnage dont on lit les notes, pour titrer la section côté MJ. */
  notesOwnerName?: string;
  onAjouterEntree?: (entree: { title: string | null; body: string }) => void;
  onSupprimerEntree?: (id: string) => void;
  onAjouterNote?: (note: { title: string | null; body: string }) => void;
  onModifierNote?: (id: string, note: { title: string | null; body: string }) => void;
  onSupprimerNote?: (id: string) => void;
}) {
  const [titreJournal, setTitreJournal] = useState('');
  const [corpsJournal, setCorpsJournal] = useState('');
  // L'id de la note ouverte, 'nouvelle' pour une création, ou rien.
  const [noteOuverte, setNoteOuverte] = useState<string | null>(null);
  const [titreNote, setTitreNote] = useState('');
  const [corpsNote, setCorpsNote] = useState('');

  const publierEntree = () => {
    if (!corpsJournal.trim()) return;
    onAjouterEntree?.({ title: titreJournal.trim() || null, body: corpsJournal.trim() });
    setTitreJournal('');
    setCorpsJournal('');
  };

  const ouvrirNote = (note?: Note) => {
    setNoteOuverte(note ? note.id : 'nouvelle');
    setTitreNote(note?.title ?? '');
    setCorpsNote(note?.body ?? '');
  };
  const fermerNote = () => {
    setNoteOuverte(null);
    setTitreNote('');
    setCorpsNote('');
  };
  const enregistrerNote = () => {
    if (!corpsNote.trim()) return;
    const payload = { title: titreNote.trim() || null, body: corpsNote.trim() };
    if (noteOuverte && noteOuverte !== 'nouvelle') onModifierNote?.(noteOuverte, payload);
    else onAjouterNote?.(payload);
    fermerNote();
  };

  // Ni `<main>` ni défilement propre : ce bloc est empilé dans le rouleau
  // unique de `FicheScreen`, qui possède seul la zone de scroll.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2 className="ttl" style={{ fontSize: 17 }}>Journal</h2>

      {estMj && (
        <div style={carte}>
          <input
            value={titreJournal}
            onChange={(event) => setTitreJournal(event.target.value)}
            placeholder="Titre (facultatif)"
            autoComplete="off"
            style={{ ...champ, marginTop: 0 }}
          />
          <textarea
            value={corpsJournal}
            onChange={(event) => setCorpsJournal(event.target.value)}
            placeholder="Ce qui s'est passé à la table…"
            style={zone}
          />
          <button
            onClick={publierEntree}
            disabled={!corpsJournal.trim()}
            style={{
              marginTop: 8, minHeight: 'var(--tap)', padding: '0 16px', borderRadius: 'var(--radius-sm)',
              background: corpsJournal.trim() ? 'var(--accent)' : 'var(--surface)',
              color: corpsJournal.trim() ? 'var(--accent-ink)' : 'var(--muted)',
              border: corpsJournal.trim() ? 'none' : '1px solid var(--line)', fontWeight: 700, fontSize: 14,
            }}
          >
            Publier
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="lbl" style={{ textTransform: 'none', color: 'var(--muted)' }}>
          {estMj ? 'Rien publié pour l’instant.' : 'Le MJ n’a encore rien écrit.'}
        </p>
      ) : (
        parDateDecroissante(entries).map((entree) => (
          <EntreeJournal
            key={entree.id}
            entree={entree}
            onSupprimer={estMj ? () => onSupprimerEntree?.(entree.id) : undefined}
          />
        ))
      )}

      {!estMj && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 18 }}>
            <h2 className="ttl" style={{ fontSize: 17, flexGrow: 1 }}>Mes notes</h2>
            <button
              onClick={() => (noteOuverte ? fermerNote() : ouvrirNote())}
              className="lbl"
              style={{
                minHeight: 32, padding: '0 10px', borderRadius: 999,
                border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 700,
              }}
            >
              {noteOuverte ? 'Annuler' : '+ Ajouter'}
            </button>
          </div>
          <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)' }}>
            Personnelles — seul le MJ peut aussi les lire, pour garder un œil sur la table.
          </div>

          {noteOuverte && (
            <div style={carte}>
              <input
                value={titreNote}
                onChange={(event) => setTitreNote(event.target.value)}
                placeholder="Titre (facultatif)"
                autoComplete="off"
                style={{ ...champ, marginTop: 0 }}
              />
              <textarea
                value={corpsNote}
                onChange={(event) => setCorpsNote(event.target.value)}
                placeholder="Ce que tu veux garder pour toi…"
                style={zone}
              />
              <button
                onClick={enregistrerNote}
                disabled={!corpsNote.trim()}
                style={{
                  marginTop: 8, minHeight: 'var(--tap)', padding: '0 16px', borderRadius: 'var(--radius-sm)',
                  background: corpsNote.trim() ? 'var(--accent)' : 'var(--surface)',
                  color: corpsNote.trim() ? 'var(--accent-ink)' : 'var(--muted)',
                  border: corpsNote.trim() ? 'none' : '1px solid var(--line)', fontWeight: 700, fontSize: 14,
                }}
              >
                Enregistrer
              </button>
            </div>
          )}

          {parDateDecroissante(notes).map((note) => (
            <button
              key={note.id}
              onClick={() => ouvrirNote(note)}
              className="card"
              style={{ ...carte, textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                {note.title && <div className="ttl" style={{ fontSize: 15, flexGrow: 1 }}>{note.title}</div>}
                <div className="lbl" style={note.title ? undefined : { flexGrow: 1, textAlign: 'right' }}>
                  {dateCourte(note.createdAt)}
                </div>
              </div>
              <p style={{
                margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
              }}>
                {note.body}
              </p>
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => { event.stopPropagation(); onSupprimerNote?.(note.id); }}
                className="lbl"
                style={{ display: 'inline-block', marginTop: 8, color: 'var(--muted)' }}
              >
                Supprimer
              </span>
            </button>
          ))}
        </>
      )}

      {/*
        Côté MJ : lecture seule, jamais d'édition — la RLS ne lui donne que le
        droit de lire. Rien à afficher tant que ce joueur n'a écrit aucune
        note, plutôt qu'une section vide sans intérêt.
      */}
      {estMj && notes.length > 0 && (
        <>
          <h2 className="ttl" style={{ fontSize: 17, marginTop: 18 }}>
            Notes {notesOwnerName ? `de ${notesOwnerName}` : 'personnelles'}
          </h2>
          {parDateDecroissante(notes).map((note) => (
            <div key={note.id} style={carte}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                {note.title && <div className="ttl" style={{ fontSize: 15, flexGrow: 1 }}>{note.title}</div>}
                <div className="lbl" style={note.title ? undefined : { flexGrow: 1, textAlign: 'right' }}>
                  {dateCourte(note.createdAt)}
                </div>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {note.body}
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
