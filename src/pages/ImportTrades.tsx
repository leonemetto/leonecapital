import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useSharedTrades } from '@/contexts/TradesContext';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { ArrowLeft, UploadSimple, CheckCircle, Warning, FileText, X } from '@phosphor-icons/react';
import { TradeFormData } from '@/types/trade';
import { cn } from '@/lib/utils';

// ─── Column mapping templates ───────────────────────────────────────────────
// preprocess: optional fn to merge/group rows before row-by-row mapping (e.g. partial fills)
const TEMPLATES: Record<string, { label: string; hint: string; brokers?: string[]; preprocess?: (rows: Record<string, string>[]) => Record<string, string>[]; map: (row: Record<string, string>) => Partial<TradeFormData> | null }> = {
  edgeflow: {
    label: 'EdgeFlow Export',
    hint: 'CSV exported from EdgeFlow Trades DB',
    map: (row) => {
      const date = row['Date'] || row['date'];
      const instrument = row['Instrument'] || row['instrument'];
      const direction = (row['Direction'] || row['direction'])?.toLowerCase();
      const outcome = (row['Outcome'] || row['outcome'])?.toLowerCase();
      const pnl = parseFloat(row['P&L ($)'] || row['P&L'] || row['pnl'] || '0');
      if (!date || !instrument || !direction || !outcome) return null;
      return {
        date, instrument,
        direction: direction === 'long' ? 'long' : 'short',
        outcome: outcome === 'win' ? 'win' : outcome === 'loss' ? 'loss' : 'breakeven',
        pnl,
        strategy: row['Strategy'] || row['strategy'] || '',
        session: row['Session'] || row['session'] || '',
        rMultiple: row['R-Multiple'] ? parseFloat(row['R-Multiple']) : undefined,
        riskPercent: row['Risk %'] ? parseFloat(row['Risk %']) : undefined,
        htfBias: row['HTF Bias'] || row['htfBias'] || undefined,
        emotionalState: row['Emotional State'] ? parseInt(row['Emotional State']) : undefined,
        confidenceLevel: row['Confidence'] ? parseInt(row['Confidence']) : undefined,
        timeInTrade: row['Time (min)'] ? parseInt(row['Time (min)']) : undefined,
        followedPlan: row['Followed Plan'] === 'Yes' ? true : row['Followed Plan'] === 'No' ? false : undefined,
        notes: row['Notes'] || row['notes'] || '',
      };
    },
  },
  mt4: {
    label: 'MT4 / MT5',
    hint: 'MetaTrader 4 or 5 Account History export',
    brokers: ['Exness', 'XM', 'Pepperstone', 'IC Markets', 'HFM', 'FBS', 'Admirals', 'BlackBull', 'Vantage', 'and 100+ more'],
    map: (row) => {
      const ticket = row['Ticket'] || row['ticket'];
      const symbol = row['Item'] || row['Symbol'] || row['symbol'];
      const type = (row['Type'] || row['type'] || '').toLowerCase();
      const profit = parseFloat(row['Profit'] || row['profit'] || '0');
      const openTime = row['Open Time'] || row['open_time'] || row['OpenTime'];
      if (!symbol || !openTime) return null;
      const date = openTime.slice(0, 10);
      const isBuy = type.includes('buy');
      const isSell = type.includes('sell');
      if (!isBuy && !isSell) return null;
      return {
        date,
        instrument: symbol,
        direction: isBuy ? 'long' : 'short',
        outcome: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven',
        pnl: profit,
        notes: ticket ? `MT4 Ticket #${ticket}` : '',
        strategy: '',
        session: '',
      };
    },
  },
  tradingview: {
    label: 'TradingView',
    hint: 'Strategy Tester → List of Trades → Export CSV',
    brokers: ['TradingView Paper Trading', 'TradingView Strategy Tester'],
    map: (row) => {
      // Only process Exit rows — they carry the realised P&L
      const type = (row['Type'] || '').toLowerCase();
      if (!type.includes('exit')) return null;
      const dateTime = row['Date/Time'] || row['Date'] || '';
      if (!dateTime) return null;
      const profitRaw = row['Profit'] || row['Profit USDT'] || row['Profit USD'] || row['Profit, USDT'] || '0';
      const profit = parseFloat(profitRaw.replace(/[^0-9.\-]/g, '')) || 0;
      const symbol = row['Symbol'] || row['Ticker'] || row['Instrument'] || 'Unknown';
      const isLong = type.includes('long');
      return {
        date: dateTime.slice(0, 10),
        instrument: symbol,
        direction: isLong ? 'long' : 'short',
        outcome: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven',
        pnl: profit,
        notes: row['Trade #'] ? `TradingView Trade #${row['Trade #']}` : 'TradingView',
        strategy: '',
        session: '',
      };
    },
  },
  ctrader: {
    label: 'cTrader',
    hint: 'History → Deals → Export to CSV',
    brokers: ['Pepperstone', 'IC Markets', 'FxPro', 'Axiory', 'FXCM', 'ThinkMarkets'],
    map: (row) => {
      // cTrader: Position ID, Symbol, Direction, Volume (lots), Entry Price, Close Price, Commission, Swap, Net Profit, Open Time, Close Time
      const symbol = row['Symbol'] || row['symbol'];
      const direction = (row['Direction'] || row['direction'] || row['Side'] || '').toLowerCase();
      const profit = parseFloat(row['Net Profit'] || row['Net profit'] || row['Profit'] || row['profit'] || '0');
      const closeTime = row['Close Time'] || row['close_time'] || row['CloseTime'] || row['Date'] || '';
      if (!symbol || !closeTime) return null;
      const isBuy = direction.includes('buy') || direction.includes('long');
      const posId = row['Position ID'] || row['Deal ID'] || '';
      return {
        date: closeTime.slice(0, 10),
        instrument: symbol,
        direction: isBuy ? 'long' : 'short',
        outcome: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven',
        pnl: profit,
        notes: posId ? `cTrader Position #${posId}` : 'cTrader',
        strategy: '',
        session: '',
      };
    },
  },
  deriv: {
    label: 'Deriv',
    hint: 'Reports → Profit/Loss → Export CSV',
    brokers: ['Deriv', 'Binary.com'],
    map: (row) => {
      // Deriv Trade History: Date, Trade ID, Trade type, Asset, Buy price, Sell price, Profit/Loss
      // Deriv Statement: Date, Ref., Description, Action, Credit/Debit, Balance
      const asset = row['Asset'] || row['Symbol'] || row['Instrument'] || row['Description'] || '';
      const profitRaw = row['Profit/Loss'] || row['Profit / Loss'] || row['Credit/Debit'] || row['Net P&L'] || '';
      const profit = parseFloat(profitRaw.replace(/[^0-9.\-]/g, '')) || 0;
      const dateRaw = row['Date'] || row['Close Time'] || row['Sell Time'] || '';
      if (!dateRaw || !asset) return null;
      const tradeType = (row['Trade type'] || row['Type'] || row['Action'] || '').toLowerCase();
      // Skip deposits / withdrawals
      if (tradeType && (tradeType.includes('deposit') || tradeType.includes('withdrawal') || tradeType.includes('transfer'))) return null;
      const isLong = tradeType.includes('call') || tradeType.includes('rise') || tradeType.includes('buy') || tradeType.includes('long');
      const ref = row['Ref.'] || row['Trade ID'] || '';
      return {
        date: dateRaw.slice(0, 10),
        instrument: asset,
        direction: isLong ? 'long' : 'short',
        outcome: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven',
        pnl: profit,
        notes: ref ? `Deriv Ref #${ref}` : 'Deriv',
        strategy: '',
        session: '',
      };
    },
  },
  binance: {
    label: 'Binance',
    hint: 'Futures → Orders → Closed Positions → Export',
    brokers: ['Binance Futures', 'Binance Spot'],
    map: (row) => {
      // Binance Futures Closed Positions: Symbol, Closed PNL, Avg Entry Price, Avg Close Price, Open Time, Close Time
      // Binance Trade History: Time, Symbol, Side, Price, Qty, Realized Profit
      const symbol = row['Symbol'] || row['symbol'] || row['Pair'] || '';
      const profitRaw = row['Closed PNL'] || row['Realized Profit'] || row['realizedProfit'] || row['PNL'] || row['Profit'] || '0';
      const profit = parseFloat(profitRaw.replace(/[^0-9.\-]/g, '')) || 0;
      const closeTime = row['Close Time'] || row['closeTime'] || row['Time'] || row['time'] || row['Date'] || '';
      if (!symbol || !closeTime) return null;
      const side = (row['Side'] || row['side'] || row['Direction'] || '').toLowerCase();
      const isLong = side.includes('long') || side.includes('buy');
      return {
        date: closeTime.slice(0, 10),
        instrument: symbol,
        direction: isLong ? 'long' : 'short',
        outcome: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven',
        pnl: profit,
        notes: row['Order ID'] ? `Binance #${row['Order ID']}` : 'Binance',
        strategy: '',
        session: '',
      };
    },
  },
  ibkr: {
    label: 'Interactive Brokers',
    hint: 'Reports → Activity Statement → Trades section',
    brokers: ['IBKR', 'Interactive Brokers'],
    map: (row) => {
      // IBKR Activity Statement Trades section
      // Symbol, Date/Time, Quantity, T. Price, Proceeds, Comm/Fee, Basis, Realized P/L, Asset Category
      const symbol = row['Symbol'] || row['symbol'];
      const realizedPL = parseFloat(row['Realized P/L'] || row['Realized PnL'] || row['Realized P&L'] || '0');
      const dateTime = row['Date/Time'] || row['Date'] || '';
      const assetCat = (row['Asset Category'] || row['DataDiscriminator'] || '').toLowerCase();
      // Skip non-data rows (headers, totals, subtotals)
      if (assetCat.includes('header') || assetCat.includes('total') || assetCat.includes('subtotal')) return null;
      if (!symbol || !dateTime) return null;
      const qty = parseFloat(row['Quantity'] || row['quantity'] || '0');
      return {
        date: dateTime.slice(0, 10),
        instrument: symbol,
        direction: qty >= 0 ? 'long' : 'short',
        outcome: realizedPL > 0 ? 'win' : realizedPL < 0 ? 'loss' : 'breakeven',
        pnl: realizedPL,
        notes: 'IBKR',
        strategy: '',
        session: '',
      };
    },
  },
  tradestation: {
    label: 'TradeStation',
    hint: 'TradeManager → Closed Positions → Export',
    brokers: ['TradeStation'],
    map: (row) => {
      // TradeStation: Symbol, Entry Date, Exit Date, Direction (Long/Short), Quantity, Entry Price, Exit Price, Commissions, Profit/Loss
      const symbol = row['Symbol'] || row['symbol'];
      const profitRaw = row['Profit/Loss'] || row['P/L'] || row['Net Profit'] || row['Profit'] || '0';
      const profit = parseFloat(profitRaw.replace(/[^0-9.\-]/g, '')) || 0;
      const exitDate = row['Exit Date'] || row['Close Date'] || row['Date'] || '';
      if (!symbol || !exitDate) return null;
      const direction = (row['Direction'] || row['Side'] || row['Type'] || '').toLowerCase();
      const isLong = direction.includes('long') || direction.includes('buy');
      return {
        date: exitDate.slice(0, 10),
        instrument: symbol,
        direction: isLong ? 'long' : 'short',
        outcome: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven',
        pnl: profit,
        notes: 'TradeStation',
        strategy: '',
        session: '',
      };
    },
  },
  bybit: {
    label: 'Bybit',
    hint: 'Orders → Closed PnL → Export CSV',
    brokers: ['Bybit Futures', 'Bybit Spot'],
    map: (row) => {
      // Bybit Closed PnL: Symbol, Side, Qty, Entry Price, Exit Price, Closed P&L, Open Time, Close Time
      // Bybit Trade History: Symbol, Side, Order Price, Filled Price, Qty, Closed P&L, Create Time
      const symbol = row['Symbol'] || row['symbol'] || row['Pair'] || '';
      const profitRaw = row['Closed P&L'] || row['Closed PnL'] || row['Realized P&L'] || row['PnL'] || row['Profit'] || '0';
      const profit = parseFloat(profitRaw.replace(/[^0-9.\-]/g, '')) || 0;
      const closeTime = row['Close Time'] || row['Create Time'] || row['Time'] || row['Date'] || '';
      if (!symbol || !closeTime) return null;
      const side = (row['Side'] || row['side'] || row['Direction'] || '').toLowerCase();
      const isLong = side.includes('long') || side.includes('buy');
      return {
        date: closeTime.slice(0, 10),
        instrument: symbol,
        direction: isLong ? 'long' : 'short',
        outcome: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven',
        pnl: profit,
        notes: row['Order ID'] ? `Bybit #${row['Order ID']}` : 'Bybit',
        strategy: '',
        session: '',
      };
    },
  },
  oanda: {
    label: 'OANDA',
    hint: 'Account → Transaction History → Export CSV',
    brokers: ['OANDA'],
    map: (row) => {
      // OANDA Transaction History: Transaction ID, Time, Type, Instrument, Units, Price, P&L, Account Balance
      const instrument = row['Instrument'] || row['instrument'] || row['Market'] || '';
      const profitRaw = row['P&L'] || row['P/L'] || row['Profit'] || row['Realized P&L'] || '0';
      const profit = parseFloat(profitRaw.replace(/[^0-9.\-]/g, '')) || 0;
      const timeRaw = row['Time'] || row['Date'] || row['Close Time'] || '';
      const type = (row['Type'] || row['Transaction'] || '').toLowerCase();
      // Only process closing transactions
      if (type && !type.includes('close') && !type.includes('fill') && !type.includes('trade') && type !== '') {
        if (type.includes('deposit') || type.includes('withdrawal') || type.includes('fund')) return null;
      }
      if (!instrument || !timeRaw) return null;
      const units = parseFloat(row['Units'] || row['units'] || '0');
      return {
        date: timeRaw.slice(0, 10),
        instrument,
        direction: units >= 0 ? 'long' : 'short',
        outcome: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven',
        pnl: profit,
        notes: row['Transaction ID'] ? `OANDA #${row['Transaction ID']}` : 'OANDA',
        strategy: '',
        session: '',
      };
    },
  },
  thinkorswim: {
    label: 'Thinkorswim',
    hint: 'Account Statement → Trade History → Export CSV',
    brokers: ['Thinkorswim', 'TD Ameritrade', 'Charles Schwab'],
    map: (row) => {
      // TOS Account Statement: Date, Time, Type, Symbol, Quantity, Price, Commission, Net Amount
      const symbol = row['Symbol'] || row['symbol'] || row['Instrument'] || '';
      const netAmount = parseFloat((row['Net Amount'] || row['Net amount'] || row['Amount'] || row['P/L'] || '0').replace(/[^0-9.\-]/g, '')) || 0;
      const dateRaw = row['Date'] || row['date'] || row['Trade Date'] || '';
      const type = (row['Type'] || row['type'] || row['Action'] || '').toLowerCase();
      // Skip non-trade rows (money movements, dividends, etc.)
      if (type.includes('money') || type.includes('dividend') || type.includes('interest') || type.includes('journal')) return null;
      if (!symbol || !dateRaw) return null;
      const qty = parseFloat(row['Quantity'] || row['Qty'] || row['quantity'] || '0');
      const action = (row['Action'] || row['Side'] || row['Type'] || '').toLowerCase();
      const isLong = action.includes('buy') || action.includes('long') || qty > 0;
      return {
        date: dateRaw.slice(0, 10),
        instrument: symbol,
        direction: isLong ? 'long' : 'short',
        outcome: netAmount > 0 ? 'win' : netAmount < 0 ? 'loss' : 'breakeven',
        pnl: netAmount,
        notes: 'Thinkorswim',
        strategy: '',
        session: '',
      };
    },
  },
  ig: {
    label: 'IG Markets',
    hint: 'My IG → History → Transaction History → Export',
    brokers: ['IG Markets', 'IG'],
    map: (row) => {
      // IG Transaction History: Date/Time Opened, Date/Time Closed, Market, Direction, Size, Opening, Closing, Profit/Loss
      const market = row['Market'] || row['Symbol'] || row['Instrument'] || '';
      const profitRaw = row['Profit/Loss'] || row['P&L'] || row['Net Profit'] || row['Profit'] || '0';
      const profit = parseFloat(profitRaw.replace(/[$(£€),]/g, '').trim()) || 0;
      const closedTime = row['Date/Time Closed'] || row['Close Date'] || row['Date'] || '';
      if (!market || !closedTime) return null;
      const direction = (row['Direction'] || row['Side'] || row['Type'] || '').toLowerCase();
      const isLong = direction.includes('buy') || direction.includes('long');
      return {
        date: closedTime.slice(0, 10),
        instrument: market,
        direction: isLong ? 'long' : 'short',
        outcome: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven',
        pnl: profit,
        notes: row['Reference'] ? `IG #${row['Reference']}` : 'IG Markets',
        strategy: '',
        session: '',
      };
    },
  },
  ninjatrader: {
    label: 'NinjaTrader',
    hint: 'Trade Performance → Export → CSV',
    brokers: ['NinjaTrader'],
    map: (row) => {
      // NinjaTrader Trade Performance: Instrument, Account, Strategy, Market Pos., Quantity, Entry Price, Exit Price, Profit, Entry Time, Exit Time
      const instrument = row['Instrument'] || row['Symbol'] || row['instrument'] || '';
      const profitRaw = row['Profit'] || row['Net Profit'] || row['P&L'] || '0';
      const profit = parseFloat(profitRaw.replace(/[^0-9.\-]/g, '')) || 0;
      const exitTime = row['Exit Time'] || row['Exit Date'] || row['Close Time'] || row['Date'] || '';
      if (!instrument || !exitTime) return null;
      const marketPos = (row['Market Pos.'] || row['Direction'] || row['Side'] || '').toLowerCase();
      const isLong = marketPos.includes('long') || marketPos.includes('buy');
      return {
        date: exitTime.slice(0, 10),
        instrument,
        direction: isLong ? 'long' : 'short',
        outcome: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven',
        pnl: profit,
        notes: row['Strategy'] ? `NT · ${row['Strategy']}` : 'NinjaTrader',
        strategy: row['Strategy'] || '',
        session: '',
      };
    },
  },
  tradovate: {
    label: 'Tradovate',
    hint: 'Reports → Performance → Export CSV  (or Position History CSV)',
    brokers: ['Tradovate'],
    preprocess: (rows) => {
      // Position History: group partial fills into one trade per entry
      // Tradovate assigns slightly different timestamps to partial fills of the same entry,
      // so we group by Position ID + entry minute (truncated to MM/DD/YYYY HH:MM)
      if (!rows.length || !('Position ID' in rows[0])) return rows;
      const groups = new Map<string, Record<string, string>>();
      for (const row of rows) {
        const posId = row['Position ID'] || '';
        const boughtTs = row['Bought Timestamp'] || '';
        const soldTs = row['Sold Timestamp'] || '';
        // Determine entry side: whichever timestamp is earlier is the entry
        const buyTime = boughtTs ? new Date(boughtTs).getTime() : Infinity;
        const sellTime = soldTs ? new Date(soldTs).getTime() : Infinity;
        const entryTs = buyTime < sellTime ? boughtTs : soldTs;
        // Truncate to minute to absorb sub-second differences between partial fills
        const entryMinute = entryTs.slice(0, 16);
        const key = `${posId}-${entryMinute}`;
        if (!groups.has(key)) {
          groups.set(key, { ...row });
        } else {
          const existing = groups.get(key)!;
          // Sum P&L and qty across partial fills
          existing['P/L'] = String((parseFloat(existing['P/L'] || '0')) + (parseFloat(row['P/L'] || '0')));
          existing['Paired Qty'] = String((parseFloat(existing['Paired Qty'] || '0')) + (parseFloat(row['Paired Qty'] || '0')));
        }
      }
      return Array.from(groups.values());
    },
    map: (row) => {
      // Supports two Tradovate export formats:
      // 1. Performance CSV: symbol, pnl ($65.00 / $(240.00)), boughtTimestamp, soldTimestamp
      // 2. Position History CSV: Contract, P/L (plain number), Trade Date, Bought Timestamp, Sold Timestamp

      // Detect format by checking which columns exist
      const isPerformance = 'boughtTimestamp' in row;
      const isPositionHistory = 'Trade Date' in row || 'Contract' in row;

      const symbol = row['symbol'] || row['Contract'] || '';
      if (!symbol) return null;

      // Parse P&L — Performance uses "$65.00" / "$(240.00)", Position History uses plain "-240.00"
      let profit = 0;
      const pnlRaw = row['pnl'] || row['P/L'] || row['P&L'] || '0';
      if (pnlRaw.includes('(')) {
        profit = -(parseFloat(pnlRaw.replace(/[$(),\s]/g, '')) || 0);
      } else {
        profit = parseFloat(pnlRaw.replace(/[$,\s]/g, '')) || 0;
      }

      // Parse date — Performance: "MM/DD/YYYY HH:MM:SS", Position History: "YYYY-MM-DD"
      const boughtTs = row['boughtTimestamp'] || row['Bought Timestamp'] || '';
      const soldTs = row['soldTimestamp'] || row['Sold Timestamp'] || '';
      const tradeDate = row['Trade Date'] || '';

      let date = '';
      let isLong = true;

      if (boughtTs && soldTs) {
        const buyTime = new Date(boughtTs).getTime();
        const sellTime = new Date(soldTs).getTime();
        isLong = buyTime < sellTime; // bought before sold = long
        const entryStr = isLong ? boughtTs : soldTs;
        // Convert MM/DD/YYYY to YYYY-MM-DD
        const parts = entryStr.split(' ')[0].split('/');
        date = parts.length === 3 ? `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}` : entryStr.slice(0, 10);
      } else if (tradeDate) {
        date = tradeDate.slice(0, 10);
        // Position History: determine direction from Bought/Sold timestamps if available
        if (row['Bought Timestamp'] && row['Sold Timestamp']) {
          const buyTime = new Date(row['Bought Timestamp']).getTime();
          const sellTime = new Date(row['Sold Timestamp']).getTime();
          isLong = buyTime < sellTime;
        }
      }

      if (!date) return null;

      // Parse duration for timeInTrade
      let timeInTrade: number | undefined;
      const dur = row['duration'] || '';
      if (dur) {
        const minMatch = dur.match(/(\d+)min/);
        const secMatch = dur.match(/(\d+)sec/);
        const mins = minMatch ? parseInt(minMatch[1]) : 0;
        const secs = secMatch ? parseInt(secMatch[1]) : 0;
        timeInTrade = mins + Math.round(secs / 60) || undefined;
      }

      return {
        date,
        instrument: symbol,
        direction: isLong ? 'long' : 'short',
        outcome: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven',
        pnl: profit,
        timeInTrade,
        notes: 'Tradovate',
        strategy: '',
        session: '',
      };
    },
  },
  generic: {
    label: 'Generic CSV',
    hint: 'Map any CSV with date, instrument, direction, outcome, P&L columns',
    map: (row) => {
      // Try common column name variations
      const date = row['date'] || row['Date'] || row['trade_date'] || row['TradeDate'] || row['open_date'];
      const instrument = row['instrument'] || row['Instrument'] || row['symbol'] || row['Symbol'] || row['pair'] || row['Pair'];
      const rawDir = (row['direction'] || row['Direction'] || row['side'] || row['Side'] || row['type'] || row['Type'] || '').toLowerCase();
      const rawOut = (row['outcome'] || row['Outcome'] || row['result'] || row['Result'] || '').toLowerCase();
      const pnl = parseFloat(row['pnl'] || row['PnL'] || row['P&L'] || row['profit'] || row['Profit'] || row['net_pnl'] || '0');
      if (!date || !instrument) return null;
      const direction: 'long' | 'short' = rawDir.includes('buy') || rawDir.includes('long') ? 'long' : 'short';
      let outcome: 'win' | 'loss' | 'breakeven' = 'breakeven';
      if (rawOut.includes('win') || pnl > 0) outcome = 'win';
      else if (rawOut.includes('loss') || pnl < 0) outcome = 'loss';
      return {
        date: date.slice(0, 10),
        instrument,
        direction,
        outcome,
        pnl,
        notes: '',
        strategy: '',
        session: '',
      };
    },
  },
};

