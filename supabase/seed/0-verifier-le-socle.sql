-- Contrôle du socle « Jondons et gradons ».
-- Lecture seule : ne crée, ne modifie et ne supprime rien.
-- Les cinq lignes doivent afficher « ✅ ».

with controle(rang, quoi, attendu, obtenu) as (
  values
    (1, 'tables jg_ créées', 4,
      (select count(*)::int from pg_tables
        where schemaname = 'public' and tablename like 'jg\_%')),
    (2, 'RLS activée sur chacune', 4,
      (select count(*)::int from pg_tables
        where schemaname = 'public' and tablename like 'jg\_%' and rowsecurity)),
    (3, 'règles d''accès posées', 11,
      (select count(*)::int from pg_policies
        where schemaname = 'public' and tablename like 'jg\_%')),
    (4, 'tables publiées en temps réel', 2,
      (select count(*)::int from pg_publication_tables
        where pubname = 'supabase_realtime' and tablename like 'jg\_%')),
    (5, 'fonctions d''appartenance', 3,
      (select count(*)::int from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname in ('jg_is_member', 'jg_is_gm', 'jg_bump_version')))
)
select quoi, attendu, obtenu,
       case when obtenu = attendu then '✅' else '❌' end as verdict
from controle order by rang;
