import { useState } from 'react';
import { useCriteria, CriteriaSetting } from '@/hooks/useCriteria';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Check, X, Loader2 } from 'lucide-react';

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
    <div className="space-y-3">
      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Label</th>
              <th className="text-left px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium w-28">Category</th>
              <th className="px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium w-16 text-center">Active</th>
              <th className="px-3 py-2 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {criteria.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No criteria yet. Add your first entry rule below.
                </td>
              </tr>
            )}
            {criteria.map(c => (
              <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                {editingId === c.id ? (
                  <>
                    <td className="px-3 py-1.5">
                      <Input
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        className="h-7 bg-background border-border text-xs"
                        autoFocus
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <Input
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value)}
                        className="h-7 bg-background border-border text-xs"
                        placeholder="Category"
                      />
                    </td>
                    <td className="px-3 py-1.5" />
                    <td className="px-3 py-1.5">
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
                    <td className="px-3 py-2.5 text-xs font-medium">{c.label}</td>
                    <td className="px-3 py-2.5">
                      {c.category ? (
                        <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{c.category}</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={() => handleToggle(c)}
                        className="scale-75"
                      />
                    </td>
                    <td className="px-3 py-2.5">
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
              <tr className="bg-primary/5">
                <td className="px-3 py-1.5">
                  <Input
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="e.g. Price at HTF POI"
                    className="h-7 bg-background border-border text-xs"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <Input
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="e.g. Liquidity"
                    className="h-7 bg-background border-border text-xs"
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </td>
                <td className="px-3 py-1.5" />
                <td className="px-3 py-1.5">
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
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setShowAddRow(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Criterion
        </Button>
      )}
    </div>
  );
}
