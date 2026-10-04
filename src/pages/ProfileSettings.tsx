import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useTraderProfile } from '@/hooks/useTraderProfile';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/layout/PageHeader';
import { Pill, Segmented, Surface } from '@/components/ef/primitives';
import { FIELD, FIELD_LABEL } from '@/components/ef/field';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { Camera, Sun, Moon, ShieldCheck, ShieldSlash as ShieldOff, Trash as Trash2 } from '@phosphor-icons/react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useSharedAccounts } from '@/contexts/AccountsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { SubscriptionPanel } from '@/components/billing/SubscriptionPanel';

function DemoDataSection() {
  const { deleteDemoAccount } = useOnboarding();
  const { accounts } = useSharedAccounts();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const hasDemoAccount = accounts.some(a => a.type === 'demo');

  if (!hasDemoAccount) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDemoAccount();
      toast.success('Demo account deleted');
    } catch {
      toast.error('Could not delete the demo account');
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <Section id="data" title="Data" description="The demo account and its sample trades.">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-auto text-[13px] text-ef-ink-2">Delete the demo account and all its trades? This cannot be undone.</span>
          <button type="button" onClick={() => setConfirming(false)} className="ef-btn ef-btn-ghost">Cancel</button>
          <button type="button" onClick={handleDelete} disabled={deleting} className="ef-btn bg-ef-neg font-semibold text-white hover:opacity-90">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="ef-btn ef-btn-secondary hover:text-ef-neg">
          <Trash2 className="h-3.5 w-3.5" /> Delete demo account
        </button>
      )}
    </Section>
  );
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Surface id={id} className="scroll-mt-20">
      <div className="border-b border-ef-line px-5 py-4">
        <h2 className="m-0 text-[15px] font-medium tracking-[-0.01em] text-ef-ink">{title}</h2>
        {description && <p className="m-0 mt-1 max-w-[62ch] text-[12.5px] leading-relaxed text-ef-ink-3">{description}</p>}
      </div>
      <div className="px-5 py-5">{children}</div>
    </Surface>
  );
}

