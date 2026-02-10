import { createContext, useContext, ReactNode } from 'react';
import { useAccounts as useAccountsHook } from '@/hooks/useAccounts';

type AccountsContextType = ReturnType<typeof useAccountsHook>;

const AccountsContext = createContext<AccountsContextType | null>(null);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const accounts = useAccountsHook();
  return (
    <AccountsContext.Provider value={accounts}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useSharedAccounts(): AccountsContextType {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error('useSharedAccounts must be used within AccountsProvider');
  return ctx;
}
