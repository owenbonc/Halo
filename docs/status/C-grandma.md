# C. Grandma's app and role picker

Owner: Owen
Owns: `app/page.tsx` (role picker), `app/grandma/**`, `components/grandma/**`, `components/ui/**`, `app/api/voice-note/**`, shared UI look (`app/globals.css` tokens, the font in `app/layout.tsx`)

## Done

- Shared look, ready for D. Tokens live in `app/globals.css` (`@theme`): `paper`, `surface`, `ink`, `ink-soft`, `line`, `accent` (with `-strong`, `-soft`), and band colours `danger`, `caution`, `clear` (each with `-soft`), plus `shadow-card` and `ease-out`. The font is Atkinson Hyperlegible Next.
- `components/ui/`: `Button` and `buttonClass(variant)` (primary or secondary, 56px tall, full width; use `buttonClass` on a `<Link>`), `Card` (takes `tone={band}`), `BandBadge` (icon plus words for a band), `BAND_TONE`, and SVG icons in `icons.tsx`.

- Role picker (`/`): "Who are you?", remembered on the device, "Switch role" on Grandma's view.
- Grandma home (`/grandma`): polls every 2 s and shows the newest card. Red, amber and green each come with an icon and words; the card shows the quoted cues, the scam type, fixed next steps from `lib/guidance.ts`, and "Read it to me". The alert line reads "Sam has been told", "Sam is calling you now" or "Sam hasn't replied yet. If you're worried, call 159". "Ask Sam to call me" appears only for warnings with no alert, and is hidden while messages are paused, because `POST /api/alerts` doesn't check `paused`.
- Setup and consent (`/grandma/setup`): changes save straight away. "Choose someone else" resets the contact to unverified and shows a 4-digit code (labelled as a demo stand-in for the text message). Ask first or tell automatically, pause, and what Sam will and won't see.
- Voice note: no time limit (the server caps uploads at 10 MB), a visible timer, errors shown, scrolls to the new card. The route returns 502 with a plain message if transcription or analysis throws.
- Checked at 375 px against the stubbed slices: red, green, ask-first tap, Sam's acknowledgement, setup change and verify, voice note (synthetic mic stream; the browser pane blocks real microphones). All token pairs pass WCAG AA (lowest 5.6:1). `scripts/verify.sh` prints READY.

## Doing

## Next

- Impeccable critique of the Grandma screens before the freeze.
- Retest against B's real `analyse` (long summaries, four cues) and on a real phone with a real microphone.

## Needs from others

- D: build the caretaker screens from `components/ui` (`Card tone={alert.band}`, `BandBadge`, `Button`) rather than `BAND_LABEL[band].tone`, so both sides match.

- B: the stub's green summary repeats the card title ("No common warning signs found."). Argon's summary should say what the call was about instead.
- Skeleton keeper: `POST /api/alerts` creates an alert even while `paused` is true. Grandma's view hides the button, but the route should refuse too.

## Contract change requests

- Keeper (`lib/labels.ts`): once D has moved to `components/ui`, delete `icon` and `tone` from `BAND_LABEL`. Band styling and icons now live in `components/ui/band.tsx`, and the emoji icons break the no-emoji-as-icons rule.
