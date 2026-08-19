-- Rôle non privilégié : sans cela, le superutilisateur contourne toute RLS et
-- le test ne prouverait rien. Créé une fois, réutilisé ensuite — le supprimer
-- exigerait de révoquer tous ses droits d'abord, pour aucun bénéfice.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'jg_client') then
    create role jg_client nologin;
  end if;
end;
$$;
grant usage on schema public to jg_client;
grant select, insert, update, delete on all tables in schema public to jg_client;
grant execute on all functions in schema public to jg_client;

truncate table public.jg_sheets, public.jg_encounters, public.jg_members, public.jg_campaigns cascade;
delete from auth.users;

-- Deux joueurs, un MJ, une campagne.
insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),  -- MJ
  ('22222222-2222-2222-2222-222222222222'),  -- joueuse A
  ('33333333-3333-3333-3333-333333333333')   -- joueur B
on conflict do nothing;

insert into public.jg_campaigns (id, name, gm_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Les Loups Rouges', '11111111-1111-1111-1111-111111111111');
insert into public.jg_members (campaign_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'mj'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'joueur'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'joueur');
insert into public.jg_sheets (id, campaign_id, owner_id, data) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '{"name":"Fiche de A"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '{"name":"Fiche de B"}');
insert into public.jg_encounters (id, campaign_id, state) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '{"turnIndex":-1}');

-- Une campagne étrangère, pour vérifier l'étanchéité.
insert into auth.users (id) values ('44444444-4444-4444-4444-444444444444') on conflict do nothing;
insert into public.jg_campaigns (id, name, gm_id) values
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Autre table', '44444444-4444-4444-4444-444444444444');
insert into public.jg_members (campaign_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'mj');
insert into public.jg_sheets (id, campaign_id, owner_id, data) values
  ('bbbbbbbb-0000-0000-0000-000000000009', 'aaaaaaaa-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', '{"name":"Étrangère"}');
