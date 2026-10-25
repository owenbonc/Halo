# Halo phone line

Call a real phone number and Halo screens the call: the same Sulafat opening, a follow-up question that Gemini drafts and a second model checks before it's spoken, the closing, then the card on her phone and the alert on Sam's. While it runs, this terminal prints every stage, so the audience can follow the pipeline.

```
phone ──► Twilio ──► cloudflared tunnel ──► pnpm phone (this laptop) ──► Gemini Live
                                                  │
                                                  └──► Halo app (Vercel): call session,
                                                       reply check, analysis, card, alert
```

The bridge holds no Gemini key. It goes through the Halo app's own routes (`/api/live-token`, `/api/live-token/validate`, `/api/calls`), so phone calls get the same locked Gemini setup, access code, call budget, reply check and analysis as calls from `/call`. Vercel can't hold a phone call's audio stream open, which is why the bridge runs here.

## Set up (about 10 minutes)

1. **Twilio account.** Sign up at twilio.com (the free trial includes credit). On the console home page, copy the **Account SID** and **Auth Token**.
2. **A number.** In the Twilio console, go to Phone Numbers › Buy a number and pick one with **Voice**.
   - **For tomorrow, buy a US number.** It works immediately. UK numbers need a regulatory bundle (ID and address) that Twilio has to approve first, and that can take days. Calling a US number from a UK phone is an international call, so check your plan's rates.
   - On a trial account, Twilio plays a short notice and asks the caller to press a key before Halo answers. Adding a card to upgrade the account removes it. Add the presenter's phone under Phone Numbers › Verified Caller IDs, in case trial limits apply.
3. **`.env`** (never commit it):
   ```
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1...
   CALL_DEMO_ACCESS_CODE=...   # the event demo code /call asks for
   ```
   `HALO_URL` defaults to production (`https://hang-up-and-check.vercel.app`). To screen through your own `pnpm dev`, set `HALO_URL=http://localhost:3000`. Use `localhost`, not `127.0.0.1`: the app checks the request origin against the host Next.js reports.
4. **Run it:**
   ```
   pnpm install
   caffeinate -dis pnpm phone
   ```
   It opens a cloudflared tunnel (`brew install cloudflared` if missing), points your Twilio number at it, and prints "Halo phone line is ready" with the number to call. `caffeinate` keeps the Mac awake. Every run gets a new tunnel address and updates the number again.

Before every demo run, run `pnpm demo:reset` as usual.

## What the terminal shows

```
━━━ Call 1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+  0.0s  ☎  phone      answered (caller ID is not read or shown)
+  0.6s  🔑 halo       call session issued (access code and call budget checked)
+  1.3s  🔊 assistant  Hello, you've reached a call assistant. Who's calling, and what's it about? (prerecorded)
+  1.4s  ⚡ gemini      Live session open: gemini-3.8-live, Sulafat voice, settings locked by Halo
+  6.0s  👂 listening  caller’s turn
+ 17.0s  🎙  caller    This is Detective Constable Harris from the Metropolitan Police. …
+ 17.1s  💭 drafting   Gemini is writing a follow-up question
+ 21.5s  ✍  drafted    Could you please provide your full name and the department you are calling from?
+ 23.2s  ✅ checked     approved in 1.8s
+ 23.2s  🔊 assistant  Could you please provide your full name and the department you are calling from? (generated)
+ 27.5s  👂 listening  caller’s turn
+ 40.3s  🎙  caller    She needs to withdraw her savings in cash today. …
+ 40.3s  🔊 assistant  Thank you, I'll pass that on. (prerecorded)
+ 42.4s  ■  ended      call complete
+ 44.4s  📝 transcript 5 turns, 584 characters → Halo /api/calls
+ 49.4s  🧠 analysis   STRONG warning signs · courier
+ 49.4s  🧠 analysis   no Atlas pattern matched
+ 49.4s  📲 alert      sent automatically to her person's phone: …/caregiver
```

This is from a rehearsal against a local copy of Halo, which has no Atlas Search, so no pattern matched. Against production, that line lists the matched Atlas patterns.

When the check refuses a draft, for example one asking the caller for a contact number, the terminal shows `↩ fallback` and the caller hears the prerecorded follow-up instead. Numbers in caller or model words are shown as `[number removed]`, because the terminal is on screen.

## Limits

- English only, one call at a time (a second caller hears "The practice line is busy"), 45 seconds per call, as on `/call`.
- There's about 8 seconds of silence between the caller's first answer and the follow-up: Gemini speaks its draft at roughly real-time pace, and the whole draft is checked before any of it plays. The closing plays as soon as the caller finishes.
- Anyone who has the number can call while `pnpm phone` runs. Halo's call budget limits the cost; stop the bridge (Ctrl-C) when you're not demoing. Use made-up callers only.

## If something goes wrong

| Terminal says | Do this |
|---|---|
| `Halo rejected CALL_DEMO_ACCESS_CODE` | Fix the code in `.env`. |
| `Halo's call limit is reached` | Wait a minute. |
| `cloudflared is not installed` | `brew install cloudflared` |
| `Twilio rejected the account details` / `not on this Twilio account` | Check the SID, token and number (in +E.164 form, like `+15551234567`). |
| Nothing when you call | Check the number's Voice webhook in the Twilio console is the `…/twilio/voice` address printed at startup. |
| `Gemini disconnected` / `Nothing was sent` | Call again. Nothing reached her phone. |

## Files

- `bridge.ts`: the entry point: webhook, media stream, tunnel and the life of one call.
- `screener.ts`: the screening turns, as a plain tested module.
- `audio.ts`: µ-law 8 kHz ↔ PCM conversion.
- `twilio.ts`: request signatures, TwiML, stream events and the number's webhook.
- `halo.ts`: the Halo app routes the bridge calls.
- `pipeline.ts`: the terminal view.
