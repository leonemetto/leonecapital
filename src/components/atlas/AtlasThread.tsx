import { useEffect, useRef, useState } from 'react';
import { ArrowUp, X } from '@phosphor-icons/react';
import { AnimatedAssistantMessage } from '@/components/ai/AnimatedAssistantMessage';
import { cn } from '@/lib/utils';
import { useAtlas } from './AtlasProvider';
import type { AtlasContextHint } from '@/components/shell/ShellContext';

export const DEFAULT_SUGGESTIONS = [
  'Which instrument makes me the most money?',
  "What's my worst session and why?",
  'Am I more profitable long or short?',
  'What does my best trading day look like?',
];

/**
 * The conversation itself: messages, suggestions and the composer. The side
 * panel and the full page both render this.
 */
export function AtlasThread({
  variant,
  suggestions = DEFAULT_SUGGESTIONS,
  hint,
  onClearHint,
  autoFocus,
}: {
  variant: 'panel' | 'page';
  suggestions?: string[];
  hint?: AtlasContextHint | null;
  onClearHint?: () => void;
  autoFocus?: boolean;
}) {
  const { messages, isLoading, streamingId, send } = useAtlas();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const submit = (text: string) => {
    if (!text.trim() || isLoading) return;
    send(text, hint?.detail);
    setInput('');
    onClearHint?.();
  };

  const page = variant === 'page';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn('ef-scroll-quiet min-h-0 flex-1 overflow-y-auto', page ? 'px-1 py-6' : 'px-4 py-4')}>
        {messages.length === 0 ? (
          <div className={cn('flex h-full flex-col', page ? 'items-center justify-center text-center' : 'justify-end')}>
            <img
              src="/art/atlas-globe.webp"
              alt=""
              width={page ? 220 : 148}
              height={page ? 220 : 148}
              className={cn('ef-art', page ? 'mb-5' : '-ml-3 mb-1')}
            />
            <h2 className={cn('m-0 font-medium tracking-[-0.02em] text-ef-ink', page ? 'text-[26px]' : 'text-[17px]')}>
              Ask about your trading
            </h2>
            <p className={cn('m-0 mt-1.5 text-[13px] leading-relaxed text-ef-ink-3', page && 'max-w-[44ch]')}>
              Atlas reads your logged trades and answers with your own numbers. It does not predict markets.
            </p>
            <ul className={cn('m-0 mt-5 flex list-none p-0', page ? 'max-w-xl flex-wrap justify-center gap-2' : 'flex-col gap-1.5')}>
              {suggestions.map(s => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => submit(s)}
                    className={cn(
                      'ef-focus rounded-control border border-ef-line text-left text-[12.5px] text-ef-ink-2 transition-colors hover:border-ef-line-strong hover:bg-ef-hover hover:text-ef-ink',
                      page ? 'px-3 py-2' : 'w-full px-3 py-2',
                    )}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className={cn('flex flex-col gap-5', page && 'mx-auto max-w-[720px]')}>
            {messages.map(msg =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <p className="m-0 max-w-[88%] whitespace-pre-wrap rounded-surface rounded-br-chip bg-ef-sunken px-3.5 py-2.5 text-[13px] leading-relaxed text-ef-ink">
                    {msg.content}
                  </p>
                </div>
              ) : (
                <div key={msg.id} className="min-w-0">
                  <p className="ef-label m-0 mb-1.5">Atlas</p>
                  <div className="text-[13px] leading-relaxed text-ef-ink">
                    <AnimatedAssistantMessage content={msg.content} isStreaming={streamingId === msg.id} />
                  </div>
                </div>
              ),
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={cn('shrink-0 border-t border-ef-line', page ? 'px-1 pb-1 pt-3' : 'px-4 pb-3 pt-3')}>
        <form
          onSubmit={e => {
            e.preventDefault();
            submit(input);
          }}
          className={cn(page && 'mx-auto max-w-[720px]')}
        >
          {hint && (
            <div className="mb-2 flex items-center gap-1.5">
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-chip bg-ef-sunken py-1 pl-2 pr-1 text-[11.5px] text-ef-ink-2">
                <span className="text-ef-ink-4">About</span>
                <span className="truncate font-medium">{hint.label}</span>
                <button
                  type="button"
                  onClick={onClearHint}
                  aria-label="Remove context"
                  className="ef-focus grid h-4 w-4 place-items-center rounded-[4px] text-ef-ink-4 hover:bg-ef-hover hover:text-ef-ink"
                >
                  <X className="h-2.5 w-2.5" weight="bold" />
                </button>
              </span>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-surface border border-ef-line bg-ef-bg p-1.5 transition-colors focus-within:border-ef-ink-3">
            <label htmlFor={`atlas-input-${variant}`} className="sr-only">Ask Atlas</label>
            <textarea
              id={`atlas-input-${variant}`}
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              rows={1}
              placeholder={hint ? `Ask about ${hint.label}` : 'Ask about your trading'}
              className="max-h-32 min-h-[32px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] leading-relaxed text-ef-ink outline-none placeholder:text-ef-ink-4"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send"
              className="ef-btn ef-btn-primary h-8 w-8 shrink-0 px-0"
            >
              <ArrowUp className="h-3.5 w-3.5" weight="bold" />
            </button>
          </div>
          <p className="m-0 mt-2 text-[10.5px] leading-snug text-ef-ink-4">
            Analysis of your past trades only. Not financial advice.
          </p>
        </form>
      </div>
    </div>
  );
}
