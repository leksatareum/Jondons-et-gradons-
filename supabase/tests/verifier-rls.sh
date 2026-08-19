#!/usr/bin/env bash
# Vérifie les règles d'accès contre un vrai PostgreSQL.
#
# Des politiques RLS jamais exécutées sont une supposition : une erreur y
# laisse silencieusement un joueur écrire la fiche d'un autre. Ce script monte
# une base jetable, applique les migrations et rejoue les cas qui comptent
# sous un rôle NON privilégié — un superutilisateur contourne la RLS et le
# test ne prouverait rien.
#
#   ./supabase/tests/verifier-rls.sh
set -euo pipefail

PORT="${PGPORT:-5433}"
SOCKET="${PGSOCKET:-/tmp}"
PSQL=(psql -h "$SOCKET" -p "$PORT" -U postgres)

echo "── Application des migrations ──"
# Doublures locales de ce que Supabase fournit : le schéma d'authentification
# et auth.uid(), qui lit l'identité portée par le jeton.
"${PSQL[@]}" -q -c "create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key);
  create or replace function auth.uid() returns uuid language sql stable as \$\$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid \$\$;"
for migration in supabase/migrations/*.sql; do
  "${PSQL[@]}" -q -v ON_ERROR_STOP=1 -f "$migration"
done
"${PSQL[@]}" -q -v ON_ERROR_STOP=1 -f supabase/tests/jeu-d-essai.sql

echec=0
essai() { # description | utilisateur | requête | attendu
  local res
  # `|| true` : un refus de la RLS est un ÉCHEC psql, et c'est justement le
  # résultat attendu de plusieurs cas. Sans ça, `set -e` arrête le script
  # avant d'avoir vérifié le plus important.
  res=$("${PSQL[@]}" -tAq -c "set local role jg_client;
    set local request.jwt.claim.sub = '$2';
    $3" 2>&1 || true)
  if [ "$res" = "$4" ]; then
    printf "  ✓ %s\n" "$1"
  else
    printf "  ✗ %s — attendu «%s», obtenu «%s»\n" "$1" "$4" "$res"; echec=1
  fi
}

A=22222222-2222-2222-2222-222222222222
B=33333333-3333-3333-3333-333333333333
MJ=11111111-1111-1111-1111-111111111111
ETRANGER=44444444-4444-4444-4444-444444444444

echo "── Lecture : on voit son groupe, et rien d'autre ──"
essai "la joueuse A voit les 2 fiches de sa campagne" "$A" "select count(*) from jg_sheets;" "2"
essai "un MJ étranger ne voit aucune fiche de cette campagne" "$ETRANGER" "select count(*) from jg_sheets where campaign_id='aaaaaaaa-0000-0000-0000-000000000001';" "0"
essai "A voit la rencontre de sa campagne" "$A" "select count(*) from jg_encounters;" "1"

echo "── Écriture : chacun sa fiche, sauf le MJ ──"
essai "A modifie SA fiche" "$A" "update jg_sheets set data='{\"n\":1}' where id='bbbbbbbb-0000-0000-0000-000000000001'; select count(*) from jg_sheets where id='bbbbbbbb-0000-0000-0000-000000000001' and version=2;" "1"
essai "A ne peut PAS modifier la fiche de B" "$A" "update jg_sheets set data='{\"pirate\":true}' where id='bbbbbbbb-0000-0000-0000-000000000002'; select version from jg_sheets where id='bbbbbbbb-0000-0000-0000-000000000002';" "1"
essai "le MJ modifie la fiche de B (il applique les dégâts)" "$MJ" "update jg_sheets set data='{\"pv\":3}' where id='bbbbbbbb-0000-0000-0000-000000000002'; select version from jg_sheets where id='bbbbbbbb-0000-0000-0000-000000000002';" "2"
essai "A ne peut pas supprimer la fiche de B" "$A" "delete from jg_sheets where id='bbbbbbbb-0000-0000-0000-000000000002'; select count(*) from jg_sheets where id='bbbbbbbb-0000-0000-0000-000000000002';" "1"

echo "── Rencontre : le MJ seul lance le tour par tour ──"
essai "A ne peut PAS lancer le combat" "$A" "update jg_encounters set state='{\"turnIndex\":0}'; select state->>'turnIndex' from jg_encounters;" "-1"
essai "le MJ lance le combat" "$MJ" "update jg_encounters set state='{\"turnIndex\":0}'; select state->>'turnIndex' from jg_encounters;" "0"

echo "── Enrôlement : seul le MJ invite ──"
essai "A ne peut pas s'inviter dans une campagne étrangère" "$A" "insert into jg_members (campaign_id, user_id, role) values ('aaaaaaaa-0000-0000-0000-000000000002','$A','joueur'); select count(*) from jg_members where user_id='$A';" "ERROR:  new row violates row-level security policy for table \"jg_members\""

echo
[ "$echec" -eq 0 ] && echo "Toutes les règles d'accès tiennent." || { echo "Des règles d'accès sont en défaut."; exit 1; }
