# D. Caretaker's app, alerts, pitch

Owner: Josh Lim (took over D on 24 Oct; also wrote slice B, now handed on)
Owns: `app/caretaker/**`, `components/caretaker/**`, `app/api/alerts/**`, `lib/alerts.ts`, `README.md`, `demo/**`

## Done
- Branch `slice/d-caretaker` from main. Caretaker screens, `lib/alerts.ts` and the alert routes were built by C on main; I build on them.
- `demo/scripts.md`: stage lines for the three screener calls (caller lines word for word B's `demo-*` cases), the voice note and the escalation.
- Detect new alerts: `arrivals()` in components/caretaker, 4 behaviour tests.
- Alert chimes, vibrates and jumps to a large Alerts card. Exercised: typecheck, lint, unit tests and verify.sh READY. Checked in the browser: jumps from History to Alerts, vibrates and chimes, 34px headline, acknowledgement reaches her app, no chime on reload, fits 375px.
- Escalation and audit record checked locally (escalation window 1 minute): both phones show the escalation, and the alert document holds trigger, createdAt and acknowledgedAt. Atlas shots for the video in `demo/video-plan.md`.
- Wording pass: changed 5 strings in D's files (straight apostrophes made curly, matching “I’m calling her now”) and passed 3 items to others (A, keeper A); Grandma's screens, setup, role picker and components/ui had nothing to fix.
- README, video plan and pitch: `README.md`, `demo/video-plan.md` (shot list added above the Atlas shots) and `demo/pitch.md`.

## Doing
- Rehearsal and video (Sunday 08:00–09:30).

## Next
- **Gate before submitting (Josh, by Sun 11:30):** on the deployed URL, run one courier call and check Atlas shows a non-empty `analysis.matchedPatternIds`. If Argon or Gemini Live isn't live, edit README's Real list and pitch.md's DeepMind paragraph to say so.
- Check the Atlas shots on the team cluster `cluster0.revh6w` once Owen's invite arrives (needs B's brain merged and `pnpm seed:patterns` there).
- Before submitting: take demo/screenshot.png from a deployed run and add it to README; confirm the team names.

## Needs from others
- **B:** in `data/test-cases.json`, `demo-police-courier`'s `Assistant: What do you need from her?` should read `Assistant: Could you tell me a little more about why you're calling?` (the real follow-up clip).
- **B:** add the voice-note script in `demo/scripts.md` as a `demo-voice-note` case.
- **A:** the screener's opening clip says "Grandma's call assistant" (also in B's demo cases). If it changes, tell me and B so the scripts stay in step.
- **A (keeper):** the caretaker app uses only `BAND_LABEL[band].title` (in `BandLine`), never `.icon` or `.tone`, so C's request to delete those two fields from `lib/labels.ts` is unblocked on D's side.
- **A (`app/call/page.tsx`): hard-coded “Grandma” in the caller’s page text.** Her name should come from settings, or the text should say “her”. Lines 45 and 115: “We could not confirm delivery. Check Grandma’s page before making another call.” → “We could not confirm delivery. Check her phone before making another call.” Line 292: “Microphone off. Passing the conversation to Grandma…” → “Microphone off. Passing the conversation on…”. Lines 295–296: “Sample result passed to Grandma.” → “Sample result passed on.” and “Passed to Grandma.” → “Passed on.” Lines 304 and 455: “Call Grandma” → “Call her”. Line 377: “Grandma will receive a preset scam warning, regardless of what you say.” → “She will receive a preset scam warning, regardless of what you say.” Line 481: “Grandma receives a summary card.” → “She receives a summary card.”
- **A (`app/call/voice/clips.json:3`, opening clip):** “Hello, you've reached Grandma's call assistant. Who's calling, and what's it about?” → “Hello, you've reached the call assistant for this number. Who's calling, and what's it about?” (needs re-recording; tell B and me so `demo/scripts.md` and B’s demo cases follow).
- **A, keeper (`lib/guidance.ts:23`, `call_back_known_number` body):** “genuine” is a banned word. “If it might be genuine, call them back on the number from your letter, bank card or their official website.” → “If it might be real, call them back on the number from your letter, bank card or their official website.”

## Contract change requests
- None.
