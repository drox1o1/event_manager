'use client';

import * as React from 'react';
import { Icon, Input, Button, Badge } from '@cyrokx/ui';
import { PanelHead } from './PanelHead';
import { NotWiredNote } from './panelState';

interface Order {
  id: number;
  hash: string;
  name: string;
  email: string;
  time: string;
  status: 'Completed' | 'Incomplete';
}

const ORDERS: Order[] = [
  { id: 318581, hash: 'q3T1OBK', name: 'Dr Ajay Kumar', email: 'iamdrajay@gmail.com', time: '10:54 · 15 Jul', status: 'Completed' },
  { id: 318552, hash: '1gT9QGW', name: 'Parveen Kumar', email: 'pkgoyal15@gmail.com', time: '06:33 · 15 Jul', status: 'Completed' },
  { id: 318542, hash: 'WoTdLkK', name: 'Bikramjeet Singh', email: 'bschattha2266@gmail.com', time: '23:30 · 14 Jul', status: 'Completed' },
  { id: 318510, hash: 'ykTN3ZE', name: 'Mahima Kaur', email: 'rinpykk@gmail.com', time: '21:02 · 14 Jul', status: 'Completed' },
  { id: 318453, hash: 'z1ToEPR', name: 'Sudhir Khatri', email: 'khatrisudhir403@gmail.com', time: '14:18 · 14 Jul', status: 'Completed' },
  { id: 318449, hash: 'mR4kP2x', name: 'Neha Verma', email: 'neha.verma@gmail.com', time: '12:40 · 14 Jul', status: 'Incomplete' },
  { id: 318431, hash: '9WTqj8q', name: 'Ankur Mohan', email: 'doctorocks@gmail.com', time: '10:52 · 14 Jul', status: 'Completed' },
  { id: 318410, hash: 'P1ToJOW', name: 'Aakula Srinu', email: 'aakulasrinu606@gmail.com', time: '06:10 · 14 Jul', status: 'Completed' },
  { id: 318393, hash: 'rVTgK6k', name: 'Bhavin Chauhan', email: 'chauhanbhavin255@gmail.com', time: '23:24 · 13 Jul', status: 'Completed' },
  { id: 318388, hash: 'bQ7wZ0t', name: 'Ritu Malhotra', email: 'ritu.malhotra@yahoo.in', time: '22:51 · 13 Jul', status: 'Incomplete' },
  { id: 318376, hash: 'KJTbDJ8', name: 'Himanshu Suman', email: 'himanshusuman9414@gmail.com', time: '22:08 · 13 Jul', status: 'Completed' },
  { id: 318372, hash: '2GTdlWl', name: 'Vidur Monga', email: 'vidur.monga03@gmail.com', time: '22:04 · 13 Jul', status: 'Completed' },
  { id: 318360, hash: 'aQTWdLl', name: 'Vicky Yadav', email: 'vickyyadav76890@gmail.com', time: '21:33 · 13 Jul', status: 'Completed' },
  { id: 318346, hash: 'bwTG0n6', name: 'Aditi Punia', email: 'aditi.punia@yahoo.in', time: '21:06 · 13 Jul', status: 'Completed' },
];

/** EventOrders — order ledger: Excel export, completed/incomplete filter, search
 *  by name/email or registration ID, per-row invoice download. */
export function EventOrdersPanel() {
  const [showIncomplete, setShowIncomplete] = React.useState(false);
  const [kw, setKw] = React.useState('');
  const [rid, setRid] = React.useState('');

  const rows = ORDERS.filter((o) => {
    if (!showIncomplete && o.status !== 'Completed') return false;
    if (showIncomplete && o.status !== 'Incomplete') return false;
    if (kw && !`${o.name} ${o.email}`.toLowerCase().includes(kw.toLowerCase())) return false;
    if (rid && !String(o.id).includes(rid)) return false;
    return true;
  });

  const completed = ORDERS.filter((o) => o.status === 'Completed').length;
  const incomplete = ORDERS.filter((o) => o.status === 'Incomplete').length;

  return (
    <div>
      <PanelHead title="Orders" subtitle={`${completed} completed · ${incomplete} incomplete`}>
        <Button size="sm" variant="secondary"><Icon name="download" size={15} />Download completed orders (Excel)</Button>
        <Button size="sm" variant={showIncomplete ? 'primary' : 'ghost'} onClick={() => setShowIncomplete((v) => !v)}>
          <Icon name={showIncomplete ? 'check-circle' : 'clock'} size={15} />{showIncomplete ? 'Showing incomplete' : 'Show incomplete orders'}
        </Button>
      </PanelHead>

      <NotWiredNote>Sample orders shown for layout. A per-event orders API is backend follow-up work; the search, filter and export controls operate on this sample data.</NotWiredNote>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}><Input icon="search" placeholder="Search name or email" value={kw} onChange={(e) => setKw(e.target.value)} /></div>
        <div style={{ width: 240 }}><Input placeholder="Registration ID" value={rid} onChange={(e) => setRid(e.target.value)} /></div>
        <Button variant="secondary"><Icon name="search" size={16} />Search</Button>
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {['#', 'Order hash', 'Buyer name', 'Buyer email', 'Time', 'Status', 'Invoice'].map((h) => (
                <th key={h} style={{ textAlign: h === 'Invoice' ? 'center' : 'left', padding: '12px 18px', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-subtle)', fontWeight: 600, borderBottom: '1px solid var(--border-default)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const done = o.status === 'Completed';
              return (
                <tr key={o.id} style={{ background: done ? 'var(--status-success-bg)' : 'transparent', borderBottom: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '13px 18px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{o.id}</td>
                  <td style={{ padding: '13px 18px' }}><span style={{ fontFamily: 'monospace', color: 'var(--text-link)', fontWeight: 600 }}>{o.hash}</span></td>
                  <td style={{ padding: '13px 18px', color: 'var(--text-heading)', fontWeight: 600 }}>{o.name}</td>
                  <td style={{ padding: '13px 18px', color: 'var(--text-body)' }}>{o.email}</td>
                  <td style={{ padding: '13px 18px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{o.time}</td>
                  <td style={{ padding: '13px 18px' }}><Badge status={done ? 'approved' : 'review'}>{o.status}</Badge></td>
                  <td style={{ padding: '13px 18px', textAlign: 'center' }}>
                    <button title="Download invoice" disabled={!done} style={{ width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-control)', background: 'var(--surface-card)', color: done ? 'var(--color-accent-secondary)' : 'var(--text-subtle)', cursor: done ? 'pointer' : 'not-allowed', opacity: done ? 1 : 0.5 }}>
                      <Icon name="file-text" size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14 }}>No orders match your filters.</div>}
      </div>
    </div>
  );
}
