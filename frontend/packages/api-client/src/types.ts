// Types mirroring src/layers/common/common/schemas.py and the raw dict
// shapes returned by src/public_api/handler.py + src/authenticated_api/handler.py.
// Decimal/date/datetime fields serialize as strings over JSON (Pydantic's
// `model_dump(mode="json")` / manual `.isoformat()` calls) -- kept as
// `string` here rather than `number`/`Date`, matching what actually arrives
// on the wire.

export type OrganiserStatus = 'pending' | 'verified' | 'suspended';
export type EventStatus = 'draft' | 'review' | 'approved' | 'rejected' | 'live' | 'soldout' | 'deactivated';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type RefundStatus = 'pending' | 'approved' | 'rejected';

// --- Auth ---

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

// --- Public: events, categories ---

export interface TicketTierSummary {
  id: string;
  name: string;
  price: string;
  quantity_total: number;
  quantity_sold: number;
}

export interface EventSummary {
  id: string;
  title: string;
  category: string | null;
  city: string;
  event_date: string;
  price_from: string | null;
  sold_out: boolean;
}

export interface EventDetail extends EventSummary {
  description: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  banner_image_url: string | null;
  ticket_tiers: TicketTierSummary[];
}

export interface EventListResponse {
  events: EventSummary[];
  page: number;
  page_size: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  sort_order: number;
}

// --- Public: checkout / orders / refunds ---

export interface CheckoutItemInput {
  ticket_tier_id: string;
  quantity: number;
}

export interface CheckoutRequest {
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  items: CheckoutItemInput[];
}

export interface CheckoutResponse {
  order_id: string;
  payment_status: PaymentStatus;
}

export interface OrderTicket {
  id: string;
  qr_code_token: string;
  checked_in: boolean;
}

export interface OrderItemDetail {
  ticket_tier_id: string;
  ticket_tier_name: string | null;
  quantity: number;
  unit_price: string;
  tickets: OrderTicket[];
}

export interface OrderDetail {
  order_id: string;
  event_id: string;
  event_title: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  subtotal: string;
  booking_fee: string;
  total_amount: string;
  payment_status: PaymentStatus;
  created_at: string;
  items: OrderItemDetail[];
}

export interface RefundRequestInput {
  reason: string;
}

export interface RefundRequestCreatedResponse {
  refund_request_id: string;
  status: RefundStatus;
}

// --- Organiser: auth ---

export interface OrganiserSignupRequest {
  contact_name: string;
  org_name: string;
  email: string;
  password: string;
}

export interface OrganiserSignupResponse {
  organiser_id: string;
  status: OrganiserStatus;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// --- Organiser: events ---

export interface EventCreateRequest {
  title: string;
  category_id: string;
  description: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  city: string;
  capacity: number;
}

export type EventUpdateRequest = Partial<EventCreateRequest> & { banner_image_url?: string };

export interface EventActionResponse {
  event_id: string;
  status: EventStatus;
}

export interface OrganiserEventSummary {
  event_id: string;
  title: string;
  category: string | null;
  city: string;
  event_date: string;
  status: EventStatus;
  tickets_sold: number;
  tickets_total: number;
  rejection_reason: string | null;
}

export interface AdminEventSummary extends OrganiserEventSummary {
  organiser_name: string | null;
}

export interface OrganiserEventTier {
  id: string;
  name: string;
  price: string;
  quantity_total: number;
  quantity_sold: number;
}

export interface OrganiserEventDetail extends OrganiserEventSummary {
  description: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  capacity: number;
  banner_image_url: string | null;
  category_id: string;
  ticket_tiers: OrganiserEventTier[];
}

export interface OrganiserEventListResponse {
  events: OrganiserEventSummary[];
  page: number;
  page_size: number;
}

export interface AdminEventListResponse {
  events: AdminEventSummary[];
  page: number;
  page_size: number;
}

export interface TicketTierCreateInput {
  name: string;
  price: string;
  quantity_total: number;
  sale_start?: string;
  sale_end?: string;
}

export interface TicketTiersCreateResponse {
  ticket_tiers: { id: string; name: string }[];
}

export interface BannerUploadUrlResponse {
  upload_url: string;
  banner_image_url: string;
}

export interface Attendee {
  ticket_id: string;
  order_id: string;
  buyer_name: string;
  buyer_email: string;
  ticket_tier: string | null;
  checked_in: boolean;
}

export interface AttendeeListResponse {
  attendees: Attendee[];
}

// --- Admin: moderation ---

export interface ModerationQueueItem {
  event_id: string;
  title: string;
  organiser_id: string;
  submitted_at: string | null;
}

export interface ModerationQueueResponse {
  events: ModerationQueueItem[];
}

export interface ModerationRejectRequest {
  reason: string;
}

// --- Admin: organisers ---

export interface OrganiserSummary {
  id: string;
  org_name: string;
  contact_name: string;
  email: string;
  status: OrganiserStatus;
  created_at: string;
}

export interface OrganiserListResponse {
  organisers: OrganiserSummary[];
}

export interface OrganiserActionResponse {
  organiser_id: string;
  status: OrganiserStatus;
}

// --- Admin: transactions ---

export interface TransactionSummary {
  order_id: string;
  event_title: string | null;
  buyer_name: string;
  buyer_email: string;
  total_amount: string;
  payment_status: PaymentStatus;
  created_at: string;
}

export interface TransactionListResponse {
  transactions: TransactionSummary[];
  page: number;
  page_size: number;
}

// --- Admin: refunds ---

export interface RefundSummary {
  refund_request_id: string;
  order_id: string;
  buyer_name: string | null;
  amount: string | null;
  reason: string;
  status: RefundStatus;
  requested_at: string;
}

export interface RefundListResponse {
  refunds: RefundSummary[];
}

export interface RefundResolveRequest {
  reason: string;
}

// --- Admin: platform settings ---

export interface PlatformSettings {
  commission_pct: string;
  buyer_fee_enabled: boolean;
  auto_payout_enabled: boolean;
  email_sender_name: string;
  email_reply_to: string | null;
  email_footer_note: string | null;
}

export type PlatformSettingsUpdateRequest = Partial<PlatformSettings>;
