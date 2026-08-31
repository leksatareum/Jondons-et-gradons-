import { useState } from 'react';
import type { JournalEntry, Message, Note } from '../sync/campaign-sync';
import { TAB_BAR_CLEARANCE } from './TabBar';

/**
 * Le journal, en quatre registres qui ne se mélangent jamais.
 *
 * · **Notes** — personnelles. Le joueur les écrit ; le MJ peut les lire (il
 *   garde un œil sur sa table) mais jamais les modifier.
 * · **Journal** — public. Le MJ l'écrit, toute la table le lit.
 * · **Messages** — privés, entre deux personnes, dans les deux sens. Les
 *   joueurs y écrivent aussi bien au MJ qu'aux autres personnages.
 * · **Secrets** — ce que le MJ confie à un seul joueur, et auquel on ne
 *   répond pas.
 *
 * Chaque registre a ses propres droits, tenus par la RLS ; cet écran ne fait
 * que proposer ce qu'elle autorise, il ne vérifie rien lui-même.
 *
 * Notes et Journal se regroupent par CHAPITRE — un texte libre posé par
 * l'auteur (« Valbrume », « La dent cassée »…), jamais une entité à part :
 * pas de date de début/fin, pas de description, juste une étiquette. Une
 * entrée sans chapitre reste dans le registre général, jamais orpheline.
 * Chaque entrée est une carte dépliante : le titre se lit d'un coup d'œil,
 * le texte n'apparaît qu'au tap — un journal de plusieurs séances ne tient
 * plus tout entier ouvert sur l'écran.
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

/** Plus récent d'abord — c'est un journal, pas une liste à parcourir depuis le début. */
const parDateDecroissante = <T extends { createdAt: string }>(lignes: T[]): T[] =>
  [...lignes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

/**
 * Regroupe par chapitre — le plus récemment alimenté d'abord, le registre
 * général (`chapitre: null`, rien n'y a été rangé) toujours en dernier : un
 * chapitre nommé porte une intention de l'auteur, son absence n'en est pas
 * une à mettre en avant.
 */
export function parChapitre<T extends { chapter: string | null; createdAt: string }>(
  lignes: T[],
): { chapitre: string | null; lignes: T[] }[] {
  const groupes = new Map<string | null, T[]>();
  for (const ligne of parDateDecroissante(lignes)) {
    const cle = ligne.chapter?.trim() || null;
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle)!.push(ligne);
  }
  return [...groupes.entries()].sort((a, b) => {
    if (a[0] === null) return 1;
    if (b[0] === null) return -1;
    return b[1][0].createdAt.localeCompare(a[1][0].createdAt);
  }).map(([chapitre, lignesDuChapitre]) => ({ chapitre, lignes: lignesDuChapitre }));
}

/** Les chapitres déjà utilisés, pour la saisie semi-automatique — jamais un « valbrume » qui redouble un « Valbrume ». */
const chapitresConnus = (...groupes: { chapter: string | null }[][]): string[] => {
  const vus = new Set<string>();
  for (const groupe of groupes) {
    for (const ligne of groupe) {
      const nom = ligne.chapter?.trim();
      if (nom) vus.add(nom);
    }
  }
  return [...vus].sort((a, b) => a.localeCompare(b, 'fr'));
};

const RESUME = (texte: string, max: number): string =>
  texte.length > max ? `${texte.slice(0, max).trimEnd()}…` : texte;

const champ: React.CSSProperties = {
  width: '100%', minHeight: 'var(--tap)', marginTop: 8,
  padding: '0 12px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--gold-dim)', background: 'var(--surface)',
  // 16px ou plus : en dessous, iOS zoome sur le champ à la mise au point,
  // et l'écran reste zoomé après — il faut alors pincer pour dézoomer.
  color: 'var(--ink)', fontSize: 16,
};

const zone: React.CSSProperties = {
  ...champ, minHeight: 88, padding: '10px 12px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
};

const carte: React.CSSProperties = {
  padding: '11px 13px', borderRadius: 'var(--radius)',
  border: '1px solid var(--gold-dim)',
  background: 'linear-gradient(180deg, var(--surface-raised), var(--surface))',
};

const bouton = (actif: boolean): React.CSSProperties => ({
  minHeight: 'var(--tap)', padding: '0 16px', borderRadius: 'var(--radius-sm)',
  background: actif ? 'var(--accent)' : 'var(--surface)',
  color: actif ? 'var(--accent-ink)' : 'var(--muted)',
  border: actif ? 'none' : '1px solid var(--gold-dim)', fontWeight: 700, fontSize: 14,
});

