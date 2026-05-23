-- Add balance_adjustment column to accounts
-- Positive = deposits added, Negative = withdrawals made
-- Displayed balance = current_balance + sum(trade PnL) + balance_adjustment
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS balance_adjustment NUMERIC DEFAULT 0;
