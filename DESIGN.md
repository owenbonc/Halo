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

- **Grandma** (`/grandma/**`): big. 20px body, `Button` size `lg` (56px), `TabBar` size `lg`. She picks Standard, Large, Larger or Largest text at setup or in Profile; it scales the root font size (93.75% / 100% / 112.5% / 125%, so Standard's body is 18.75px, just above the caretaker's 17px) on her phone, so everything in rem grows together. Tab labels stop growing at 20px so three always fit.
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
- Grandma: **New** (`/grandma`, calls she hasn't dealt with), **Past calls** (`/grandma/past`, every warning call with filters), **Profile** (`/grandma/profile`, her name, her person, consent, text size, switch role). A call opens at `/grandma/calls/[id]`.
- A call leaves New only when she taps "I've dealt with this" (remembered on her phone). Green calls show in New for 5 minutes so she sees the call was screened, then clear themselves and are never kept in Past calls.
- Caretaker: **Alerts**, **History**, **Profile** (read-only: Grandma controls consent).

## Floating, not scrolling

- What must always be reachable floats above the tab bar, in thumb reach, like bulk's controls. Grandma: the **Sam dock** (`CallDock`: Sam's status, the one action that matters, Ask Sam or Call 159, and "Read it to me" beside it). Caretaker: "I'm calling her now". The rest scrolls under them. Position floating layers with `ABOVE_TAB_BAR`.
- The dock is solid lavender while Sam is on it, and white with a red edge when Sam hasn't replied (red text fails on lavender).
- Top bars (`TopBar`) are sticky `material` with a glass pill link on the right.
- Leave room at the end of the page for floating layers so the last item can scroll clear of them.

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
