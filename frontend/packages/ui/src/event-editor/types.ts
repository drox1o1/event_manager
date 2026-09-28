import type {
  EventActionResponse,
  EventCreateRequest,
  EventImageInput,
  EventUpdateRequest,
  FormFieldInput,
  FormFieldsResponse,
  ImageUploadUrlResponse,
  BannerUploadUrlResponse,
  OrganiserEventDetail,
  OrganiserEventTier,
  TicketTierCreateInput,
  TicketTiersCreateResponse,
} from '@showtik/api-client';

/** The endpoints the event editor needs. `organiserApi` and `adminApi` both
 *  satisfy this with identical signatures, so the same editor drives the
 *  organiser portal (own events) and the super-admin panel (any event). */
export interface EventEditorApi {
  createEvent(token: string, body: EventCreateRequest): Promise<EventActionResponse>;
  getEvent(token: string, eventId: string): Promise<OrganiserEventDetail>;
  updateEvent(token: string, eventId: string, body: EventUpdateRequest): Promise<EventActionResponse>;
  createTicketTiers(token: string, eventId: string, tiers: TicketTierCreateInput[]): Promise<TicketTiersCreateResponse>;
  updateTicketTier(token: string, eventId: string, tierId: string, tier: TicketTierCreateInput): Promise<OrganiserEventTier>;
  deleteTicketTier(token: string, eventId: string, tierId: string): Promise<{ deleted: string }>;
  /** contentType = the File's .type; it's signed into the presigned URL. */
  createBannerUploadUrl(token: string, eventId: string, contentType?: string): Promise<BannerUploadUrlResponse>;
  createImageUploadUrl(token: string, eventId: string, contentType?: string): Promise<ImageUploadUrlResponse>;
  replaceEventImages(token: string, eventId: string, images: EventImageInput[]): Promise<{ images: string[] }>;
  uploadFile(uploadUrl: string, file: File): Promise<void>;
  getFormFields(token: string, eventId: string): Promise<FormFieldsResponse>;
  replaceFormFields(token: string, eventId: string, fields: FormFieldInput[]): Promise<FormFieldsResponse>;
}

export type EditorSection = 'basic' | 'media' | 'tickets' | 'form' | 'publish' | 'notify';

export const EDITOR_SECTIONS: { key: EditorSection; label: string }[] = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'media', label: 'Media' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'form', label: 'Registration form' },
  { key: 'publish', label: 'Publish' },
  { key: 'notify', label: 'Notify audience' },
];

export interface HostOption {
  id: string;
  name: string;
}
