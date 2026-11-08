# SMM.TJ — платформаи агентии SMM

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion · GSAP ScrollTrigger · Lenis · next-intl (тоҷикӣ / русӣ) · Supabase + Prisma (аз қадами воридшавӣ).

## Оғоз

```bash
npm install
npm run dev
```

Кушоед: http://localhost:3000 → ба `/tg` мегузарад. Русӣ: `/ru`.

- `/tg` — асосӣ: hero бо заррачаҳои 3D, хизматҳо, натиҷаҳо, портфолио бо скроли уфуқӣ, раванди кор, шарҳҳо, нархҳо, FAQ
- `/tg/services`, `/tg/services/reels` — хизматҳо
- `/tg/portfolio`, `/tg/portfolio/nur-beauty` — кейсҳо бо слайдери «пеш/баъд»
- `/tg/pricing`, `/tg/about`, `/tg/contact` — нархҳо, даста, форма ва харита
- `/tg/design-system` — ҳамаи рангҳо, ҳуруф, тугмаҳо, кортҳо, формаҳо ва аниматсияҳо.
- Тугмаи моҳ/офтоб дар header — реҷаи торик / равшан (интихоб дар браузер нигоҳ дошта мешавад).

## Сохтор

```
messages/          tg.json, ru.json — ҳамаи матнҳо
src/app/[locale]/  саҳифаҳо (template.tsx — гузариши саҳифа)
src/components/fx  Preloader, Cursor, SmoothScroll, TextReveal, Magnetic, TiltCard, Counter, Marquee, Reveal, Background
src/components/home  бахшҳои саҳифаи асосӣ (Hero, PortfolioScroll, Process, PricingCards, Faq...)
src/content/site.ts  нархҳо, кейсҳо, тамосҳо (маълумоти тамос ҳоло намунавӣ аст)
src/components/ui  Button, Card/Badge/Eyebrow, Input/Textarea/Toggle, Logo, ThemeToggle
src/app/globals.css  токенҳои дизайн (@theme), реҷаи равшан: [data-theme="light"]
legacy/            сайти кӯҳна (барои маълумот)
```

Ҳамаи аниматсияҳо `prefers-reduced-motion`-ро риоя мекунанд; дар телефон курсор ва эффектҳои вазнин хомӯшанд.

## GitHub Pages (нусхаи статикӣ)

```bash
bash scripts/build-pages.sh
```

Натиҷа дар `pages-out/` — онро ба шохаи `gh-pages` push кунед. Дар Pages формаи тамос паёмро ба WhatsApp мефиристад (сервер нест).
Нусхаи пурра бо сервер (воридшавӣ, кабинет) дар Vercel кор мекунад.

> Папкаҳои `tg/`, `ru/`, `_next/`, `404/` ва файлҳои `index.html`, `404.html`, `.nojekyll` дар решаи репозиторий — нусхаи тайёри сайт барои GitHub Pages (аз `scripts/build-pages.sh`). Онҳоро дастӣ таҳрир накунед.
