import { useState, useEffect, useRef } from 'react';
import { useDailyJournal } from '@/hooks/useDailyJournal';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { NotePencil, Smiley, SmileyMeh, SmileySad, SmileyWink, SmileyXEyes, FloppyDisk } from '@phosphor-icons/react';

const MOODS = [
  { value: 1, icon: SmileySad,    label: 'Rough',    color: '#f87171' },
  { value: 2, icon: SmileyMeh,    label: 'Okay',     color: '#fb923c' },
  { value: 3, icon: SmileyMeh,    label: 'Neutral',  color: '#f59e0b' },
  { value: 4, icon: Smiley,       label: 'Good',     color: '#34d399' },
  { value: 5, icon: SmileyWink,   label: 'Great',    color: '#4ade80' },
];

const LABEL = 'text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]';

export function DailyJournal() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { entry, isLoading, save } = useDailyJournal(today);

  const [notes, setNotes] = useState('');
  const [keyLesson, setKeyLesson] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  // Populate from loaded entry (once)
  useEffect(() => {
    if (entry && !initialized.current) {
      setNotes(entry.notes);
      setKeyLesson(entry.keyLesson);
      setMood(entry.mood);
      initialized.current = true;
    }
  }, [entry]);

  const handleSave = async () => {
    setSaving(true);
    await save({ notes, keyLesson, mood });
    setSaving(false);
    setDirty(false);
  };

  const handleMood = (v: number) => {
    setMood(prev => prev === v ? null : v);
    setDirty(true);
  };

  const activeMood = MOODS.find(m => m.mood === mood) ?? MOODS.find(m => m.value === mood);

  return (
    <div className="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] p-5 px-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NotePencil className="h-3.5 w-3.5 text-[rgba(255,255,255,0.3)]" weight="regular" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(255,255,255,0.3)]">
            Session Journal
          </span>
        </div>
        <span className="text-[11px] text-[rgba(255,255,255,0.25)] font-mono">
          {format(new Date(), 'MMM d, yyyy')}
        </span>
      </div>

      {/* Mood selector */}
      <div>
        <p className={LABEL}>How was your session?</p>
        <div className="flex gap-2 mt-2">
          {MOODS.map(m => {
            const Icon = m.icon;
            const active = mood === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => handleMood(m.value)}
                title={m.label}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border transition-all outline-none',
                  active
                    ? 'border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.06)]'
                    : 'border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)]'
                )}
              >
                <Icon
                  className="h-5 w-5 transition-colors"
                  weight={active ? 'fill' : 'regular'}
                  style={{ color: active ? m.color : 'rgba(255,255,255,0.3)' }}
                />
                <span
                  className="text-[9px] font-semibold transition-colors"
                  style={{ color: active ? m.color : 'rgba(255,255,255,0.25)' }}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <p className={LABEL}>Session notes</p>
        <textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setDirty(true); }}
          placeholder="What happened today? Market conditions, key observations..."
          rows={3}
          className="mt-1 w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-[rgba(255,255,255,0.2)] resize-none outline-none focus:border-[rgba(255,255,255,0.2)] transition-colors"
        />
      </div>

      {/* Key lesson */}
      <div>
        <p className={LABEL}>Key lesson</p>
        <input
          type="text"
          value={keyLesson}
          onChange={e => { setKeyLesson(e.target.value); setDirty(true); }}
          placeholder="One thing I'm taking away from today..."
          className="mt-1 w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 h-9 text-[13px] text-white placeholder:text-[rgba(255,255,255,0.2)] outline-none focus:border-[rgba(255,255,255,0.2)] transition-colors"
        />
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between pt-1">
        {entry?.updatedAt && !dirty ? (
          <span className="text-[11px] text-[rgba(255,255,255,0.2)]">
            Saved {format(new Date(entry.updatedAt), 'h:mm a')}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className={cn(
            'flex items-center gap-1.5 px-4 h-8 rounded-[24px] text-xs font-semibold transition-all outline-none',
            dirty
              ? 'bg-white text-black hover:bg-white/90'
              : 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.25)] cursor-default'
          )}
        >
          <FloppyDisk className="h-3.5 w-3.5" weight="bold" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
