# DESIGN.md

How Hang Up & Check looks. Owner: slice C (Owen), who decides design for every screen. Change the look by editing the tokens in `app/globals.css` and the components in `components/ui/`, never screen by screen.

## Rules for every screen

- Use only the semantic colour names below and the components in `components/ui/`. No raw Tailwind colours (`stone-*`, `red-*`, `green-*`, `amber-*`, `white`, `black`), no hex in components.
- Red, amber and green mean warning bands only, always with their icon and words (`BandBadge`). The one exception: an "End call" button may use `bg-danger text-surface`, because red hang-up is the phone convention.
- Body text at least 20px (`text-xl`, the default), tap targets at least 48px, contrast at least WCAG AA. No percentages, never the word "safe".
- Phone numbers only from `lib/guidance.ts`.

## Colour

Built with the color-expert method: an OKLCH reference palette (sand, lavender, tomato, ochre, fern) mapped to semantic roles, chosen by character (lightness and chroma) rather than hue. Every text pair is checked with WCAG and APCA, and the bands are checked under protan, deutan and tritan simulation.

| Role | Use |
|---|---|
| `bg` | Page background (warm paper) |
| `surface`, `surface-hover`, `surface-2` | Cards and sheets; hover wash; insets and quoted phrases |
| `ink`, `ink-2`, `ink-3` | Primary, secondary and tertiary text |
| `line` | Hairline borders on cards |
| `line-strong` | Borders that carry meaning (unselected controls, secondary buttons): 3:1 |
| `accent` + `on-accent` | Brand lavender fill with ink text (never white). Primary buttons, the "Sam is calling you" moment |
| `accent-hover`, `accent-strong` | Derived from `accent`; hover and pressed |
| `accent-soft` | Selected-option tint |
| `accent-ink` | Accent-coloured text, links and icons; focus ring and caret |
| `danger`, `caution`, `clear` (+ `-soft`) | Strong, some and no warning signs: ink for text and the card edge, soft for the card fill |

## Type

- Headings: Bricolage Grotesque (`font-display`, set on `h1`–`h3`), tracking -0.02em, line-height 1.15.
- Body: Atkinson Hyperlegible Next, 20px, line-height 1.5. Numbers that line up (times, codes, timers): `tabular-nums`.
- Emphasise with weight before size.

## Shape and depth

- Radii: `rounded-chip` 12px (status boxes, inputs, quoted phrases), `rounded-card` 18px (cards, options), `rounded-sheet` 24px; buttons are pills (`rounded-full`).
- Cards on the page: a 1px `line` border, no shadow. `shadow-float` only on things that float (toasts, sheets).

## Components (`components/ui/`)

- `Button` / `buttonClass(variant)`: `primary` (accent pill) or `secondary` (surface pill with a `line-strong` edge), 56px tall, full width. Put `buttonClass` on a `<Link>` or `<a>` that should look like a button.
- `Card`: neutral, or `tone={band}` for a warning card.
- `BandBadge`: a band's icon and words. `BAND_TONE` has each band's classes and icon.
- `icons.tsx`: drawn SVG icons, 1.75 stroke. No emoji as icons.

## Motion and touch

- Press feedback: `active:scale-[0.97]`, 100ms ease-out. Hover only on precise pointers (the `hover:` variant is set up for that).
- Entrances move but never fade, so a card stays readable if the browser stops drawing frames. Respect `prefers-reduced-motion`.
- Already global: no tap highlight, `touch-action: manipulation`, no text selection on buttons, safe-area padding, 16px minimum on inputs.

## Moving a screen onto the system

| Instead of | Use |
|---|---|
| `bg-stone-100`, `bg-stone-200` | `bg-surface-2` |
| `bg-white` | `bg-surface` |
| `text-stone-600`, `text-stone-500` | `text-ink-2` |
| `border-stone-500`, `border-stone-600`, `border-stone-800` | `border-line-strong` |
| `bg-stone-900 text-white` button | `<Button>` (primary) |
| `bg-green-700` / `bg-green-800` "start call" button | `<Button>` (primary) |
| `bg-red-700 text-white` "end call" button | `bg-danger text-surface` with `buttonClass` shape |
| `bg-red-50 text-red-900` error | `bg-danger-soft text-danger` |
| `bg-amber-50 border-amber-600` notice | `bg-caution-soft border-caution` |
| `BAND_LABEL[band].tone` card | `<Card tone={band}>` with `<BandBadge band={band} />` |
| `rounded-xl` / `rounded-2xl` | `rounded-chip` / `rounded-card` |
| `text-white` on a dark fill | `text-surface` |
