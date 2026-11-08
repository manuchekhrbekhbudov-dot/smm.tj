#!/usr/bin/env bash
# Builds a static copy of the site for GitHub Pages into ./pages-out
# Usage: scripts/build-pages.sh [/repo-name]   (default base path: /smm.tj)
set -euo pipefail
BASE="${1:-/smm.tj}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# copy sources (no rsync dependency); node_modules is symlinked to save time/space
tar -C "$ROOT" --exclude=./.git --exclude=./.next --exclude=./pages-out --exclude=./legacy --exclude=./node_modules -cf - . | tar -C "$WORK" -xf -
ln -s "$ROOT/node_modules" "$WORK/node_modules"
cd "$WORK"
# Middleware (locale redirect) needs a server; the static build links to /tg/ directly.
# Supabase settings come from NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in the environment.
rm -f src/middleware.ts
rm -rf "src/app/[locale]/[...rest]"

STATIC_EXPORT=1 PAGES_BASE_PATH="$BASE" NEXT_TELEMETRY_DISABLED=1 npx next build

# Root → Tajik home; keep Jekyll away from _next/
cat > out/index.html <<HTML
<!doctype html><html lang="tg"><head><meta charset="utf-8"><title>SMM.TJ</title>
<meta http-equiv="refresh" content="0; url=${BASE}/tg/">
<link rel="canonical" href="${BASE}/tg/"></head>
<body style="background:#05010A"><script>location.replace("${BASE}/tg/"+location.search)</script></body></html>
HTML
cp out/tg/404/index.html out/404.html 2>/dev/null || cp out/index.html out/404.html
touch out/.nojekyll

rm -rf "$ROOT/pages-out"
mv out "$ROOT/pages-out"
echo "Static site ready in pages-out/ (base path $BASE)"
