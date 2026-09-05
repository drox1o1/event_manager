# CyRokx Design System

CyRokx is building an event discovery and ticketing platform — a Klook-style
marketplace where people find and buy tickets to live events (music, comedy,
workshops, sports, food) with no account wall, and organisers create and
manage those events through their own portal, moderated by a super admin
panel before anything goes live.

## Sources

The only material provided for this system was a local folder `EvenCycle/`
containing two markdown documents (no code, no Figma, no logo/icon/photo
assets):

- `EvenCycle/DUKU_EventPlatform_DesignPRD.md` — the design PRD: goals, color
  palette, type scale, spacing/layout rules, radius/elevation, component
  inventory, and the full screen inventory across the three surfaces.
- `EvenCycle/DUKU_EventPlatform_ClaudeDesignPrompts.md` — a sequenced set of
  build prompts (style tile → component library → wireframes → hi-fi →
  organiser portal → admin panel → email/P2) meant to be pasted into a design
  agent one at a time.

Both documents refer to the working palette as a placeholder — "DUKU" is the
agency/project codename in the source files; **CyRokx** is the actual brand
per the brief this system was built from. The client has since supplied real
brand colors (Portland Orange, Purple Kissed Blue — see Visual foundations
below), which now drive the accent tokens in this system. The client's
reference swatch also included a cream "Glamour White"; it read too warm/
yellow as a UI background next to white cards, so page backgrounds stay a
neutral gray instead — flag it if the client wants that cream reinstated
somewhere more decorative (e.g. email header, marketing sections).

No codebase, Figma file, logo, icon set, or photography was attached, so this
system is greenfield: colors/type/spacing come directly from the PRD's exact
spec (not inferred), and anywhere the PRD was silent (iconography, imagery,
wordmark) this system makes an explicit, flagged substitution — see
Iconography below and the caveats at the end of this file.

## Content fundamentals

The source documents are internal spec/prompt documents, not shipped product
copy, so there is no existing voice to reverse-engineer. The tone implied by
the brief — "minimal, high-conversion," "nothing decorative that does not
earn its place," "frictionless discovery to checkout" — points to a direct,
utilitarian voice for a transactional marketplace:

- **Second person, plain verbs.** Buttons and CTAs read as an instruction to
  the user, not a feature name: "Buy tickets," "Search," "Create event,"
  never "Ticket Purchasing Module."
- **Numbers over adjectives.** "12 left," "1,204 registrations," "+12% vs
  last week" — let the data carry the weight instead of "Selling fast!"
- **Sentence case everywhere.** Headings, buttons, nav labels — no
  Title Case, no all-caps except the rare micro-label (e.g. a section
  eyebrow like "DISCOVER LIVE EVENTS NEAR YOU," used sparingly and always at
  a small caption size with letter-spacing, never at body size).
