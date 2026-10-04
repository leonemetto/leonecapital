import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
  Plus, UploadSimple, Compass, NotePencil, SunHorizon, Rows, ChartLineUp, DropHalf, Scales,
  ListChecks, Wallet, GearSix, Question, Sun, Moon, Coins, ArrowRight,
} from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { useSharedAccounts, ALL_ACCOUNTS } from '@/contexts/AccountsContext';
import { useView } from '@/contexts/ViewContext';
import { todayLocal, parseLocalDate, cn } from '@/lib/utils';
import { fmtSignedMoney, toneOf, TONE_CLASS } from '@/lib/format';
import { useShell } from './ShellContext';
import { MOD_KEY } from './Sidebar';

const ITEM =
  'flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-ef-ink-2 data-[selected=true]:bg-ef-hover data-[selected=true]:text-ef-ink';
const GROUP =
  'px-1.5 pb-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-ef-ink-4';

function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="ml-auto flex items-center gap-0.5">
      {keys.map(k => (
        <kbd key={k} className="ef-kbd">{k}</kbd>
      ))}
    </span>
  );
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, openLogTrade, openAtlas, openDayReview, openTrade } = useShell();
  const { accounts, selectedAccountId, setSelectedAccountId } = useSharedAccounts();
  const { accountTrades } = useView();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  const instruments = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of accountTrades) counts.set(t.instrument, (counts.get(t.instrument) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [accountTrades]);

  const recent = useMemo(
    () => [...accountTrades].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [accountTrades],
  );

  const run = (fn: () => void) => () => {
    setPaletteOpen(false);
    fn();
  };

  return (
    <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <DialogContent
        aria-describedby={undefined}
        className="top-[18%] w-[calc(100%-32px)] max-w-[560px] translate-y-0 gap-0 overflow-hidden rounded-surface border-ef-line bg-ef-elev p-0 backdrop-blur-none sm:rounded-surface [&>button]:hidden"
        style={{ boxShadow: 'var(--ef-shadow-pop)' }}
      >
        <DialogTitle className="sr-only">Search and commands</DialogTitle>
        <Command className="rounded-none bg-transparent">
          <CommandInput
            placeholder="Search trades, instruments, pages and actions"
            className="h-12 text-[14px] text-ef-ink placeholder:text-ef-ink-4"
          />
          <CommandList className="ef-scroll-quiet max-h-[min(420px,58vh)] pb-1.5">
            <CommandEmpty className="px-4 py-8 text-center text-[13px] text-ef-ink-3">
              Nothing matches. Try an instrument, a page or an action.
            </CommandEmpty>

            <CommandGroup heading="Actions" className={GROUP}>
              <CommandItem className={ITEM} onSelect={run(openLogTrade)}>
                <Plus className="h-4 w-4 text-ef-ink-3" /> Log a trade <Keys keys={['L']} />
              </CommandItem>
              <CommandItem className={ITEM} onSelect={run(() => openDayReview(todayLocal()))}>
                <NotePencil className="h-4 w-4 text-ef-ink-3" /> Review today
              </CommandItem>
              <CommandItem className={ITEM} onSelect={run(() => openAtlas())}>
                <Compass className="h-4 w-4 text-ef-ink-3" /> Ask Atlas <Keys keys={[MOD_KEY, 'J']} />
              </CommandItem>
              <CommandItem className={ITEM} onSelect={run(() => navigate('/import-trades'))}>
                <UploadSimple className="h-4 w-4 text-ef-ink-3" /> Import trades from a file
              </CommandItem>
              <CommandItem
                className={ITEM}
                onSelect={run(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))}
              >
                {resolvedTheme === 'dark' ? <Sun className="h-4 w-4 text-ef-ink-3" /> : <Moon className="h-4 w-4 text-ef-ink-3" />}
                Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'} theme
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading="Go to" className={GROUP}>
              <CommandItem className={ITEM} onSelect={run(() => navigate('/dashboard'))}>
                <SunHorizon className="h-4 w-4 text-ef-ink-3" /> Today <Keys keys={['G', 'D']} />
              </CommandItem>
              <CommandItem className={ITEM} onSelect={run(() => navigate('/journal'))}>
                <Rows className="h-4 w-4 text-ef-ink-3" /> Trades <Keys keys={['G', 'T']} />
              </CommandItem>
              <CommandItem className={ITEM} onSelect={run(() => navigate('/insights'))}>
                <ChartLineUp className="h-4 w-4 text-ef-ink-3" /> Insights · Breakdown <Keys keys={['G', 'I']} />
              </CommandItem>
              <CommandItem className={ITEM} onSelect={run(() => navigate('/insights/leaks'))}>
                <DropHalf className="h-4 w-4 text-ef-ink-3" /> Insights · Leaks
              </CommandItem>
              <CommandItem className={ITEM} onSelect={run(() => navigate('/insights/what-if'))}>
                <Scales className="h-4 w-4 text-ef-ink-3" /> Insights · What-if
              </CommandItem>
              <CommandItem className={ITEM} onSelect={run(() => navigate('/trading-plan'))}>
                <ListChecks className="h-4 w-4 text-ef-ink-3" /> Plan <Keys keys={['G', 'P']} />
              </CommandItem>
              <CommandItem className={ITEM} onSelect={run(() => navigate('/accounts'))}>
                <Wallet className="h-4 w-4 text-ef-ink-3" /> Accounts
              </CommandItem>
              <CommandItem className={ITEM} onSelect={run(() => navigate('/profile'))}>
                <GearSix className="h-4 w-4 text-ef-ink-3" /> Settings
              </CommandItem>
              <CommandItem className={ITEM} onSelect={run(() => navigate('/how-to-use'))}>
                <Question className="h-4 w-4 text-ef-ink-3" /> Help and features
              </CommandItem>
            </CommandGroup>

            {accounts.length > 1 && (
              <CommandGroup heading="Switch account" className={GROUP}>
                <CommandItem className={ITEM} value="account all accounts" onSelect={run(() => setSelectedAccountId(ALL_ACCOUNTS))}>
                  <Wallet className="h-4 w-4 text-ef-ink-3" /> All accounts
                  {selectedAccountId === ALL_ACCOUNTS && <span className="ef-label ml-auto">Current</span>}
                </CommandItem>
                {accounts.map(a => (
                  <CommandItem key={a.id} className={ITEM} value={`account ${a.name} ${a.id}`} onSelect={run(() => setSelectedAccountId(a.id))}>
                    <Wallet className="h-4 w-4 text-ef-ink-3" /> {a.name}
                    {selectedAccountId === a.id && <span className="ef-label ml-auto">Current</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {instruments.length > 0 && (
              <CommandGroup heading="Instruments" className={GROUP}>
                {instruments.map(([name, count]) => (
                  <CommandItem
                    key={name}
                    className={ITEM}
                    value={`instrument ${name}`}
                    onSelect={run(() => navigate(`/journal?instrument=${encodeURIComponent(name)}`))}
                  >
                    <Coins className="h-4 w-4 text-ef-ink-3" /> {name}
                    <span className="ef-num ml-auto flex items-center gap-1.5 text-[11.5px] text-ef-ink-4">
                      {count} {count === 1 ? 'trade' : 'trades'} <ArrowRight className="h-3 w-3" />
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {recent.length > 0 && (
              <CommandGroup heading="Recent trades" className={GROUP}>
                {recent.map(t => (
                  <CommandItem
                    key={t.id}
                    className={ITEM}
                    value={`trade ${t.instrument} ${t.date} ${t.strategy} ${t.session} ${t.id}`}
                    onSelect={run(() => openTrade(t.id, recent.map(r => r.id)))}
                  >
                    <span className="ef-num w-12 shrink-0 text-[11.5px] text-ef-ink-4">
                      {parseLocalDate(t.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="font-medium text-ef-ink">{t.instrument}</span>
                    <span className="text-ef-ink-4">{t.direction}</span>
                    <span className={cn('ef-num ml-auto text-[12.5px]', TONE_CLASS[toneOf(t.pnl)])}>{fmtSignedMoney(t.pnl, 2)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
