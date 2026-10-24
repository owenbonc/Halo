# DESIGN.md

How Halo looks. Owner: slice C (Owen), who decides design for every screen. Change the look by editing the tokens in `app/globals.css` and the components in `components/ui/`, never screen by screen.

## Rules for every screen

- Use only the semantic colour names below and the components in `components/ui/`. No raw Tailwind colours (`stone-*`, `red-*`, `green-*`, `amber-*`, `white`, `black`), no hex in components.
- Red, amber and green mean warning bands only, always with their icon and words (`BandBadge`). The one exception: an "End call" button may use `bg-danger text-surface`, because red hang-up is the phone convention.
- Grandma's app: body text at least 20px (`text-xl`, the default), tap targets at least 48px. The caretaker's app is a standard iPhone app (see Two densities). Contrast at least WCAG AA everywhere. No percentages, never the word "safe".
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

## Two densities

- **Grandma** (`/grandma/**`): big. 20px body, `Button` size `lg` (56px), `TabBar` size `lg`. She picks Standard, Large, Larger or Largest text at setup or in Settings; it scales the root font size (93.75% / 100% / 112.5% / 125%, so Standard's body is 18.75px, just above the caretaker's 17px) on her phone, so everything in rem grows together. Tab labels stop growing at 20px so three always fit.
- **Caretaker** (`/caretaker/**`): a normal iPhone app. 34px large title, 17px body, 15px secondary, 13px meta, `Button` size `md` (48px), `TabBar` size `md`. Clean like bulk: white cards with hairlines, section headers with a count ("History · 4").
- Sizes are always rem, never px, so Grandma's text size reaches everything.

## Type

- Headings: Bricolage Grotesque (`font-display`, set on `h1`–`h3`), tracking -0.02em, line-height 1.15.
- Body: Atkinson Hyperlegible Next, 20px, line-height 1.5. Numbers that line up (times, codes, timers): `tabular-nums`.
- Emphasise with weight before size.

## Shape and depth

- Radii: `rounded-chip` 12px (status boxes, inputs, quoted phrases), `rounded-card` 18px (cards, panels, options), `rounded-sheet` 24px; buttons and links that act like buttons are full pills (`rounded-full`).
- **Pills** carry single facts (caller, time, scam type, status, the listening timer). **Boxes** group every chunk: cards on the page, panels inside a card. Panels inside a card are a deliberate choice of the design owner, not an accident.
- **Insets are tonal.** Pills, panels and quotes use `bg-inset` / `bg-inset-2` / `border-inset-line`: white on a plain card, and inside a warning card a deeper tint of that band (the card's `tone-*` class sets them). Never put white inside a tinted card.
- Cards and panels: a 1px `line` border, no shadow. Warning cards: a 1px band-ink edge on the band tint.
- `shadow-float` only on things that float (glass controls, toasts).

## The phone (from bulk)

- On a laptop (a window at least 500px wide with a mouse), the app draws inside an iPhone 16 Pro frame on an aubergine desk, with a live status bar and home indicator (`components/ui/DeviceFrame.tsx`). On a phone it fills the screen.
- Pad against `var(--safe-top)` and `var(--safe-bottom)`, never `env(safe-area-inset-*)` directly: inside the frame they are the phone's 62px and 34px.
- Scroll with `appScroller()` from `DeviceFrame`, never `window.scrollTo`: inside the frame the app scrolls in the phone's screen. `position: fixed` stays inside the phone.

## Tabs

- Both apps use the floating glass `TabBar` (components/ui) above the home indicator: icon plus word on every tab, the selected tab on lavender glass, a red count badge for what needs attention.
- Grandma: **Alerts** (`/grandma`, a deck of calls she hasn't opened, one card at a time), **Past calls** (`/grandma/past`, the calls she has dealt with, with filters), **Settings** (`/grandma/settings`, her name, her person, consent, text size, switch role; mostly used by the caretaker).
- The Alerts badge counts calls she hasn't opened. Opening means tapping any button on a card. The deck runs strongest band first, newest first within a band; once every call has been opened it refills with those not dealt with. "I've dealt with this" moves a call to Past calls, and a green call moves there as soon as she opens it.
- Caretaker: **Alerts**, **History**, **Profile** (read-only: Grandma controls consent).

## One card, big buttons

- Grandma's Alerts tab fits one call on screen without scrolling at Standard text, like the top card of a deck (`CallFace`). Top to bottom: the time, the action ring, then the card with the full verdict (`BandBadge`), the scam type and Sam's status line; everything else sits one tap away.
- The action ring (`ActionRing`) is a circle of big buttons around a verdict circle. The verdict circle shows the band's icon and short word (`BAND_LABEL.circle`) on the band's tint. Each segment leads with a large icon and a short label, both inside the segment; the bottom quarters put the label above the icon so it clears the curve. Warning calls get four quarters: **Get Sam** and **What to do** on top in lavender `glass-accent`, **Their words** and **Read aloud** below in `glass` with a `border-line` hairline. The segments drop the glass float shadow so the wheel reads as one flat ring. Green calls get two halves, Their words and Read aloud. A gap of page background separates the segments from each other and from the centre. Below the card, a quiet "I've dealt with this", then **Next call** and **Other calls**.
- Each button opens its own screen at `/grandma/calls/[id]/{sam,help,said,read}`, titled with the same words as its button, with a glass **Back** pill at the top (`TopBar back`). "Their words" leads on to the whole call (`/transcript`), with every number and link removed on the server.
- Sam's status is solid lavender while Sam is on it, and white with a red edge when Sam hasn't replied (red text fails on lavender). The caretaker's "I'm calling her now" floats above the tab bar (`ABOVE_TAB_BAR`).
- Top bars (`TopBar`) are sticky `material`. Leave room at the end of each page so the last item scrolls clear of the tab bar.

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
