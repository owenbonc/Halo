# DESIGN.md

How Halo looks. Owner: slice C (Owen), who decides design for every screen. Change the look by editing the tokens in `app/globals.css` and the components in `components/ui/`, never screen by screen.

## Rules for every screen

- Use only the semantic colour names below and the components in `components/ui/`. No raw Tailwind colours (`stone-*`, `red-*`, `green-*`, `amber-*`, `white`, `black`), no hex in components.
- Red, amber and green mean warning bands only, always with their icon and words (`BandBadge`). Two uses fill with the band itself (`bg-danger text-surface`, `bg-caution text-surface`): the loved one's warning banner, so a warning reads as urgent, and an "End call" button, because red hang-up is the phone convention.
- The loved one's app: body text at least 20px (`text-xl`, the default), tap targets at least 48px. The caregiver's app is a standard iPhone app (see Two densities). Contrast at least WCAG AA everywhere. No percentages, never the word "safe".
- Phone numbers only from `lib/guidance.ts`.

## Colour

Built with the color-expert method: an OKLCH reference palette (stone, umber, tomato, ochre, fern) mapped to semantic roles, chosen by character (lightness and chroma) rather than hue. Stone and umber are warm greys so low in chroma that red, amber and green carry all the meaning; the only other colour is the lavender Halo wordmark. Every text pair is checked with WCAG and APCA, and the bands are checked under protan, deutan and tritan simulation.

| Role | Use |
|---|---|
| `bg` | Page background (warm stone white) |
| `surface`, `surface-hover`, `surface-2` | Cards and sheets; hover wash; insets and quoted phrases |
| `ink`, `ink-2`, `ink-3` | Primary, secondary and tertiary text |
| `line` | Hairline borders on cards |
| `line-strong` | Borders that carry meaning (unselected controls, secondary buttons): 3:1 |
| `accent` + `on-accent` | Brand umber fill with white text, kept small: primary buttons, the selected tab, the icon circle on the loved one's two main tiles, the "Sam is calling you" moment |
| `accent-hover`, `accent-strong` | Derived from `accent`; hover and pressed |
| `accent-soft` | Selected-option tint |
| `accent-ink` | Accent-coloured text, links and icons; focus ring and caret |
| `danger`, `caution`, `clear` (+ `-soft`) | Strong, some and no warning signs: ink for text and the card edge, soft for the card fill |

## Two densities

- **Loved one** (`/loved-one/**`): big. 20px body, `Button` size `lg` (56px). She picks Standard, Large, Larger or Largest text at setup or in Settings; it scales the root font size (93.75% / 100% / 112.5% / 125%, so Standard's body is 18.75px, just above the caregiver's 17px) on her phone, so everything in rem grows together. - **Caregiver** (`/caregiver/**`): a normal iPhone app. 17px body, 15px secondary, 13px meta, `Button` size `md` (48px). Clean like bulk: white cards with hairlines.
- **Shared by both:** the same `TabBar` and the same `TopBar` title (a count goes after the title: "Past calls · 5", "History · 4"), so the two phones look like one app. Tab labels grow with her text size and stop at 20px so three always fit.
- Sizes are always rem, never px, so the loved one's text size reaches everything.

## Type

- Headings: Gabarito (`font-display`, set on `h1`–`h3`), a sturdy rounded sans; tracking -0.02em, line-height 1.15.
- The Halo wordmark (`components/ui/Logo`) is the original: Bricolage Grotesque extra bold in lavender (`font-logo`, `text-logo`). It sits at the right of every top bar and on the first setup screen.
- Body: Atkinson Hyperlegible Next, 20px, line-height 1.5. Numbers that line up (times, codes, timers): `tabular-nums`.
- Emphasise with weight before size.

## Shape and depth