const dateCourte = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
};

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
            border: actif === clef ? 'none' : '1px solid var(--gold-dim)',
            fontWeight: 700, fontSize: 10.5,
          }}
        >
          {libelle}
        </button>
      ))}
    </div>
  );
}

/** L'en-tête d'un groupe de chapitre — absent pour le registre général quand il n'est pas seul. */
function EnteteChapitre({ chapitre, visible }: {
  chapitre: string | null;
  /** Faux quand c'est le seul groupe : rien à distinguer, une étiquette serait de trop. */
  visible: boolean;
}) {
  if (!visible) return null;
  const couleur = chapitre === null ? 'var(--muted)' : 'var(--accent)';
  return (
    <div className="lbl" style={{ marginTop: 4, color: couleur, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 14, height: 1, background: couleur }} aria-hidden />
      {/* Sans étiquette, cette entrée se confondrait visuellement avec le
          groupe juste au-dessus — elle n'a pas moins besoin d'un en-tête,
          juste un en-tête qui dit l'absence plutôt qu'un nom. */}
      {chapitre ?? 'Sans chapitre'}
    </div>
  );
}

/**
 * Une carte dépliante : le titre (ou un extrait, faute de titre) et la date
 * se lisent toujours ; le corps n'apparaît qu'au tap. C'est ce qui permet à
 * plusieurs séances de tenir sur l'écran sans défiler à travers du texte
 * qu'on ne relit pas.
 */
