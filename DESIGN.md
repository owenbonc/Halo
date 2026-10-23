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

- Radii: `rounded-chip` 12px (status boxes, inputs, quoted phrases), `rounded-card` 18px (cards, panels, options), `rounded-sheet` 24px; buttons and links that act like buttons are full pills (`rounded-full`).
- **Pills** carry single facts (caller, time, scam type, status, the listening timer). **Boxes** group every chunk: cards on the page, white panels inside a warning card. Panels inside a tinted card are a deliberate choice of the design owner, not an accident.
- Cards and panels: a 1px `line` border, no shadow. Warning cards: a 1px band-ink edge on the band tint.
- `shadow-float` only on things that float (glass controls, toasts).

## Glass (from bulk)

- `glass`: clear glass (white at 55% over a 20px blur, a bright edge and top highlight, a faint ink hairline, the float shadow). Secondary buttons, the role choices and the pill links in the header.
- `glass-accent`: lavender glass at 62% for primary actions. Ink text on top (at least 10:1 over every background).
- `material`: translucent paper for bars that stay on screen. Headers are sticky `material` bars with the content scrolling under them.
- Every glass surface turns solid (white with a `line-strong` edge, or solid lavender) when the browser has no backdrop blur, or the user asks for reduced transparency or more contrast.
- Status messages (like "Sam is calling you") are solid, never glass: glass is for things you press or that stay on screen.

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
