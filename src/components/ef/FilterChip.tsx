import { useState } from 'react';
import { CaretDown, Check, X } from '@phosphor-icons/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

/**
 * A filter that opens a short list. Multi-select by default; pass `single`
 * for one-of choices such as a date range.
 */
export function FilterChip({
  label,
  options,
  selected,
  onChange,
  single = false,
  /** In single mode, the value that means "no filter". */
  neutral,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  single?: boolean;
  neutral?: string;
}) {
  const [open, setOpen] = useState(false);
  const active = single ? selected[0] != null && selected[0] !== neutral : selected.length > 0;
  const first = options.find(o => o.value === selected[0]);
  const summary = !active
    ? label
    : single
      ? first?.label ?? label
      : `${first?.label ?? selected[0]}${selected.length > 1 ? ` +${selected.length - 1}` : ''}`;

  const toggle = (value: string) => {
    if (single) {
      onChange([value]);
      setOpen(false);
      return;
    }
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="inline-flex">
        <PopoverTrigger asChild>
          <button
            type="button"
            data-active={active}
            aria-label={active ? `${label}: ${summary}` : `Filter by ${label.toLowerCase()}`}
            className={cn('ef-chip', active && !single && 'rounded-r-none border-r-0 pr-2')}
          >
            {active && !single && <span className="text-ef-ink-4">{label}</span>}
            <span className="max-w-[140px] truncate">{active || single ? summary : label}</span>
            {(!active || single) && <CaretDown className="h-3 w-3 text-ef-ink-4" />}
          </button>
        </PopoverTrigger>
        {active && !single && (
          <button
            type="button"
            onClick={() => onChange([])}
            aria-label={`Clear ${label.toLowerCase()} filter`}
            className="ef-chip rounded-l-none px-1.5"
            data-active
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <PopoverContent
        align="start"
        className="w-[220px] rounded-control border-ef-line bg-ef-elev p-1 backdrop-blur-none"
        style={{ boxShadow: 'var(--ef-shadow-pop)' }}
      >
        <ul className="m-0 max-h-[280px] list-none overflow-y-auto p-0" role="listbox" aria-label={label} aria-multiselectable={!single}>
          {options.length === 0 && <li className="px-2.5 py-2 text-[12.5px] text-ef-ink-3">Nothing to filter by yet.</li>}
          {options.map(o => {
            const on = selected.includes(o.value);
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => toggle(o.value)}
                  className="ef-focus flex w-full items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-left text-[13px] text-ef-ink-2 transition-colors hover:bg-ef-hover hover:text-ef-ink"
                >
                  <span
                    className={cn(
                      'grid h-3.5 w-3.5 shrink-0 place-items-center border',
                      single ? 'rounded-full' : 'rounded-[4px]',
                      on ? 'border-transparent bg-ef-ink text-ef-bg' : 'border-ef-line-strong',
                    )}
                  >
                    {on && <Check className="h-2.5 w-2.5" weight="bold" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.count != null && <span className="ef-num text-[11px] text-ef-ink-4">{o.count}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
