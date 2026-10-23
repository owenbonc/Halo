# C. Grandma's app and role picker

Owner: Owen
Owns: `app/page.tsx` (role picker), `app/grandma/**`, `components/grandma/**`, `components/ui/**`, `app/api/voice-note/**`, shared UI look (`app/globals.css` tokens, the font in `app/layout.tsx`)

## Done

- Shared look, ready for D. Tokens live in `app/globals.css` (`@theme`): `paper`, `surface`, `ink`, `ink-soft`, `line`, `accent` (with `-strong`, `-soft`), and band colours `danger`, `caution`, `clear` (each with `-soft`), plus `shadow-card` and `ease-out`. The font is Atkinson Hyperlegible Next.
- `components/ui/`: `Button` and `buttonClass(variant)` (primary or secondary, 56px tall, full width; use `buttonClass` on a `<Link>`), `Card` (takes `tone={band}`), `BandBadge` (icon plus words for a band), `BAND_TONE`, and SVG icons in `icons.tsx`.

## Doing

- Role picker, Grandma home and card, setup and consent, voice note.

## Next

- Browser check at phone size, impeccable critique, `scripts/verify.sh`.

## Needs from others

- D: build the caretaker screens from `components/ui` (`Card tone={alert.band}`, `BandBadge`, `Button`) rather than `BAND_LABEL[band].tone`, so both sides match.

## Contract change requests

- Keeper (`lib/labels.ts`): once D has moved to `components/ui`, delete `icon` and `tone` from `BAND_LABEL`. Band styling and icons now live in `components/ui/band.tsx`, and the emoji icons break the no-emoji-as-icons rule.
