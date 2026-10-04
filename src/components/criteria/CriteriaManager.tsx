import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, PencilSimple, Plus, Trash, X } from '@phosphor-icons/react';
import { useCriteria, type CriteriaSetting } from '@/hooks/useCriteria';
import { Switch } from '@/components/ui/switch';
import { FIELD } from '@/components/ef/field';
import { cn } from '@/lib/utils';

interface CriteriaManagerProps {
  /** How often each rule was ticked on trades that recorded a checklist. */
  tickRates?: Record<string, { ticked: number; total: number }>;
  /** A rule to offer in the add row, e.g. one suggested from a leak. */
  suggested?: string;
}

/**
 * The entry rules: the checklist shown when a trade is logged. Each rule can
 * be switched off without deleting it, and shows how often it was ticked.
 */
export function CriteriaManager({ tickRates, suggested }: CriteriaManagerProps) {
  const { criteria, isLoading, addCriteria, updateCriteria, deleteCriteria, seedDefaults } = useCriteria();
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!suggested) return;
    setNewLabel(suggested);
    setNewCategory('Edge');
    setShowAddRow(true);
  }, [suggested]);

  const closeAdd = () => {
    setShowAddRow(false);
    setNewLabel('');
    setNewCategory('');
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      await addCriteria(newLabel.trim(), newCategory.trim());
      closeAdd();
      toast.success('Rule added');
    } catch (err: any) {
      toast.error(err.message || 'Could not add the rule');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (c: CriteriaSetting) => {
    setEditingId(c.id);
    setEditLabel(c.label);
    setEditCategory(c.category);
  };

  const saveEdit = async (id: string) => {
    if (!editLabel.trim()) return;
    try {
      await updateCriteria(id, { label: editLabel.trim(), category: editCategory.trim() });
      setEditingId(null);
      toast.success('Rule updated');
    } catch (err: any) {
      toast.error(err.message || 'Could not update the rule');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCriteria(id);
      setConfirmId(null);
      toast.success('Rule removed');
    } catch (err: any) {
      toast.error(err.message || 'Could not remove the rule');
    }
  };

  const handleToggle = async (c: CriteriaSetting) => {
    try {
      await updateCriteria(c.id, { isActive: !c.isActive });
    } catch (err: any) {
      toast.error(err.message || 'Could not update the rule');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 px-5 pb-5" aria-busy="true" aria-label="Loading rules">
        {[0, 1, 2].map(i => <div key={i} className="h-10 animate-pulse rounded-control bg-ef-sunken" />)}
      </div>
    );
  }

  const input = cn(FIELD, 'h-8');

  return (
    <div>
      {criteria.length === 0 && !showAddRow ? (
        <div className="px-5 pb-5">
          <p className="m-0 text-[13px] font-medium text-ef-ink">No entry rules yet</p>
          <p className="m-0 mt-1 max-w-[52ch] text-[12.5px] leading-relaxed text-ef-ink-3">
            Add the checks that must be true before you enter a trade. They appear as a checklist each time you log one.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowAddRow(true)} className="ef-btn ef-btn-primary">
              <Plus className="h-3.5 w-3.5" weight="bold" /> Add a rule
            </button>
            <button
              type="button"
              onClick={() => seedDefaults().then(() => toast.success('Six starter rules added')).catch((e: any) => toast.error(e.message || 'Could not add the starter rules'))}
              className="ef-btn ef-btn-secondary"
            >
              Start from six common rules
            </button>
          </div>
        </div>
      ) : (
        <ul className="m-0 list-none border-t border-ef-line p-0">
          {criteria.map(c => {
            const rate = tickRates?.[c.id];
            return (
              <li key={c.id} className="border-b border-ef-line px-5 py-2.5">
                {editingId === c.id ? (
                  <form onSubmit={e => { e.preventDefault(); saveEdit(c.id); }} className="flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor={`rule-${c.id}`}>Rule</label>
                    <input id={`rule-${c.id}`} value={editLabel} onChange={e => setEditLabel(e.target.value)} autoFocus className={cn(input, 'min-w-[200px] flex-1')} />
                    <label className="sr-only" htmlFor={`group-${c.id}`}>Group</label>
                    <input id={`group-${c.id}`} value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="Group" className={cn(input, 'w-32')} />
                    <button type="submit" className="ef-btn ef-btn-primary ef-btn-sm">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="ef-btn ef-btn-ghost ef-btn-sm">Cancel</button>
                  </form>
                ) : confirmId === c.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-auto text-[13px] text-ef-ink-2">Remove "{c.label}"?</span>
                    <button type="button" onClick={() => setConfirmId(null)} className="ef-btn ef-btn-ghost ef-btn-sm">Cancel</button>
                    <button type="button" onClick={() => handleDelete(c.id)} className="ef-btn ef-btn-sm bg-ef-neg font-semibold text-white hover:opacity-90">Remove</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={c.isActive}
                      onCheckedChange={() => handleToggle(c)}
                      aria-label={`${c.isActive ? 'Turn off' : 'Turn on'} the rule: ${c.label}`}
                      className="shrink-0 scale-[0.8] data-[state=checked]:bg-ef-ink data-[state=unchecked]:bg-ef-line-strong"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn('m-0 text-[13px] leading-snug', c.isActive ? 'text-ef-ink' : 'text-ef-ink-4')}>{c.label}</p>
                      {c.category && <p className="ef-num m-0 mt-0.5 text-[10.5px] uppercase tracking-[0.08em] text-ef-ink-4">{c.category}</p>}
                    </div>
                    {rate && rate.total > 0 && (
                      <span
                        className="ef-num hidden shrink-0 text-right text-[11.5px] text-ef-ink-3 sm:block"
                        title={`Ticked on ${rate.ticked} of ${rate.total} trades that recorded a checklist`}
                      >
                        ticked {Math.round((rate.ticked / rate.total) * 100)}%
                      </span>
                    )}
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button type="button" onClick={() => startEdit(c)} aria-label={`Edit the rule: ${c.label}`} className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
                        <PencilSimple className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => setConfirmId(c.id)} aria-label={`Remove the rule: ${c.label}`} className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0 hover:text-ef-neg">
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {showAddRow ? (
        <form onSubmit={e => { e.preventDefault(); handleAdd(); }} className="flex flex-wrap items-center gap-2 px-5 py-3">
          <label className="sr-only" htmlFor="new-rule">New rule</label>
          <input
            id="new-rule"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Entry near a key support level"
            autoFocus
            className={cn(input, 'min-w-[200px] flex-1')}
          />
          <label className="sr-only" htmlFor="new-group">Group</label>
          <input id="new-group" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Group, e.g. Risk" className={cn(input, 'w-36')} />
          <button type="submit" disabled={adding || !newLabel.trim()} className="ef-btn ef-btn-primary ef-btn-sm">
            <Check className="h-3 w-3" weight="bold" /> {adding ? 'Adding…' : 'Add'}
          </button>
          <button type="button" onClick={closeAdd} aria-label="Cancel" className="ef-btn ef-btn-ghost ef-btn-sm w-7 px-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      ) : criteria.length > 0 ? (
        <div className="px-5 py-3">
          <button type="button" onClick={() => setShowAddRow(true)} className="ef-btn ef-btn-secondary ef-btn-sm">
            <Plus className="h-3 w-3" weight="bold" /> Add a rule
          </button>
        </div>
      ) : null}
    </div>
  );
}
