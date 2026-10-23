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
- Impeccable critique (design review plus detector) scored 26/40. Fixed:
  - The card leads with reassurance and Sam's status, then "Read it to me" (now on the first screen), then the steps, then the caller's words.
  - Read-aloud uses an en-GB voice at 0.9 speed, pauses between sentences, and has a Stop button.
  - No sideways scroll at 200% text.
  - All links are at least 48px tall, all text at least 20px, and times show as "7:31 pm".
  - One voice ("we") throughout, and "Tell Sam automatically when it's serious".
  - The save status sits pinned at the bottom of the screen.
  - New cards are announced to screen readers, and the poll error copy is plain English.
- Checked at 375 px against the stubbed slices: red, green, ask-first tap, Sam's acknowledgement, setup change and verify, voice note (synthetic mic stream; the browser pane blocks real microphones). All token pairs pass WCAG AA (lowest 5.6:1). `scripts/verify.sh` prints READY.

## Doing

## Next

- Check on the stage phone that the card's fade-in plays. The browser pane draws no frames, so it couldn't be tested there.
- Retest against B's real `analyse` (long summaries, four cues) and on a real phone with a real microphone.

## Needs from others

- D: build the caretaker screens from `components/ui` (`Card tone={alert.band}`, `BandBadge`, `Button`) rather than `BAND_LABEL[band].tone`, so both sides match.

- B: the stub's green summary repeats the card title ("No common warning signs found."). Argon's summary should say what the call was about instead.
- Skeleton keeper: `POST /api/alerts` creates an alert even while `paused` is true. Grandma's view hides the button, but the route should refuse too.

- Skeleton keeper: `speak()` in `lib/recorder.ts` (used by `/call`) sets no `lang`, so it may pick a US voice. Grandma's card now uses its own en-GB read-aloud with a Stop button.
- Spec question for the team: "Caretaker" reads as "building janitor" in UK English. "Family or carer" would be clearer, but the spec names the button, so it is unchanged.

## Contract change requests

- Keeper (`lib/labels.ts`): once D has moved to `components/ui`, delete `icon` and `tone` from `BAND_LABEL`. Band styling and icons now live in `components/ui/band.tsx`, and the emoji icons break the no-emoji-as-icons rule.
