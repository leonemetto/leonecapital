import { FlaskConical } from 'lucide-react';

export function SandboxBanner() {
  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-center gap-2 text-amber-500">
      <FlaskConical className="h-3.5 w-3.5" />
      <span className="text-[10px] font-bold uppercase tracking-widest">
        Sandbox Mode — You are viewing demo data
      </span>
    </div>
  );
}