function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-t border-ef-line py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="m-0 text-[13px] font-medium text-ef-ink">{title}</p>
        {description && <p className="m-0 mt-0.5 text-[12.5px] leading-relaxed text-ef-ink-3">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const NAV = [
  { id: 'profile', label: 'Profile' },
  { id: 'trading-profile', label: 'Trading profile' },
  { id: 'security', label: 'Security' },
  { id: 'billing', label: 'Billing' },
  { id: 'preferences', label: 'Preferences' },
];

export default function ProfileSettings() {
  const { profile, setNickname, updateAvatarUrl } = useProfile();
  const { user } = useAuth();
  const { traderProfile, saveProfile: saveTraderProfile } = useTraderProfile();
  
  const { theme, setTheme } = useTheme();
  const { countBreakevenInWinRate, setCountBreakevenInWinRate } = useSettings();
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


  // Trader profile state
  const [tpStyle, setTpStyle] = useState('');
  const [tpInstruments, setTpInstruments] = useState('');
  const [tpSessions, setTpSessions] = useState('');
  const [tpGoals, setTpGoals] = useState('');
  const [tpMistakes, setTpMistakes] = useState('');
  const [tpRules, setTpRules] = useState('');
  const [tpRisk, setTpRisk] = useState('');
  const [tpTriggers, setTpTriggers] = useState('');
  const [tpNotes, setTpNotes] = useState('');
  const [savingTp, setSavingTp] = useState(false);

  useEffect(() => {
    if (profile?.nickname) setNicknameLocal(profile.nickname);
  }, [profile?.nickname]);

  useEffect(() => {
    if (traderProfile) {
      setTpStyle(traderProfile.tradingStyle);
      setTpInstruments(traderProfile.favoriteInstruments);
      setTpSessions(traderProfile.favoriteSessions);
      setTpGoals(traderProfile.accountGoals);
      setTpMistakes(traderProfile.commonMistakes);
      setTpRules(traderProfile.tradingRules);
      setTpRisk(traderProfile.riskPerTrade);
      setTpTriggers(traderProfile.mentalTriggers);
      setTpNotes(traderProfile.notes);
    }
  }, [traderProfile]);

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

    // Validate MIME type and size before upload (prevents SVG XSS and oversized uploads)
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, or GIF images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
      const ext = extMap[file.type] ?? 'jpg';
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
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
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

  const handleSaveTraderProfile = async () => {
    setSavingTp(true);
    try {
      await saveTraderProfile({
        tradingStyle: tpStyle, favoriteInstruments: tpInstruments, favoriteSessions: tpSessions,
        accountGoals: tpGoals, commonMistakes: tpMistakes, tradingRules: tpRules,
        riskPerTrade: tpRisk, mentalTriggers: tpTriggers, notes: tpNotes,
      });
      toast.success('Trading profile saved');
    } catch { toast.error('Failed to save trading profile'); }
    finally { setSavingTp(false); }
  };

  const initials = (profile?.nickname || 'U').slice(0, 2).toUpperCase();
  const memory = (traderProfile?.behavioralMemory ?? []).slice(-8).reverse();
  const tpField = cn(FIELD);
  const tpArea = cn(FIELD, 'h-auto min-h-[76px] resize-y py-2.5 leading-relaxed');

  return (
    <AppLayout width="narrow">
      <PageHeader title="Settings" subtitle="Profile, security, billing and preferences." />

      <div className="grid items-start gap-x-8 gap-y-4 lg:grid-cols-[168px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="ef-scroll-quiet -mx-1 flex gap-0.5 overflow-x-auto px-1 lg:sticky lg:top-[76px] lg:mx-0 lg:flex-col lg:px-0">
          {NAV.map(n => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={e => {
                e.preventDefault();
                document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="ef-focus shrink-0 rounded-[8px] px-2.5 py-1.5 text-[13px] text-ef-ink-3 transition-colors hover:bg-ef-hover hover:text-ef-ink"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex min-w-0 flex-col gap-3">
          {/* Profile */}
          <Section id="profile" title="Profile">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change profile photo"
                  className="ef-focus group relative shrink-0 rounded-surface"
                >
                  <Avatar className="h-16 w-16 rounded-surface">
                    <AvatarImage src={profile?.avatarUrl || undefined} className="rounded-surface" />
                    <AvatarFallback className="rounded-surface bg-ef-sunken text-lg font-semibold text-ef-ink">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="absolute inset-0 grid place-items-center rounded-surface bg-ef-bg/70 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Camera className="h-5 w-5 text-ef-ink" />
                  </span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <div className="min-w-0 sm:hidden">
                  <p className="m-0 truncate text-[14px] font-medium text-ef-ink">{profile?.nickname || 'Trader'}</p>
                  <p className="m-0 truncate text-[12.5px] text-ef-ink-3">{user?.email}</p>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor="settings-nickname" className={FIELD_LABEL}>Nickname</label>
                <div className="flex gap-2">
                  <input id="settings-nickname" value={nickname} onChange={e => setNicknameLocal(e.target.value)} maxLength={30} className={cn(FIELD, 'max-w-[280px]')} />
                  <button type="button" onClick={handleNicknameSave} disabled={savingNickname || !nickname.trim() || nickname === profile?.nickname} className="ef-btn ef-btn-secondary h-9">
                    {savingNickname ? 'Saving…' : 'Save'}
                  </button>
                </div>
                <p className="m-0 mt-3 text-[12.5px] text-ef-ink-3">
                  Signed in as <span className="text-ef-ink-2">{user?.email}</span>
                  {uploadingAvatar && ' · uploading photo…'}
                </p>
              </div>
            </div>
          </Section>

          {/* Trading profile */}
          <Section
            id="trading-profile"
            title="Trading profile"
            description="Atlas reads this before it answers. The more specific it is, the less generic the advice."
          >
            <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tp-style" className={FIELD_LABEL}>Trading style</label>
                <input id="tp-style" value={tpStyle} onChange={e => setTpStyle(e.target.value)} placeholder="Intraday trend follower" className={tpField} />
              </div>
              <div>
                <label htmlFor="tp-risk" className={FIELD_LABEL}>Risk per trade</label>
                <input id="tp-risk" value={tpRisk} onChange={e => setTpRisk(e.target.value)} placeholder="1% of the account, $50 at most" className={tpField} />
              </div>
              <div>
                <label htmlFor="tp-instruments" className={FIELD_LABEL}>Instruments</label>
                <input id="tp-instruments" value={tpInstruments} onChange={e => setTpInstruments(e.target.value)} placeholder="XAUUSD, NAS100" className={tpField} />
              </div>
              <div>
                <label htmlFor="tp-sessions" className={FIELD_LABEL}>Sessions</label>
                <input id="tp-sessions" value={tpSessions} onChange={e => setTpSessions(e.target.value)} placeholder="London, New York" className={tpField} />
              </div>
              <div>
                <label htmlFor="tp-goals" className={FIELD_LABEL}>Account goals</label>
                <textarea id="tp-goals" value={tpGoals} onChange={e => setTpGoals(e.target.value)} placeholder="Pass the 50k challenge by December" className={tpArea} />
              </div>
              <div>
                <label htmlFor="tp-rules" className={FIELD_LABEL}>Personal rules</label>
                <textarea id="tp-rules" value={tpRules} onChange={e => setTpRules(e.target.value)} placeholder="Three trades a day at most" className={tpArea} />
              </div>
              <div>
                <label htmlFor="tp-mistakes" className={FIELD_LABEL}>Common mistakes</label>
                <textarea id="tp-mistakes" value={tpMistakes} onChange={e => setTpMistakes(e.target.value)} placeholder="Revenge trades after a loss" className={tpArea} />
              </div>
              <div>
                <label htmlFor="tp-triggers" className={FIELD_LABEL}>Emotional triggers</label>
                <textarea id="tp-triggers" value={tpTriggers} onChange={e => setTpTriggers(e.target.value)} placeholder="Fear of missing a move" className={tpArea} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="tp-notes" className={FIELD_LABEL}>Anything else Atlas should know</label>
                <textarea id="tp-notes" value={tpNotes} onChange={e => setTpNotes(e.target.value)} className={tpArea} />
              </div>
            </div>
            <button type="button" onClick={handleSaveTraderProfile} disabled={savingTp} className="ef-btn ef-btn-primary mt-5">
              {savingTp ? 'Saving…' : 'Save trading profile'}
            </button>

            {memory.length > 0 && (
              <div className="mt-6 border-t border-ef-line pt-5">
                <p className="ef-label m-0">What Atlas has noticed</p>
                <p className="m-0 mt-2 max-w-[62ch] text-[12.5px] leading-relaxed text-ef-ink-3">
                  Short notes Atlas keeps from your conversations and uses in later answers.
                </p>
                <ul className="m-0 mt-3 list-none p-0">
                  {memory.map((item, i) => (
                    <li key={i} className="border-t border-ef-line py-2 text-[13px] text-ef-ink-2 first:border-t-0">
                      {typeof item === 'string' ? item : item?.insight ?? item?.text ?? JSON.stringify(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          {/* Security */}
          <Section id="security" title="Security">
            <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <label htmlFor="settings-password" className={FIELD_LABEL}>New password</label>
                <input id="settings-password" type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} placeholder="At least 8 characters" className={FIELD} />
              </div>
              <div>
                <label htmlFor="settings-password-confirm" className={FIELD_LABEL}>Confirm password</label>
                <input id="settings-password-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={FIELD} />
              </div>
            </div>
            <button type="button" onClick={handlePasswordChange} disabled={savingPassword || !newPassword} className="ef-btn ef-btn-secondary mt-4">
              {savingPassword ? 'Updating…' : 'Update password'}
            </button>

            <div className="mt-6 border-t border-ef-line pt-5">
              <div className="flex items-center gap-2">
                <p className="m-0 text-[13px] font-medium text-ef-ink">Two-factor authentication</p>
                {hasMfa && <Pill tone="pos">On</Pill>}
              </div>

              {mfaLoading ? (
                <div className="mt-3 h-9 w-40 animate-pulse rounded-control bg-ef-sunken" aria-busy="true" aria-label="Loading two-factor status" />
              ) : hasMfa ? (
                <>
                  <p className="m-0 mt-1 max-w-[62ch] text-[12.5px] leading-relaxed text-ef-ink-3">
                    Sign-in asks for a code from your authenticator app.
                  </p>
                  <button type="button" onClick={() => handleUnenrollMfa(verifiedFactors[0].id)} disabled={unenrolling} className="ef-btn ef-btn-secondary mt-3 hover:text-ef-neg">
                    <ShieldOff className="h-3.5 w-3.5" /> {unenrolling ? 'Turning off…' : 'Turn off two-factor'}
                  </button>
                </>
              ) : qrCode ? (
                <div className="mt-3 flex flex-col gap-4 sm:flex-row">
                  <div className="shrink-0 self-start rounded-control bg-white p-3">
                    <img src={qrCode} alt="QR code to scan with an authenticator app" className="h-40 w-40" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[12.5px] leading-relaxed text-ef-ink-3">
                      Scan the code with an authenticator app, then enter the six-digit code it shows.
                    </p>
                    {totpSecret && (
                      <div className="mt-3">
                        <span className={FIELD_LABEL}>Or enter this key by hand</span>
                        <code className="ef-num block select-all break-all rounded-control bg-ef-sunken px-3 py-2 text-[12px] text-ef-ink-2">{totpSecret}</code>
                      </div>
                    )}
                    <div className="mt-3">
                      <label htmlFor="settings-totp" className={FIELD_LABEL}>Verification code</label>
                      <input
                        id="settings-totp"
                        value={verifyCode}
                        onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        maxLength={6}
                        className={cn(FIELD, 'ef-num max-w-[160px] tracking-[0.3em]')}
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button type="button" onClick={handleVerifyMfa} disabled={verifying || verifyCode.length !== 6} className="ef-btn ef-btn-primary">
                        {verifying ? 'Verifying…' : 'Verify and turn on'}
                      </button>
                      <button type="button" onClick={() => { setQrCode(null); setTotpSecret(null); setFactorId(null); setVerifyCode(''); }} className="ef-btn ef-btn-ghost">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="m-0 mt-1 max-w-[62ch] text-[12.5px] leading-relaxed text-ef-ink-3">
                    Adds a code from an authenticator app to every sign-in.
                  </p>
                  <button type="button" onClick={handleEnrollMfa} disabled={enrolling} className="ef-btn ef-btn-secondary mt-3">
                    <ShieldCheck className="h-3.5 w-3.5" /> {enrolling ? 'Setting up…' : 'Set up two-factor'}
                  </button>
                </>
              )}
            </div>
          </Section>

          {/* Billing */}
          <Section id="billing" title="Billing">
            <SubscriptionPanel />
          </Section>

          {/* Preferences */}
          <Section id="preferences" title="Preferences">
            <Row title="Theme" description={theme === 'dark' ? 'Dark' : 'Light'}>
              <Segmented<'dark' | 'light'>
                ariaLabel="Theme"
                value={theme === 'light' ? 'light' : 'dark'}
                onChange={setTheme}
                options={[
                  { value: 'dark', label: <span className="flex items-center gap-1.5"><Moon className="h-3.5 w-3.5" /> Dark</span> },
                  { value: 'light', label: <span className="flex items-center gap-1.5"><Sun className="h-3.5 w-3.5" /> Light</span> },
                ]}
              />
            </Row>
            <Row
              title="Count breakeven trades in win rate"
              description={countBreakevenInWinRate
                ? 'On: win rate is wins divided by all trades.'
                : 'Off: win rate is wins divided by wins plus losses.'}
            >
              <Switch checked={countBreakevenInWinRate} onCheckedChange={setCountBreakevenInWinRate} aria-label="Count breakeven trades in win rate" className="data-[state=checked]:bg-ef-ink data-[state=unchecked]:bg-ef-line-strong" />
            </Row>
          </Section>

          <DemoDataSection />
        </div>
      </div>
    </AppLayout>
  );
}
