-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- (policies that cross-reference other tables come after all
--  tables are created, to avoid "relation does not exist" errors)
-- ============================================================

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Boloes
create table public.boloes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  invite_code text unique default upper(substring(md5(random()::text), 1, 8)) not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  scoring_correct_result integer default 1 not null,
  scoring_correct_score integer default 3 not null,
  scoring_draw integer default 2 not null,
  scoring_correct_diff integer default 2 not null,
  scoring_knockout integer default 5 not null,
  scoring_champion integer default 15 not null,
  scoring_top_scorer integer default 10 not null,
  created_at timestamptz default now() not null
);

-- Bolao Members
create table public.bolao_members (
  id uuid default uuid_generate_v4() primary key,
  bolao_id uuid references public.boloes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now() not null,
  total_points integer default 0 not null,
  unique(bolao_id, user_id)
);

-- Matches
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  external_id integer unique not null,
  home_team text not null,
  away_team text not null,
  home_team_flag text,
  away_team_flag text,
  match_date timestamptz not null,
  stage text not null,
  home_score integer,
  away_score integer,
  status text default 'SCHEDULED' check (status in ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED')) not null,
  locked boolean default false not null, -- true = editado manualmente pelo admin, sync não sobrescreve time/data/fase
  created_at timestamptz default now() not null
);

-- Predictions
create table public.predictions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  bolao_id uuid references public.boloes(id) on delete cascade not null,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  points integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, match_id, bolao_id)
);

-- Tournament predictions (champion, top scorer)
create table public.tournament_predictions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  bolao_id uuid references public.boloes(id) on delete cascade not null,
  champion text,
  top_scorer text,
  champion_points integer,
  top_scorer_points integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, bolao_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.boloes enable row level security;
alter table public.bolao_members enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.tournament_predictions enable row level security;

-- Profiles
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Boloes (policy that references bolao_members goes here, after that table exists)
create policy "Boloes visible to members" on public.boloes
  for select using (
    exists (
      select 1 from public.bolao_members
      where bolao_id = boloes.id and user_id = auth.uid()
    ) or owner_id = auth.uid()
  );

create policy "Authenticated users can create boloes" on public.boloes
  for insert with check (auth.uid() = owner_id);

create policy "Owner can update bolao" on public.boloes
  for update using (auth.uid() = owner_id);

create policy "Owner can delete bolao" on public.boloes
  for delete using (auth.uid() = owner_id);

-- Bolao Members
create policy "Members visible to bolao members" on public.bolao_members
  for select using (
    exists (
      select 1 from public.bolao_members bm
      where bm.bolao_id = bolao_members.bolao_id and bm.user_id = auth.uid()
    )
  );

create policy "Authenticated users can join boloes" on public.bolao_members
  for insert with check (auth.uid() = user_id);

-- Matches
create policy "Matches are viewable by everyone" on public.matches
  for select using (true);

create policy "Service role can manage matches" on public.matches
  for all using (auth.role() = 'service_role');

-- Predictions
create policy "Users can view predictions in their boloes" on public.predictions
  for select using (
    exists (
      select 1 from public.bolao_members
      where bolao_id = predictions.bolao_id and user_id = auth.uid()
    )
  );

create policy "Users can insert their own predictions" on public.predictions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own predictions before match starts" on public.predictions
  for update using (
    auth.uid() = user_id and
    exists (
      select 1 from public.matches
      where id = predictions.match_id and match_date > now()
    )
  );

-- Tournament predictions
create policy "Tournament predictions visible to bolao members" on public.tournament_predictions
  for select using (
    exists (select 1 from public.bolao_members where bolao_id = tournament_predictions.bolao_id and user_id = auth.uid())
  );

create policy "Users can manage their own tournament predictions" on public.tournament_predictions
  for all using (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Calculate match points
create or replace function public.calculate_points(
  pred_home integer,
  pred_away integer,
  real_home integer,
  real_away integer,
  pts_result integer,
  pts_score integer,
  pts_draw integer,
  pts_diff integer
) returns integer as $$
declare
  pred_result text;
  real_result text;
begin
  if real_home is null or real_away is null then
    return null;
  end if;

  -- Cravada (placar exato)
  if pred_home = real_home and pred_away = real_away then
    return pts_score;
  end if;

  if pred_home > pred_away then pred_result := 'H';
  elsif pred_home < pred_away then pred_result := 'A';
  else pred_result := 'D';
  end if;

  if real_home > real_away then real_result := 'H';
  elsif real_home < real_away then real_result := 'A';
  else real_result := 'D';
  end if;

  -- Empate acertado
  if real_result = 'D' and pred_result = 'D' then
    return pts_draw;
  end if;

  -- Vitória: checa saldo e depois resultado
  if real_result != 'D' and pred_result = real_result then
    if abs(pred_home - pred_away) = abs(real_home - real_away) then
      return pts_diff;
    end if;
    return pts_result;
  end if;

  return 0;
end;
$$ language plpgsql;

-- Update points when match finishes
create or replace function public.update_prediction_points()
returns trigger as $$
begin
  if new.status = 'FINISHED' and new.home_score is not null and new.away_score is not null then
    update public.predictions p
    set points = public.calculate_points(
      p.home_score, p.away_score,
      new.home_score, new.away_score,
      b.scoring_correct_result,
      b.scoring_correct_score,
      b.scoring_draw,
      b.scoring_correct_diff
    )
    from public.boloes b
    where p.match_id = new.id and p.bolao_id = b.id;

    update public.bolao_members bm
    set total_points = (
      select coalesce(sum(p.points), 0)
      from public.predictions p
      where p.user_id = bm.user_id and p.bolao_id = bm.bolao_id and p.points is not null
    )
    where exists (
      select 1 from public.predictions p
      where p.match_id = new.id and p.bolao_id = bm.bolao_id and p.user_id = bm.user_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_match_finished
  after update on public.matches
  for each row execute procedure public.update_prediction_points();
