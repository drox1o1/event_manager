// authenticated_api endpoints, admin role (src/authenticated_api/handler.py).

import { apiFetch } from './http';
import type {
  AdminEventListResponse,
  AttendeeListResponse,
  RegistrationExport,
  RegistrationExportFormat,
  BannerUploadUrlResponse,
  EventCreateRequest,
  EventImageInput,
  EventUpdateRequest,
  FeatureEventRequest,
  FormFieldInput,
  FormFieldsResponse,
  ImageUploadUrlResponse,
  OrganiserEventDetail,
  OrganiserEventTier,
  TicketTierCreateInput,
  TicketTiersCreateResponse,
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
  OrderQuerySummary,
  OrganiserProfileUpdate,
  OrganiserProfile,
  SitePage,
  SitePageListItem,
  SitePageUpsertRequest,
  TokenResponse,
  TransactionListResponse,
} from './types';

export function login(body: LoginRequest): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/admin/auth/login', { method: 'POST', body });
}

export function refresh(refreshToken: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/admin/auth/refresh', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  });
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
  params: { status?: string; page?: number; pageSize?: number; featured?: boolean } = {}
): Promise<AdminEventListResponse> {
  return apiFetch<AdminEventListResponse>('/admin/events', {
    token,
    query: { status: params.status, page: params.page, page_size: params.pageSize, featured: params.featured ? 'true' : undefined },
  });
}

export function publishEvent(token: string, eventId: string): Promise<EventActionResponse> {
  return apiFetch<EventActionResponse>(`/admin/events/${eventId}/publish`, { method: 'POST', token });
}

export function listOrganisers(token: string, params: { status?: string } = {}): Promise<OrganiserListResponse> {
  return apiFetch<OrganiserListResponse>('/admin/organisers', { token, query: { status: params.status } });
}

export function approveOrganiser(token: string, organiserId: string): Promise<OrganiserActionResponse> {
  return apiFetch<OrganiserActionResponse>(`/admin/organisers/${organiserId}/approve`, { method: 'POST', token });
}

export function rejectOrganiser(token: string, organiserId: string, reason: string): Promise<OrganiserActionResponse> {
  return apiFetch<OrganiserActionResponse>(`/admin/organisers/${organiserId}/reject`, { method: 'POST', body: { reason }, token });
}

