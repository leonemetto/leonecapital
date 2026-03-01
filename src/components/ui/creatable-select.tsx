import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onAddOption: (value: string) => Promise<void>;
  placeholder?: string;
  label?: string;
  uppercase?: boolean;
}

export function CreatableSelect({
  value,
  onChange,
  options,
  onAddOption,
  placeholder = 'Select or type...',
  uppercase = false,
}: CreatableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const showAddOption =
    query.trim().length > 0 &&
    !options.some(o => o.toLowerCase() === query.trim().toLowerCase());

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(option: string) {
    onChange(option);
    setOpen(false);
    setQuery('');
  }

  async function handleAdd() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setAdding(true);
    await onAddOption(trimmed);
    onChange(uppercase ? trimmed.toUpperCase() : trimmed);
    setOpen(false);
    setQuery('');
    setAdding(false);
  }

  return (
    <div ref={containerRef} className={cn('relative', open && 'z-50')}>
      <button
        type="button"
        onClick={() => {
          setOpen(o => !o);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full flex items-center justify-between mt-1 bg-secondary border border-border h-9 rounded-md px-3 text-sm text-left"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value || placeholder}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          <div className="p-1.5 border-b border-border">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (showAddOption) handleAdd();
                  else if (filtered.length > 0) handleSelect(filtered[0]);
                }
                if (e.key === 'Escape') { setOpen(false); setQuery(''); }
              }}
              placeholder="Search or add new..."
              className="w-full bg-transparent text-sm outline-none px-1 py-0.5 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left transition-colors"
              >
                <Check className={cn('h-3.5 w-3.5 shrink-0', value === option ? 'text-primary' : 'opacity-0')} />
                {option}
              </button>
            ))}
            {showAddOption && (
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-primary font-medium transition-colors border-t border-border"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                {adding ? 'Adding...' : `Add "${uppercase ? query.trim().toUpperCase() : query.trim()}"`}
              </button>
            )}
            {filtered.length === 0 && !showAddOption && (
              <p className="px-3 py-2 text-sm text-muted-foreground">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
