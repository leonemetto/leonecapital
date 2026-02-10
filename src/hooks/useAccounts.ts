import { useState, useEffect, useCallback } from 'react';
import { TradingAccount, AccountFormData } from '@/types/account';

const STORAGE_KEY = 'edgejournal_accounts';

function loadAccounts(): TradingAccount[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as any[];
    return parsed.map(a => ({
      ...a,
      currentBalance: a.currentBalance ?? a.startingBalance,
    }));
  } catch {
    return [];
  }
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<TradingAccount[]>(loadAccounts);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts]);

  const addAccount = useCallback((data: AccountFormData) => {
    const newAccount: TradingAccount = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setAccounts(prev => [newAccount, ...prev]);
    return newAccount;
  }, []);

  const updateAccount = useCallback((id: string, data: Partial<AccountFormData>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  }, []);

  return { accounts, addAccount, updateAccount, deleteAccount };
}
