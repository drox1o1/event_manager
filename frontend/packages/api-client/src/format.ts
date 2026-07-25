// Small display-formatting helpers shared by all three apps -- backend
// serializes price as a decimal string and dates as ISO strings, these turn
// them into the copy voice the design system calls for ("₹799", "Sat, 12 Jul").

export function formatINR(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const amount = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(amount)) return '—';
  if (amount === 0) return 'Free';
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function formatEventDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatDateTime(isoDate: string, isoTime?: string): string {
  const datePart = formatEventDate(isoDate);
  if (!isoTime) return datePart;
  const [hoursStr, minutesStr] = isoTime.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return datePart;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${datePart} · ${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function formatTimestamp(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return isoDateTime;
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
