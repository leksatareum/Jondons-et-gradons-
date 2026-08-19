# Couche de données

## Cohabitation avec l'ancienne application

`table-connectee` est gelée mais **toujours en service** — une partie s'y joue
encore. Ces tables vivent donc dans le même projet Supabase, préfixées `jg_`,
et ne touchent à rien de l'existant. Tes comptes et ton authentification sont
déjà là : le jour de la bascule, personne n'aura à se réinscrire.

Un schéma Postgres dédié aurait été plus élégant qu'un préfixe, mais il faut
alors l'exposer à l'API depuis le tableau de bord. Le préfixe ne demande
aucune configuration.

## Les tables

| Table | Contenu |
|---|---|
| `jg_campaigns` | Une campagne, son MJ. |
| `jg_members` | Qui participe, avec quel rôle. |
| `jg_sheets` | Une fiche par personnage : le `CharacterSheet` en JSON. |
| `jg_encounters` | L'état de la rencontre : le `EncounterState` en JSON. |

Deux choses valent d'être soulignées :

**La fiche ne stocke que les décisions.** Aucun point de vie maximum, aucune
classe d'armure, aucun emplacement de sort en base. Tout se dérive à la
lecture — c'est ce qui permet à une règle corrigée demain de s'appliquer
rétroactivement, sans migration.

**`version` s'incrémente par un déclencheur**, jamais par le client. Deux
clients qui écrivent en même temps se marcheraient dessus si chacun calculait
sa propre version. C'est ce numéro qui permet au client d'ignorer un événement
plus ancien que ce qu'il détient déjà.

## Qui peut quoi

- On est membre d'une campagne, ou on ne voit rien.
- Tout le monde **lit** les fiches du groupe — c'est la moitié de l'intérêt
  d'une app connectée.
- Un joueur n'**écrit** que sa propre fiche.
- Le MJ écrit toutes les fiches de sa campagne : il applique les dégâts et les
  états, et attendre que chaque joueur les saisisse est exactement la lourdeur
  qu'on supprime.
- Seul le MJ écrit la rencontre. C'est lui, et lui seul, qui lance le tour par
  tour.

Ces règles ne sont pas des intentions : elles sont **vérifiées** contre un
vrai PostgreSQL, sous un rôle non privilégié (un superutilisateur contourne la
RLS et ne prouverait rien).

```bash
# Depuis une base locale jetable, port 5433 :
./supabase/tests/verifier-rls.sh
```

Dix cas, dont ceux qui comptent vraiment : un joueur ne peut ni modifier ni
supprimer la fiche d'un autre, ne peut pas lancer le combat, et ne peut pas
s'inviter dans une campagne étrangère.

## Ce qui reste à faire

Le transport (`src/sync/supabase-transport.ts`) est écrit et testé **contre
une doublure**, pas contre un vrai serveur Supabase. Il traduit les statuts de
canal, les changements et les suppressions, et fait la relecture complète.

Il n'a jamais ouvert un vrai canal : c'est la prochaine étape, et c'est là que
j'attends des surprises. Il manque aussi l'authentification et le câblage des
écrans sur ces données.