- Radii: `rounded-chip` 16px (status boxes, inputs, quoted phrases), `rounded-card` 26px (cards, panels, options, tiles), `rounded-sheet` 32px (the warning banner); buttons and links that act like buttons are full pills (`rounded-full`).
- **Pills** carry statuses (New, Dealt with, Sent, You called, the listening timer). Times and scam types are plain text: a time in a pill looks like a button. **Boxes** group every chunk: cards on the page, panels inside a card. Panels inside a card are a deliberate choice of the design owner, not an accident.
- **Lists of calls or alerts** are one grouped card with a hairline between rows (`divide-y divide-line`), like an iOS inset list, in both apps.
- **Insets are tonal.** Pills, panels and quotes use `bg-inset` / `bg-inset-2` / `border-inset-line`: white on a plain card, and inside a warning card a deeper tint of that band (the card's `tone-*` class sets them). Never put white inside a tinted card.
- Cards and panels: a 1px `line` border, no shadow. Warning cards: a 1px band-ink edge on the band tint.
- `shadow-float` only on things that float (glass controls, toasts).

## The phone (from bulk)

- On a laptop (a window at least 500px wide with a mouse), the app draws inside an iPhone 16 Pro frame on a dark stone desk, with a live status bar and home indicator (`components/ui/DeviceFrame.tsx`). On a phone it fills the screen.
- Pad against `var(--safe-top)` and `var(--safe-bottom)`, never `env(safe-area-inset-*)` directly: inside the frame they are the phone's 62px and 34px.
- Scroll with `appScroller()` from `DeviceFrame`, never `window.scrollTo`: inside the frame the app scrolls in the phone's screen. `position: fixed` stays inside the phone.

## Tabs

- Both apps use the floating glass `TabBar` (components/ui) above the home indicator: icon plus word on every tab, the selected tab on solid umber, a red count badge for what needs attention.
- Loved one: **Alerts** (`/loved-one`, a deck of calls she hasn't opened, one card at a time), **Past calls** (`/loved-one/past`, every call, each warning call marked dealt with or not, with filters), **Settings** (`/loved-one/settings`, her name, her person, consent, text size, set up this phone again; mostly used by the caregiver).
- The Alerts badge counts calls she hasn't opened. Opening means tapping any button on a card. The deck runs strongest band first, newest first within a band; once every call has been opened it refills with those not dealt with. "I've dealt with this" takes a call out of the deck, and "Put it back in Alerts" returns it; a green call leaves the deck as soon as she opens it. Past calls lists every call either way.
- Caregiver: **Alerts**, **History**, **Settings** (`/caregiver/settings`: the alert sound, which is the caregiver's to set, then what the loved one chose, read-only because she controls consent, and set up this phone again).

## One card, big buttons

- The loved one's Alerts tab fits one call on screen without scrolling at Standard text, like the top card of a deck (`CallFace`). Top to bottom: the verdict banner, her buttons as tiles, then Sam's status line; everything else sits one tap away.
- The verdict banner (`rounded-sheet`) holds the time, the band's icon and full title, and the scam type. On a warning it is the band itself, solid red or amber with white text, so it reads as urgent. A green call stays a calm tint with `BandBadge`, its caveat and the reassurance line.
- The tiles are big squares two by two, each a large icon over a short label. Warning calls get four: all four are white `glass`; **Get Sam** and **What to do** on top carry their icon in a solid umber circle, so they lead without a big dark fill, and **Their words** and **Read aloud** below have a plain icon. Green calls get two, Their words and Read aloud. Below the tiles, Sam's status, a quiet "I've dealt with this", then **Next call** and **Other calls**.
- Each button opens its own screen at `/loved-one/calls/[id]/{sam,help,said,read}`, titled with the same words as its button, with a glass **Back** pill at the top (`TopBar back`). "Their words" leads on to the whole call (`/transcript`), with every number and link removed on the server.
- Sam's status is solid umber with white text while Sam is on it, and white with a red edge when Sam hasn't replied (red text fails on umber). The caregiver's "I'm calling her now" floats above the tab bar (`ABOVE_TAB_BAR`).
- Top bars (`TopBar`) are sticky `material`. Leave room at the end of each page so the last item scrolls clear of the tab bar.

## Glass (from bulk)

- `glass`: clear glass (white at 55% over a 20px blur, a bright edge and top highlight, a faint ink hairline, the float shadow). Secondary buttons, the role choices and the pill links in the header.
- `glass-accent`: solid umber for primary actions, keeping glass's edge and highlight. White text on top.
- `material`: translucent paper for bars that stay on screen. Headers are sticky `material` bars with the content scrolling under them.
- Every glass surface turns solid (white with a `line-strong` edge, or plain umber) when the browser has no backdrop blur, or the user asks for reduced transparency or more contrast.
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
