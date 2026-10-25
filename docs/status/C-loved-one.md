# C. Loved one's app and role picker

Owner: Owen, away all Saturday. The slice and design are open to the team; see `docs/HANDOVER.md`.
Owns: `app/page.tsx` (role picker), `app/loved-one/**`, `components/loved-one/**`, `components/ui/**`, `app/api/voice-note/**`, shared UI look (`app/globals.css` tokens, the font in `app/layout.tsx`), `DESIGN.md` (design decisions for every screen)

## Done

- **Stone look (Owen's call, 25 Oct, branch `ui/stone`):** Josh's tile card (`ui/themes`) ported onto main in warm neutral Stone with an umber brand instead of navy, replacing sand/lavender, Bricolage headings and the action ring described below. Headings are Gabarito. The loved one's Alerts card is a solid verdict banner over four big 4:3 tiles; Get Sam and What to do carry their icon in a solid umber circle. The original lavender Halo wordmark sits at the right of every top bar and on the first setup screen. Still fits one call above the tab bar at Standard text.
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
- **Role picker (`/`):** "What would you like to do?", remembered on the device.
- **Loved one home (`/loved-one`):**
  - A warning call stays on top until Sam has called back (up to an hour), so a later harmless call shows as a small "Newer call" note instead of replacing it.
  - Card order: band, scam type, summary, reassurance, Sam's status (or the ask button), a tappable "Call 159" (strong warning, not yet acknowledged), "Read it to me" with Stop, the next steps, then what the caller said.
  - Alert lines follow the spec: "Sam has been told…", "Sam is calling you.", "Sam hasn't replied. Call 159."
  - There is a loading state, new cards are announced to screen readers, and the ask button is hidden while paused.
- **Setup and consent (`/loved-one/setup`):**
  - Changes save straight away, with the status pinned to the bottom of the screen.
  - "Choose someone else" shows a 4-digit code, labelled as a demo stand-in for the text message.
  - Ask first or tell automatically, pause, and what Sam will and won't see.
- **Voice note:** no time limit (the server caps uploads at 10 MB), a visible timer, errors shown, and it scrolls to the new card. The route returns 502 with a plain message if transcription or analysis throws.
- **Checks:**
  - Two impeccable critiques (design review plus detector), with the fixes applied.
  - At 375px on all three pages: no tap target under 48px, no text under 20px, no sideways scroll at 200% text.
  - `scripts/verify.sh` prints READY.

- **Phone frame, floating dock and call history:**
  - On a laptop the app draws inside an iPhone frame (after bulk's demo); on a phone it is full screen.
  - Sam's status and the one action that matters (Ask Sam or Call 159), plus "Read it to me", float at the bottom of the loved one's screen.
  - `/loved-one` lists earlier calls under the latest card, and each opens at `/loved-one/calls/[id]`.
  - Inside warning cards, pills and panels are deeper tints of the band, not white.

- **Voice-note route hardened (A's P1):**
  - It checks `content-length` before reading the body: 411 when it's missing, 413 over the 10 MB cap.
  - It allows 5 notes a minute per phone (429), because transcription is billable. The counter lives in each server's memory, so it resets on cold start; it should move to Atlas before real users.
  - Tested in `app/api/voice-note/guard.test.ts` and against the real server.
  - B's request is also done: transcription and analysis errors return a plain 502.
- **Keeper fixes for B (Owen):** `.gitattributes` keeps line endings LF, so Windows checkouts pass lint, and Biome now skips `pnpm-lock.yaml`.

- **Tabs on both apps (Owen's design call):**
  - Loved one: **New** (`/loved-one`), **Past calls** (`/loved-one/past`, with filters), **Profile** (`/loved-one/profile`, replacing `/loved-one/setup`; it adds Standard/Large/Largest text size and Switch role).
  - A call leaves New when she taps "I've dealt with this" (remembered on her phone). Green calls show for 5 minutes and are never kept in Past.
  - Caregiver: **Alerts**, **History**, **Profile** at standard iPhone sizes, with "I'm calling her now" floating above a small glass tab bar.
  - The phone frame now shows whenever a mouse drives the window, at any width.

- **Pause enforced on the server (keeper fix, Owen):** `POST /api/alerts` now refuses with 409 while the loved one has paused messages, so no one can alert Sam behind her choice. Tested against the running server: 409 and no alert while paused, 201 once unpaused.

- **Deployed (Owen, keeper):** https://hang-up-and-check.vercel.app on Vercel, with Atlas (free M0) behind it. Every push to main deploys production automatically. Still to add: `GEMINI_API_KEY` and `CALL_DEMO_ACCESS_CODE`, so `/call` can't run a live call yet.
- **Setup flow and her name (Owen's call):**
  - The picker now offers "Set up a phone for someone" and "I look out for someone"; neither names a role.
  - `/setup`, on her phone: her name, the caregiver's name, an optional backup, and text size. Then "Now hand the phone to Margaret", and she picks how Sam is told herself. It saves settings and opens her app.
  - Profile has "Your name". Text sizes are now Standard (18.75px, just above the caregiver's 17px), Large (the old 20px), Larger and Largest.

- **Alerts deck (Owen's call, 24 Oct):** The loved one's tabs are now **Alerts**, **Past calls** and **Settings** (`/loved-one/settings`, was Profile).
  - Alerts shows one call at a time, with no scrolling at Standard text on a 375px phone. The card face is the verdict, scam type, time and Sam's status. Under it: big **Get Sam** and **What to do** tiles, smaller **What they said** and **Read it to me**, then "I've dealt with this", **Next call** and **Other calls**. Each tile opens `/loved-one/calls/[id]/{sam,help,said,read}` with a Back button.
  - Deck order is strong, then some, then green, newest first within a band (`components/loved-one/deck.ts`, tested). Opening means tapping any button; the deck holds unopened calls, then refills with opened ones not dealt with. Green calls move to Past once opened. The floating Sam dock is gone.
  - "What they said" leads on to the whole call: new `GET /api/calls/:id/transcript` returns it with every digit, spoken number and link removed (`lib/scrub.ts`, B's scrubber with the same tests, plus a line-by-line `scrubTranscript`).
  - The voice note lives on Other calls and on the empty Alerts screen; after sending, the new card opens in Alerts.
  - SPEC.md ("loved one's app", API table) and DESIGN.md (Tabs, One card, big buttons) updated. Clicked through locally on synthetic calls; verify.sh READY.

- **Action ring (Owen's call, 24 Oct, branch `ui/alert-ring`):** the card leads with the time, then a ring of big icon-first buttons around a verdict circle (band icon and a short word, `BAND_LABEL.circle`). Warning calls get four quarters: **Get Sam**, **What to do**, **Their words** (was What they said) and **Read aloud** (was Read it to me); green calls get two halves. The full verdict, scam type and Sam's status sit below. Still fits at Standard text; Large and up scroll a little. The loved one's top bar now cancels the page's top padding, removing a doubled gap above every title.

## Doing

## Next

- Check on the stage phone that the card's fade-in plays. The browser pane draws no frames, so it couldn't be tested there.
- Retest against B's real `analyse` (long summaries, four cues) and on a real phone with a real microphone.
- Check the Alerts screen at Larger and Largest text on the stage phone, and that "Read aloud" starts speaking on arrival (the browser pane can't play speech).

## Needs from others

- **A (keeper):** the alerts-deck PR adds `GET /api/calls/:id/transcript` (shared route). It has the same missing access control as the other routes; please review it with your P1.
- **B:** `scrub` now lives in `lib/scrub.ts` on main, copied from your `lib/rules.ts` with its tests. When the brain lands, import it from there and delete your copy, so there's one scrubber.
- **Notion:** the Specification page needs the new "loved one's app" bullet from SPEC.md (Notion is the source of truth).

- D: the caregiver screens (`app/caregiver/**`, `components/caregiver/**`) are built and on main, at Owen's request as design owner, before you'd pushed anything. Please build on them (Alerts, History, Profile tabs, `CaregiverShell` with `useAlerts()`), and keep README, video and pitch as yours.
- B: the card shows `analysis.summary` as is. SPEC says digits and URLs are stripped from it; please make sure `analyse()` does that, so no number from a model ever reaches either app.
- A and D: your pages now render inside the laptop phone frame too. Use `var(--safe-top)` / `var(--safe-bottom)` and `appScroller()` (see `DESIGN.md`, The phone). Before the freeze, move your screens onto `DESIGN.md` (its last table maps your current classes to tokens). Once A's branch is on main, C can do that pass for the call and caregiver pages instead.
- D: build the caregiver screens from `components/ui` (`Card tone={alert.band}`, `BandBadge`, `Button`) and the semantic colour names, rather than `BAND_LABEL[band].tone` or raw Tailwind colours, so both sides match.
- B or the guidance keeper: for screened calls (`source: 'screener'`), drop `different_phone` from `nextSteps`. She never picked up, so "Scammers can keep a landline connected" only adds fear.
- Guidance keeper: add a dialable number to `GUIDANCE.call_159` (e.g. `tel: '159'`) so the card's "Call 159" button reads it from `lib/guidance.ts` instead of its own literal.

- B: the stub's green summary repeats the card title ("No common warning signs found."). Argon's summary should say what the call was about instead.

- Skeleton keeper: `speak()` in `lib/recorder.ts` (used by `/call`) sets no `lang`, so it may pick a US voice. The loved one's card now uses its own en-GB read-aloud with a Stop button.

## Contract change requests

- Keeper (`lib/labels.ts`): once D has moved to `components/ui`, delete `icon` and `tone` from `BAND_LABEL`. Band styling and icons now live in `components/ui/band.tsx`, and the emoji icons break the no-emoji-as-icons rule.
