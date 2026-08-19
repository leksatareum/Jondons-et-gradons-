# Temps réel

## La panne qu'on ne reproduit pas

Dans `table-connectee`, `src/lib/api-base.js` ouvrait le canal ainsi :

```js
const channel = client.channel(`campaign:${campaignId}`)
  .on('postgres_changes', { /* … */ }, handler)
  .subscribe();               // ← aucun callback de statut
return () => { client.removeChannel(channel); };
```

Quatre manques, qui se cumulent :

1. **`.subscribe()` sans callback de statut.** `SUBSCRIBED`, `CHANNEL_ERROR`,
   `TIMED_OUT`, `CLOSED` n'étaient jamais observés : l'app ne pouvait pas
   savoir qu'elle était déconnectée.
2. **Aucun `visibilitychange`.** Sur téléphone, l'app passe en arrière-plan à
   la moindre notification et l'OS coupe le websocket. Au retour, le canal est
   mort et rien ne le rouvre.
3. **Aucun `online` / `offline`.** Un tunnel, un ascenseur, un passage en 4G,
   et la connexion ne revient jamais.
4. **Aucune relecture après reconnexion.** Même si le socket revenait, ce qui
   s'était passé pendant l'absence était perdu définitivement.

D'où le symptôme : les joueurs devaient recharger l'app quand le MJ lançait un
combat ou une montée de niveau.

## Ce qui remplace

`src/sync/` — trois pièces, sans dépendance à Supabase ni au navigateur dans
la logique, donc testables intégralement.

### `connection.ts` — le cycle de vie

Une machine à états : `idle → connecting → syncing → live`, plus `offline`.

- **Le statut du canal est observé**, et une erreur ou une expiration relance
  une reconnexion à délai croissant.
- **Toute (re)connexion déclenche une resynchronisation complète**, avant de
  se déclarer à jour. Le flux incrémental ne dit rien de ce qui s'est passé
  pendant qu'on n'écoutait pas : on ne lui fait jamais confiance seul.
- **Le retour au premier plan et le retour du réseau sont des signaux de
  reconnexion** au même titre qu'une erreur — c'est le cas normal sur
  téléphone, pas un cas limite.
- **Un canal silencieux trop longtemps est considéré mort** et rouvert, sans
  attendre que quiconque le signale. C'est le filet contre les websockets
  « à moitié ouverts », fréquents en mobilité.
- **Chaque connexion porte une génération.** Un instantané lent, un événement
  en vol ou un statut venant d'un canal déjà fermé sont ignorés à leur
  retour, au lieu d'écraser l'état d'une connexion plus récente.

`isTrustworthy()` dit si l'état affiché peut être considéré comme à jour —
de quoi afficher un bandeau honnête plutôt que de mentir au joueur.

### `versioned-store.ts` — la cohérence des données

Un événement incrémental n'est appliqué que s'il est **plus récent** que ce
qu'on détient, la version faisant foi — jamais l'ordre d'arrivée, qui ne veut
rien dire sur un réseau mobile. C'est ce qui permet à une resynchronisation
complète et à un flux d'événements de cohabiter sans se détruire.

La table `characters` porte déjà une colonne `version` : elle sert d'horloge.

### `browser-environment.ts` — le branchement réel

Écoute `visibilitychange`, `online`, `offline` et `pageshow` (retour depuis le
cache de navigation, où la page reprend avec un websocket mort et aucun
événement pour le dire).

## Ce qui reste à faire

Le transport Supabase lui-même (`SyncTransport`) n'est pas encore écrit : il
viendra avec la couche de données, et devra appeler `onStatus` à chaque
changement d'état du canal — c'est tout l'intérêt de l'interface.