function CarteDepliante({ titre, date, corps, ouverte, onBasculer, actions }: {
  titre: string;
  date: string;
  corps: string;
  ouverte: boolean;
  onBasculer: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div style={carte}>
      <button
        onClick={onBasculer}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left' }}
      >
        <div
          className="ttl"
          style={{
            fontSize: 15, flexGrow: 1, minWidth: 0,
            overflow: ouverte ? undefined : 'hidden',
            textOverflow: ouverte ? undefined : 'ellipsis',
            whiteSpace: ouverte ? undefined : 'nowrap',
          }}
        >
          {titre}
        </div>
        <div className="lbl" style={{ flexShrink: 0 }}>{date}</div>
        <span
          aria-hidden
          style={{
            flexShrink: 0, color: 'var(--muted)', fontSize: 14,
            transform: ouverte ? 'rotate(90deg)' : 'none', transition: 'transform .15s',
          }}
        >
          ›
        </span>
      </button>
      {ouverte && (
        <>
          <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{corps}</p>
          {actions && <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>{actions}</div>}
        </>
      )}
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
      border: `1px solid ${deMoi ? 'var(--accent)' : 'var(--gold-dim)'}`,
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

/**
 * Le jet discret : un d20, envoyé directement au MJ comme un message privé
 * — jamais public, jamais visible des autres joueurs. C'est tout ce que ça
 * fait : ni bonus, ni historique séparé, juste le geste le plus simple pour
 * tenter quelque chose à la table sans que tout le monde sache si ça a
 * marché.
 */
function JetDiscret({ onEnvoyer }: { onEnvoyer: (body: string) => void }) {
  const [tentative, setTentative] = useState('');
  const [dernierJet, setDernierJet] = useState<number | null>(null);

  const lancer = () => {
    const resultat = 1 + Math.floor(Math.random() * 20);
    setDernierJet(resultat);
    const libelle = tentative.trim();
    onEnvoyer(libelle ? `Jet discret (d20) : ${resultat} — ${libelle}` : `Jet discret (d20) : ${resultat}`);
  };

  return (
    <div style={{ ...carte, borderColor: 'var(--accent)' }}>
      <div className="lbl" style={{ color: 'var(--accent)' }}>Jet discret</div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>
        Un d20 envoyé au MJ en message privé — les autres joueurs ne voient rien.
      </div>
      <input
        value={tentative}
        onChange={(event) => setTentative(event.target.value)}
        placeholder="Ce que tu tentes (facultatif) — Discrétion, fouiller le coffre…"
        autoComplete="off"
        style={{ ...champ, marginTop: 8 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <button onClick={lancer} style={{ ...bouton(true), flexGrow: 1 }}>
          🎲 Lancer un d20
        </button>
        {dernierJet !== null && (
          <div className="num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', minWidth: 32, textAlign: 'center' }}>
            {dernierJet}
          </div>
        )}
      </div>
    </div>
  );
}

export function JournalScreen({
  entries, notes, estMj, notesOwnerName,
  moi, gmId, correspondants, messages,
  onAjouterEntree, onModifierEntree, onSupprimerEntree,
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
  /** Id du MJ — pour router le jet discret vers lui, absent côté MJ (il n'en a pas besoin). */
  gmId?: string;
  /** À qui l'on peut écrire. Vide : la section Messages le dit plutôt que d'afficher un formulaire mort. */
  correspondants: Correspondant[];
  messages: Message[];
  onAjouterEntree?: (entree: { title: string | null; chapter: string | null; body: string }) => void;
  onModifierEntree?: (id: string, entree: { title: string | null; chapter: string | null; body: string }) => void;
  onSupprimerEntree?: (id: string) => void;
  onAjouterNote?: (note: { title: string | null; chapter: string | null; body: string }) => void;
  onModifierNote?: (id: string, note: { title: string | null; chapter: string | null; body: string }) => void;
  onSupprimerNote?: (id: string) => void;
  onEnvoyerMessage?: (message: { recipientId: string; body: string; kind: 'message' | 'secret' }) => void;
  onSupprimerMessage?: (id: string) => void;
}) {
  const [section, setSection] = useState<JournalSection>('notes');
  const [titreJournal, setTitreJournal] = useState('');
  const [chapitreJournal, setChapitreJournal] = useState('');
  const [corpsJournal, setCorpsJournal] = useState('');
  // L'id de l'entrée en cours de modification — pour ranger une entrée déjà
  // publiée dans un chapitre qui n'existait pas encore au moment de
  // l'écrire. Distinct du formulaire de publication au-dessus : on modifie
  // une entrée existante en place, sur sa propre carte, pas en haut de liste.
  const [entreeEnEdition, setEntreeEnEdition] = useState<string | null>(null);
  const [titreEdition, setTitreEdition] = useState('');
  const [chapitreEdition, setChapitreEdition] = useState('');
  const [corpsEdition, setCorpsEdition] = useState('');
  // L'id de la note ouverte, 'nouvelle' pour une création, ou rien.
  const [noteOuverte, setNoteOuverte] = useState<string | null>(null);
  const [titreNote, setTitreNote] = useState('');
  const [chapitreNote, setChapitreNote] = useState('');
  const [corpsNote, setCorpsNote] = useState('');
  const [destinataire, setDestinataire] = useState(correspondants[0]?.id ?? '');
  const [corpsMessage, setCorpsMessage] = useState('');
  const [corpsSecret, setCorpsSecret] = useState('');
  // Les cartes ouvertes — communes aux notes et au journal, les id sont des UUID uniques.
  const [ouvertes, setOuvertes] = useState<ReadonlySet<string>>(new Set());
  const basculer = (id: string) => setOuvertes((courant) => {
    const suite = new Set(courant);
    if (suite.has(id)) suite.delete(id); else suite.add(id);
    return suite;
  });

  const publierEntree = () => {
    if (!corpsJournal.trim()) return;
    onAjouterEntree?.({
      title: titreJournal.trim() || null, chapter: chapitreJournal.trim() || null, body: corpsJournal.trim(),
    });
    setTitreJournal('');
    setChapitreJournal('');
    setCorpsJournal('');
  };

  const ouvrirEditionEntree = (entree: JournalEntry) => {
    setEntreeEnEdition(entree.id);
    setTitreEdition(entree.title ?? '');
    setChapitreEdition(entree.chapter ?? '');
    setCorpsEdition(entree.body);
  };
  const annulerEditionEntree = () => {
    setEntreeEnEdition(null);
    setTitreEdition('');
    setChapitreEdition('');
    setCorpsEdition('');
  };
  const enregistrerEditionEntree = () => {
    if (!entreeEnEdition || !corpsEdition.trim()) return;
    onModifierEntree?.(entreeEnEdition, {
      title: titreEdition.trim() || null, chapter: chapitreEdition.trim() || null, body: corpsEdition.trim(),
    });
    annulerEditionEntree();
  };

  const ouvrirNote = (note?: Note) => {
    setNoteOuverte(note ? note.id : 'nouvelle');
    setTitreNote(note?.title ?? '');
    setChapitreNote(note?.chapter ?? '');
    setCorpsNote(note?.body ?? '');
  };
  const fermerNote = () => {
    setNoteOuverte(null);
    setTitreNote('');
    setChapitreNote('');
    setCorpsNote('');
  };
  const enregistrerNote = () => {
    if (!corpsNote.trim()) return;
    const payload = { title: titreNote.trim() || null, chapter: chapitreNote.trim() || null, body: corpsNote.trim() };
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
  const groupesNotes = parChapitre(notes);
  const groupesEntrees = parChapitre(entries);
  const suggestionsChapitres = chapitresConnus(entries, notes);

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
      <datalist id="jg-chapitres-connus">
        {suggestionsChapitres.map((nom) => <option key={nom} value={nom} />)}
      </datalist>

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
              <input
                value={chapitreNote}
                onChange={(event) => setChapitreNote(event.target.value)}
                placeholder="Chapitre (facultatif) — Valbrume…"
                autoComplete="off"
                list="jg-chapitres-connus"
                style={champ}
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
            groupesNotes.map(({ chapitre, lignes }) => (
              <div key={chapitre ?? '·'} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <EnteteChapitre chapitre={chapitre} visible={groupesNotes.length > 1} />
                {lignes.map((note) => (
                  <CarteDepliante
                    key={note.id}
                    titre={note.title || RESUME(note.body, 60)}
                    date={dateCourte(note.createdAt)}
                    corps={note.body}
                    ouverte={ouvertes.has(note.id)}
                    onBasculer={() => basculer(note.id)}
                    actions={!estMj && (
                      <>
                        <button
                          onClick={(event) => { event.stopPropagation(); ouvrirNote(note); }}
                          className="lbl" style={{ color: 'var(--accent)' }}
                        >
                          Modifier
                        </button>
                        <button
                          onClick={(event) => { event.stopPropagation(); onSupprimerNote?.(note.id); }}
                          className="lbl" style={{ color: 'var(--muted)' }}
                        >
                          Supprimer
                        </button>
                      </>
                    )}
                  />
                ))}
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
              <input
                value={chapitreJournal}
                onChange={(event) => setChapitreJournal(event.target.value)}
                placeholder="Chapitre (facultatif) — Valbrume…"
                autoComplete="off"
                list="jg-chapitres-connus"
                style={champ}
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
            groupesEntrees.map(({ chapitre, lignes }) => (
              <div key={chapitre ?? '·'} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <EnteteChapitre chapitre={chapitre} visible={groupesEntrees.length > 1} />
                {lignes.map((entree) => (
                  entreeEnEdition === entree.id ? (
                    // Édition en place : la carte devient son propre
                    // formulaire — c'est ce qui permet de ranger dans un
                    // chapitre une entrée écrite avant que ce chapitre existe.
                    <div key={entree.id} style={{ ...carte, borderColor: 'var(--accent)' }}>
                      <input
                        value={titreEdition}
                        onChange={(event) => setTitreEdition(event.target.value)}
                        placeholder="Titre (facultatif)"
                        autoComplete="off"
                        style={{ ...champ, marginTop: 0 }}
                      />
                      <input
                        value={chapitreEdition}
                        onChange={(event) => setChapitreEdition(event.target.value)}
                        placeholder="Chapitre (facultatif) — Valbrume…"
                        autoComplete="off"
                        list="jg-chapitres-connus"
                        style={champ}
                      />
                      <textarea
                        value={corpsEdition}
                        onChange={(event) => setCorpsEdition(event.target.value)}
                        style={zone}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button
                          onClick={enregistrerEditionEntree}
                          disabled={!corpsEdition.trim()}
                          style={{ ...bouton(Boolean(corpsEdition.trim())), flexGrow: 1 }}
                        >
                          Enregistrer
                        </button>
                        <button onClick={annulerEditionEntree} style={bouton(false)}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <CarteDepliante
                      key={entree.id}
                      titre={entree.title || RESUME(entree.body, 60)}
                      date={dateCourte(entree.createdAt)}
                      corps={entree.body}
                      ouverte={ouvertes.has(entree.id)}
                      onBasculer={() => basculer(entree.id)}
                      actions={estMj && (
                        <>
                          <button
                            onClick={(event) => { event.stopPropagation(); ouvrirEditionEntree(entree); }}
                            className="lbl" style={{ color: 'var(--accent)' }}
                          >
                            Modifier
                          </button>
                          <button
                            onClick={(event) => { event.stopPropagation(); onSupprimerEntree?.(entree.id); }}
                            className="lbl" style={{ color: 'var(--muted)' }}
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    />
                  )
                ))}
              </div>
            ))
          )}
        </>
      )}

      {/* ───── Messages privés ───── */}
      {section === 'messages' && (
        <>
          <h2 className="ttl" style={{ fontSize: 17 }}>Messages privés</h2>

          {/* Le jet discret : seuls les joueurs en ont l'usage — le MJ voit
              déjà tout ce qui se passe à la table. */}
          {!estMj && gmId && (
            <JetDiscret onEnvoyer={(body) => onEnvoyerMessage?.({ recipientId: gmId, body, kind: 'message' })} />
          )}

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
