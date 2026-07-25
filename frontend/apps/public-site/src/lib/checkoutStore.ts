// Guest checkout has no server-side cart (the backend's checkout endpoint
// takes the full item list in one POST), so the ticket selection made on the
// event-detail page is handed to the checkout page through sessionStorage.

export interface CheckoutSelectionItem {
  ticket_tier_id: string;
  quantity: number;
  name: string;
  unit_price: string;
}

export interface CheckoutSelection {
  eventTitle: string;
  items: CheckoutSelectionItem[];
}

function key(eventId: string): string {
  return `cyrokx.checkout.${eventId}`;
}

export function persistCheckoutSelection(eventId: string, selection: CheckoutSelection): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(key(eventId), JSON.stringify(selection));
}

export function readCheckoutSelection(eventId: string): CheckoutSelection | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(key(eventId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckoutSelection;
  } catch {
    return null;
  }
}

export function clearCheckoutSelection(eventId: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(key(eventId));
}
