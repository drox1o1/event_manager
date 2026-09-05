'use client';

import * as React from 'react';
import { Icon, Input, Select, Switch, Button } from '@cyrokx/ui';
import { PanelHead } from './PanelHead';
import { useSavedFlash, NotWiredNote } from './panelState';

const TAX_MODE = ['Added at checkout (exclusive)', 'Included in ticket price (inclusive)'];

interface Override {
  id: string;
  cat: string;
  rate: string;
  on: boolean;
}

function PreviewRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13.5 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: muted ? 'var(--text-subtle)' : 'var(--text-body)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

/** EventTax — tax configuration: registration number, rate, inclusive/exclusive
 *  handling and per-category overrides shown on invoices. */
export function EventTaxPanel() {
  const [enabled, setEnabled] = React.useState(true);
  const [gstin, setGstin] = React.useState('29ABCDE1234F1Z5');
  const [label, setLabel] = React.useState('GST');
  const [rate, setRate] = React.useState('18');
  const [mode, setMode] = React.useState(TAX_MODE[0]);
  const [overrides, setOverrides] = React.useState<Override[]>([
    { id: 't1', cat: '10K Run', rate: '18', on: false },
    { id: 't2', cat: '21K Half Marathon', rate: '18', on: false },
    { id: 't3', cat: '5K Fun Run', rate: '5', on: true },
  ]);
  const patch = (id: string, k: keyof Override, v: string | boolean) =>
    setOverrides((os) => os.map((o) => (o.id === id ? { ...o, [k]: v } : o)));
  const [saved, flashSaved] = useSavedFlash();

  const sample = 899;
  const taxAmt = enabled ? Math.round(sample * (Number(rate) / 100)) : 0;
  const total = mode === TAX_MODE[0] ? sample + taxAmt : sample;

  return (
    <div>
      <PanelHead title="Tax" subtitle="Applied to every order and itemised on participant invoices.">
        <Button size="sm" onClick={flashSaved}><Icon name={saved ? 'check' : 'save'} size={15} />{saved ? 'Saved' : 'Save tax settings'}</Button>
      </PanelHead>

      <NotWiredNote>Tax settings save locally for now — the tax API is backend follow-up work. The invoice preview updates live as you edit.</NotWiredNote>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid var(--border-default)' }}>
            <Switch label="Collect tax for this event" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            <div style={{ fontSize: 13, color: 'var(--text-muted)', paddingLeft: 2 }}>When off, orders are processed with no tax line and invoices show the ticket price only.</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, opacity: enabled ? 1 : 0.5, pointerEvents: enabled ? 'auto' : 'none' }}>
            <Input label="Tax registration number (GSTIN)" placeholder="29ABCDE1234F1Z5" value={gstin} onChange={(e) => setGstin(e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 }}>
              <Input label="Tax label" placeholder="GST" value={label} onChange={(e) => setLabel(e.target.value)} />
              <Input label="Default rate (%)" type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <Select label="How tax is applied" value={mode} onChange={(e) => setMode(e.target.value)} options={TAX_MODE} />

            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>Per-category overrides</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>Charge a different rate for specific categories — otherwise the default {rate || '0'}% applies.</div>
              <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', overflow: 'hidden' }}>
                {overrides.map((o, i) => (
                  <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 120px', gap: 12, alignItems: 'center', padding: '12px 16px', borderBottom: i < overrides.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>{o.cat}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" value={o.rate} disabled={!o.on} onChange={(e) => patch(o.id, 'rate', e.target.value)} style={{ width: 62, padding: '7px 8px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', fontSize: 14, fontFamily: 'var(--font-sans)', color: o.on ? 'var(--text-heading)' : 'var(--text-subtle)', background: o.on ? '#fff' : 'var(--color-off-white)' }} />
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>%</span>
                    </div>
                    <div style={{ justifySelf: 'end' }}><Switch checked={o.on} onChange={(e) => patch(o.id, 'on', e.target.checked)} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>Invoice preview</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>21K Half Marathon · 1 ticket</div>
          <PreviewRow label="Ticket price" value={`₹${sample.toLocaleString('en-IN')}`} />
          <PreviewRow label={`${label || 'Tax'} (${enabled ? rate || 0 : 0}%)${mode === TAX_MODE[1] ? ' incl.' : ''}`} value={enabled ? `₹${taxAmt.toLocaleString('en-IN')}` : '₹0'} muted={mode === TAX_MODE[1]} />
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 6, borderTop: '1.5px solid var(--border-default)' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-accent)' }}>₹{total.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-subtle)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <Icon name="info" size={14} /> {mode === TAX_MODE[1] ? 'Tax is already part of the ticket price shown to buyers.' : 'Tax is added on top at checkout.'}
          </div>
        </div>
      </div>
    </div>
  );
}
