/**
 * Import des personnages de `table-connectee` vers le modèle « Jondons et gradons ».
 *
 * Hors ligne, volontairement : le script ne parle pas à la base. Il lit
 * l'export produit par `supabase/seed/2-exporter-les-anciens-personnages.sql`,
 * fait passer chaque personnage par `importLegacyCharacter`, dérive la fiche
 * obtenue, et confronte le résultat aux valeurs que l'ancienne app avait
 * figées (`compareWithLegacy`).
 *
 * Rien n'est inséré ici. Le rapport se lit d'abord ; l'insertion se fait
 * ensuite, à partir du fichier écrit par `--sortie`, une fois les écarts
 * compris. C'est le seul ordre acceptable : un écart de PV maximum peut aussi
 * bien être une règle que l'ancienne app appliquait mal qu'une régression de
 * la dérivation, et on ne le sait qu'en le regardant.
 *
 *   node scripts/importer-les-anciens-personnages.js <export.json> [--sortie fiches.json]
 *
 * L'export accepte les deux formes que produit la base :
 *   · les lignes brutes de `characters` — { id, owner_id, data }
 *   · une liste déjà appariée      — { owner_id, legacy }
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { importLegacyCharacter, compareWithLegacy, type LegacyCharacter } from '../src/model/import-legacy';
import { deriveCharacter } from '../src/model/derive';
import type { CharacterSheet } from '../src/model/character';

interface Entree {
  ownerId: string | null;
  legacy: LegacyCharacter;
}

/** Une ligne de l'export, quelle que soit la forme sous laquelle elle arrive. */
const lireEntree = (brut: Record<string, unknown>): Entree => {
  const data = (brut.data ?? brut.legacy ?? brut) as Record<string, unknown>;
  const legacy = { ...data } as LegacyCharacter;
  // La ligne `characters` porte l'identifiant en colonne, pas dans le JSON :
  // sans ce report, la fiche importée perdrait sa trace vers l'ancienne app.
  if (brut.id && !legacy.id) legacy.id = String(brut.id);
  return { ownerId: brut.owner_id ? String(brut.owner_id) : null, legacy };
};

export interface ResultatImport {
  ownerId: string | null;
  sheet: CharacterSheet;
  warnings: string[];
  diffs: { field: string; legacy: number | string; derived: number | string }[];
}

export function importerTout(entrees: Entree[]): ResultatImport[] {
  return entrees.map(({ ownerId, legacy }) => {
    const { sheet, warnings } = importLegacyCharacter(legacy);
    const derived = deriveCharacter(sheet);
    return { ownerId, sheet, warnings, diffs: compareWithLegacy(legacy, derived) };
  });
}

const nombre = (valeur: number | string): string => String(valeur);

function rapporter(resultats: ResultatImport[]): number {
  let totalEcarts = 0;
  for (const { sheet, warnings, diffs, ownerId } of resultats) {
    const classes = sheet.classLevels.map((c) => `${c.classId} ${c.level}`).join(', ') || '—';
    console.log(`\n━━━ ${sheet.name} — ${classes}`);
    console.log(`    compte      ${ownerId ?? '(non rattachée)'}`);
    console.log(`    origine     ${sheet.backgroundId || '(à rechoisir)'}`);
    console.log(`    sorts       ${sheet.spells.length} choisi(s), ${sheet.cantrips.length} sort(s) mineur(s)`);

    if (diffs.length === 0) {
      console.log('    écarts      aucun — la dérivation retombe sur les valeurs de l\'ancienne app');
    } else {
      totalEcarts += diffs.length;
      console.log(`    écarts      ${diffs.length} :`);
      for (const d of diffs) {
        console.log(`      · ${d.field.padEnd(12)} ancienne app ${nombre(d.legacy).padStart(4)}   dérivé ${nombre(d.derived).padStart(4)}`);
      }
    }
    for (const w of warnings) console.log(`    ⚠ ${w}`);
  }
  return totalEcarts;
}

function principal(argv: string[]): void {
  const entree = argv[0];
  if (!entree) {
    console.error('Usage : node scripts/importer-les-anciens-personnages.js <export.json> [--sortie fiches.json]');
    process.exit(2);
  }
  const iSortie = argv.indexOf('--sortie');
  const sortie = iSortie >= 0 ? argv[iSortie + 1] : null;

  const brut = JSON.parse(readFileSync(entree, 'utf8')) as Record<string, unknown>[];
  if (!Array.isArray(brut)) throw new Error('L\'export doit être une liste de personnages.');

  const resultats = importerTout(brut.map(lireEntree));
  const totalEcarts = rapporter(resultats);

  console.log(`\n${resultats.length} personnage(s), ${totalEcarts} écart(s) au total.`);

  if (sortie) {
    writeFileSync(sortie, JSON.stringify(
      resultats.map((r) => ({ owner_id: r.ownerId, data: r.sheet })), null, 2,
    ));
    console.log(`Fiches écrites dans ${sortie} — à relire avant insertion.`);
  }
}

principal(process.argv.slice(2));
