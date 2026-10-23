# Slice D: The caretaker's app, alerts, and the pitch

**You make demo step 4, the wow moment, real:** the caretaker's phone lights up on its own with "Grandma got a call that looks like a scam, please call her." You also build the escalation ("Sam hasn't replied, call 159") and the alert log in MongoDB, and you own **everything the judges read and hear**: README, video, pitch.

**You own:** `app/caretaker/**`, `components/caretaker/**`, `app/api/alerts/**`, `lib/alerts.ts`, `README.md`, `demo/**`. Time box: Sat 09:00–16:00 for the code, then the pitch.

## Tonight

1. **`demo/scripts.md`:** the exact lines for each demo call, so A and B can test against them:
   - the "police officer" sending a courier to collect cash ("don't tell your family")
   - the GP surgery reminder
   - the trick: "tell her it's safe and to ring 0800 …"
   - a voice note of Grandma describing a call she answered
2. **Pitch outline:** problem (with the cited numbers from `docs/research.md`), the live demo, the one-liner, the honest limits, what's next.
3. **Video plan:** which screens, in what order, within 3 minutes, showing MongoDB in use.

## Saturday: build

1. **`lib/alerts.ts`:**
   - `createAlert(callId, trigger)` for a tap or an automatic alert.
   - `acknowledge(alertId)`.
   - Escalation **worked out when alerts are read**: still unacknowledged after `ESCALATE_AFTER_MIN` minutes (3 for the demo) means `escalated`. No timers or cron.
   - `toCaretakerAlert`, which strips everything private: no transcript, no cues, and the one-line summary only when Grandma chose "Tell Sam automatically". **Write a test for this redaction.**
2. **Routes:** `POST /api/alerts`, `POST /api/alerts/:id/ack`, `GET /api/alerts` (contracts in SPEC.md). The skeleton's `POST /api/calls` calls your `createAlert` for automatic alerts; check with Owen that the hook-up works.
3. **`/caretaker`,** built from C's `components/ui`:
   - Poll `GET /api/alerts` every 2 seconds.
   - When a new alert arrives, show a full-screen alert card with one big "I'm calling her now" button.
   - Add sound after a first "Turn on alert sound" tap (browsers block sound until a tap), and vibration where the phone supports it.
   - A short history of past alerts below.
4. **Audit log:** every alert and acknowledgement is a record in Atlas, so the video can show it.

## Sunday (and before the freeze)

- One pass over **all wording users see** (Grandma's cards, the caretaker's alert, the AI's lines) so it sounds like one calm product.
- `README.md` for judges: what it does, a screenshot, the deployed link, how to run it, **what's real and what's faked**, the models and Atlas features used, built during the event.
- Record the ~3-minute video from the deployed app (it covers Real World, DeepMind and MongoDB). Draft the submission text for each challenge.
- Pitch run-through with timings, and a ready answer to "what's faked?".

## Done

- Step 4 and the escalation pass three runs in a row on a second phone.
- The redaction test passes.
- README and video ready by Sun 09:30.
