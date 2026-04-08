CREATE TABLE IF NOT EXISTS daily_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  notes text NOT NULL DEFAULT '',
  key_lesson text NOT NULL DEFAULT '',
  mood int CHECK (mood >= 1 AND mood <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own journal entries"
ON daily_journals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
