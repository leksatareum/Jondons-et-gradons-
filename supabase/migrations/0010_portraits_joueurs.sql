-- ═══════════════════════════════════════════════════════════════════════
-- Portraits de personnage : chaque joueur illustre sa propre fiche.
--
-- Un objet est rangé sous `<sheet_id>/<fichier>` : le premier segment du
-- chemin est l'identifiant de la fiche, ce qui retrouve son propriétaire
-- (ou le MJ de sa campagne) sans table de liaison supplémentaire — la même
-- relation que `jg_sheets` porte déjà. Le bucket est public en LECTURE
-- (l'image sert directement depuis le CDN, sans repasser par l'API) ; seule
-- l'écriture est verrouillée par ces politiques.
-- ═══════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portraits', 'portraits', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create or replace function public.jg_owns_portrait_path(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.jg_sheets
    where id::text = split_part(object_name, '/', 1)
      and (owner_id = auth.uid() or public.jg_is_gm(campaign_id))
  );
$$;

drop policy if exists jg_portraits_write on storage.objects;
create policy jg_portraits_write on storage.objects
  for insert
  with check (bucket_id = 'portraits' and public.jg_owns_portrait_path(name));

drop policy if exists jg_portraits_update on storage.objects;
create policy jg_portraits_update on storage.objects
  for update
  using (bucket_id = 'portraits' and public.jg_owns_portrait_path(name))
  with check (bucket_id = 'portraits' and public.jg_owns_portrait_path(name));

drop policy if exists jg_portraits_delete on storage.objects;
create policy jg_portraits_delete on storage.objects
  for delete
  using (bucket_id = 'portraits' and public.jg_owns_portrait_path(name));
