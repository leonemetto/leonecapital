import { Flask } from '@phosphor-icons/react';

export function SandboxBanner() {
  return (
    <div className="flex w-full items-center justify-center gap-2 border-b border-ef-line bg-ef-warn-wash px-4 py-1.5 text-ef-warn">
      <Flask className="h-3.5 w-3.5" />
      <span className="ef-num text-[10.5px] font-medium uppercase tracking-[0.12em]">Sandbox · you are viewing a demo account</span>
    </div>
  );
}
