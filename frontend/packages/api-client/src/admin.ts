// authenticated_api endpoints, admin role (src/authenticated_api/handler.py).

import { apiFetch } from './http';
import type {
  AdminEventListResponse,
  CategoriesReplaceRequest,
  CategoriesResponse,
  EventActionResponse,
  HomepageConfig,
  HomepageReplaceRequest,
  LoginRequest,
  ModerationQueueResponse,
  ModerationRejectRequest,
  OrganiserActionResponse,
  OrganiserListResponse,
  PlatformSettings,
  PlatformSettingsUpdateRequest,
  RefundListResponse,
  RefundResolveRequest,
  SitePage,
  SitePageListItem,
  SitePageUpsertRequest,
  TokenResponse,
  TransactionListResponse,
} from './types';

export function login(body: LoginRequest): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/admin/auth/login', { method: 'POST', body });
}

export function getModerationQueue(token: string): Promise<ModerationQueueResponse> {
  return apiFetch<ModerationQueueResponse>('/admin/moderation-queue', { token });
}

export function approveEvent(token: string, eventId: string): Promise<EventActionResponse> {
  return apiFetch<EventActionResponse>(`/admin/events/${eventId}/approve`, { method: 'POST', token });
}

export function rejectEvent(token: string, eventId: string, body: ModerationRejectRequest): Promise<EventActionResponse> {
  return apiFetch<EventActionResponse>(`/admin/events/${eventId}/reject`, { method: 'POST', body, token });
}

export function listAllEvents(
  token: string,
  params: { status?: string; page?: number; pageSize?: number } = {}
): Promise<AdminEventListResponse> {
  return apiFetch<AdminEventListResponse>('/admin/events', {
    token,
    query: { status: params.status, page: params.page, page_size: params.pageSize },
  });
}

export function publishEvent(token: string, eventId: string): Promise<EventActionResponse> {
  return apiFetch<EventActionResponse>(`/admin/events/${eventId}/publish`, { method: 'POST', token });
}

export function listOrganisers(token: string): Promise<OrganiserListResponse> {
  return apiFetch<OrganiserListResponse>('/admin/organisers', { token });
}

export function suspendOrganiser(token: string, organiserId: string): Promise<OrganiserActionResponse> {
  return apiFetch<OrganiserActionResponse>(`/admin/organisers/${organiserId}/suspend`, { method: 'POST', token });
}

export function reactivateOrganiser(token: string, organiserId: string): Promise<OrganiserActionResponse> {
  return apiFetch<OrganiserActionResponse>(`/admin/organisers/${organiserId}/reactivate`, { method: 'POST', token });
}

export function listTransactions(token: string, params: { page?: number; pageSize?: number } = {}): Promise<TransactionListResponse> {
  return apiFetch<TransactionListResponse>('/admin/transactions', {
    token,
    query: { page: params.page, page_size: params.pageSize },
  });
}

export function listRefunds(token: string): Promise<RefundListResponse> {
  return apiFetch<RefundListResponse>('/admin/refunds', { token });
}

export function approveRefund(token: string, refundId: string): Promise<{ refund_request_id: string; status: string }> {
  return apiFetch(`/admin/refunds/${refundId}/approve`, { method: 'POST', token });
}

export function rejectRefund(token: string, refundId: string, body: RefundResolveRequest): Promise<{ refund_request_id: string; status: string }> {
  return apiFetch(`/admin/refunds/${refundId}/reject`, { method: 'POST', body, token });
}

export function getSettings(token: string): Promise<PlatformSettings> {
  return apiFetch<PlatformSettings>('/admin/settings', { token });
}

export function updateSettings(token: string, body: PlatformSettingsUpdateRequest): Promise<PlatformSettings> {
  return apiFetch<PlatformSettings>('/admin/settings', { method: 'PATCH', body, token });
}

// --- Homepage CMS ---

export function getHomepageConfig(token: string): Promise<HomepageConfig> {
  return apiFetch<HomepageConfig>('/admin/homepage', { token });
}

/** Replace-all save of the entire homepage (hero/banner + ordered sections). */
export function replaceHomepage(token: string, body: HomepageReplaceRequest): Promise<HomepageConfig> {
  return apiFetch<HomepageConfig>('/admin/homepage', { method: 'PUT', body, token });
}

// --- Categories ---

export function listCategories(token: string): Promise<CategoriesResponse> {
  return apiFetch<CategoriesResponse>('/admin/categories', { token });
}

/** Replace-all save: rows with an id are updated, rows without one are
 *  created, and any existing category missing from the list is deleted
 *  (rejected with 409 if events still reference it). */
export function replaceCategories(token: string, body: CategoriesReplaceRequest): Promise<CategoriesResponse> {
  return apiFetch<CategoriesResponse>('/admin/categories', { method: 'PUT', body, token });
}

// --- Site pages ---

export function listSitePages(token: string): Promise<{ pages: SitePageListItem[] }> {
  return apiFetch<{ pages: SitePageListItem[] }>('/admin/site-pages', { token });
}

export function getSitePage(token: string, slug: string): Promise<SitePage> {
  return apiFetch<SitePage>(`/admin/site-pages/${slug}`, { token });
}

/** Creates the page if `slug` doesn't exist yet, otherwise updates it. */
export function upsertSitePage(token: string, slug: string, body: SitePageUpsertRequest): Promise<SitePage> {
  return apiFetch<SitePage>(`/admin/site-pages/${slug}`, { method: 'PUT', body, token });
}

export function deleteSitePage(token: string, slug: string): Promise<{ deleted: string }> {
  return apiFetch<{ deleted: string }>(`/admin/site-pages/${slug}`, { method: 'DELETE', token });
}
