
ALTER TABLE public.trades
  DROP CONSTRAINT trades_account_id_fkey,
  ADD CONSTRAINT trades_account_id_fkey
    FOREIGN KEY (account_id)
    REFERENCES public.accounts(id)
    ON DELETE CASCADE;
