import { useState } from 'react';
import type { JournalEntry, Message, Note } from '../sync/campaign-sync';
import { TAB_BAR_CLEARANCE } from './TabBar';

/**
 * Le journal, en quatre registres qui ne se mélangent jamais.
 *
 * · **Notes** — personnelles. Le joueur les écrit ; le MJ peut les lire (il
 *   garde un œil sur sa table) mais jamais les modifier.
 * · **Journal** — public. Le MJ l'écrit, toute la table le lit.
 * · **Messages** — privés, entre deux personnes, dans les deux sens.
 * · **Secrets** — ce que le MJ confie à un seul joueur, et auquel on ne
 *   répond pas.
 *
 * Chaque registre a ses propres droits, tenus par la RLS ; cet écran ne fait
 * que proposer ce qu'elle autorise, il ne vérifie rien lui-même.
 */

export type JournalSection = 'notes' | 'journal' | 'messages' | 'secrets';

/** Quelqu'un à qui l'on peut écrire : le MJ, ou un autre personnage de la table. */
export interface Correspondant {
  id: string;
  nom: string;
}

/**
 * Les messages échangés avec chaque correspondant, plus récents en dernier —
 * une conversation se lit dans l'ordre où elle s'est tenue, contrairement au
 * journal qu'on ouvre à la dernière page.
 *
 * Les secrets n'en font pas partie : ils ont leur propre registre, et les
 * mêler aux messages laisserait croire qu'on peut y répondre.
 */
export function conversationsAvec(
  messages: Message[],
  moi: string,
  correspondants: Correspondant[],
): { correspondant: Correspondant; echanges: Message[] }[] {
  return correspondants.map((correspondant) => ({
    correspondant,
    echanges: messages
      .filter((message) => message.kind === 'message')
      .filter((message) => (
        (message.authorId === moi && message.recipientId === correspondant.id)
        || (message.authorId === correspondant.id && message.recipientId === moi)
      ))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }));
}

