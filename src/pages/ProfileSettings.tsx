import { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { Camera, KeyRound, Shield, User, Sun, Moon } from 'lucide-react';

export default function ProfileSettings() {
  const { profile, setNickname, updateAvatarUrl } = useProfile();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNicknameLocal] = useState(profile?.nickname || '');
  const [savingNickname, setSavingNickname] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleNicknameSave = async () => {
    if (!nickname.trim()) return;
    setSavingNickname(true);
    try {
      await setNickname(nickname.trim());
      toast.success('Nickname updated');
    } catch {
      toast.error('Failed to update nickname');
    } finally {
      setSavingNickname(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Add cache buster
      const url = `${publicUrl}?t=${Date.now()}`;
      await updateAvatarUrl(url);
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (profile?.nickname || 'U').slice(0, 2).toUpperCase();

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-xl font-bold">Profile Settings</h1>

        {/* Avatar */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-foreground" />
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="font-semibold">{profile?.nickname || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs gap-1" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                <Camera className="h-3 w-3" />
                {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
              </Button>
            </div>
          </div>
        </div>

        {/* Nickname */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Nickname</h2>
          </div>
          <Input value={nickname} onChange={e => setNicknameLocal(e.target.value)} maxLength={30} className="bg-secondary border-border h-9" />
          <Button size="sm" onClick={handleNicknameSave} disabled={savingNickname || !nickname.trim()}>
            {savingNickname ? 'Saving...' : 'Save Nickname'}
          </Button>
        </div>

        {/* Password */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Change Password</h2>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">New Password</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" minLength={6} className="mt-1 bg-secondary border-border h-9" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Confirm Password</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="mt-1 bg-secondary border-border h-9" />
          </div>
          <Button size="sm" onClick={handlePasswordChange} disabled={savingPassword || !newPassword}>
            {savingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </div>

        {/* 2FA Info */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Two-Factor Authentication</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            2FA adds an extra layer of security. This feature is coming soon.
          </p>
        </div>

        {/* Theme */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
              <div>
                <h2 className="text-sm font-semibold">Appearance</h2>
                <p className="text-xs text-muted-foreground">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
              </div>
            </div>
            <Switch checked={theme === 'light'} onCheckedChange={(checked) => setTheme(checked ? 'light' : 'dark')} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
