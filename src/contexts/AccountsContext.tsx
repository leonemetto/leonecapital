import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useAccounts as useAccountsHook } from '@/hooks/useAccounts';

export const ALL_ACCOUNTS = '__all__';
const STORAGE_KEY = 'dashboard_account_filter';

type AccountsContextType = ReturnType<typeof useAccountsHook> & {
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
};

const AccountsContext = createContext<AccountsContextType | null>(null);

function readStored(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ALL_ACCOUNTS;
  } catch {
    return ALL_ACCOUNTS;
  }
}

export function AccountsProvider({ children }: { children: ReactNode }) {
  const accounts = useAccountsHook();
  const [selectedAccountId, setSelected] = useState<string>(readStored);

  const setSelectedAccountId = useCallback((id: string) => {
    setSelected(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage unavailable — keep in-memory state.
    }
  }, []);

  // A saved account id can outlive the account (deleted, or a different user
  // signed in). Left alone it would silently hide every trade, so fall back.
  useEffect(() => {
    if (selectedAccountId === ALL_ACCOUNTS) return;
    if (accounts.isLoading || accounts.accounts.length === 0) return;
    if (!accounts.accounts.some(a => a.id === selectedAccountId)) {
      setSelectedAccountId(ALL_ACCOUNTS);
    }
  }, [accounts.accounts, accounts.isLoading, selectedAccountId, setSelectedAccountId]);

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
