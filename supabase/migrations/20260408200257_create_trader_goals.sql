CREATE TABLE IF NOT EXISTS trader_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  daily_target numeric,
  weekly_target numeric,
  monthly_target numeric,
  max_daily_loss numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trader_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals"
ON trader_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
