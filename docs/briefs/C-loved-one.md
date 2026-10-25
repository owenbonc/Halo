# Slice C: The loved one's app, the role picker, and the shared look

**You make demo steps 1, 3 and the loved one's side of 4 real,** plus the voice-note check. You also own **how the whole app looks**: D builds the caregiver's screens from your components, so the two sides feel like one product. This is what the judges look at most.

**You own:** `app/page.tsx` (role picker), `app/loved-one/**`, `components/loved-one/**`, `components/ui/**`, `app/api/voice-note/**`. Time box: Sat 09:00–16:00.

## Tonight: sketch (paper or Figma, no code)

1. **Role picker:** "Who are you?", with two big buttons, Loved one and Caregiver.
2. **Loved one home:** the latest card, plus one big "Check a call I answered" button.
3. **The card,** in three versions:
   - **Red:** "Strong warning signs", what the caller said that worried us (quoted), the scam type, the fixed next steps, "Read it to me", and "Ask Sam to call me" (or "Sam has been told").
   - **Amber:** some warning signs.
   - **Green:** "No common warning signs found. This is not a guarantee."
4. **Setup and consent:** choose the contact, verify their code (shown on screen), choose "Ask me first" or "Tell Sam automatically when it's serious", see exactly what Sam will and won't see, and pause or remove Sam.

## Design rules (from the research, not negotiable)

- Big text (at least 20px body), one message per screen, plain words, calm tone ("You did the right thing by not answering").
- Red, amber and green **always with an icon and words**, never colour alone. Contrast at least WCAG AA. Tap targets at least 48px.
- No percentages, never the word "safe".
- Phone numbers only from `lib/guidance.ts` (159, Report Fraud, 7726), never from the call.
- "Read it to me" uses the browser's built-in speech (`speechSynthesis`).

## Saturday: build

1. **`components/ui/`:** colours and type as Tailwind tokens, plus Button, Card and BandBadge. Push these early, because D needs them.
2. **`/`:** the role picker. Remember the choice on the device (localStorage, wrapped in try/catch) and add a small "Switch role" link on both views.
3. **`/loved-one`:** poll `GET /api/calls` every 2 seconds and show the newest card. The ask button calls `POST /api/alerts`. Show the alert status: "Sam is calling you", or "Sam hasn't replied, call 159" when it's escalated.
4. **Setup and consent screen:** `GET`/`PUT /api/settings`.
5. **Voice note:** one big button, record 20–60 seconds with `MediaRecorder`, and `POST /api/voice-note`. That route calls `transcribe` and `analyse` from slice B. Show "I didn't catch that, try again or call 159" when the transcript is too short.

## Done

- Steps 1, 3 and 4 (loved one's side) pass three runs in a row on a phone-sized screen.
- The voice note works for the video.
- Run impeccable's `critique` on the loved one's screens and fix what it finds before the freeze.
