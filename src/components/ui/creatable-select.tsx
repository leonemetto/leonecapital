import { useState } from 'react';
import { Check, CaretDown, Plus } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface CreatableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onAddOption: (value: string) => Promise<void>;
  placeholder?: string;
  label?: string;
  uppercase?: boolean;
  id?: string;
  className?: string;
}

/**
 * A select the user can add to. Built on Popover so it works inside dialogs:
 * the list stays inside the dialog's focus scope and keeps arrow-key support.
 */
export function CreatableSelect({
  value,
  onChange,
  options,
  onAddOption,
  placeholder = 'Select or type...',
  uppercase = false,
  id,
  className,
}: CreatableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const trimmed = query.trim();
  const candidate = uppercase ? trimmed.toUpperCase() : trimmed;
  const showAdd = trimmed.length > 0 && !options.some(o => o.toLowerCase() === trimmed.toLowerCase());

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const handleSelect = (option: string) => {
    onChange(option);
    close();
  };

  const handleAdd = async () => {
    if (!trimmed || adding) return;
    setAdding(true);
    try {
      await onAddOption(trimmed);
      onChange(candidate);
    } catch (error) {
      console.error('Error adding option:', error);
    } finally {
      setAdding(false);
      close();
    }
  };

  return (
    <Popover open={open} onOpenChange={o => (o ? setOpen(true) : close())}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-control border border-ef-line bg-ef-bg px-3 text-left text-[13px] outline-none transition-colors hover:border-ef-line-strong focus-visible:border-ef-ink-3',
            className,
          )}
        >
          <span className={cn('truncate', value ? 'text-ef-ink' : 'text-ef-ink-4')}>{value || placeholder}</span>
          <CaretDown className={cn('h-3.5 w-3.5 shrink-0 text-ef-ink-4 transition-transform', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[200px] rounded-control border-ef-line bg-ef-elev p-0 backdrop-blur-none"
        style={{ boxShadow: 'var(--ef-shadow-pop)' }}
      >
        <Command className="rounded-control bg-transparent">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search or add new"
            className="h-9 text-[13px] text-ef-ink placeholder:text-ef-ink-4"
          />
          <CommandList className="max-h-52 p-1">
            <CommandEmpty className="px-2.5 py-2 text-[12.5px] text-ef-ink-3">No results</CommandEmpty>
            {options.map(option => (
              <CommandItem
                key={option}
                value={option}
                onSelect={() => handleSelect(option)}
                className="flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-[13px] text-ef-ink-2 data-[selected=true]:bg-ef-hover data-[selected=true]:text-ef-ink"
              >
                <Check className={cn('h-3.5 w-3.5 shrink-0', value === option ? 'text-ef-ink' : 'opacity-0')} weight="bold" />
                {option}
              </CommandItem>
            ))}
            {showAdd && (
              <CommandItem
                value={`add ${trimmed}`}
                onSelect={handleAdd}
                disabled={adding}
                className="mt-1 flex cursor-pointer items-center gap-2 rounded-[7px] border-t border-ef-line px-2.5 py-1.5 text-[13px] font-medium text-ef-ink data-[selected=true]:bg-ef-hover"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" weight="bold" />
                {adding ? 'Adding…' : `Add "${candidate}"`}
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
