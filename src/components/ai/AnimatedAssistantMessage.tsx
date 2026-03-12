import ReactMarkdown from 'react-markdown';
import { useAnimatedText } from '@/components/ui/animated-text';

interface Props {
  content: string;
  isStreaming: boolean;
}

export function AnimatedAssistantMessage({ content, isStreaming }: Props) {
  // Use word-level animation for a natural streaming feel
  const animatedContent = useAnimatedText(content, " ");

  const displayContent = isStreaming ? content : animatedContent;

  if (!displayContent) {
    return (
      <span className="inline-flex gap-1.5 text-primary/60 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse [animation-delay:300ms]" />
      </span>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1.5 [&>ul]:my-1.5 [&>ol]:my-1.5 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>li]:text-muted-foreground [&>p]:text-foreground/90">
      <ReactMarkdown>{displayContent}</ReactMarkdown>
    </div>
  );
}
