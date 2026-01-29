-- CoinMate: 사용자별 데이터 저장 (전략/거래 히스토리)
-- Supabase Dashboard → SQL Editor에서 실행하세요.

-- 1) extensions (uuid 생성)
create extension if not exists "pgcrypto";

-- 2) strategies 테이블
create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coin_symbol text not null,
  strategy_type text not null check (strategy_type in ('profit-target','stop-loss','ai-signal','time-based')),
  target_price numeric,
  stop_loss_price numeric,
  profit_percentage numeric,
  loss_percentage numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists strategies_user_id_idx on public.strategies(user_id);
create index if not exists strategies_coin_symbol_idx on public.strategies(coin_symbol);

-- 3) trade_history 테이블 (향후 자동매도/백테스트/성과분석용)
create table if not exists public.trade_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coin_symbol text not null,
  action text not null check (action in ('buy','sell')),
  price numeric not null,
  amount numeric not null,
  strategy_id uuid references public.strategies(id) on delete set null,
  executed_at timestamptz not null default now()
);

create index if not exists trade_history_user_id_idx on public.trade_history(user_id);
create index if not exists trade_history_executed_at_idx on public.trade_history(executed_at);

-- 4) RLS 활성화
alter table public.strategies enable row level security;
alter table public.trade_history enable row level security;

-- 5) RLS 정책: 본인 데이터만 접근
drop policy if exists "Users can select own strategies" on public.strategies;
create policy "Users can select own strategies"
  on public.strategies
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own strategies" on public.strategies;
create policy "Users can insert own strategies"
  on public.strategies
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own strategies" on public.strategies;
create policy "Users can update own strategies"
  on public.strategies
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own strategies" on public.strategies;
create policy "Users can delete own strategies"
  on public.strategies
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can select own trades" on public.trade_history;
create policy "Users can select own trades"
  on public.trade_history
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own trades" on public.trade_history;
create policy "Users can insert own trades"
  on public.trade_history
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own trades" on public.trade_history;
create policy "Users can update own trades"
  on public.trade_history
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own trades" on public.trade_history;
create policy "Users can delete own trades"
  on public.trade_history
  for delete
  using (auth.uid() = user_id);


