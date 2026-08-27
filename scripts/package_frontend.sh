#!/usr/bin/env bash
# Assembles a Lambda deployment package for one frontend app under
# .build/frontend/<app>/, from that app's `next build` standalone output.
#
# Layout Next.js's `output: "standalone"` produces (see next.config.ts) is
# self-contained except for two directories it deliberately omits --
# .next/static and public/ -- which must be copied in by hand:
# https://nextjs.org/docs/app/api-reference/config/next-config-js/output
#
# The zip root also gets run.sh, the Handler for AWS Lambda Web Adapter's
# zip-based (non-container) mode: the adapter's exec wrapper runs this
# script instead of invoking a JS handler, and proxies Lambda Function URL
# requests to it as plain HTTP on $PORT.
# https://github.com/awslabs/aws-lambda-web-adapter
set -euo pipefail

APP="${1:?usage: package_frontend.sh <app-name>, e.g. organiser-portal}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT/frontend/apps/$APP"
STANDALONE="$APP_DIR/.next/standalone"
OUT="$ROOT/.build/frontend/$APP"

test -d "$STANDALONE" || {
  echo "No .next/standalone for $APP -- run 'make frontend-build' first" >&2
  exit 1
}

rm -rf "$OUT"
mkdir -p "$OUT"

# Root node_modules + apps/$APP/{server.js,.next/**,node_modules?} traced by
# Next -- workspace packages (@cyrokx/ui, @cyrokx/api-client) are already
# inlined into the server bundle via transpilePackages, so nothing further
# is needed from frontend/packages/.
cp -R "$STANDALONE/." "$OUT/"

# Omitted by standalone output; copy by hand (see comment above).
cp -R "$APP_DIR/.next/static" "$OUT/apps/$APP/.next/static"
if [ -d "$APP_DIR/public" ]; then
  cp -R "$APP_DIR/public" "$OUT/apps/$APP/public"
fi

cat > "$OUT/run.sh" <<EOF
#!/bin/sh
exec node apps/$APP/server.js
EOF
chmod +x "$OUT/run.sh"

echo "Packaged $APP -> $OUT"
