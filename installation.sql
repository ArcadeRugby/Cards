-- =====================================================================
-- INSTALLATION SUPABASE : base de joueurs + photos
-- À coller dans « SQL Editor » (Supabase), après avoir remplacé TON-EMAIL-ADMIN
-- par l'adresse e-mail du compte administrateur. Puis cliquer sur « Run ».
-- =====================================================================

-- 1. Table des joueurs (mêmes colonnes que joueurs.csv)
create table if not exists public.joueurs (
  id text primary key,
  nom text not null,
  poste smallint not null check (poste between 1 and 15),
  rarete text not null,
  pu smallint not null check (pu between 1 and 10),
  vi smallint not null check (vi between 1 and 10),
  te smallint not null check (te between 1 and 10),
  pi smallint not null check (pi between 1 and 10),
  pl smallint not null check (pl between 1 and 10),
  mo smallint not null check (mo between 1 and 10),
  an smallint not null check (an between 1 and 10),
  co smallint not null check (co between 1 and 10),
  me smallint not null check (me between 1 and 10),
  la smallint not null check (la between 1 and 10),
  de smallint not null check (de between 1 and 10),
  tb smallint not null check (tb between 1 and 10),
  specialite text,
  age smallint,
  poids smallint,
  taille smallint,
  nationalite text,
  photo text
);
create index if not exists joueurs_poste_idx on public.joueurs (poste);

-- 2. Liste des administrateurs
create table if not exists public.admins (email text primary key);
insert into public.admins (email) values ('TON-EMAIL-ADMIN') on conflict do nothing;
alter table public.admins enable row level security;   -- aucune règle : illisible depuis le navigateur

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email'))
$$;

-- 3. Droits : tout le monde lit, seul l'administrateur écrit
alter table public.joueurs enable row level security;
drop policy if exists "lecture publique" on public.joueurs;
create policy "lecture publique" on public.joueurs for select using (true);
drop policy if exists "ecriture admin" on public.joueurs;
create policy "ecriture admin" on public.joueurs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 4. Espace de stockage des photos (public en lecture)
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do nothing;
drop policy if exists "photos lecture publique" on storage.objects;
create policy "photos lecture publique" on storage.objects for select using (bucket_id = 'photos');
drop policy if exists "photos ecriture admin" on storage.objects;
create policy "photos ecriture admin" on storage.objects for all to authenticated
  using (bucket_id = 'photos' and public.is_admin()) with check (bucket_id = 'photos' and public.is_admin());
