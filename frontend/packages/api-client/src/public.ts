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
  RefundRequestCreatedResponse,
  RefundRequestInput,
} from './types';

export interface ListEventsParams {
  category?: string;
  city?: string;
  page?: number;
  pageSize?: number;
}

export function listEvents(params: ListEventsParams = {}): Promise<EventListResponse> {
  return apiFetch<EventListResponse>('/events', {
    query: { category: params.category, city: params.city, page: params.page, page_size: params.pageSize },
  });
}

export function getEvent(eventId: string): Promise<EventDetail> {
  return apiFetch<EventDetail>(`/events/${eventId}`);
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

export function checkout(eventId: string, body: CheckoutRequest): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>(`/events/${eventId}/checkout`, { method: 'POST', body });
}

export function getOrder(orderId: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/orders/${orderId}`);
}

export function requestRefund(orderId: string, body: RefundRequestInput): Promise<RefundRequestCreatedResponse> {
  return apiFetch<RefundRequestCreatedResponse>(`/orders/${orderId}/refund-request`, { method: 'POST', body });
}
