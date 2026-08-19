# Importer tes personnages depuis `table-connectee`

Le moteur d'import est prêt et testé, mais **sur les personnages de
démonstration de l'ancienne app** (Veya, Thorin, Wrenna, Cassian), pas encore
sur les tiens. C'est une distinction qui compte : les fiches de démo ont des
PV écrits à la main, tes vraies fiches ont été produites par l'app. Le test
d'acceptation que tu as demandé n'est donc pas encore passé pour de bon.

## Récupérer tes fiches

Dans `table-connectee`, chaque personnage est une ligne de la table
`characters`, dont la colonne `data` (JSONB) contient toute la fiche. Depuis
l'éditeur SQL de Supabase :

```sql
select jsonb_agg(data) from public.characters;
```

Enregistre le résultat dans un fichier, par exemple `mes-persos.json`.

## Lancer l'import

```ts
import { importLegacyCharacter, compareWithLegacy } from './src/model/import-legacy';
import { deriveCharacter } from './src/model/derive';

for (const legacy of JSON.parse(readFileSync('mes-persos.json', 'utf8'))) {
  const { sheet, warnings } = importLegacyCharacter(legacy);
  const derived = deriveCharacter(sheet);
  const ecarts = compareWithLegacy(legacy, derived);
  console.log(legacy.name, ecarts.length ? ecarts : 'aucun écart', warnings);
}
```

## Lire le résultat

- **`warnings`** — ce qui n'a pas pu être repris fidèlement (origine
  introuvable, sorts accordés retirés du budget, PV repris tels quels). Ce
  sont des points à regarder, pas forcément des problèmes.
- **`ecarts`** — les endroits où la dérivation ne retombe pas sur la valeur
  que l'ancienne app avait figée. **Un écart n'est pas forcément une
  régression** : l'ancienne app appliquait certaines règles de travers (cf.
  `legacy-rules-backlog.md`), donc un écart peut aussi bien signaler qu'elle
  avait tort. Chacun mérite d'être regardé une fois, pas corrigé
  automatiquement.

## Ce qui est délibérément perdu à l'import

Tout ce qui est dérivable : `hpMax`, `speed`, `hitDie`, `darkvision`,
`resistances`, les `slots.max`, le `toHit` de chaque attaque, la liste des
`features` avec leur texte. C'est le but — c'est ce gel qui empêchait ta
joueuse occultiste de choisir son pacte. Ces valeurs sont relues une fois,
pour vérification, puis jetées.

Deux exceptions assumées, parce que ce ne sont pas des calculs :

- **Les PV maximum** sont repris tels quels (`maxHpOverride`). L'ancienne app
  ne gardait que le total, pas le détail des jets de dé de vie — et un jet est
  un fait historique, irrécupérable. Lui substituer la moyenne changerait
  silencieusement les PV d'un personnage joué. À la prochaine montée de
  niveau, saisis les jets dans `hitPointRolls` et efface l'imposition : les PV
  redeviennent entièrement dérivés.
- **L'état vivant** (PV du moment, ressources dépensées, états) est repris,
  mais converti en *dépenses* plutôt qu'en valeurs courantes — « 2
  emplacements de rang 1 dépensés » plutôt que « il en reste 2 ». Si le
  maximum change ensuite, le restant se recalcule au lieu de devenir faux.
