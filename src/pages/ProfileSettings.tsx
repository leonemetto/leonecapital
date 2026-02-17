import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { Camera, KeyRound, Shield, User, Sun, Moon, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';

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

  // 2FA state
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);


  // Load MFA factors
  useEffect(() => {
    const loadFactors = async () => {
      setMfaLoading(true);
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        setMfaFactors(data?.totp || []);
      } catch {
        // MFA not available or error
        setMfaFactors([]);
      } finally {
        setMfaLoading(false);
      }
    };
    loadFactors();
  }, []);

  const verifiedFactors = mfaFactors.filter((f: any) => f.status === 'verified');
  const hasMfa = verifiedFactors.length > 0;

  const handleEnrollMfa = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setQrCode(data.totp.qr_code);
      setTotpSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start 2FA enrollment');
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!factorId || verifyCode.length !== 6) return;
    setVerifying(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      toast.success('2FA enabled successfully!');
      setQrCode(null);
      setTotpSecret(null);
      setFactorId(null);
      setVerifyCode('');
      // Refresh factors
      const { data } = await supabase.auth.mfa.listFactors();
      setMfaFactors(data?.totp || []);
    } catch (err: any) {
      toast.error(err.message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  const handleUnenrollMfa = async (id: string) => {
    setUnenrolling(true);
    try {
      // First, upgrade session to AAL2 by doing a challenge+verify
      const aal = JSON.parse(atob((await supabase.auth.getSession()).data.session!.access_token.split('.')[1]))?.aal;
      if (aal !== 'aal2') {
        // Need to prompt user for TOTP code first
        const code = prompt('Enter your 2FA code to confirm disabling:');
        if (!code || code.length !== 6) {
          toast.error('Valid 6-digit code required to disable 2FA');
          setUnenrolling(false);
          return;
        }
        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: id });
        if (challengeError) throw challengeError;
        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: id,
          challengeId: challenge.id,
          code,
        });
        if (verifyError) throw verifyError;
        // Now session is AAL2, refresh it
        await supabase.auth.refreshSession();
      }

      const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (error) throw error;
      toast.success('2FA disabled');
      const { data } = await supabase.auth.mfa.listFactors();
      setMfaFactors(data?.totp || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to disable 2FA');
    } finally {
      setUnenrolling(false);
    }
  };

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

        {/* 2FA */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Two-Factor Authentication</h2>
            {hasMfa && <ShieldCheck className="h-4 w-4 text-profit" />}
          </div>

          {mfaLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading...
            </div>
          ) : hasMfa ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-profit" />
                2FA is enabled. Your account is protected with TOTP.
              </p>
              <Button variant="destructive" size="sm" onClick={() => handleUnenrollMfa(verifiedFactors[0].id)} disabled={unenrolling}>
                <ShieldOff className="h-3.5 w-3.5 mr-1" />
                {unenrolling ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            </div>
          ) : qrCode ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
              </p>
              <div className="flex justify-center p-4 bg-secondary rounded-lg">
                <img src={qrCode} alt="TOTP QR Code" className="w-48 h-48" />
              </div>
              {totpSecret && (
                <div>
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Manual Entry Key</Label>
                  <code className="block mt-1 text-xs bg-secondary p-2 rounded font-mono break-all select-all">{totpSecret}</code>
                </div>
              )}
              <div>
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Verification Code</Label>
                <Input
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="mt-1 bg-secondary border-border h-9 font-mono tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleVerifyMfa} disabled={verifying || verifyCode.length !== 6}>
                  {verifying ? 'Verifying...' : 'Verify & Enable'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setQrCode(null); setTotpSecret(null); setFactorId(null); setVerifyCode(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security by enabling TOTP-based two-factor authentication.
              </p>
              <Button size="sm" onClick={handleEnrollMfa} disabled={enrolling}>
                <Shield className="h-3.5 w-3.5 mr-1" />
                {enrolling ? 'Setting up...' : 'Enable 2FA'}
              </Button>
            </div>
          )}
        </div>


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
