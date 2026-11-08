# SMM.TJ — бозори мутахассисони SMM дар Тоҷикистон

Мутахассисони SMM бо рақами телефон (SMS) сабти ном мекунанд, профил ва **нархҳои худро** мегузоранд.
Мизоҷон онҳоро бо филтр меёбанд, фармоиш медиҳанд ва пас аз анҷоми кор **шарҳи воқеӣ** менависанд.
Директор (+992 50 444 01 01) профилҳоро тасдиқ мекунад ва шарҳҳоро назорат мекунад.

**Ягон маълумоти сохта нест** — ҳама рақамҳо ва профилҳо аз пойгоҳи додаҳо меоянд.

## Технологияҳо
Next.js 15 · TypeScript · Tailwind CSS 4 · Framer Motion · GSAP · Three.js · next-intl (тоҷикӣ/русӣ) · **Supabase** (Auth бо SMS, Postgres + RLS, Storage).

## Supabase
1. Дар supabase.com лоиҳа созед.
2. **SQL Editor** → мундариҷаи `supabase/schema.sql`-ро гузоред → **Run**.
3. **Authentication → Providers → Phone** → фаъол кунед ва SMS-провайдер (Twilio) гузоред.
4. `Project URL` ва `anon key`-ро ба `.env.local` гузоред:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

Қоидаҳои бовар дар худи база (RLS + trigger) иҷро мешаванд: мутахассис худро тасдиқ карда наметавонад,
шарҳ танҳо пас аз фармоиши анҷомёфта, як фармоиш — як шарҳ, рейтингро база ҳисоб мекунад.

## Оғоз
```bash
npm install
npm run dev
```

## Саҳифаҳо
`/tg` асосӣ · `/tg/specialists` каталог · `/tg/specialist?id=` профил · `/tg/login` воридшавӣ (SMS) ·
`/tg/onboarding` · `/tg/cabinet` кабинет (мизоҷ/мутахассис) · `/tg/admin` панели директор · `/tg/about`.

## GitHub Pages
```bash
NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... bash scripts/build-pages.sh
cp -r pages-out/. .
```
Папкаҳои `tg/`, `ru/`, `_next/`, `404/` ва `index.html`, `404.html`, `.nojekyll` дар решаи репозиторий — нусхаи тайёри сайт барои Pages. Онҳоро дастӣ таҳрир накунед.
