'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icon, RichText, useIsMobile } from '@showtik/ui';
import { formatDateTime, formatEventDate, formatINR } from '@showtik/api-client';
import type { EventDetail } from '@showtik/api-client';
import { BookingModal } from '@/components/BookingModal';

export interface EventDetailViewProps {
  event: EventDetail;
  /** Open the ticket selector immediately (e.g. from a homepage "Book tickets"). */
  autoBook?: boolean;
}

const WEEKDAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function youtubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function to12h(t: string | null | undefined): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function calendarUrl(e: EventDetail): string {
  const fmt = (d: string, t: string) => `${d.replace(/-/g, '')}T${t.slice(0, 5).replace(':', '')}00`;
  const start = fmt(e.event_date, e.event_time);
  const end = e.end_date && e.end_time ? fmt(e.end_date, e.end_time) : fmt(e.event_date, `${String(Math.min(Number(e.event_time.slice(0, 2)) + 2, 23)).padStart(2, '0')}:${e.event_time.slice(3, 5)}`);
  const p = new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates: `${start}/${end}`, ctz: e.timezone, location: e.location_type === 'venue' ? `${e.venue_name}, ${e.venue_address}` : 'Online', details: `${e.title} on Showtik` });
  return `https://calendar.google.com/calendar/render?${p}`;
}

/** Event page — banner, host, date & location, rich description, video,
 *  gallery, tags, ticket info, FAQ, and a sticky "Book Tickets" card that opens
 *  the multi-ticket booking flow. */
