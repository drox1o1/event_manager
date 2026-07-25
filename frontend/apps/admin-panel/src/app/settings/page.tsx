'use client';

import * as React from 'react';
import { Icon, Input, Button, Switch, Textarea, Toast } from '@cyrokx/ui';
import { adminApi, ApiError } from '@cyrokx/api-client';
import type { PlatformSettings } from '@cyrokx/api-client';
import { AdminShell } from '@/components/AdminShell';
import { useRequireAuth } from '@/lib/auth';

function SettingsCard({ icon, title, description, children }: { icon: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-accent-tint)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={icon} size={17} />
        </span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function SettingsInner() {
  const token = useRequireAuth();
  const [settings, setSettings] = React.useState<PlatformSettings | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) return;
    adminApi.getSettings(token).then(setSettings).catch(() => setError('Could not load platform settings.'));
  }, [token]);

  const update = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) =>
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    if (!token || !settings) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.updateSettings(token, {
        commission_pct: settings.commission_pct,
        buyer_fee_enabled: settings.buyer_fee_enabled,
        auto_payout_enabled: settings.auto_payout_enabled,
        email_sender_name: settings.email_sender_name,
        email_reply_to: settings.email_reply_to || undefined,
        email_footer_note: settings.email_footer_note || undefined,
      });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div style={{ color: 'var(--text-muted)' }}>{error ?? 'Loading…'}</div>;
  }

  const commissionNum = Number(settings.commission_pct) || 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-heading)' }}>Platform settings</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Commission and buyer notifications — platform-wide.</div>
        </div>
        <Button onClick={save} loading={saving}>Save changes</Button>
      </div>

      {error && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{error}</div>}

      <SettingsCard icon="percent" title="Commission" description="Platform fee taken from every ticket sold, before organiser payout.">
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ width: 160 }}>
            <Input label="Platform commission" value={settings.commission_pct} onChange={(e) => update('commission_pct', e.target.value.replace(/[^0-9.]/g, ''))} icon="percent" />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', paddingBottom: 12 }}>
            On a ₹1,000 ticket, CyRokx keeps <strong style={{ color: 'var(--text-heading)' }}>₹{Math.round(commissionNum * 10)}</strong>.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-default)' }}>
          <Switch label="Pass a separate booking fee to the buyer" checked={settings.buyer_fee_enabled} onChange={(e) => update('buyer_fee_enabled', e.target.checked)} />
          <Switch label="Release payouts automatically once an event is approved" checked={settings.auto_payout_enabled} onChange={(e) => update('auto_payout_enabled', e.target.checked)} />
        </div>
      </SettingsCard>

      <SettingsCard icon="mail" title="Buyer email notifications" description="Sender identity and footer for order-confirmation email.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Sender name" placeholder="CyRokx" value={settings.email_sender_name} onChange={(e) => update('email_sender_name', e.target.value)} />
            <Input label="Reply-to email" type="email" placeholder="support@cyrokx.com" value={settings.email_reply_to ?? ''} onChange={(e) => update('email_reply_to', e.target.value)} />
            <Textarea label="Footer note" rows={2} placeholder="Questions about your order? Reply to this email." value={settings.email_footer_note ?? ''} onChange={(e) => update('email_footer_note', e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', marginBottom: 8 }}>PREVIEW</div>
            <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--color-ink)', color: '#fff', padding: '16px 20px', fontWeight: 700, fontSize: 15 }}>
                {settings.email_sender_name || 'CyRokx'}
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>You&apos;re going! Your order is confirmed.</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)', marginBottom: 4 }}>Jazz Night at The Terrace</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>Sat, 12 Jul · 7:00 PM · The Terrace, Bandra, Mumbai</div>
                <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--color-off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', margin: '0 auto 14px' }}>
                  <Icon name="qr-code" size={28} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', textAlign: 'center' }}>{settings.email_footer_note || 'Questions about your order? Reply to this email.'}</div>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      {saved && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100 }}>
          <Toast variant="success" title="Settings saved" />
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AdminShell>
      <SettingsInner />
    </AdminShell>
  );
}
