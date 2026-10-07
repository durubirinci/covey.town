-- Run this once in your Supabase project (Dashboard -> SQL Editor -> New query -> Run)
-- to create the tables that the townService saves data to.

-- One row per completed game (Connect Four, Tic-Tac-Toe, ...)
create table if not exists public.game_results (
  id bigint generated always as identity primary key,
  game_id text not null unique,
  game_type text not null,
  area_id text not null,
  -- e.g. {"alice": 1, "bob": 0}: 1 for the winner, 0 for everyone else (all 0 for a tie)
  scores jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists game_results_created_at_idx on public.game_results (created_at desc);

-- Only the townService (which uses the service role key) can read or write this table.
-- Enabling row level security with no policies blocks access via the public anon key.
alter table public.game_results enable row level security;

-- Wins, losses and ties per player name, per game type
create or replace view public.leaderboard
with (security_invoker = true) as
select
  game_type,
  player_name,
  count(*) filter (where score = 1) as wins,
  count(*) filter (where score = 0 and not is_tie) as losses,
  count(*) filter (where is_tie) as ties,
  count(*) as games_played
from (
  select
    r.game_type,
    s.key as player_name,
    s.value::int as score,
    not exists (select 1 from jsonb_each_text(r.scores) w where w.value::int = 1) as is_tie
  from public.game_results r, jsonb_each_text(r.scores) s
) per_player
group by game_type, player_name;