export function EventDetailView({ event, autoBook }: EventDetailViewProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [booking, setBooking] = React.useState(false);
  const [shared, setShared] = React.useState(false);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      else if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? i : (i + 1) % event.gallery_images.length));
      else if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? i : (i - 1 + event.gallery_images.length) % event.gallery_images.length));
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [lightboxIndex, event.gallery_images.length]);

  React.useEffect(() => { if (autoBook) setBooking(true); }, [autoBook]);

  const onSale = event.ticket_tiers.filter((t) => t.sale_status === 'on_sale' && t.quantity_sold < t.quantity_total);
  const prices = onSale.map((t) => (t.ticket_type === 'free' ? 0 : Number(t.price)));
  const minPrice = prices.length ? Math.min(...prices) : null;
  const allFree = onSale.length > 0 && onSale.every((t) => t.ticket_type === 'free' || Number(t.price) === 0);
  const canBook = onSale.length > 0;
  // Cheapest option free (even alongside paid tiers) reads as "Free", not "From Free".
  const priceLabel = allFree || minPrice === 0 ? 'Free' : minPrice !== null ? `From ${formatINR(minPrice)}` : '—';
  const vid = youtubeId(event.promo_video_url);
  const where = event.location_type === 'venue' ? `${event.venue_name}, ${event.city}` : event.location_type === 'online' ? 'Online event' : 'Recorded — watch anytime';
  const when = `${formatDateTime(event.event_date, event.event_time)}${event.end_time ? ` to ${event.end_date && event.end_date !== event.event_date ? `${formatEventDate(event.end_date)}, ` : ''}${to12h(event.end_time)}` : ''}`;
  const recurText = event.schedule_type === 'recurring' && event.recurrence
    ? `Repeats ${event.recurrence.frequency === 'daily' ? 'every day' : event.recurrence.frequency === 'monthly' ? 'every month' : `every ${event.recurrence.weekdays.map((d) => WEEKDAY[d]).join(', ') || 'week'}`} until ${formatEventDate(event.recurrence.until)}`
    : null;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue_name}, ${event.venue_address}`)}`;

  const share = async () => {
    const url = window.location.href.split('?')[0];
    try {
      if (navigator.share) await navigator.share({ title: event.title, url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 1800); }
    } catch { /* dismissed */ }
  };

  const faqs = [
    { q: `When and where is ${event.title} being held?`, a: `${when}${recurText ? ` (${recurText.toLowerCase()})` : ''} — ${event.location_type === 'venue' ? `${event.venue_name}, ${event.venue_address}` : where}.` },
    { q: `Who is organizing ${event.title}?`, a: event.organiser ? `${event.organiser.org_name}, a verified organiser on Showtik.` : 'This event is hosted by Showtik.' },
    { q: `Where can I buy ${event.title} tickets?`, a: 'Right here — tap “Book Tickets”. No account needed; tickets arrive instantly on your order page.' },
    { q: `What types of tickets are available for ${event.title}?`, a: event.ticket_tiers.length ? event.ticket_tiers.map((t) => `${t.name} (${t.ticket_type === 'free' ? 'Free' : t.ticket_type === 'donation' ? 'pay what you want' : formatINR(t.price)})`).join(', ') + '.' : 'Tickets will be announced soon.' },
  ];

  const hostCard = (
    <div style={{ background: 'var(--surface-card)', borderRadius: 18, border: '1px solid var(--border-default)', padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>Host Details</div>
      <div
        onClick={() => event.organiser && router.push(`/organisers/${event.organiser.id}`)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: event.organiser ? 'pointer' : 'default' }}
      >
        <span style={{ width: 46, height: 46, borderRadius: 12, flex: 'none', background: event.organiser?.logo_url ? `center/cover no-repeat url(${event.organiser.logo_url})` : 'var(--gradient-brand)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!event.organiser?.logo_url && (event.organiser?.org_name ?? 'S').charAt(0).toUpperCase()}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.organiser?.org_name ?? 'Showtik'}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="badge-check" size={13} color="var(--color-accent-secondary)" />Verified organiser</div>
        </div>
        {event.organiser && <Icon name="chevron-right" size={18} color="var(--text-subtle)" />}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: 'var(--font-sans)', paddingBottom: isMobile ? 100 : 64 }}>
      {/* Banner on a blurred backdrop of itself, like a poster wall */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--color-ink)' }}>
        {event.banner_image_url && <div aria-hidden style={{ position: 'absolute', inset: -40, background: `center/cover no-repeat url(${event.banner_image_url})`, filter: 'blur(40px) saturate(1.2)', opacity: 0.55 }} />}
        <div style={{ position: 'relative', maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: isMobile ? '12px 12px 0' : '28px 32px 0' }}>
          <div style={{ aspectRatio: '2 / 1', maxHeight: 520, width: '100%', borderRadius: isMobile ? '14px 14px 0 0' : '22px 22px 0 0', overflow: 'hidden', background: event.banner_image_url ? `center/cover no-repeat url(${event.banner_image_url})` : 'var(--gradient-hero)', display: 'flex', alignItems: 'flex-end', padding: event.banner_image_url ? 0 : 'clamp(24px, 5vw, 56px)', position: 'relative' }}>
            {!event.banner_image_url && (
              <>
                <span aria-hidden style={{ position: 'absolute', top: '-30%', right: '-8%', width: '42%', height: '180%', background: 'var(--gradient-brand)', opacity: 0.55, transform: 'rotate(18deg)', borderRadius: 40 }} />
                <div style={{ position: 'relative', fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 6vw, 72px)', fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 0.95, letterSpacing: '-0.03em', maxWidth: 800 }}>{event.title}</div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 'var(--content-max-width)', margin: '0 auto', padding: isMobile ? '0 16px' : '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 360px', gap: isMobile ? 28 : 48, marginTop: isMobile ? 20 : 32 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {event.category && <span style={{ padding: '5px 12px', borderRadius: 999, background: 'var(--color-accent-tint)', color: 'var(--color-accent)', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{event.category}</span>}
              {event.location_type !== 'venue' && <span style={{ padding: '5px 12px', borderRadius: 999, background: 'var(--surface-accent-secondary-tint)', color: 'var(--color-accent-secondary)', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{event.location_type === 'online' ? 'Online' : 'Recorded'}</span>}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 4.6vw, 52px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--text-heading)', margin: '0 0 14px' }}>{event.title}</h1>
            <div onClick={() => event.organiser && router.push(`/organisers/${event.organiser.id}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, color: 'var(--text-muted)', cursor: event.organiser ? 'pointer' : 'default', marginBottom: 22 }}>
              by <strong style={{ color: 'var(--text-heading)' }}>{event.organiser?.org_name ?? 'Showtik'}</strong>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
              <PillBtn icon="share-2" onClick={share}>{shared ? 'Link copied' : 'Share Event'}</PillBtn>
              <a href={calendarUrl(event)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><PillBtn icon="calendar-plus">Add to Calendar</PillBtn></a>
            </div>

            <Heading>Date &amp; Location</Heading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 40 }}>
              <InfoRow icon="calendar">
                <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{when} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({event.timezone === 'Asia/Kolkata' ? 'IST' : event.timezone})</span></div>
                {recurText && <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{recurText}</div>}
              </InfoRow>
              <InfoRow icon={event.location_type === 'venue' ? 'map-pin' : 'monitor-play'}>
                {event.location_type === 'venue' ? (
                  <>
                    <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{event.venue_name}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{event.venue_address}</div>
                    <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 14, fontWeight: 600, color: 'var(--color-accent-secondary)', textDecoration: 'none' }}>View on map <Icon name="map" size={14} /></a>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{where}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>The access link appears on your order page after booking.</div>
                  </>
                )}
              </InfoRow>
            </div>

            <Heading>About the event</Heading>
            <RichText text={event.description} style={{ marginBottom: 32 }} />

            {vid && (
              <div style={{ aspectRatio: '16 / 9', borderRadius: 18, overflow: 'hidden', marginBottom: 32, background: '#000' }}>
                <iframe title={`${event.title} video`} src={`https://www.youtube-nocookie.com/embed/${vid}`} style={{ width: '100%', height: '100%', border: 0 }} allowFullScreen />
              </div>
            )}

            {event.gallery_images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(event.gallery_images.length, 3)}, 1fr)`, gap: 12, marginBottom: 36 }}>
                {event.gallery_images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    aria-label={`Open photo ${i + 1} of ${event.gallery_images.length}`}
                    style={{ padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', borderRadius: 14 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${event.title} photo ${i + 1}`} style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 14 }} />
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'var(--surface-accent-secondary-tint)', marginBottom: 36, fontSize: 14, color: 'var(--text-body)' }}>
              <Icon name="qr-code" size={20} color="var(--color-accent-secondary)" />E-tickets make event day easier — every participant gets their own QR ticket. Just show up and scan.
            </div>

            {event.tags.length > 0 && (
              <>
                <Heading>Event Tags</Heading>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
                  {event.tags.map((t) => <a key={t} href={`/events?q=${encodeURIComponent(t)}`} style={{ padding: '7px 14px', borderRadius: 999, border: '1px solid var(--border-default)', fontSize: 13.5, color: 'var(--text-body)', textDecoration: 'none', background: 'var(--surface-card)' }}>{t}</a>)}
                </div>
              </>
            )}

            <Heading>Ticket Info</Heading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {event.ticket_tiers.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Tickets will be announced soon.</div>}
              {[...event.ticket_tiers].sort((a, b) => a.sort_order - b.sort_order).map((t) => {
                const left = t.quantity_total - t.quantity_sold;
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border-default)', background: 'var(--surface-card)' }}>
                    <Icon name="ticket" size={18} color="var(--color-accent)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{t.name}{t.group_name && <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}> · {t.group_name}</span>}</div>
                      {t.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{t.description}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-heading)' }}>{t.ticket_type === 'donation' ? 'Pay what you want' : formatINR(t.price)}</div>
                      <div style={{ fontSize: 12, color: left <= 0 || t.sale_status !== 'on_sale' ? 'var(--color-error)' : 'var(--text-subtle)' }}>{left <= 0 ? 'Sold out' : t.sale_status !== 'on_sale' ? 'Not on sale' : left <= 20 ? `${left} left` : 'Available'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {canBook && <button type="button" onClick={() => setBooking(true)} style={bookBtn(false)}><Icon name="zap" size={16} />Book Tickets</button>}

            <div style={{ marginTop: 44 }}>
              <Heading>Frequently Asked Questions</Heading>
              <div style={{ borderTop: '1px solid var(--border-default)' }}>
                {faqs.map((f, i) => (
                  <div key={f.q} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <button type="button" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 2px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: 'var(--text-heading)' }}>
                      {f.q}<Icon name={openFaq === i ? 'chevron-up' : 'chevron-down'} size={18} />
                    </button>
                    {openFaq === i && <div style={{ padding: '0 2px 16px', fontSize: 14.5, color: 'var(--text-body)', lineHeight: 1.6 }}>{f.a}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ position: isMobile ? 'static' : 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--surface-card)', borderRadius: 18, border: '1px solid var(--border-default)', boxShadow: '0 12px 36px rgba(5,23,71,0.08)', padding: 22 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Register for</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 900, color: allFree ? 'var(--color-success)' : 'var(--text-heading)', margin: '2px 0 4px', letterSpacing: '-0.02em' }}>{priceLabel}</div>
                <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 18 }}>{formatEventDate(event.event_date)} · {event.city}</div>
                <button type="button" disabled={!canBook} onClick={() => setBooking(true)} style={bookBtn(!canBook, true)}>
                  <Icon name="zap" size={17} />{canBook ? 'Book Tickets' : event.sold_out ? 'Sold out' : 'Tickets unavailable'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)', marginTop: 12, justifyContent: 'center' }}><Icon name="shield-check" size={14} />Secure checkout · No account needed</div>
              </div>
              {hostCard}
            </div>
          </div>
        </div>
      </div>

      {isMobile && canBook && !booking && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--surface-card)', borderTop: '1px solid var(--border-default)', boxShadow: '0 -8px 24px rgba(5,23,71,0.1)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tickets</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-heading)' }}>{priceLabel}</div>
          </div>
          <button type="button" onClick={() => setBooking(true)} style={{ ...bookBtn(false), width: 'auto', padding: '0 28px' }}><Icon name="zap" size={16} />Book Tickets</button>
        </div>
      )}

      {booking && <BookingModal event={event} onClose={() => setBooking(false)} />}

      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${event.title} photo ${lightboxIndex + 1} of ${event.gallery_images.length}`}
          onClick={() => setLightboxIndex(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(5,10,25,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 16 : 48 }}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
            style={{ position: 'absolute', top: isMobile ? 14 : 24, right: isMobile ? 14 : 24, width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer' }}
          >
            <Icon name="x" size={20} />
          </button>

          {event.gallery_images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i === null ? i : (i - 1 + event.gallery_images.length) % event.gallery_images.length)); }}
                aria-label="Previous photo"
                style={{ position: 'absolute', left: isMobile ? 8 : 20, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer' }}
              >
                <Icon name="chevron-left" size={22} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i === null ? i : (i + 1) % event.gallery_images.length)); }}
                aria-label="Next photo"
                style={{ position: 'absolute', right: isMobile ? 8 : 20, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer' }}
              >
                <Icon name="chevron-right" size={22} />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.gallery_images[lightboxIndex]}
            alt={`${event.title} photo ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
          />

          {event.gallery_images.length > 1 && (
            <div style={{ position: 'absolute', bottom: isMobile ? 14 : 24, left: 0, right: 0, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              {lightboxIndex + 1} / {event.gallery_images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function bookBtn(disabled: boolean, full = false): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, width: full ? '100%' : 'auto', padding: full ? 0 : '0 26px',
    borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700,
    background: disabled ? 'var(--color-muted-bg)' : 'var(--color-accent)', color: disabled ? 'var(--text-subtle)' : '#fff',
    boxShadow: disabled ? 'none' : '0 8px 22px rgba(196,20,63,0.3)',
  };
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-heading)', margin: '0 0 16px', letterSpacing: '-0.01em' }}>{children}</h2>;
}

function InfoRow({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      <span style={{ width: 42, height: 42, flex: 'none', borderRadius: 12, background: 'var(--color-off-white)', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={19} /></span>
      <div style={{ paddingTop: 2 }}>{children}</div>
    </div>
  );
}

function PillBtn({ icon, children, onClick }: { icon: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-heading)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
      <Icon name={icon} size={15} />{children}
    </button>
  );
}