// ─── CSV parser ──────────────────────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    values.push(cur.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

export default function ImportTrades() {
  const navigate = useNavigate();
  const { addTrade } = useSharedTrades();
  const { accounts } = useSharedAccounts();
  const fileRef = useRef<HTMLInputElement>(null);

  const [template, setTemplate] = useState<keyof typeof TEMPLATES>('edgeflow');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Default to the first account so imported trades are always assigned
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<Array<{ parsed: Partial<TradeFormData> | null; raw: Record<string, string> }>>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState('');

  function handleFile(file: File) {
    setResult(null);
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      const tmpl = TEMPLATES[template];
      const processed = tmpl.preprocess ? tmpl.preprocess(parsed) : parsed;
      setRows(processed);
      setPreview(processed.slice(0, 5).map((r) => ({ parsed: tmpl.map(r), raw: r })));
    };
    reader.readAsText(file);
  }

  function handleTemplateChange(t: keyof typeof TEMPLATES) {
    setTemplate(t);
    if (rows.length > 0) {
      const tmpl = TEMPLATES[t];
      const processed = tmpl.preprocess ? tmpl.preprocess(rows) : rows;
      setRows(processed);
      setPreview(processed.slice(0, 5).map((r) => ({ parsed: tmpl.map(r), raw: r })));
    }
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    setError('');
    const tmpl = TEMPLATES[template];
    let imported = 0, skipped = 0;

    for (const row of rows) {
      const parsed = tmpl.map(row);
      if (!parsed || !parsed.date || !parsed.instrument) { skipped++; continue; }
      try {
        await addTrade({
          date: parsed.date,
          instrument: parsed.instrument,
          direction: parsed.direction ?? 'long',
          outcome: parsed.outcome ?? 'breakeven',
          pnl: parsed.pnl ?? 0,
          strategy: parsed.strategy ?? '',
          session: parsed.session ?? '',
          notes: parsed.notes ?? '',
          rMultiple: parsed.rMultiple,
          riskPercent: parsed.riskPercent,
          htfBias: parsed.htfBias,
          emotionalState: parsed.emotionalState,
          confidenceLevel: parsed.confidenceLevel,
          timeInTrade: parsed.timeInTrade,
          followedPlan: parsed.followedPlan,
          accountId: selectedAccountId || undefined,
        });
        imported++;
      } catch {
        skipped++;
      }
    }

    setImporting(false);
    setResult({ imported, skipped });
  }

  const validCount = preview.filter((p) => p.parsed !== null).length;

  return (
    <AppLayout>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border" style={{ paddingBottom: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)} style={{ padding: '6px', borderRadius: 8, background: 'transparent', border: 'none', color: 'var(--ef-ink-3)', cursor: 'pointer' }}>
            <ArrowLeft className="h-4 w-4" weight="regular" />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ef-ink)' }}>Import Trades</h1>
            <div className="font-mono" style={{ fontSize: 12.5, color: 'var(--ef-ink-3)', marginTop: 2 }}>Supports 14 formats — MT4/MT5, cTrader, TradingView, Tradovate, Binance, Bybit, OANDA, IG, IBKR, and more</div>
          </div>
        </div>

        {result ? (
          /* ── Result state ── */
          <div className="text-center" style={{ background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)', borderRadius: 14, padding: '32px 24px' }}>
            <CheckCircle size={40} color="var(--ef-pos)" weight="fill" style={{ margin: '0 auto 16px' }} />
            <div>
              <p style={{ fontSize: 20, fontWeight: 500, color: 'var(--ef-ink)', margin: '0 0 4px' }}>{result.imported} trades imported</p>
              {result.skipped > 0 && <p style={{ fontSize: 13, color: 'var(--ef-ink-3)', margin: 0 }}>{result.skipped} rows skipped (missing required fields)</p>}
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={() => navigate('/journal')} className="px-5 py-2 rounded-[24px] bg-foreground text-background text-sm font-semibold">View Trades</button>
              <button onClick={() => { setResult(null); setRows([]); setFileName(''); setPreview([]); }} className="px-5 py-2 rounded-[24px] border border-border text-foreground text-sm">Import More</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step 1 — Template */}
            <div className="rounded-[14px] p-5" style={{ background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 mb-3">1. Select Your Broker / Format</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(Object.keys(TEMPLATES) as (keyof typeof TEMPLATES)[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateChange(key)}
                    className={cn(
                      'text-left p-3 rounded-xl border transition-all',
                      template === key
                        ? 'border-foreground/30 bg-muted'
                        : 'border-border hover:border-foreground/25'
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground mb-0.5">{TEMPLATES[key].label}</p>
                    <p className="text-[11px] text-muted-foreground/60 leading-snug mb-1.5">{TEMPLATES[key].hint}</p>
                    {TEMPLATES[key].brokers && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {TEMPLATES[key].brokers!.map((b) => (
                          <span key={b} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: 'var(--ef-bg-sunken)', color: 'var(--ef-ink-3)', border: '1px solid var(--ef-line)' }}>
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 — Account */}
            {accounts.length > 0 && (
              <div className="rounded-[14px] p-5" style={{ background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 mb-3">2. Assign to Account</p>
                <div className="flex flex-wrap gap-2">
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAccountId(a.id)}
                      className={cn('px-3 py-1.5 rounded-full text-xs border transition-all', selectedAccountId === a.id ? 'border-foreground/30 bg-foreground text-background' : 'border-border text-muted-foreground')}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Upload */}
            <div className="rounded-[14px] p-5" style={{ background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 mb-3">3. Upload CSV File</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {!fileName ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border border-dashed border-border rounded-xl py-10 flex flex-col items-center gap-3 hover:border-foreground/25 hover:bg-muted/30 transition-all"
                >
                  <UploadSimple className="h-8 w-8 text-muted-foreground/40" weight="regular" />
                  <p className="text-sm text-muted-foreground/60">Click to select a CSV file</p>
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                  <FileText className="h-5 w-5 text-muted-foreground/60 shrink-0" weight="regular" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground/50">{rows.length} rows detected</p>
                  </div>
                  <button onClick={() => { setFileName(''); setRows([]); setPreview([]); if (fileRef.current) fileRef.current.value = ''; }} className="text-muted-foreground/40 hover:text-foreground">
                    <X className="h-4 w-4" weight="regular" />
                  </button>
                </div>
              )}
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="rounded-[14px] p-5" style={{ background: 'var(--ef-bg-elev)', border: '1px solid var(--ef-line)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 mb-3">Preview (first 5 rows)</p>
                <div className="space-y-2">
                  {preview.map((p, i) => (
                    <div key={i} className={cn('flex items-center gap-3 p-3 rounded-lg text-sm', p.parsed ? 'bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.2)]' : 'bg-[rgba(248,113,113,0.06)] border border-[rgba(248,113,113,0.2)]')}>
                      {p.parsed ? (
                        <CheckCircle className="h-4 w-4 text-[#10b981] shrink-0" weight="fill" />
                      ) : (
                        <Warning className="h-4 w-4 text-[#f87171] shrink-0" weight="fill" />
                      )}
                      {p.parsed ? (
                        <span className="text-foreground font-mono text-xs">
                          {p.parsed.date} · {p.parsed.instrument} · {p.parsed.direction} · {p.parsed.outcome} · ${p.parsed.pnl?.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs">Row {i + 1} — missing required fields (date, instrument)</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/50 mt-3">
                  {rows.length} total rows — estimated {Math.round((validCount / Math.min(preview.length, rows.length)) * rows.length)} will import successfully
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] text-[#f87171] text-sm">
                <Warning className="h-4 w-4 shrink-0" weight="fill" />
                {error}
              </div>
            )}

            {rows.length > 0 && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full py-3 rounded-[24px] bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-50"
              >
                {importing ? 'Importing…' : `Import ${rows.length} Rows`}
              </button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
