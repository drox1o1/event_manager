// authenticated_api endpoints, organiser role (src/authenticated_api/handler.py).
// Every function takes the caller's access token explicitly -- this package
// doesn't own token storage, the consuming app's auth context does.

import { apiFetch } from './http';
import type {
  AttendeeListResponse,
  BannerUploadUrlResponse,
  EventActionResponse,
  EventCreateRequest,
  EventImageInput,
  EventUpdateRequest,
  FormFieldInput,
  FormFieldsResponse,
  ImageUploadUrlResponse,
  LoginRequest,
  OrganiserEventDetail,
  OrganiserEventListResponse,
  OrganiserSignupRequest,
  OrganiserSignupResponse,
  TicketTierCreateInput,
  TicketTiersCreateResponse,
  TokenResponse,
} from './types';

export function signup(body: OrganiserSignupRequest): Promise<OrganiserSignupResponse> {
  return apiFetch<OrganiserSignupResponse>('/organiser/auth/signup', { method: 'POST', body });
}

export function verifyEmail(token: string): Promise<{ status: string }> {
  return apiFetch('/organiser/auth/verify-email', { method: 'POST', body: { token } });
}

export function login(body: LoginRequest): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/organiser/auth/login', { method: 'POST', body });
}

export function listMyEvents(token: string, params: { page?: number; pageSize?: number } = {}): Promise<OrganiserEventListResponse> {
  return apiFetch<OrganiserEventListResponse>('/organiser/events', {
    token,
    query: { page: params.page, page_size: params.pageSize },
  });
}

export function getMyEvent(token: string, eventId: string): Promise<OrganiserEventDetail> {
  return apiFetch<OrganiserEventDetail>(`/organiser/events/${eventId}`, { token });
}

export function createEvent(token: string, body: EventCreateRequest): Promise<EventActionResponse> {
  return apiFetch<EventActionResponse>('/organiser/events', { method: 'POST', body, token });
}

export function updateEvent(token: string, eventId: string, body: EventUpdateRequest): Promise<EventActionResponse> {
  return apiFetch<EventActionResponse>(`/organiser/events/${eventId}`, { method: 'PATCH', body, token });
}

export function submitEvent(token: string, eventId: string): Promise<EventActionResponse> {
  return apiFetch<EventActionResponse>(`/organiser/events/${eventId}/submit`, { method: 'POST', token });
}

export function createTicketTiers(token: string, eventId: string, tiers: TicketTierCreateInput[]): Promise<TicketTiersCreateResponse> {
  return apiFetch<TicketTiersCreateResponse>(`/organiser/events/${eventId}/ticket-tiers`, {
    method: 'POST',
    body: { tiers },
    token,
  });
}

export function createBannerUploadUrl(token: string, eventId: string): Promise<BannerUploadUrlResponse> {
  return apiFetch<BannerUploadUrlResponse>(`/organiser/events/${eventId}/banner-upload-url`, { method: 'POST', token });
}

export function listAttendees(token: string, eventId: string): Promise<AttendeeListResponse> {
  return apiFetch<AttendeeListResponse>(`/organiser/events/${eventId}/attendees`, { token });
}

// --- Registration form builder ---

export function getFormFields(token: string, eventId: string): Promise<FormFieldsResponse> {
  return apiFetch<FormFieldsResponse>(`/organiser/events/${eventId}/form-fields`, { token });
}

/** Replaces the event's entire registration form with `fields` (replace-all). */
export function replaceFormFields(token: string, eventId: string, fields: FormFieldInput[]): Promise<FormFieldsResponse> {
  return apiFetch<FormFieldsResponse>(`/organiser/events/${eventId}/form-fields`, {
    method: 'PUT',
    body: { fields },
    token,
  });
}

// --- Gallery images (up to 3, shown under the event description) ---

export function createImageUploadUrl(token: string, eventId: string): Promise<ImageUploadUrlResponse> {
  return apiFetch<ImageUploadUrlResponse>(`/organiser/events/${eventId}/image-upload-url`, { method: 'POST', token });
}

export function replaceEventImages(token: string, eventId: string, images: EventImageInput[]): Promise<{ images: string[] }> {
  return apiFetch<{ images: string[] }>(`/organiser/events/${eventId}/images`, {
    method: 'PUT',
    body: { images },
    token,
  });
}

/** Uploads a gallery image file directly to S3 via a presigned PUT URL. */
export async function uploadImageFile(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'image/jpeg' },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Image upload failed (${response.status})`);
  }
}

/** Uploads a file directly to S3 using a presigned PUT URL from createBannerUploadUrl. */
export async function uploadBannerFile(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'image/jpeg' },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Banner upload failed (${response.status})`);
  }
}
