import { createContext, useContext, ReactNode, useState } from 'react';
import { useAccounts as useAccountsHook } from '@/hooks/useAccounts';

type AccountsContextType = ReturnType<typeof useAccountsHook> & {
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
};

const AccountsContext = createContext<AccountsContextType | null>(null);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const accounts = useAccountsHook();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('__all__');
  return (
    <AccountsContext.Provider value={{ ...accounts, selectedAccountId, setSelectedAccountId }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useSharedAccounts(): AccountsContextType {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error('useSharedAccounts must be used within AccountsProvider');
  return ctx;
}
