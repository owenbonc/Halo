# C. Grandma's app and role picker

Owner: Owen
Owns: `app/page.tsx` (role picker), `app/grandma/**`, `components/grandma/**`, `components/ui/**`, `app/api/voice-note/**`, shared UI look (`app/globals.css` tokens, the font in `app/layout.tsx`), `DESIGN.md` (design decisions for every screen)

## Done

- **Shared look, ready for D.** The design rules come from Owen's bulk project (not its layout), with a lavender brand accent. The palette was built with the color-expert method.
  - **Tokens:** the reference palette in `app/globals.css` is OKLCH (sand, lavender, tomato, ochre, fern). Use only these semantic names:
    - Surfaces: `bg`, `surface`, `surface-hover`, `surface-2`.
    - Text: `ink`, `ink-2`, `ink-3`.
    - Lines: `line`, and `line-strong` for borders that carry meaning (3:1).
    - Accent: `accent` (fill, with `on-accent` ink text, never white), `accent-hover` and `accent-strong` (derived from the base), `accent-soft`, and `accent-ink` for accent-coloured text and icons.
    - Warning bands: `danger`, `caution`, `clear`, each with `-soft`.
    - Every text pair is checked with WCAG AA and APCA.
  - **Shape and depth:** radii `rounded-chip` (12), `rounded-card` (18), `rounded-sheet` (24); pill buttons. Shadows only on floating layers (`shadow-float`); cards use a 1px `line` border.
  - **Type:** Bricolage Grotesque for headings (`font-display`, tight tracking), Atkinson Hyperlegible Next for 20px body text, `tabular-nums` for times and codes.
  - **Feel:** 0.97 press feedback, and hover only on precise pointers.
  - **Mobile and browser details:** no tap highlight, `touch-action`, safe areas, theme colour; selection, focus ring and caret in the accent ink.
- **`components/ui/`:**
  - `Button` and `buttonClass(variant)`: primary or secondary, 56px tall pills. Use `buttonClass` on a `<Link>` or `<a>`.
  - `Card` (takes `tone={band}`), `BandBadge`, `BAND_TONE`.
  - SVG icons in `icons.tsx`, stroke 1.75.
- **Role picker (`/`):** "Who are you?", remembered on the device.
- **Grandma home (`/grandma`):**
  - A warning call stays on top until Sam has called back (up to an hour), so a later harmless call shows as a small "Newer call" note instead of replacing it.
  - Card order: band, scam type, summary, reassurance, Sam's status (or the ask button), a tappable "Call 159" (strong warning, not yet acknowledged), "Read it to me" with Stop, the next steps, then what the caller said.
  - Alert lines follow the spec: "Sam has been told…", "Sam is calling you.", "Sam hasn't replied. Call 159."
  - There is a loading state, new cards are announced to screen readers, and the ask button is hidden while paused.
- **Setup and consent (`/grandma/setup`):**
  - Changes save straight away, with the status pinned to the bottom of the screen.
  - "Choose someone else" shows a 4-digit code, labelled as a demo stand-in for the text message.
  - Ask first or tell automatically, pause, and what Sam will and won't see.
- **Voice note:** no time limit (the server caps uploads at 10 MB), a visible timer, errors shown, and it scrolls to the new card. The route returns 502 with a plain message if transcription or analysis throws.
- **Checks:**
  - Two impeccable critiques (design review plus detector), with the fixes applied.
  - At 375px on all three pages: no tap target under 48px, no text under 20px, no sideways scroll at 200% text.
  - `scripts/verify.sh` prints READY.

## Doing

## Next

- Check on the stage phone that the card's fade-in plays. The browser pane draws no frames, so it couldn't be tested there.
- Retest against B's real `analyse` (long summaries, four cues) and on a real phone with a real microphone.

## Needs from others

- A and D: before the freeze, move your screens onto `DESIGN.md` (its last table maps your current classes to tokens). Once A's branch is on main, C can do that pass for the call and caretaker pages instead.
- D: build the caretaker screens from `components/ui` (`Card tone={alert.band}`, `BandBadge`, `Button`) and the semantic colour names, rather than `BAND_LABEL[band].tone` or raw Tailwind colours, so both sides match.
- B or the guidance keeper: for screened calls (`source: 'screener'`), drop `different_phone` from `nextSteps`. She never picked up, so "Scammers can keep a landline connected" only adds fear.
- Guidance keeper: add a dialable number to `GUIDANCE.call_159` (e.g. `tel: '159'`) so the card's "Call 159" button reads it from `lib/guidance.ts` instead of its own literal.

- B: the stub's green summary repeats the card title ("No common warning signs found."). Argon's summary should say what the call was about instead.
- Skeleton keeper: `POST /api/alerts` creates an alert even while `paused` is true. Grandma's view hides the button, but the route should refuse too.

- Skeleton keeper: `speak()` in `lib/recorder.ts` (used by `/call`) sets no `lang`, so it may pick a US voice. Grandma's card now uses its own en-GB read-aloud with a Stop button.
- Spec question for the team: "Caretaker" reads as "building janitor" in UK English. "Family or carer" would be clearer, but the spec names the button, so it is unchanged.

## Contract change requests

- Keeper (`lib/labels.ts`): once D has moved to `components/ui`, delete `icon` and `tone` from `BAND_LABEL`. Band styling and icons now live in `components/ui/band.tsx`, and the emoji icons break the no-emoji-as-icons rule.
