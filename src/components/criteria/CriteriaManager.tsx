import { useState } from 'react';
import { useCriteria, CriteriaSetting } from '@/hooks/useCriteria';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash as Trash2, Pencil, Check, X, CircleNotch as Loader2 } from '@phosphor-icons/react';

export function CriteriaManager() {
  const { criteria, isLoading, addCriteria, updateCriteria, deleteCriteria } = useCriteria();
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      await addCriteria(newLabel.trim(), newCategory.trim());
      setNewLabel('');
      setNewCategory('');
      setShowAddRow(false);
      toast.success('Criterion added');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add criterion');
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
    try {
      await updateCriteria(id, { label: editLabel.trim(), category: editCategory.trim() });
      setEditingId(null);
      toast.success('Criterion updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCriteria(id);
      toast.success('Criterion removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleToggle = async (c: CriteriaSetting) => {
    try {
      await updateCriteria(c.id, { isActive: !c.isActive });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading checklist...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.025]">
              <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-[0.14em] font-semibold">Rule</th>
              <th className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-[0.14em] font-semibold w-32">Group</th>
              <th className="px-4 py-3 text-[10px] text-muted-foreground uppercase tracking-[0.14em] font-semibold w-20 text-center">Live</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {criteria.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-foreground">No entry rules yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Add the checks that must be true before you enter a trade.</p>
                </td>
              </tr>
            )}
            {criteria.map(c => (
              <tr key={c.id} className="hover:bg-white/[0.025] transition-colors">
                {editingId === c.id ? (
                  <>
                    <td className="px-4 py-2">
                      <Input
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        className="h-7 bg-background border-border text-xs"
                        autoFocus
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value)}
                        className="h-7 bg-background border-border text-xs"
                        placeholder="Category"
                      />
                    </td>
                    <td className="px-4 py-2" />
                    <td className="px-4 py-2">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(c.id)}>
                          <Check className="h-3 w-3 text-profit" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                          <X className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-[13px] font-medium text-foreground">{c.label}</td>
                    <td className="px-4 py-3">
                      {c.category ? (
                        <span className="text-[10px] bg-white/[0.045] border border-white/10 px-2 py-1 rounded-full text-muted-foreground">{c.category}</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={() => handleToggle(c)}
                        className="scale-75"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(c)}>
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-3 w-3 text-loss" />
                        </Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Add new row inline */}
            {showAddRow && (
              <tr className="bg-white/[0.025]">
                <td className="px-4 py-2">
                  <Input
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="e.g. Entry near key support level"
                    className="h-7 bg-background border-border text-xs"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="e.g. Risk Management"
                    className="h-7 bg-background border-border text-xs"
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </td>
                <td className="px-4 py-2" />
                <td className="px-4 py-2">
                  <div className="flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleAdd} disabled={adding || !newLabel.trim()}>
                      {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-profit" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setShowAddRow(false); setNewLabel(''); setNewCategory(''); }}>
                      <X className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!showAddRow && (
        <Button variant="ghost" size="sm" className="gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-4 text-xs hover:bg-white/[0.06]" onClick={() => setShowAddRow(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add rule
        </Button>
      )}
    </div>
  );
}
