import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserCircle } from '@phosphor-icons/react';

interface NicknamePromptProps {
  onSubmit: (nickname: string) => Promise<void>;
}

export function NicknamePrompt({ onSubmit }: NicknamePromptProps) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setLoading(true);
    try {
      await onSubmit(nickname.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-xl p-8 max-w-sm w-full text-center space-y-5"
      >
        <div className="p-3 rounded-xl bg-muted inline-block">
          <UserCircle className="h-8 w-8 text-foreground" weight="regular" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Welcome to EdgeFlow</h1>
        <p className="text-sm text-muted-foreground/70">What should we call you?</p>
        <Input
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          placeholder="Enter your nickname"
          maxLength={30}
          autoFocus
        />
        <Button
          type="submit"
          disabled={!nickname.trim() || loading}
          className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-[24px] font-semibold"
        >
          {loading ? 'Saving...' : "Let's Go"}
        </Button>
      </form>
    </div>
  );
}