- **No emoji, no exclamation-point marketing voice.** The PRD's own language
  ("Clean, minimal, high-conversion... Nothing decorative that does not earn
  its place") rules out playful copy; keep status and confirmation copy
  matter-of-fact ("You're going!" is about as warm as it gets — see Order
  Confirmation).
- **Say what happens next.** Every transactional moment states a concrete
  fact or timeframe rather than a vague reassurance: "Your ticket... will
  arrive by email within 2 days," "We'll review it within 24 hours" — not
  "Thanks, we'll be in touch soon!"
- **Organiser/admin copy is even drier.** Dashboards and tables use label +
  value, no narrative sentences: "Revenue ₹4.2L +12% vs last week," not
  "Great news — your revenue is up!"

This is a starting point, not a finished voice guide — flag it for a real
content review once actual product copy or a brand voice doc exists.

## Visual foundations

**Color.** One accent (`#FC512A`, Portland Orange) carries every primary
action, link, and price — nowhere else. Everything else is neutral:
ink/body/muted/subtle text tones, a neutral gray page background
(`#F5F5F5`), white card surfaces, and a single gray rule color for dividers
— no cream or warm tint in any background, by design. A second brand color,
`#2641C8` Purple Kissed Blue, is held in reserve as a wayfinding accent
rather than mixed into primary actions — right now it marks the Super Admin
Panel's sidebar as a distinct surface from the Organiser Portal
(`SidebarShell`'s `accentColor` prop), per the brief's call for the two
logged-in surfaces to feel related but distinguishable. Status color
(success/warning/error) is reserved strictly for lifecycle state
(draft/review/approved/rejected/live/sold-out), never for decoration. See
`tokens/colors.css` for the full scale, including derived hover/active/tint
values computed with `color-mix()` rather than hand-picked hex, so state
colors stay mathematically tied to their base token.

**Type.** Inter, sans-serif, throughout — no serif, no display face. Bold
(700) for headings and price only; medium (600) for buttons/labels; regular
(400) for body. Headings use 1.2 line-height, body uses 1.5. The scale runs
Display 48 → Caption 12 in eight fixed steps (`tokens/typography.css`) — do
not introduce in-between sizes.

**Spacing & layout.** Strict 8pt grid (4/8/12/16/24/32/48/64). 12-column grid,
1200px max content width, 24px gutters. Section rhythm is 64px on desktop,
40px on mobile — vertical space is the primary tool for hierarchy, not
borders or dividers.

**Backgrounds & imagery.** Photography is the hero on every discovery screen
— event cards, hero units, and detail galleries are built around a large
image area first, copy second. No source photography was provided, so every
image slot in this system renders a neutral warm-gray gradient placeholder
with a photo icon (see `EventCard`, `EventDetail`) — swap in real event
photography before shipping; that placeholder is not a final visual
treatment. No patterns, textures, or illustration style appear in the source
brief — assume none until told otherwise. No gradients are used decoratively;
the only gradient in the system is the neutral photo placeholder itself.

**Elevation & borders.** Cards are shadow-first: `0 2px 8px rgba(0,0,0,0.06)`
at rest, a stronger lift on hover — never a hard 1px border standing in for a
card edge. Borders (`--border-default`, `#E4E4E4`) are reserved for form
fields, dividers, and filter rows where a shadow would be the wrong signal.

**Radius.** 8px on every control (buttons, inputs), 12px on cards, 16px on
modals, pill (999px) on badges/chips/avatars/tags. Consistent across the
whole system — never mix radii within one component family.

**Motion.** Subtle only, per the brief: hover lifts on cards (translateY +
shadow swap), color/opacity transitions on buttons and inputs (~150ms ease),
a spinner for loading buttons. No bounce, no springy easing, no page-level
transitions called out in the source — keep motion in service of feedback,
never decoration.

**Hover / press states.** Hover darkens fills via `color-mix()` (accent
buttons) or tints backgrounds faintly (secondary/ghost buttons, nav items);
never lightens toward white. Press/active goes one step darker than hover.
Disabled states flatten to the muted-background token and drop the border,
never just lower opacity on the colored state.

**Transparency & blur.** Used exactly once by design: the modal overlay
(`--surface-overlay`, `rgba(13,13,13,0.48)`). No blur/glass anywhere else in
the system.

**Imagery color vibe.** Not specified in the source brief — once real
photography is supplied, confirm whether it should be warm/saturated (matches
the warm off-white/accent palette) or neutral/documentary; flag this as an
open question for the client's photography direction.

## Iconography

No icon font, sprite, or SVG set was included with the source material. This
system uses **Lucide** (open-source, MIT, CDN-delivered) as a documented
substitution — its default 1.75px stroke weight and minimal line style is
the closest match to the "consistent stroke weight" the PRD calls for and to
Klook's own line-icon language.

- Loaded via `<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js">`
  on any page that uses icons.
- Wrapped by `components/icons/Icon.jsx` — a thin `<Icon name="search" />`
  component. No raw SVG path data lives in this repo; Lucide's own script
  draws each icon at runtime, per this project's rule against hand-drawn SVGs.
- No emoji and no Unicode glyphs are used as icons anywhere in this system.
- If the client has (or wants) a bespoke icon set, replace the CDN script tag
  and `Icon.jsx`'s internals — every consumer calls the same `<Icon name=…/>`
  API, so the swap is contained to one file.

## Assets

`assets/README.md` documents the same substitution above. No logos, product
photography, or illustrations were supplied — `guidelines/brand-wordmark.html`
shows a plain Inter-700 typographic lockup ("CyRokx") standing in for a real
mark; replace it the moment brand files exist. There are no illustrations,
patterns, or background textures in the source brief, so none are used here.

## Index

- `styles.css` — root stylesheet; imports everything under `tokens/`.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`,
  `radius-shadow.css`, `fonts.css` (Inter via Google Fonts CDN — no local
  webfont files were supplied).
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Radius &
  Shadow, Brand groups) shown in the Design System tab, plus the combined
  `style-tile.html`.
- `components/` — reusable primitives, grouped by concern:
  - `icons/` — `Icon` (Lucide wrapper).
  - `forms/` — `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`,
    `Switch`, `SearchBar`, `FilterControl`.
  - `feedback/` — `Badge` (status pill), `Toast`, `EmptyState`.
  - `display/` — `Avatar`, `Tag`, `StatCard`.
  - `cards/` — `EventCard`, `TicketTierRow`.
  - `navigation/` — `Stepper`.
  - `layout/` — `Navbar`, `Footer`, `Modal`, `DataTable`, `SidebarShell`.
- `ui_kits/public-site/` — Homepage, Event Listing, Event Detail, Checkout,
  Order Confirmation, Category Page, City Page, and Error/Empty/Payment-Fail
  states, wired into one interactive `index.html` (no login flow, per the
  PRD).
- `ui_kits/organiser-portal/` — Login/Sign up, Dashboard, Create Event
  (multi-step: details → date & venue → ticket tiers → images → review &
  submit), My Events, Event Detail, and Attendee List, wired into one
  interactive `index.html` using `SidebarShell`.
- `ui_kits/admin-panel/` — Login, Dashboard, Moderation Queue (the review
  panel with approve/reject-with-reason), All Events, Organiser Management,
  All Transactions, Refund Management (requests + dispute log), and Platform
  Settings (categories, commission, buyer-email notification settings),
  wired into one interactive `index.html`, same `SidebarShell` shell as the
  organiser portal but with the admin's own nav and a "Super admin" identity
  in the sidebar footer.
- `SKILL.md` — portable skill definition for using this system elsewhere
  (e.g. Claude Code).

## Caveats — please help me get this right

- **No codebase, Figma, logo, icon set, or photography was attached** — this
  entire system is built from the PRD's explicit spec plus reasonable,
  clearly-flagged substitutions (Lucide icons, a typographic wordmark,
  gradient photo placeholders). Please send real brand assets so I can
  replace every flagged placeholder.
- **All three P1 surfaces are now built and interactive**: Public Site,
  Organiser Portal, Super Admin Panel. Public Site P2 (Category Page, City
  Page, 404/empty-search/payment-fail) and Admin Panel P2 (Refund
  Management, Platform Settings) are built too. The Platform Settings email
  section includes a small in-page preview of the order-confirmation email,
  but a real send-ready email template (P2, section 7 of the PRD) is not yet
  built — say the word if you want that, plus the Organiser Portal's
  remaining P2 (ticket tiers manager, profile settings, payout history).
- Confirm the copy voice guide above matches how CyRokx actually wants to
  sound — it's inferred from the brief's tone, not a real content style guide.
