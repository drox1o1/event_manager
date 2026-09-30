# Hidden / unfinished features (internal)

Things removed from what clients and end users see because they had no backend,
showed sample data, or showed developer notes. Re-enable each one only once it
is backed by a real API. Last reviewed: 2026-09-30.

## Organiser portal — event workspace (`apps/organiser-portal/src/app/events/[eventId]/page.tsx`)

| Feature | What was wrong | Status | To bring back |
|---|---|---|---|
| Categories tab | Edited a local copy of the tiers (plus sample data) and said "the categories API is backend follow-up work" | **Fixed**: now lists the real ticket tiers; "Edit tickets" opens the editor's Tickets step, which saves to the API | Extra race fields (distance, start/end time, currency, hide on event page) need tier columns if still wanted |
| Discounts tab | Sample codes, saved only in the browser, dev note shown | **Hidden** (`EventDiscountsPanel.tsx` kept, not rendered) | Promo-code API + checkout support; `orders.discount_amount` / `promo_code` columns already exist (0009) |
| Tax tab | Settings saved only in the browser; invoice preview used a fixed ₹899 | **Hidden** (`EventTaxPanel.tsx`) | Per-event tax settings API + tax in checkout totals |
| Orders tab | Sample orders "shown for layout"; search/export ran on fake data | **Hidden** (`EventOrdersPanel.tsx`). The real **Attendees** page (with CSV/Excel export) now sits in the People group | Per-event orders list API (or reuse attendees export data) |
| More → Merchandize, Leaderboards, Certificates, Attendee bib, Email templates | "Coming soon" placeholder screens | **Hidden** from the More menu | Each needs its own backend feature |
| Event dashboard | "Orders by date" chart was hard-coded July data; Balance / Paid figures were invented; Orders = Attendees | **Fixed**: shows status, gross sales, tickets sold, spots left and a real sales-by-category table | A per-day orders API to bring back the date chart; payouts API for balance/paid |

## Where the dev notes lived
`NotWiredNote` in `apps/organiser-portal/src/components/event/panelState.tsx` renders
the pink "backend follow-up" banner. Nothing user-facing renders it any more; do
not use it in a screen that ships.

## Check before each release
```
grep -rnE "follow-up|backend|saves locally|Sample |coming soon" frontend/apps/*/src frontend/packages/ui/src | grep "\.tsx:"
```
Anything that renders on screen (not a code comment) should be fixed or hidden
and added to this list.
