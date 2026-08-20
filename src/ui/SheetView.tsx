import { useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CombatScreen } from './CombatScreen';
import { SpellbookScreen } from './SpellbookScreen';
import { cardsFromCharacter } from './spell-cards';
import { deriveCharacter } from '../model/derive';
import { saveSheet } from '../sync/mutations';
import type { CampaignSync, StoredSheet } from '../sync/campaign-sync';
import type { EncounterState } from '../domain/encounter';

/**
 * La vue d'une fiche : combat et grimoire.
 *
 * La même pour le joueur sur sa fiche et pour le MJ sur celle d'un autre. Une
 * seconde version « pour le MJ » aurait divergé au premier changement de règle,
 * et c'est toujours celle qu'on oublie de corriger qui finit par mentir en
 * pleine partie.
 *
 * Ce qui change entre les deux n'est pas l'écran mais le droit d'écrire, et il
 * est tenu par la RLS : un joueur n'écrit que sa fiche, le MJ écrit toutes
 * celles de sa campagne. L'écran n'a donc rien à vérifier — il propose, la base
 * tranche.
 */

export type SheetTab = 'combat' | 'grimoire';

export function SheetView({ client, sync, fiche, rencontre, onglet, onOnglet, entete }: {
  client: SupabaseClient;
  sync: CampaignSync;
  fiche: StoredSheet;
  rencontre: EncounterState | undefined;
  onglet: SheetTab;
  onOnglet: (onglet: SheetTab) => void;
  /** Rendu au-dessus de l'écran : bandeau de synchronisation, retour du MJ… */
  entete?: React.ReactNode;
}) {
  const derivee = useMemo(() => deriveCharacter(fiche.data), [fiche.data]);
  const cartes = useMemo(() => cardsFromCharacter(fiche.data, derivee), [fiche.data, derivee]);

  /**
   * Préparer un sort est une écriture comme une autre : la fiche part en base
   * et la ligne renvoyée fait foi. La règle qui dit *quand* c'est permis vit
   * dans le modèle ; l'écran ne fait que proposer ce qu'elle autorise.
   */
  const basculerSort = (spellId: string, classId: string) => {
    const present = fiche.data.spells.some((sort) => sort.id === spellId);
    void saveSheet(client, sync, fiche.id, {
      ...fiche.data,
      spells: present
        ? fiche.data.spells.filter((sort) => sort.id !== spellId)
        : [...fiche.data.spells, { id: spellId, sourceClass: classId, prepared: true }],
    });
  };

  /**
   * Les points de vie ne sont pas stockés : c'est la blessure qui l'est. Le
   * maximum reste dérivé, donc une règle qui le change demain s'applique
   * rétroactivement sans toucher aux fiches.
   */
  const soignerOuBlesser = (delta: number) => {
    const subis = Math.max(0, Math.min(derivee.maxHp, fiche.data.live.damageTaken - delta));
    if (subis === fiche.data.live.damageTaken) return;
    void saveSheet(client, sync, fiche.id, {
      ...fiche.data,
      live: { ...fiche.data.live, damageTaken: subis },
    });
  };

  if (onglet === 'grimoire') {
    return (
      <>
        {entete}
        <SpellbookScreen sheet={fiche.data} derived={derivee} onToggle={basculerSort} />
        <Onglets onglet={onglet} onChanger={onOnglet} />
      </>
    );
  }

  const enCombat = rencontre != null && rencontre.turnIndex >= 0;
  const actif = enCombat ? rencontre.combatants[rencontre.turnIndex] : undefined;

  return (
    <>
      {entete}
      <CombatScreen
        sheet={fiche.data}
        cards={cartes}
        onSpendHp={soignerOuBlesser}
        turn={
          enCombat
            ? {
                mode: 'combat',
                // Le lien fiche ↔ combattant se fait par le nom du personnage :
                // c'est la seule clé commune tant qu'un combattant n'est pas
                // rattaché à une fiche côté base.
                isYourTurn: actif?.name === fiche.data.name,
                holder: actif?.name,
              }
            : { mode: 'libre' }
        }
      />
      <Onglets onglet={onglet} onChanger={onOnglet} />
    </>
  );
}

/**
 * Le passage d'un écran à l'autre.
 *
 * Flottant au-dessus du contenu plutôt qu'en barre fixe : les deux écrans
 * gèrent déjà leur propre hauteur, et leur en retirer une bande obligerait à
 * reprendre les deux mises en page pour un bouton.
 */
function Onglets({ onglet, onChanger }: {
  onglet: SheetTab;
  onChanger: (onglet: SheetTab) => void;
}) {
  return (
    <nav style={{
      position: 'fixed', zIndex: 10,
      right: 14, bottom: 'calc(14px + env(safe-area-inset-bottom))',
      display: 'flex', gap: 4, padding: 4,
      borderRadius: 999, border: '1px solid var(--line)',
      background: 'var(--surface-raised)', boxShadow: 'var(--raise)',
    }}>
      {([['combat', 'Combat'], ['grimoire', 'Sorts']] as const).map(([clef, libelle]) => (
        <button
          key={clef}
          onClick={() => onChanger(clef)}
          className="lbl"
          style={{
            minHeight: 38, padding: '0 14px', borderRadius: 999,
            background: onglet === clef ? 'var(--accent)' : 'transparent',
            color: onglet === clef ? 'var(--accent-ink)' : 'var(--muted)',
            fontWeight: 700,
          }}
        >
          {libelle}
        </button>
      ))}
    </nav>
  );
}
