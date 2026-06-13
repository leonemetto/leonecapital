import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const BREAKEVEN_KEY = 'ef-breakeven-in-winrate';

/** Read the persisted preference. Default true = breakevens count toward win rate. */
export function getBreakevenInWinRate(): boolean {
  if (typeof localStorage === 'undefined') return true;
  return localStorage.getItem(BREAKEVEN_KEY) !== 'false';
}

interface SettingsContextType {
  /** When true (default), breakeven trades sit in the win-rate denominator. */
  countBreakevenInWinRate: boolean;
  setCountBreakevenInWinRate: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [countBreakevenInWinRate, setState] = useState<boolean>(getBreakevenInWinRate);

  const setCountBreakevenInWinRate = useCallback((value: boolean) => {
    setState(value);
    try {
      localStorage.setItem(BREAKEVEN_KEY, value ? 'true' : 'false');
    } catch {
      // localStorage unavailable (private mode, etc.) — keep in-memory state.
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ countBreakevenInWinRate, setCountBreakevenInWinRate }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
