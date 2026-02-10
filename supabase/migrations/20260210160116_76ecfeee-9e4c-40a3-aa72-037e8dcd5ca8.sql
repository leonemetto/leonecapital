-- Drop existing foreign key and re-add with CASCADE
ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_account_id_fkey;
ALTER TABLE public.trades ADD CONSTRAINT trades_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;