# CyRokx frontend

Three Next.js (App Router, TypeScript) apps for the CyRokx event-ticketing
platform, built from the **CyRokx Design System** (Claude Design project
`ef2ebff5-…`) and wired to the Python/AWS-SAM backend in `../src`.

```
frontend/
  packages/
    ui/            @cyrokx/ui         — design tokens + 24 shared components (TSX, plain CSS vars)
    api-client/    @cyrokx/api-client — typed fetch client mirroring common/schemas.py + formatters
  apps/
    public-site/       events discovery + guest checkout (no auth)  — SSR, port 3000
    organiser-portal/  create/manage events (organiser JWT)         — port 3001
    admin-panel/       moderation + platform admin (admin JWT)       — port 3002
```

`packages/ui` keeps the design system's own approach: **plain CSS custom
properties** (`@cyrokx/ui/tokens.css`) + inline styles, so the components are a
1:1 port of the design kit. Icons use `lucide-react` behind the same
`<Icon name="…" />` API. Auth is JWT bearer tokens in `localStorage`
(there's no refresh endpoint server-side yet — sessions expire after ~1h and
the route guard bounces to `/login`).

## Setup

```bash
cd frontend
npm install
```

Each app needs the deployed API Gateway base URL. Copy the example and fill in
the CloudFormation `ApiUrl` output of the `cyrokx-app-*` stack:

```bash
cp apps/public-site/.env.example apps/public-site/.env.local
# repeat for organiser-portal and admin-panel, then set NEXT_PUBLIC_API_BASE_URL
```

```bash
aws cloudformation describe-stacks --stack-name cyrokx-app-prod \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text
```

## Develop

```bash
npm run dev:public-site       # http://localhost:3000
npm run dev:organiser-portal  # http://localhost:3001
npm run dev:admin-panel       # http://localhost:3002
```

## Build

```bash
npm run build                 # tsc + production build for all three apps
```

## Notes / known gaps (inherited from the backend "foundation pass")

- **Checkout is test-mode.** `POST /events/{id}/checkout` records a real order
  + tickets in Postgres and marks it paid immediately — no Razorpay call (no
  gateway credentials). The Checkout page flags this inline.
- **No confirmation email is sent.** `email_sender` is a backend stub, so the
  organiser email-verify token is only visible in CloudWatch logs for now.
- **Events must be published to appear publicly.** The admin flow is
  submit → approve → **publish** (`approved → live`); the public site only lists
  `live` events.
- **QR codes** are generated as tokens and shown on the order page, but not
  rendered as scannable images (no check-in scanner UI exists yet).