/** Les secrets reçus, plus récents d'abord — le dernier révélé est celui qu'on relit. */
export function secretsRecus(messages: Message[], moi: string): Message[] {
  return messages
    .filter((message) => message.kind === 'secret' && message.recipientId === moi)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Les secrets que j'ai envoyés, filtrés par `correspondants` — comme
 * `conversationsAvec`. Sur la fiche d'un personnage précis, `correspondants`
 * ne contient que lui : sans ce filtre, ouvrir la fiche de Dauby montrait
 * aussi les secrets confiés à Veya, parce que « j'en suis l'auteur » ne
 * dépend jamais de la fiche ouverte.
 */
export function secretsEnvoyesA(
  messages: Message[],
  moi: string,
  correspondants: Correspondant[],
): Message[] {
  const destinatairesConnus = new Set(correspondants.map((correspondant) => correspondant.id));
  return messages
    .filter((message) => (
      message.kind === 'secret' && message.authorId === moi && destinatairesConnus.has(message.recipientId)
    ))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

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

const bouton = (actif: boolean): React.CSSProperties => ({
  minHeight: 'var(--tap)', padding: '0 16px', borderRadius: 'var(--radius-sm)',
  background: actif ? 'var(--accent)' : 'var(--surface)',
  color: actif ? 'var(--accent-ink)' : 'var(--muted)',
  border: actif ? 'none' : '1px solid var(--line)', fontWeight: 700, fontSize: 14,
});

const dateCourte = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
};

/** Plus récent d'abord — c'est un journal, pas une liste à parcourir depuis le début. */
const parDateDecroissante = <T extends { createdAt: string }>(lignes: T[]): T[] =>
  [...lignes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

const SECTIONS: [JournalSection, string][] = [
  ['notes', 'Notes'],
  ['journal', 'Journal'],
  ['messages', 'Messages'],
  ['secrets', 'Secrets'],
];

function SousOnglets({ actif, onChanger }: {
  actif: JournalSection;
  onChanger: (section: JournalSection) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
      {SECTIONS.map(([clef, libelle]) => (
        <button
          key={clef}
          onClick={() => onChanger(clef)}
          className="lbl"
          style={{
            flex: 1, minHeight: 34, borderRadius: 999,
            background: actif === clef ? 'var(--accent)' : 'transparent',
            color: actif === clef ? 'var(--accent-ink)' : 'var(--muted)',
            border: actif === clef ? 'none' : '1px solid var(--line)',
            fontWeight: 700, fontSize: 10.5,
          }}
        >
          {libelle}
        </button>
      ))}
    </div>
  );
}

function Bulle({ message, deMoi, onSupprimer }: {
  message: Message; deMoi: boolean; onSupprimer?: () => void;
}) {
  return (
    <div style={{
      alignSelf: deMoi ? 'flex-end' : 'flex-start',
      maxWidth: '85%', padding: '9px 12px', borderRadius: 'var(--radius)',
      background: deMoi ? 'var(--accent-wash)' : 'var(--surface)',
      border: `1px solid ${deMoi ? 'var(--accent)' : 'var(--line)'}`,
    }}>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{message.body}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <span className="lbl" style={{ fontSize: 9 }}>{dateCourte(message.createdAt)}</span>
        {onSupprimer && (
          <button onClick={onSupprimer} className="lbl" style={{ fontSize: 9, color: 'var(--muted)' }}>
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

export function JournalScreen({
  entries, notes, estMj, notesOwnerName,
  moi, correspondants, messages,
  onAjouterEntree, onSupprimerEntree,
  onAjouterNote, onModifierNote, onSupprimerNote,
  onEnvoyerMessage, onSupprimerMessage,
}: {
  entries: JournalEntry[];
  /** Côté joueur : les siennes. Côté MJ : celles du personnage dont la fiche est ouverte. */
  notes: Note[];
  estMj: boolean;
  /** Nom du personnage dont on lit les notes, pour titrer la section côté MJ. */
  notesOwnerName?: string;
  /** Qui regarde — pour distinguer ce qu'on a envoyé de ce qu'on a reçu. */
  moi: string;
  /** À qui l'on peut écrire. Vide : la section Messages le dit plutôt que d'afficher un formulaire mort. */
  correspondants: Correspondant[];
  messages: Message[];
  onAjouterEntree?: (entree: { title: string | null; body: string }) => void;
  onSupprimerEntree?: (id: string) => void;
  onAjouterNote?: (note: { title: string | null; body: string }) => void;
  onModifierNote?: (id: string, note: { title: string | null; body: string }) => void;
  onSupprimerNote?: (id: string) => void;
  onEnvoyerMessage?: (message: { recipientId: string; body: string; kind: 'message' | 'secret' }) => void;
  onSupprimerMessage?: (id: string) => void;
}) {
  const [section, setSection] = useState<JournalSection>('notes');
  const [titreJournal, setTitreJournal] = useState('');
  const [corpsJournal, setCorpsJournal] = useState('');
  // L'id de la note ouverte, 'nouvelle' pour une création, ou rien.
  const [noteOuverte, setNoteOuverte] = useState<string | null>(null);
  const [titreNote, setTitreNote] = useState('');
  const [corpsNote, setCorpsNote] = useState('');
  const [destinataire, setDestinataire] = useState(correspondants[0]?.id ?? '');
  const [corpsMessage, setCorpsMessage] = useState('');
  const [corpsSecret, setCorpsSecret] = useState('');

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

  const envoyer = (kind: 'message' | 'secret') => {
    const corps = kind === 'secret' ? corpsSecret : corpsMessage;
    if (!corps.trim() || !destinataire) return;
    onEnvoyerMessage?.({ recipientId: destinataire, body: corps.trim(), kind });
    if (kind === 'secret') setCorpsSecret('');
    else setCorpsMessage('');
  };

  const conversations = conversationsAvec(messages, moi, correspondants);
  const secrets = secretsRecus(messages, moi);
  const secretsEnvoyes = secretsEnvoyesA(messages, moi, correspondants);

  const choixDestinataire = correspondants.length > 1 && (
    <select
      value={destinataire}
      onChange={(event) => setDestinataire(event.target.value)}
      style={{ ...champ, marginTop: 0 }}
    >
      {correspondants.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
    </select>
  );

  return (
    <main style={{
      flexGrow: 1, padding: `12px 14px calc(${TAB_BAR_CLEARANCE} + 8px)`,
      display: 'flex', flexDirection: 'column', gap: 10,
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      <SousOnglets actif={section} onChanger={setSection} />

      {/* ───── Notes personnelles ───── */}
      {section === 'notes' && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h2 className="ttl" style={{ fontSize: 17, flexGrow: 1 }}>
              {estMj ? `Notes ${notesOwnerName ? `de ${notesOwnerName}` : 'personnelles'}` : 'Mes notes'}
            </h2>
            {!estMj && (
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
            )}
          </div>
          {(!estMj || notesOwnerName) && (
            <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)' }}>
              {estMj
                ? 'Écrites par le joueur — tu les lis, tu ne les modifies pas.'
                : 'Personnelles — seul le MJ peut aussi les lire, pour garder un œil sur la table.'}
            </div>
          )}

          {!estMj && noteOuverte && (
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
              <button onClick={enregistrerNote} disabled={!corpsNote.trim()} style={{ ...bouton(Boolean(corpsNote.trim())), marginTop: 8 }}>
                Enregistrer
              </button>
            </div>
          )}

          {notes.length === 0 ? (
            <p className="lbl" style={{ textTransform: 'none', color: 'var(--muted)' }}>
              {/* Hors fiche ouverte, le MJ n'a aucune note à afficher : elles
                  appartiennent à un personnage, autant dire où les trouver. */}
              {!estMj ? 'Rien de noté pour l’instant.'
                : notesOwnerName ? 'Ce joueur n’a rien noté.'
                : 'Ouvre la fiche d’un joueur pour lire ses notes.'}
            </p>
          ) : (
            parDateDecroissante(notes).map((note) => (
              <div
                key={note.id}
                onClick={estMj ? undefined : () => ouvrirNote(note)}
                role={estMj ? undefined : 'button'}
                style={{ ...carte, textAlign: 'left', cursor: estMj ? 'default' : 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  {note.title && <div className="ttl" style={{ fontSize: 15, flexGrow: 1 }}>{note.title}</div>}
                  <div className="lbl" style={note.title ? undefined : { flexGrow: 1, textAlign: 'right' }}>
                    {dateCourte(note.createdAt)}
                  </div>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {note.body}
                </p>
                {!estMj && (
                  <button
                    onClick={(event) => { event.stopPropagation(); onSupprimerNote?.(note.id); }}
                    className="lbl"
                    style={{ marginTop: 8, color: 'var(--muted)' }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            ))
          )}
        </>
      )}

      {/* ───── Journal public ───── */}
      {section === 'journal' && (
        <>
          <h2 className="ttl" style={{ fontSize: 17 }}>Journal de la table</h2>
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
              <button onClick={publierEntree} disabled={!corpsJournal.trim()} style={{ ...bouton(Boolean(corpsJournal.trim())), marginTop: 8 }}>
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
              <div key={entree.id} style={carte}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  {entree.title && <div className="ttl" style={{ fontSize: 15, flexGrow: 1 }}>{entree.title}</div>}
                  <div className="lbl" style={entree.title ? undefined : { flexGrow: 1, textAlign: 'right' }}>
                    {dateCourte(entree.createdAt)}
                  </div>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{entree.body}</p>
                {estMj && (
                  <button onClick={() => onSupprimerEntree?.(entree.id)} className="lbl" style={{ marginTop: 8, color: 'var(--muted)' }}>
                    Supprimer
                  </button>
                )}
              </div>
            ))
          )}
        </>
      )}

      {/* ───── Messages privés ───── */}
      {section === 'messages' && (
        <>
          <h2 className="ttl" style={{ fontSize: 17 }}>Messages privés</h2>
          {correspondants.length === 0 ? (
            <p className="lbl" style={{ textTransform: 'none', color: 'var(--muted)' }}>
              Personne à qui écrire pour l’instant.
            </p>
          ) : (
            <>
              <div style={carte}>
                {choixDestinataire}
                <textarea
                  value={corpsMessage}
                  onChange={(event) => setCorpsMessage(event.target.value)}
                  placeholder={`Message pour ${correspondants.find((c) => c.id === destinataire)?.nom ?? '…'}…`}
                  style={zone}
                />
                <button onClick={() => envoyer('message')} disabled={!corpsMessage.trim()} style={{ ...bouton(Boolean(corpsMessage.trim())), marginTop: 8 }}>
                  Envoyer
                </button>
              </div>

              {conversations.every(({ echanges }) => echanges.length === 0) && (
                <p className="lbl" style={{ textTransform: 'none', color: 'var(--muted)' }}>
                  Aucun message échangé pour l’instant.
                </p>
              )}
              {conversations.filter(({ echanges }) => echanges.length > 0).map(({ correspondant, echanges }) => (
                <section key={correspondant.id} style={{ marginTop: 8 }}>
                  <div className="lbl" style={{ marginBottom: 6 }}>{correspondant.nom}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {echanges.map((message) => (
                      <Bulle
                        key={message.id}
                        message={message}
                        deMoi={message.authorId === moi}
                        onSupprimer={message.authorId === moi ? () => onSupprimerMessage?.(message.id) : undefined}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
        </>
      )}

      {/* ───── Secrets ───── */}
      {section === 'secrets' && (
        <>
          <h2 className="ttl" style={{ fontSize: 17 }}>Secrets</h2>
          <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)' }}>
            {estMj
              ? 'Ce que tu confies à une seule personne. On n’y répond pas.'
              : 'Ce que le MJ t’a confié, à toi seul.'}
          </div>

          {estMj && correspondants.length > 0 && (
            <div style={carte}>
              {choixDestinataire}
              <textarea
                value={corpsSecret}
                onChange={(event) => setCorpsSecret(event.target.value)}
                placeholder="Ce que ce personnage seul apprend…"
                style={zone}
              />
              <button onClick={() => envoyer('secret')} disabled={!corpsSecret.trim()} style={{ ...bouton(Boolean(corpsSecret.trim())), marginTop: 8 }}>
                Confier
              </button>
            </div>
          )}

          {/* Le MJ relit ce qu'il a confié ; le joueur, ce qu'il a reçu. */}
          {(estMj ? secretsEnvoyes : secrets).length === 0 ? (
            <p className="lbl" style={{ textTransform: 'none', color: 'var(--muted)' }}>
              {estMj ? 'Rien confié pour l’instant.' : 'Le MJ ne t’a rien confié.'}
            </p>
          ) : (
            (estMj ? secretsEnvoyes : secrets).map((secret) => (
              <div key={secret.id} style={{ ...carte, borderColor: 'var(--accent)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div className="lbl" style={{ flexGrow: 1, color: 'var(--accent)' }}>
                    {estMj
                      ? `à ${correspondants.find((c) => c.id === secret.recipientId)?.nom ?? 'quelqu’un'}`
                      : 'confié par le MJ'}
                  </div>
                  <div className="lbl">{dateCourte(secret.createdAt)}</div>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{secret.body}</p>
                {secret.authorId === moi && (
                  <button onClick={() => onSupprimerMessage?.(secret.id)} className="lbl" style={{ marginTop: 8, color: 'var(--muted)' }}>
                    Supprimer
                  </button>
                )}
              </div>
            ))
          )}
        </>
      )}
    </main>
  );
}
