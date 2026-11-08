# SMM.TJ — платформаи агентии SMM

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion · GSAP ScrollTrigger · Lenis · next-intl (тоҷикӣ / русӣ) · Supabase + Prisma (аз қадами воридшавӣ).

## Оғоз

```bash
npm install
npm run dev
```

Кушоед: http://localhost:3000 → ба `/tg` мегузарад. Русӣ: `/ru`.

- `/tg/design-system` — ҳамаи рангҳо, ҳуруф, тугмаҳо, кортҳо, формаҳо ва аниматсияҳо.
- Тугмаи моҳ/офтоб дар header — реҷаи торик / равшан (интихоб дар браузер нигоҳ дошта мешавад).

## Сохтор

```
messages/          tg.json, ru.json — ҳамаи матнҳо
src/app/[locale]/  саҳифаҳо (template.tsx — гузариши саҳифа)
src/components/fx  Preloader, Cursor, SmoothScroll, TextReveal, Magnetic, TiltCard, Counter, Marquee, Reveal, Background
src/components/ui  Button, Card/Badge/Eyebrow, Input/Textarea/Toggle, Logo, ThemeToggle
src/app/globals.css  токенҳои дизайн (@theme), реҷаи равшан: [data-theme="light"]
legacy/            сайти кӯҳна (барои маълумот)
```

Ҳамаи аниматсияҳо `prefers-reduced-motion`-ро риоя мекунанд; дар телефон курсор ва эффектҳои вазнин хомӯшанд.
