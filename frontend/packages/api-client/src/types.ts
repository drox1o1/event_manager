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

export type TicketType = 'paid' | 'free' | 'donation';
export type TicketSaleStatus = 'on_sale' | 'paused';
export type LocationType = 'venue' | 'online' | 'recorded';
export type ScheduleType = 'single' | 'recurring';
export type ListingType = 'public' | 'private';

export interface Recurrence {
  frequency: 'daily' | 'weekly' | 'monthly';
  /** 0 = Mon .. 6 = Sun (weekly only). */
  weekdays: number[];
  until: string;
}

export interface TicketTierSummary {
  id: string;
  name: string;
  price: string;
  quantity_total: number;
  quantity_sold: number;
  ticket_type: TicketType;
  description: string | null;
  min_per_order: number;
  max_per_order: number;
  /** Age limits on the event date (null = none); needs a Date of birth question. */
  min_age: number | null;
  max_age: number | null;
  requires_approval: boolean;
  group_name: string | null;
  sale_status: TicketSaleStatus;
  sort_order: number;
}

export interface EventSummary {
  id: string;
  title: string;
  category: string | null;
  city: string;
  event_date: string;
  price_from: string | null;
  sold_out: boolean;
  event_time?: string | null;
  venue_name?: string | null;
  banner_image_url?: string | null;
  location_type?: LocationType;
}

export interface OrganiserPublicSummary {
  id: string;
  org_name: string;
  logo_url: string | null;
}

export interface EventDetail extends EventSummary {
  description: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  banner_image_url: string | null;
  gallery_images: string[];
  ticket_tiers: TicketTierSummary[];
  end_date: string | null;
  end_time: string | null;
  timezone: string;
  schedule_type: ScheduleType;
  recurrence: Recurrence | null;
  allow_discussions: boolean;
  promo_video_url: string | null;
  tags: string[];
  organiser: OrganiserPublicSummary | null;
}

export interface FeaturedEvent extends EventSummary {
  headline: string;
  description: string;
  organiser_name: string | null;
  /** Where the banner goes when clicked; null = the event page. */
  link_url?: string | null;
  /** Optional 4:3 artwork for phones; falls back to banner_image_url. */
  mobile_banner_url?: string | null;
}

export interface OrganiserPublicPage {
  id: string;
  org_name: string;
  bio: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  city: string | null;
  member_since: string;
  events: EventSummary[];
}

// --- Registration form builder ---

/** date = calendar picker; dob = date of birth (drives ticket age limits); phone = 10-digit Indian mobile, stored as +91XXXXXXXXXX. */
export type FormFieldType = 'text' | 'single_choice' | 'multi_choice' | 'date' | 'dob' | 'phone';

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
  /** Existing field's id when editing it, so past answers stay linked. */
  id?: string | null;
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
  icon: string | null;
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
  /** Set when the row is limited to one category ("See all" links there). */
  category?: string | null;
}

export interface HomepageContent {
  hero: HomepageHero;
  banner: HomepageBanner;
  /** Super-admin pinned hero slides (1 = single hero, 2+ = carousel). */
  featured?: FeaturedEvent[];
  sections: HomepageResolvedSection[];
}

// --- Admin: homepage CMS (editable config) ---

export interface FooterLinkItem {
  label: string;
  href: string;
}

export interface FooterColumnItem {
  title: string;
  links: FooterLinkItem[];
}

export interface HomepageSettings {
  hero_eyebrow: string;
  hero_headline: string;
  hero_subheadline: string | null;
  hero_search_enabled: boolean;
  banner_enabled: boolean;
  banner_text: string | null;
  banner_link_url: string | null;
  footer_tagline: string | null;
  footer_columns: FooterColumnItem[];
  active_cities: string[];
}

export interface HomepageSection {
  id: string;
  title: string;
  section_type: HomepageSectionType;
  mode: HomepageSectionMode;
  enabled: boolean;
  sort_order: number;
  category_id?: string | null;
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
  category_id?: string | null;
}

export interface HomepageReplaceRequest {
  settings: HomepageSettings;
  sections: HomepageSectionInput[];
}

// --- Public: site chrome (cities + footer, super-admin controlled) ---

export interface SiteChrome {
  cities: string[];
  footer: {
    tagline: string;
    columns: FooterColumnItem[];
  };
}

// --- Admin: categories (replace-all CRUD) ---

export interface CategoryInput {
  id?: string;
  name: string;
  icon: string | null;
}

export interface CategoriesReplaceRequest {
  categories: CategoryInput[];
}

export interface CategoriesResponse {
  categories: CategorySummary[];
}

// --- Site pages (admin CRUD, public read by slug) ---

export interface SitePageListItem {
  id: string;
  slug: string;
  title: string;
  updated_at: string;
}

export interface SitePage {
  id: string;
  slug: string;
  title: string;
  body: string;
  updated_at: string;
}

export interface SitePageUpsertRequest {
  title: string;
  body: string;
}

// --- Public: checkout / orders / refunds ---

export interface AttendeeInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  form_responses: FormResponseInput[];
}

export interface CheckoutItemInput {
  ticket_tier_id: string;
  quantity: number;
  /** Donation tickets: chosen amount per ticket. */
  amount?: string;
  /** One entry per ticket -- each participant gets their own ticket id. */
  attendees?: AttendeeInput[];
}

export interface CheckoutRequest {
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  items: CheckoutItemInput[];
  form_responses?: FormResponseInput[];
  occurrence_date?: string;
}

