-- ═══════════════════════════════════════════════════════════════════════
-- Création de la table de jeu : la campagne et ses participants.
--
-- À lancer APRÈS avoir créé les comptes dans Supabase
-- → Authentication → Users → Add user (mail + mot de passe, « Auto Confirm
--   User » coché pour qu'aucun mail ne soit envoyé).
--
-- Remplace les quatre adresses ci-dessous par les vraies, puis lance.
-- Rejouable : le relancer ne crée pas de doublon.
--
-- Les comptes sont désignés par leur mail plutôt que par leur identifiant :
-- recopier quatre UUID depuis un tableau de bord sur un téléphone est une
-- source d'erreur gratuite, et une erreur ici donne une fiche au mauvais
-- joueur.
-- ═══════════════════════════════════════════════════════════════════════

do $$
declare
  nom_campagne constant text := 'Les Loups Rouges';

  -- ↓↓↓ À REMPLACER ↓↓↓
  mail_mj      constant text := 'mj@exemple.fr';
  mails_joueurs constant text[] := array[
    'joueuse1@exemple.fr',
    'joueur2@exemple.fr',
    'joueuse3@exemple.fr'
  ];
  -- ↑↑↑ À REMPLACER ↑↑↑

  id_mj uuid;
  id_joueur uuid;
  mail text;
  id_campagne uuid;
begin
  select id into id_mj from auth.users where lower(email) = lower(mail_mj);
  if id_mj is null then
    raise exception 'Aucun compte pour %. Crée-le dans Authentication → Users avant de lancer ce script.', mail_mj;
  end if;

  -- La campagne, une seule fois.
  select id into id_campagne
    from public.jg_campaigns where name = nom_campagne and gm_id = id_mj;
  if id_campagne is null then
    insert into public.jg_campaigns (name, gm_id)
      values (nom_campagne, id_mj) returning id into id_campagne;
    raise notice 'Campagne « % » créée.', nom_campagne;
  else
    raise notice 'Campagne « % » déjà présente.', nom_campagne;
  end if;

  -- Le MJ est membre de sa propre table : les écrans lisent l'appartenance,
  -- pas la propriété, et l'oublier le priverait des fiches du groupe.
  insert into public.jg_members (campaign_id, user_id, role)
    values (id_campagne, id_mj, 'mj')
    on conflict (campaign_id, user_id) do update set role = 'mj';

  foreach mail in array mails_joueurs loop
    select id into id_joueur from auth.users where lower(email) = lower(mail);
    if id_joueur is null then
      raise exception 'Aucun compte pour %. Crée-le avant de lancer ce script.', mail;
    end if;
    insert into public.jg_members (campaign_id, user_id, role)
      values (id_campagne, id_joueur, 'joueur')
      on conflict (campaign_id, user_id) do update set role = 'joueur';
  end loop;

  raise notice 'Table prête : % participants.',
    (select count(*) from public.jg_members where campaign_id = id_campagne);
end;
$$;

-- Contrôle : qui est à la table, et de quel côté.
select c.name as campagne, u.email, m.role
from public.jg_members m
join public.jg_campaigns c on c.id = m.campaign_id
join auth.users u on u.id = m.user_id
order by m.role desc, u.email;
