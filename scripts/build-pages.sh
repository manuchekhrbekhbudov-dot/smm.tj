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

SITE="${NEXT_PUBLIC_SITE_URL:-https://manuchekhrbekhbudov-dot.github.io${BASE}}"
# Root → Tajik home; keep Jekyll away from _next/
cat > out/index.html <<HTML
<!doctype html><html lang="tg"><head><meta charset="utf-8"><title>SMM.TJ</title>
<meta http-equiv="refresh" content="0; url=${BASE}/tg/">
<link rel="canonical" href="${SITE}/tg/">
<link rel="alternate" hreflang="tg" href="${SITE}/tg/"><link rel="alternate" hreflang="ru" href="${SITE}/ru/"><link rel="alternate" hreflang="x-default" href="${SITE}/tg/"></head>
<body style="background:#05010A"><script>location.replace("${BASE}/tg/"+location.search)</script></body></html>
HTML
# Bilingual 404 for GitHub Pages (served for any unknown URL)
cat > out/404.html <<HTML
<!doctype html><html lang="tg"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 · SMM.TJ</title><meta name="robots" content="noindex"><link rel="icon" href="${BASE}/icon.svg">
<style>
:root{color-scheme:dark}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 50% 30%,#3b1a7a 0%,#05010A 60%);color:#fff;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;padding:24px}
.orb{width:140px;height:140px;margin:0 auto 28px;border-radius:50%;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.55) 0,rgba(255,255,255,0) 32%),linear-gradient(145deg,#8b5cf6,#7c3aed 45%,#c026d3);box-shadow:0 30px 80px -10px rgba(168,85,247,.6)}
h1{font-size:64px;margin:0;letter-spacing:-2px}p{color:rgba(255,255,255,.75);margin:8px 0}
.row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:28px}
a{display:inline-block;padding:14px 26px;border-radius:999px;color:#fff;text-decoration:none;font-weight:600;background:linear-gradient(135deg,#8b5cf6,#a855f7 50%,#c026d3)}
a.o{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}
</style></head><body><main><div class="orb"></div><h1>404</h1>
<p>Саҳифа ёфт нашуд.</p><p>Страница не найдена.</p>
<div class="row"><a href="${BASE}/tg/">Ба саҳифаи асосӣ</a><a class="o" href="${BASE}/ru/">На главную</a></div></main></body></html>
HTML
touch out/.nojekyll

rm -rf "$ROOT/pages-out"
mv out "$ROOT/pages-out"
echo "Static site ready in pages-out/ (base path $BASE)"
