import { useState, useEffect, useRef } from 'react';
import { useDailyJournal, useJournalHistory, DailyJournal as JournalEntry } from '@/hooks/useDailyJournal';
import { cn } from '@/lib/utils';
import { format, parseISO, isToday } from 'date-fns';
import { NotePencil, Smiley, SmileyMeh, SmileySad, SmileyWink, FloppyDisk, BookOpen } from '@phosphor-icons/react';

const MOODS = [
  { value: 1, icon: SmileySad,  label: 'Rough',   color: '#f87171' },
  { value: 2, icon: SmileyMeh,  label: 'Okay',    color: '#fb923c' },
  { value: 3, icon: SmileyMeh,  label: 'Neutral', color: '#f59e0b' },
  { value: 4, icon: Smiley,     label: 'Good',    color: '#34d399' },
  { value: 5, icon: SmileyWink, label: 'Great',   color: '#4ade80' },
];

const LABEL = 'text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]';

function MoodIcon({ value, size = 'sm' }: { value: number | null; size?: 'sm' | 'md' }) {
  if (!value) return null;
  const m = MOODS.find(x => x.value === value);
  if (!m) return null;
  const Icon = m.icon;
  return (
    <Icon
      className={size === 'sm' ? 'h-3.5 w-3.5 shrink-0' : 'h-5 w-5 shrink-0'}
      weight="fill"
      style={{ color: m.color }}
    />
  );
}

function EntryEditor({ date, onSaved }: { date: string; onSaved?: () => void }) {
  const { entry, save } = useDailyJournal(date);
  const [notes, setNotes] = useState('');
  const [keyLesson, setKeyLesson] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      setNotes(entry?.notes ?? '');
      setKeyLesson(entry?.keyLesson ?? '');
      setMood(entry?.mood ?? null);
      if (entry !== undefined) initialized.current = true;
    }
  }, [entry]);

  // Reset when date changes
  useEffect(() => {
    initialized.current = false;
    setNotes('');
    setKeyLesson('');
    setMood(null);
    setDirty(false);
  }, [date]);

  const handleSave = async () => {
    setSaving(true);
    await save({ notes, keyLesson, mood });
    setSaving(false);
    setDirty(false);
    onSaved?.();
  };

  const isEditable = isToday(parseISO(date));

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Mood */}
      <div>
        <p className={LABEL}>Session mood</p>
        <div className="flex gap-1.5 mt-2">
          {MOODS.map(m => {
            const Icon = m.icon;
            const active = mood === m.value;
            return (
              <button
                key={m.value}
                type="button"
                disabled={!isEditable}
                onClick={() => { setMood(prev => prev === m.value ? null : m.value); setDirty(true); }}
                title={m.label}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border transition-all outline-none',
                  isEditable ? 'cursor-pointer' : 'cursor-default',
                  active
                    ? 'border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)]'
                    : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
                )}
              >
                <Icon className="h-4 w-4" weight={active ? 'fill' : 'regular'} style={{ color: active ? m.color : 'rgba(255,255,255,0.25)' }} />
                <span className="text-[9px] font-medium" style={{ color: active ? m.color : 'rgba(255,255,255,0.2)' }}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="flex-1 flex flex-col">
        <p className={LABEL}>Session notes</p>
        <textarea
          value={notes}
          readOnly={!isEditable}
          onChange={e => { setNotes(e.target.value); setDirty(true); }}
          placeholder={isEditable ? "What happened today? Key observations, market conditions..." : "No notes for this day"}
          className="mt-1 flex-1 min-h-[80px] w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-[rgba(255,255,255,0.2)] resize-none outline-none focus:border-[rgba(255,255,255,0.15)] transition-colors"
        />
      </div>

      {/* Key lesson */}
      <div>
        <p className={LABEL}>Key lesson</p>
        <input
          type="text"
          value={keyLesson}
          readOnly={!isEditable}
          onChange={e => { setKeyLesson(e.target.value); setDirty(true); }}
          placeholder={isEditable ? "One takeaway from today..." : "—"}
          className="mt-1 w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 h-9 text-[13px] text-white placeholder:text-[rgba(255,255,255,0.2)] outline-none focus:border-[rgba(255,255,255,0.15)] transition-colors"
        />
      </div>

      {/* Save */}
      {isEditable && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[rgba(255,255,255,0.2)]">
            {entry?.updatedAt && !dirty ? `Saved ${format(parseISO(entry.updatedAt), 'h:mm a')}` : ''}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className={cn(
              'flex items-center gap-1.5 px-4 h-8 rounded-[24px] text-xs font-semibold transition-all outline-none',
              dirty ? 'bg-white text-black hover:bg-white/90' : 'bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.2)] cursor-default'
            )}
          >
            <FloppyDisk className="h-3.5 w-3.5" weight="bold" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

export function DailyJournal() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const { data: history = [] } = useJournalHistory(14);

  const selectedIsToday = selectedDate === today;

  return (
    <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-5 px-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <BookOpen className="h-3.5 w-3.5 text-[rgba(255,255,255,0.3)]" weight="regular" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]">
          Session Journal
        </span>
        <span className="ml-auto text-[11px] text-[rgba(255,255,255,0.25)] font-mono">
          {selectedIsToday ? `Today — ${format(new Date(), 'MMM d')}` : format(parseISO(selectedDate), 'MMM d, yyyy')}
        </span>
        {!selectedIsToday && (
          <button
            onClick={() => setSelectedDate(today)}
            className="text-[10px] text-[rgba(255,255,255,0.4)] hover:text-white border border-[rgba(255,255,255,0.1)] rounded-full px-2.5 py-1 transition-colors outline-none"
          >
            Back to today
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: editor (2/3) */}
        <div className="lg:col-span-2">
          <EntryEditor key={selectedDate} date={selectedDate} />
        </div>

        {/* Right: history (1/3) */}
        <div>
          <p className={cn(LABEL, 'mb-3')}>Past entries</p>
          {history.length === 0 ? (
            <p className="text-[11px] text-[rgba(255,255,255,0.2)] mt-4">No previous entries yet.</p>
          ) : (
            <div className="space-y-1">
              {history.map(h => {
                const isSelected = h.date === selectedDate;
                const dateLabel = isToday(parseISO(h.date))
                  ? 'Today'
                  : format(parseISO(h.date), 'EEE, MMM d');
                return (
                  <button
                    key={h.date}
                    onClick={() => setSelectedDate(h.date)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg border transition-all outline-none',
                      isSelected
                        ? 'bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.15)]'
                        : 'border-transparent hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.07)]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MoodIcon value={h.mood} />
                      <span className="text-[12px] font-medium text-white">{dateLabel}</span>
                    </div>
                    {h.notes && (
                      <p className="text-[11px] text-[rgba(255,255,255,0.3)] mt-0.5 line-clamp-1 pl-5">
                        {h.notes}
                      </p>
                    )}
                    {h.keyLesson && !h.notes && (
                      <p className="text-[11px] text-[rgba(255,255,255,0.3)] mt-0.5 line-clamp-1 pl-5 italic">
                        {h.keyLesson}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
