-- Performance indexes for hot-path queries.
--
-- Audit context: only trades(user_id) and trades(trade_group_id) existed.
-- Every other user-scoped table did a sequential scan + RLS filter on every read,
-- which is fine at 10 users and painful at 10,000.
--
-- Each table here already enforces user isolation via RLS (auth.uid() = user_id);
-- these indexes just make the planner's job O(log n) instead of O(n).

-- trades: main query is "select ... where user_id = $1 order by created_at desc limit 2000".
-- Composite (user_id, created_at DESC) lets Postgres satisfy filter + sort + limit
-- from the index alone, skipping the sort step entirely.
CREATE INDEX IF NOT EXISTS trades_user_created_at_idx
  ON public.trades (user_id, created_at DESC);

-- account_id is filtered in dashboard "view by account" + used as FK target on join.
CREATE INDEX IF NOT EXISTS trades_account_id_idx
  ON public.trades (account_id)
  WHERE account_id IS NOT NULL;

-- date is filtered by heatmap (month range), equity curve (cumulative), leak detection
-- (rolling windows). Stored as TEXT in ISO format so btree ordering matches calendar order.
CREATE INDEX IF NOT EXISTS trades_user_date_idx
  ON public.trades (user_id, date);

-- accounts: every page calls useAccounts() → select * where user_id = auth.uid().
CREATE INDEX IF NOT EXISTS accounts_user_id_idx
  ON public.accounts (user_id);

-- criteria_settings: loaded on dashboard + trade form. No unique constraint on user_id
-- (users can have many criteria), so no implicit index.
CREATE INDEX IF NOT EXISTS criteria_settings_user_id_idx
  ON public.criteria_settings (user_id);

-- trade_verifications: trade_id already has UNIQUE → implicit index. user_id queries
-- (RLS predicate evaluation) currently scan.
CREATE INDEX IF NOT EXISTS trade_verifications_user_id_idx
  ON public.trade_verifications (user_id);

-- Note: profiles, trader_profiles, trader_goals, subscriptions, daily_journals all have
-- UNIQUE(user_id) or UNIQUE(user_id, date) which Postgres backs with an implicit btree
-- index — no explicit index needed for them.
