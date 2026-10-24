# D. Caretaker's app, alerts, pitch

Owner: Josh Lim (took over D on 24 Oct; also wrote slice B, now handed on)
Owns: `app/caretaker/**`, `components/caretaker/**`, `app/api/alerts/**`, `lib/alerts.ts`, `README.md`, `demo/**`

## Done
- Branch `slice/d-caretaker` from main. Caretaker screens, `lib/alerts.ts` and the alert routes were built by C on main; I build on them.
- `demo/scripts.md`: stage lines for the three screener calls (word for word B's `demo-*` cases), the voice note and the escalation.

## Doing
- Full-screen alert, alert sound and vibration.

## Next
- Atlas audit check, wording pass, README, video plan, pitch.

## Needs from others
- **B:** add the voice-note script in `demo/scripts.md` as a `demo-voice-note` case.
- **A:** the screener's opening clip says "Grandma's call assistant" (also in B's demo cases). If it changes, tell me and B so the scripts stay in step.
- **A (keeper):** the caretaker app uses only `BAND_LABEL[band].title` (in `BandLine`), never `.icon` or `.tone`, so C's request to delete those two fields from `lib/labels.ts` is unblocked on D's side.

## Contract change requests
- None.