export interface CheckoutResponse {
  order_id: string;
  payment_status: PaymentStatus;
}

export interface TicketAnswer {
  field_id?: string;
  field_label: string;
  answer: string | string[];
}

export interface OrderTicket {
  id: string;
  ticket_code: string;
  qr_code_token: string;
  checked_in: boolean;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_answers: TicketAnswer[];
  approval_status: 'approved' | 'pending' | 'rejected';
}

export interface OrderItemDetail {
  ticket_tier_id: string;
  ticket_tier_code: string;
  ticket_tier_name: string | null;
  quantity: number;
  unit_price: string;
  tickets: OrderTicket[];
}

export interface OrderDetail {
  order_id: string;
  order_code: string;
  event_id: string;
  event_title: string | null;
  event_date: string | null;
  event_time: string | null;
  venue_name: string | null;
  city: string | null;
  banner_image_url: string | null;
  online_url: string | null;
  occurrence_date: string | null;
  payment_ref: string | null;
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

/** "Raise a query related to this transaction" (replaces refund requests). */
export type OrderQueryCategory = 'payment' | 'details' | 'cancellation' | 'other';

export interface OrderQueryInput {
  category: OrderQueryCategory;
  message: string;
}

export interface OrderQuerySummary {
  id: string;
  order_id: string;
  order_code: string;
  payment_ref: string | null;
  event_title: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  category: OrderQueryCategory;
  category_label: string;
  message: string;
  status: 'open' | 'resolved';
  created_at: string | null;
  resolved_at: string | null;
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
  end_date?: string | null;
  end_time?: string | null;
  timezone?: string;
  location_type?: LocationType;
  online_url?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  city: string;
  capacity?: number;
  schedule_type?: ScheduleType;
  recurrence?: Recurrence | null;
  listing_type?: ListingType;
  allow_discussions?: boolean;
  promo_video_url?: string | null;
  tags?: string[];
  /** Admin only: host organiser (null = platform-hosted). */
  organiser_id?: string | null;
}

export type EventUpdateRequest = Partial<EventCreateRequest> & { banner_image_url?: string | null };

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
  event_time?: string;
  banner_image_url?: string | null;
  is_featured?: boolean;
  featured_order?: number;
  featured_headline?: string | null;
  featured_link_url?: string | null;
  featured_mobile_banner_url?: string | null;
  listing_type?: ListingType;
}

export interface AdminEventSummary extends OrganiserEventSummary {
  organiser_name: string | null;
}

export interface OrganiserEventTier extends TicketTierSummary {
  /** Short human-friendly ticket-type id shown in the UI. */
  code: string;
  sale_start: string | null;
  sale_end: string | null;
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
  organiser_id: string | null;
  organiser_name: string | null;
  ticket_tiers: OrganiserEventTier[];
  form_fields: FormField[];
  location_type: LocationType;
  online_url: string | null;
  end_date: string | null;
  end_time: string | null;
  timezone: string;
  schedule_type: ScheduleType;
  recurrence: Recurrence | null;
  listing_type: ListingType;
  allow_discussions: boolean;
  promo_video_url: string | null;
  tags: string[];
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
  ticket_type: TicketType;
  price: string;
  quantity_total: number;
  description?: string | null;
  min_per_order?: number;
  max_per_order?: number;
  min_age?: number | null;
  max_age?: number | null;
  requires_approval?: boolean;
  group_name?: string | null;
  sale_status?: TicketSaleStatus;
  sale_start?: string | null;
  sale_end?: string | null;
}

export interface TicketTiersCreateResponse {
  ticket_tiers: OrganiserEventTier[];
}

export interface FeatureEventRequest {
  is_featured: boolean;
  featured_order?: number;
  featured_headline?: string | null;
  featured_link_url?: string | null;
  featured_mobile_banner_url?: string | null;
}

export interface BannerUploadUrlResponse {
  upload_url: string;
  banner_image_url: string;
}

export interface Attendee {
  ticket_id: string;
  ticket_code: string;
  order_id: string;
  order_code: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  attendee_name: string;
  attendee_email: string | null;
  attendee_phone: string | null;
  attendee_answers: TicketAnswer[];
  ticket_tier: string | null;
  ticket_tier_id: string;
  unit_price: string;
  checked_in: boolean;
  approval_status: 'approved' | 'pending' | 'rejected';
  occurrence_date: string | null;
  purchased_at: string;
}

// --- Organiser: own account / public page ---

export interface OrganiserProfile {
  id: string;
  org_name: string;
  contact_name: string;
  email: string;
  status: OrganiserStatus;
  status_reason: string | null;
  email_verified: boolean;
  approved_at: string | null;
  bio: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  phone: string | null;
  city: string | null;
  created_at: string;
}

export type OrganiserProfileUpdate = Partial<Pick<OrganiserProfile,
  'org_name' | 'contact_name' | 'bio' | 'logo_url' | 'cover_url' | 'website_url' | 'instagram_url' | 'phone' | 'city'>>;

export interface AttendeeListResponse {
  attendees: Attendee[];
}

export type RegistrationExportFormat = 'csv' | 'xlsx';

/** Server-built registration export, base64-encoded (see downloadExport). */
export interface RegistrationExport {
  filename: string;
  content_type: string;
  row_count: number;
  data: string;
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
  email_verified: boolean;
  status_reason: string | null;
  approved_at: string | null;
  city: string | null;
  phone: string | null;
  logo_url: string | null;
  events_count: number;
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