export function suspendOrganiser(token: string, organiserId: string, reason?: string): Promise<OrganiserActionResponse> {
  return apiFetch<OrganiserActionResponse>(`/admin/organisers/${organiserId}/suspend`, { method: 'POST', body: { reason: reason || null }, token });
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

export function getOrganiser(token: string, organiserId: string): Promise<OrganiserProfile> {
  return apiFetch<OrganiserProfile>(`/admin/organisers/${organiserId}`, { token });
}

/** Super admin edits an organiser's details / public page on their behalf. */
export function updateOrganiser(token: string, organiserId: string, body: OrganiserProfileUpdate): Promise<OrganiserProfile> {
  return apiFetch<OrganiserProfile>(`/admin/organisers/${organiserId}`, { method: 'PATCH', body, token });
}

export function createOrganiserImageUploadUrl(token: string, organiserId: string, kind: 'logo' | 'cover', contentType?: string): Promise<ImageUploadUrlResponse> {
  return apiFetch<ImageUploadUrlResponse>(`/admin/organisers/${organiserId}/image-upload-url`, { method: 'POST', token, query: { kind, content_type: contentType } });
}

export function listOrderQueries(token: string, status: 'open' | 'resolved' | 'all' = 'open'): Promise<{ queries: OrderQuerySummary[] }> {
  return apiFetch('/admin/queries', { token, query: { status } });
}

export function resolveOrderQuery(token: string, queryId: string): Promise<{ id: string; status: string }> {
  return apiFetch(`/admin/queries/${queryId}/resolve`, { method: 'POST', token });
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

// --- Event editor: super admin creates/completes any event. Same
// signatures as organiserApi's so the shared editor drives both portals. ---

export function createEvent(token: string, body: EventCreateRequest): Promise<EventActionResponse> {
  return apiFetch<EventActionResponse>('/admin/events', { method: 'POST', body, token });
}

export function getEvent(token: string, eventId: string): Promise<OrganiserEventDetail> {
  return apiFetch<OrganiserEventDetail>(`/admin/events/${eventId}`, { token });
}

export function updateEvent(token: string, eventId: string, body: EventUpdateRequest): Promise<EventActionResponse> {
  return apiFetch<EventActionResponse>(`/admin/events/${eventId}`, { method: 'PATCH', body, token });
}

export function createTicketTiers(token: string, eventId: string, tiers: TicketTierCreateInput[]): Promise<TicketTiersCreateResponse> {
  return apiFetch<TicketTiersCreateResponse>(`/admin/events/${eventId}/ticket-tiers`, { method: 'POST', body: { tiers }, token });
}

export function updateTicketTier(token: string, eventId: string, tierId: string, tier: TicketTierCreateInput): Promise<OrganiserEventTier> {
  return apiFetch<OrganiserEventTier>(`/admin/events/${eventId}/ticket-tiers/${tierId}`, { method: 'PUT', body: tier, token });
}

export function deleteTicketTier(token: string, eventId: string, tierId: string): Promise<{ deleted: string }> {
  return apiFetch(`/admin/events/${eventId}/ticket-tiers/${tierId}`, { method: 'DELETE', token });
}

/** contentType must equal the picked File's .type (it's signed into the URL). */
export function createBannerUploadUrl(token: string, eventId: string, contentType?: string): Promise<BannerUploadUrlResponse> {
  return apiFetch<BannerUploadUrlResponse>(`/admin/events/${eventId}/banner-upload-url`, { method: 'POST', token, query: { content_type: contentType } });
}

export function createImageUploadUrl(token: string, eventId: string, contentType?: string): Promise<ImageUploadUrlResponse> {
  return apiFetch<ImageUploadUrlResponse>(`/admin/events/${eventId}/image-upload-url`, { method: 'POST', token, query: { content_type: contentType } });
}

export function replaceEventImages(token: string, eventId: string, images: EventImageInput[]): Promise<{ images: string[] }> {
  return apiFetch<{ images: string[] }>(`/admin/events/${eventId}/images`, { method: 'PUT', body: { images }, token });
}

export function getFormFields(token: string, eventId: string): Promise<FormFieldsResponse> {
  return apiFetch<FormFieldsResponse>(`/admin/events/${eventId}/form-fields`, { token });
}

export function replaceFormFields(token: string, eventId: string, fields: FormFieldInput[]): Promise<FormFieldsResponse> {
  return apiFetch<FormFieldsResponse>(`/admin/events/${eventId}/form-fields`, { method: 'PUT', body: { fields }, token });
}

/** One page of registrations -- see organiserApi.listAttendees for why this is
 *  cursor-paginated rather than returning everything at once. */
export function listAttendees(token: string, eventId: string, cursor?: string): Promise<AttendeeListResponse> {
  return apiFetch<AttendeeListResponse>(`/admin/events/${eventId}/attendees`, { token, query: { cursor } });
}

/** Registration export (every form field + transaction columns) as CSV or Excel. */
export function exportAttendees(token: string, eventId: string, format: RegistrationExportFormat, status: string = 'all'): Promise<RegistrationExport> {
  return apiFetch<RegistrationExport>(`/admin/events/${eventId}/attendees`, { token, query: { format, status } });
}

export function approveTicket(token: string, eventId: string, ticketId: string): Promise<{ approval_status: string }> {
  return apiFetch(`/admin/events/${eventId}/tickets/${ticketId}/approve`, { method: 'POST', token });
}

export function rejectTicket(token: string, eventId: string, ticketId: string): Promise<{ approval_status: string }> {
  return apiFetch(`/admin/events/${eventId}/tickets/${ticketId}/reject`, { method: 'POST', token });
}

export function unpublishEvent(token: string, eventId: string): Promise<EventActionResponse> {
  return apiFetch<EventActionResponse>(`/admin/events/${eventId}/unpublish`, { method: 'POST', token });
}

export function featureEvent(token: string, eventId: string, body: FeatureEventRequest): Promise<FeatureEventRequest & { event_id: string }> {
  return apiFetch(`/admin/events/${eventId}/feature`, { method: 'POST', body, token });
}

/** Uploads a file to S3 via a presigned PUT URL. */
export async function uploadFile(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'image/jpeg' }, body: file });
  if (!response.ok) throw new Error(`Upload failed (${response.status})`);
}
