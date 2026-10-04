import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

/**
 * A panel that slides in from the right over a light scrim, so the list
 * behind it stays readable. Used for trade detail and the day review.
 */
export function SidePanel({
  open,
  onOpenChange,
  label,
  width = 480,
  children,
  onKeyDown,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name for the panel. */
  label: string;
  width?: number;
  children: ReactNode;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
          style={{ background: 'var(--ef-scrim)' }}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onKeyDown={onKeyDown}
          // Focus the panel itself so its keyboard shortcuts work straight away
          // without a focus ring landing on the first button.
          onOpenAutoFocus={e => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }}
          className={cn(
            'fixed right-0 top-0 z-50 flex h-[100dvh] w-full flex-col border-l border-ef-line bg-ef-elev outline-none duration-200',
            'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-8 data-[state=closed]:fade-out-0',
            'data-[state=open]:animate-in data-[state=open]:slide-in-from-right-8 data-[state=open]:fade-in-0',
            className,
          )}
          style={{ maxWidth: width, boxShadow: 'var(--ef-shadow-pop)' }}
        >
          <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const SidePanelClose = DialogPrimitive.Close;
