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
  gallery_images: string[];
  ticket_tiers: TicketTierSummary[];
}

// --- Registration form builder ---

export type FormFieldType = 'text' | 'single_choice' | 'multi_choice';

/** A field as stored/returned by the API (has a server id). */
export interface FormField {
  id: string;
  label: string;
  field_type: FormFieldType;
  options: string[] | null;
  required: boolean;
  sort_order: number;
}

/** A field as sent to the API on save (no id -- replace-all semantics). */
export interface FormFieldInput {
  label: string;
  field_type: FormFieldType;
  options?: string[] | null;
  required: boolean;
  sort_order: number;
}

export interface FormFieldsResponse {
  fields: FormField[];
}

export interface FormResponseInput {
  field_id: string;
  answer: string | string[];
}

export interface EventImageInput {
  image_url: string;
  sort_order: number;
}

export interface ImageUploadUrlResponse {
  upload_url: string;
  image_url: string;
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

// --- Public: homepage CMS (resolved) ---

export type HomepageSectionType = 'category_grid' | 'featured_events' | 'trending_events';
export type HomepageSectionMode = 'auto' | 'curated';

export interface HomepageHero {
  eyebrow: string;
  headline: string;
  subheadline: string | null;
  search_enabled: boolean;
}

export interface HomepageBanner {
  enabled: boolean;
  text: string | null;
  link_url: string | null;
}

/** A resolved homepage block: a category grid carries `categories`, an event
 *  row carries `events`. */
export interface HomepageResolvedSection {
  type: HomepageSectionType;
  title: string;
  categories?: CategorySummary[];
  events?: EventSummary[];
}

export interface HomepageContent {
  hero: HomepageHero;
  banner: HomepageBanner;
  sections: HomepageResolvedSection[];
}

// --- Admin: homepage CMS (editable config) ---

export interface HomepageSettings {
  hero_eyebrow: string;
  hero_headline: string;
  hero_subheadline: string | null;
  hero_search_enabled: boolean;
  banner_enabled: boolean;
  banner_text: string | null;
  banner_link_url: string | null;
}

export interface HomepageSection {
  id: string;
  title: string;
  section_type: HomepageSectionType;
  mode: HomepageSectionMode;
  enabled: boolean;
  sort_order: number;
  event_ids: string[];
}

export interface HomepageConfig {
  settings: HomepageSettings;
  sections: HomepageSection[];
}

export interface HomepageSectionInput {
  title: string;
  section_type: HomepageSectionType;
  mode: HomepageSectionMode;
  enabled: boolean;
  event_ids: string[];
}

export interface HomepageReplaceRequest {
  settings: HomepageSettings;
  sections: HomepageSectionInput[];
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
  form_responses?: FormResponseInput[];
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
  form_responses: OrderFormResponse[];
}

export interface OrderFormResponse {
  field_label: string;
  answer: string | string[];
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
  gallery_images: string[];
  category_id: string;
  ticket_tiers: OrganiserEventTier[];
  form_fields: FormField[];
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
