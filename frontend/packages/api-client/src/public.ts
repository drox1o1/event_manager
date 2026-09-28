// public_api endpoints -- no auth required (src/public_api/handler.py).

import { apiFetch } from './http';
import type {
  CategorySummary,
  CheckoutRequest,
  CheckoutResponse,
  EventDetail,
  EventListResponse,
  FormFieldsResponse,
  HomepageContent,
  OrderDetail,
  OrganiserPublicPage,
  RefundRequestCreatedResponse,
  RefundRequestInput,
  SiteChrome,
  SitePage,
} from './types';

export interface ListEventsParams {
  category?: string;
  city?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export function listEvents(params: ListEventsParams = {}): Promise<EventListResponse> {
  return apiFetch<EventListResponse>('/events', {
    query: { category: params.category, city: params.city, q: params.q, page: params.page, page_size: params.pageSize },
  });
}

/** Fills defaults for fields added in backend migration 0006, so the
 *  frontend keeps working against an API that hasn't been upgraded yet. */
function withEventDefaults(e: EventDetail): EventDetail {
  return {
    ...e,
    end_date: e.end_date ?? null,
    end_time: e.end_time ?? null,
    timezone: e.timezone ?? 'Asia/Kolkata',
    location_type: e.location_type ?? 'venue',
    schedule_type: e.schedule_type ?? 'single',
    recurrence: e.recurrence ?? null,
    allow_discussions: e.allow_discussions ?? true,
    promo_video_url: e.promo_video_url ?? null,
    tags: e.tags ?? [],
    organiser: e.organiser ?? null,
    gallery_images: e.gallery_images ?? [],
    ticket_tiers: (e.ticket_tiers ?? []).map((t, i) => ({
      ...t,
      ticket_type: t.ticket_type ?? (Number(t.price) === 0 ? 'free' : 'paid'),
      description: t.description ?? null,
      min_per_order: t.min_per_order ?? 1,
      max_per_order: t.max_per_order ?? 10,
      requires_approval: t.requires_approval ?? false,
      group_name: t.group_name ?? null,
      sale_status: t.sale_status ?? 'on_sale',
      sort_order: t.sort_order ?? i,
    })),
  };
}

export function getEvent(eventId: string): Promise<EventDetail> {
  return apiFetch<EventDetail>(`/events/${eventId}`).then(withEventDefaults);
}

/** The organiser's registration form for a LIVE event -- rendered on checkout. */
export function getEventFormFields(eventId: string): Promise<FormFieldsResponse> {
  return apiFetch<FormFieldsResponse>(`/events/${eventId}/form-fields`);
}

export function listCategories(): Promise<{ categories: CategorySummary[] }> {
  return apiFetch('/categories');
}

/** The resolved homepage layout controlled by the super-admin CMS. */
export function getHomepage(): Promise<HomepageContent> {
  return apiFetch<HomepageContent>('/homepage');
}

/** Site-wide chrome the super admin controls: the city list (navbar dropdown,
 *  event-listing city filter) and the public footer's tagline + link columns. */
export function getSiteChrome(): Promise<SiteChrome> {
  return apiFetch<SiteChrome>('/site-chrome');
}

/** A standalone content page (About, Careers, Help centre...) by slug. */
export function getSitePage(slug: string): Promise<SitePage> {
  return apiFetch<SitePage>(`/site-pages/${slug}`);
}

export function checkout(eventId: string, body: CheckoutRequest): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>(`/events/${eventId}/checkout`, { method: 'POST', body });
}

export function getOrder(orderId: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/orders/${orderId}`);
}

export function requestRefund(orderId: string, body: RefundRequestInput): Promise<RefundRequestCreatedResponse> {
  return apiFetch<RefundRequestCreatedResponse>(`/orders/${orderId}/refund-request`, { method: 'POST', body });
}

/** Public organiser page: profile + live public events. */
export function getOrganiserPage(organiserId: string): Promise<OrganiserPublicPage> {
  return apiFetch<OrganiserPublicPage>(`/organisers/${organiserId}`);
}
