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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-xl p-8 max-w-sm w-full text-center space-y-5"
      >
        <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.06)] inline-block">
          <UserCircle className="h-8 w-8 text-white" weight="regular" />
        </div>
        <h1 className="text-xl font-bold text-white">Welcome to EdgeFlow</h1>
        <p className="text-sm text-[rgba(255,255,255,0.4)]">What should we call you?</p>
        <Input
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          placeholder="Enter your nickname"
          maxLength={30}
          autoFocus
          className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[rgba(255,255,255,0.2)]"
        />
        <Button
          type="submit"
          disabled={!nickname.trim() || loading}
          className="w-full bg-white text-black hover:bg-white/90 rounded-[24px] font-semibold"
        >
          {loading ? 'Saving...' : "Let's Go"}
        </Button>
      </form>
    </div>
  );
}
