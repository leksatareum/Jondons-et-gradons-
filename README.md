# Jondons et gradons

Nouvelle app de gestion de campagne D&D 5e (règles 2024) pour « Les Loups Rouges ».
Repart de zéro depuis [`table-connectee`](https://github.com/leksatareum/table-connectee),
en ne reprenant que ce qui était sain : le contenu et le moteur de règles.

## Principe d'architecture

L'ancienne app figeait les capacités dans la fiche au moment de la création du
personnage. Ici, la fiche ne stocke **que les décisions du joueur** — classe,
sous-classe, choix de dons, sorts choisis, terrain, style de combat… Tout le
reste (sorts toujours préparés, quotas, ressources, capacités) est **dérivé à
la lecture** à partir de ces décisions et du niveau. Une règle ajoutée demain
doit s'appliquer rétroactivement aux personnages existants, sans migration.

Test d'acceptation : importer les personnages actuels depuis `table-connectee`
et retrouver des fiches correctes.

## État actuel

Étape 1 de la feuille de route : **le moteur de règles seul, sans interface.**

- `src/content/` — sorts, créatures, dons, invocations, équipement, compendium
  de règles.
- `src/domain/` — le moteur : d20, dégâts, mort, concentration, initiative,
  mouvement, multiclassage, progression, effets, et les trois classes jouées
  (occultiste, druide, rôdeur) avec leurs sous-classes et niveaux.

Repris depuis `table-connectee` avec ses tests — mais pas en copie brute :
2 fichiers (`content/spells.js`, `domain/wild-shape.ts`) sont patchés à la
compilation par la chaîne de plugins Vite de l'ancien dépôt, pas seulement
`App.jsx`. Ils ont été reconstruits en rejouant cette chaîne sur le texte
source, puis vérifiés par les tests. Détails dans
[`docs/legacy-rules-backlog.md`](docs/legacy-rules-backlog.md).
- `docs/legacy-rules-backlog.md` — ce qui reste à extraire de l'ancienne app
  (tables de règles encore prisonnières d'`App.jsx`, et les règles couvertes
  par des tests d'audit non repris ici, pour ne rien perdre en route).

Pas encore commencé : modèle de personnage + import, temps réel, écrans.

## Ce qui n'a *pas* été repris de `table-connectee`

`App.jsx` (12 497 lignes), les 66 plugins Vite qui le réécrivaient à la
compilation, les 29 feuilles CSS, et les ponts UI/effets temps réel
(`src/runtime/*Bridge.tsx`) — c'est précisément l'architecture qui rendait
l'ancienne app bancale.

## Commandes

```bash
npm install
npm test        # vitest
npm run typecheck
npm run check    # les deux
```
