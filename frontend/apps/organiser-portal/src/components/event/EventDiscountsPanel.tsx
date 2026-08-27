'use client';

import * as React from 'react';
import { Icon, Input, Select, Textarea, Switch, Button, Badge } from '@cyrokx/ui';
import { PanelHead } from './PanelHead';
import { useSavedFlash, NotWiredNote } from './panelState';

const DISC_CATS = ['All categories', '10K Run', '21K Half Marathon', '5K Fun Run'];

interface Discount {
  id: string;
  code: string;
  desc: string;
  cat: string;
  start: string;
  end: string;
  pct: string;
  abs: string;
  max: string;
  claimed: number;
  enabled: boolean;
}

const INITIAL_DISCOUNTS: Discount[] = [
  { id: 'd1', code: 'RUNXTREME-30', desc: '30% early-bird for the 21K category', cat: '21K Half Marathon', start: '2026-06-01 00:00', end: '2026-06-30 23:59', pct: '30', abs: '0', max: '100', claimed: 63, enabled: true },
  { id: 'd2', code: 'TEAM10', desc: 'Flat ₹100 off for club registrations', cat: 'All categories', start: '', end: '', pct: '0', abs: '100', max: '250', claimed: 41, enabled: true },
  { id: 'd3', code: '(auto) FINISHER', desc: 'Auto-applied loyalty discount at checkout', cat: 'All categories', start: '', end: '', pct: '10', abs: '0', max: '500', claimed: 128, enabled: false },
];

/** EventDiscounts — discount code manager: create codes (blank = auto-apply),
 *  scope to a category, set window, percentage/absolute value and max claims. */
export function EventDiscountsPanel() {
  const [list, setList] = React.useState<Discount[]>(INITIAL_DISCOUNTS);
  const [activeId, setActiveId] = React.useState<string>('new');
  const blank: Discount = { id: 'new', code: '', desc: '', cat: DISC_CATS[0], start: '', end: '', pct: '0', abs: '0', max: '100', claimed: 0, enabled: true };
  const [draft, setDraft] = React.useState<Discount>(blank);
  const active = activeId === 'new' ? draft : list.find((d) => d.id === activeId) ?? draft;

  const patch = (k: keyof Discount, v: string | boolean) => {
    if (activeId === 'new') setDraft((d) => ({ ...d, [k]: v }));
    else setList((ls) => ls.map((d) => (d.id === activeId ? { ...d, [k]: v } : d)));
  };

  const startNew = () => { setDraft(blank); setActiveId('new'); };
  const [saved, flashSaved] = useSavedFlash();

  const save = () => {
    if (activeId === 'new') {
      const id = Math.random().toString(36).slice(2);
      setList((ls) => [...ls, { ...draft, id }]);
      setDraft(blank);
      setActiveId(id);
    }
    flashSaved();
  };

  return (
    <div>
      <PanelHead title="Discounts" subtitle="Codes buyers enter at checkout, or auto-applied offers. Leave the code blank to auto-apply.">
        <Button size="sm" onClick={startNew}><Icon name="plus" size={15} />New discount</Button>
      </PanelHead>

      <NotWiredNote>Sample discounts. Creating and editing codes saves locally — the discounts API is backend follow-up work.</NotWiredNote>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((d) => {
            const on = d.id === active.id;
            const pct = d.max ? Math.min(100, Math.round((d.claimed / Number(d.max)) * 100)) : 0;
            const pctLabel = d.pct !== '0' && d.pct ? `${d.pct}% off` : '';
            const absLabel = d.abs !== '0' && d.abs ? `₹${d.abs} off` : '';
            const sep = pctLabel && absLabel ? ' · ' : '';
            return (
              <button key={d.id} onClick={() => setActiveId(d.id)} style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--surface-card)', border: `1.5px solid ${on ? 'var(--color-accent)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-card)', padding: 16, boxShadow: on ? 'var(--shadow-card)' : 'none', fontFamily: 'var(--font-sans)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'monospace' }}>{d.code || 'Auto-apply'}</span>
                  {d.enabled ? <Badge status="live">Active</Badge> : <Badge status="draft">Off</Badge>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>
                  {pctLabel}{sep}{absLabel} · {d.cat}
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--color-off-white)', overflow: 'hidden', marginBottom: 5 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-accent)' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{d.claimed} / {d.max} claimed</div>
              </button>
            );
          })}
        </div>

        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 20 }}>{activeId === 'new' ? 'New discount' : 'Edit discount'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <Input label="Discount code" placeholder="RUNXTREME-30" value={active.code} onChange={(e) => patch('code', e.target.value)} />
              <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 5 }}>Leave blank to auto-apply on checkout.</div>
            </div>
            <Textarea label="Description" placeholder="Discount description" rows={2} value={active.desc} onChange={(e) => patch('desc', e.target.value)} />
            <Select label="Event category (leave blank to apply to all categories)" value={active.cat} onChange={(e) => patch('cat', e.target.value)} options={DISC_CATS} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <Input label="Start time" placeholder="YYYY-MM-DD HH:mm" value={active.start} onChange={(e) => patch('start', e.target.value)} />
              <Input label="End time" placeholder="YYYY-MM-DD HH:mm" value={active.end} onChange={(e) => patch('end', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <Input label="Percentage discount (% off final price)" type="number" placeholder="0.0" value={active.pct} onChange={(e) => patch('pct', e.target.value)} />
              <Input label="Absolute discount (₹ off final price)" type="number" placeholder="0.0" value={active.abs} onChange={(e) => patch('abs', e.target.value)} />
            </div>
            <Input label="Max available count (how many buyers can claim this discount?)" type="number" placeholder="100" value={active.max} onChange={(e) => patch('max', e.target.value)} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border-default)' }}>
              <Switch label="Enabled" checked={active.enabled} onChange={(e) => patch('enabled', e.target.checked)} />
              <Button onClick={save}><Icon name={saved ? 'check' : 'save'} size={15} />{saved ? 'Saved' : 'Save discount'}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
