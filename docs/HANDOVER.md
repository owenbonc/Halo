# Handover: Sunday 25 Oct, late morning

The app is called **Halo**. The GitHub repo is `owenbonc/Halo`; the Vercel URL keeps its old name.

Owen is away from about 11:10. **Josh tests the call on production (next section) and, if it passes, merges PR #28** (Owen's call). Everything else on main still goes through a PR with `scripts/verify.sh` READY. The feature freeze has passed: only fixes to the demo path.

| When | What |
|---|---|
| Now | Josh tests the call on production, then #28 |
| by 12:00 | Submit. The hard deadline is 12:00 |
| after 12:00 | Pitch |

## What changed on main this morning

- **#38, review of the overnight PRs.**
  - Calls: the closing always plays at the 60 s limit, and the timer shows 01:00 instead of 00:60.
  - Her card: "Sam is calling you." lasts an hour after Sam taps, then reads "Sam said they'd call you about this."
  - The caregiver's tab bar matches hers at Standard size.
  - Alert sound turns off as well as on.
  - Setup Back keeps focus.
- **#37, the stone and umber UI rebuild** (Owen's, built on Josh's tile card).
- **#27, Ish's turn fixes.** A cough or bang after the opening no longer ends the call, and a reply that arrives before the caller's words are transcribed still plays.
- **#39, silence nudge.** If the caller is quiet for 7 s after any line, Halo says "Are you still there?". Quiet for 7 s more, it says "I can't hear you, so I'll end the call now. Goodbye." and hangs up. "Quiet" is the phone's own mic level (RMS 0.01), so a noisy room never counts as quiet and the call runs to 60 s.

None of #27 or #39 has been heard on a real phone yet. The unit tests cover them and verify is READY.

## First: test the call on production (Josh)

On a phone, open https://hang-up-and-check.vercel.app/call, enter the access code and tap **Start call**. Run `pnpm demo:reset` against Atlas first, so the cards land in the seeded household.

1. **Normal call.** Read the police script from `demo/scripts.md`. It passes when the opening, the follow-up and the closing all play, and a card reaches `/loved-one`.
2. **Silent call.** Say nothing. It passes when the opening plays, "Are you still there?" comes about 7 s later, the goodbye about 7 s after that, and the call ends with "No caller speech was captured" and no card.
3. **Talking, then quiet.** Answer the opening, then go quiet after the follow-up. It passes when the nudge plays, then the goodbye, and the card still arrives, because the caller spoke.
4. **Soft or nonstop talking.** Halo must never say "Are you still there?" while someone is mid-sentence. At 60 s the closing plays and a card arrives.

**If something's wrong, revert newest first:** on the PR, press **Revert** and merge that PR once CI is green. Production redeploys in about a minute.
- Nudges while someone is talking (4) or no nudge in a quiet room (2): revert **#39**.
- The call dies early or hangs: revert #39, then **#27**, then **#38**, testing after each.

## Then: PR #28, the Twilio phone line (Josh)

Merge it if the tests above pass. Checked at 11:10:
- It merges cleanly onto main (with #39) and all 268 tests pass. `pnpm install` picks up its `ws` dev dependency.
- It can't break production. `pnpm phone` runs only on a laptop, and #28 adds no pages, routes or environment variables.
- Its security checks are sound: Twilio's signature is checked, the stream needs a one-time ticket, it listens on localhost only, no secrets are committed, and caller text is scrubbed.

Before using it on stage:
- **Don't leave `pnpm phone` running during the `/call` demo.** Phone calls share the `/call` Gemini budget (20 a minute, 300 an hour), so strangers ringing the number could block the stage call.
- **It hangs up at 45 s with no closing,** and has no silence nudge. `/call` has both.
- **It has never run against real Twilio or a real phone.** The bridge glue (stream ticket, busy check, deliver-once wrap-up) has no tests.
- Small things: a port already in use crashes with a raw stack trace, nothing is logged if cloudflared dies after the tunnel opens, and unclaimed websockets aren't capped.

## The demo phones changed tonight

- **New routes:** `/loved-one` (her phone) and `/caregiver` (Sam's). `/grandma` and `/caretaker` are gone (404). Update the bookmarks.
- **Each phone forgets its role once.** On Sam's phone, open `/setup` and choose "Mine. I look out for someone". On her phone, open `/loved-one` or run setup again.
- Run `pnpm demo:reset` against Atlas before every run. It restores the seeded household: Grandma, with Sam as her person, Alex as backup, and automatic alerts for serious calls.
- Update your clone: `git remote set-url origin https://github.com/owenbonc/Halo.git` (the old URL redirects).

## Not yet proven on production

- A clean courier call through Argon and Atlas Vector Search. The only call on production so far (Sat 21:42) came back "I couldn't make out enough of the call to check it." with no matched pattern.
- That's D's gate (Josh, by 11:30): one courier call on production, and Atlas shows a non-empty `analysis.matchedPatternIds`. If it doesn't, README's Real list and the pitch's DeepMind paragraph must say so.

## The live app

**https://hang-up-and-check.vercel.app**

- Every push to `main` deploys production automatically, in about a minute. Other branches get preview links. Previews have no environment variables, so their data routes and calls fail; that's expected.
- Run `git config core.hooksPath .githooks` once in your checkout. The hook scans for keys and env files before every push.
- CI's `smoke` job checks the live site about a minute after each push to main. A red ❌ on `smoke` means production is broken: tell Kota, and revert the last merge if the cause isn't obvious.
- The Vercel project is on Owen's personal Hobby account. Only Owen can read its logs or change its environment variables, so until 09:00, reproduce problems locally.

| Environment variable | Production |
|---|---|
| `MONGODB_URI` | Set (Atlas) |
| `GEMINI_API_KEY` | Set (Secret) |
| `CALL_DEMO_ACCESS_CODE` | Set (Secret); the caller has it |
| `MONGODB_DB`, `ESCALATE_AFTER_MIN`, `DEMO_FALLBACK` | Not needed: the code defaults to `hangup`, 3 minutes and off |
| `HALO_MULTILINGUAL_PILOT`, `HALO_LOCAL_TRANSCRIPTION` | Unset: automatic-language calls and the local Whisper backup stay off |

## The database

- MongoDB Atlas cluster `cluster0.lhbq6vr`, database `hangup`. The team is invited to the Atlas project.
- Production's connection string lives only in Vercel. Use **your own** database user in your local `.env`. Never share a connection string in the repo, an issue or a chat with an AI.
- Network Access allows `0.0.0.0/0`, because Vercel's servers have no fixed IPs. Removing it takes production's data routes down.
- The 30 patterns and both search indexes (`patterns_semantic`, `patterns_phrases`) are seeded and READY.
- Demo step 7 shows Atlas on screen, so whoever presents needs to be signed in to Atlas.

## What's on main

- **`/`** opens the phone's own app, or setup on a new phone. Each phone remembers its role; both Settings tabs have "Set up this phone again".
- **Setup** (`/setup`) asks "Whose phone is this?". The caregiver's path shows what they'll see, then opens their app. Her path shows what Halo does, then the caregiver fills in her name, their own name and an optional backup; they hand the phone over and she picks her text size and chooses how her person is told. Nothing is preselected.
- **Loved one's app** (`/loved-one`): Alerts (one call at a time like a deck: a verdict banner, then big Get Sam, What to do, Their words and Read aloud tiles), Past calls and Settings tabs, the voice note, and "I've dealt with this".
- **Caregiver's app** (`/caregiver`): Alerts, History and Settings, with a floating "I'm calling [her name] now".
- **The call** (`/call`): the live Gemini screener with a tailored, checked follow-up and prerecorded lines in Gemini's Sulafat voice, plus the recorded-message option.
- **The analysis:** B's `analyse`: Gemini 4 Argon over the transcript and the matched Atlas patterns, with fixed word rules as the floor.

## Open work

**Known, not fixed**
- Changing her person ("Choose someone else") shows the code on her phone instead of texting it (the screen says so), and the only check is her tapping "read it back correctly". Fine for the demo; a real build would text it and check it on the caregiver's phone.

**Kota**
- Your branches `security/demo-hardening` (73 files) and `claude/trusting-wozniak-csdbgf` (transcription model) have no PR. After the freeze, open a PR only for what fixes the demo.

**Josh (B and D)**
- README, pitch and video; D's gate by 11:30; `demo/screenshot.png` from a deployed run; the team names.
- `demo/scripts.md`: the screener's second line may now be a tailored question. The caller reads their next line either way.
- Your slice paths moved to `app/caregiver/**` and `components/caregiver/**`; update "Owns:" in `docs/status/D-caretaker.md`.

**A (ish24cho)**
- Record PR #24 in `docs/status/A-call.md`: it changes your slice's call flow.

**Anyone**
- Test on real phones: the mic, the voice note, read-aloud, `/call` over HTTPS, two phones for the alert, and the Alerts screen at Larger and Largest text.

## Settled decisions (don't reopen without Owen)

- **The roles are Loved one and Caregiver.** The seeded loved one is called Grandma; setup asks for her real name.
- **No allowlist of "official" numbers.** Her saved contacts already ring through on her phone. Trusting bank, police or council numbers would let through exactly the spoofed calls the app exists to catch.
- **The consent choice is hers.** It's made after the hand-over screen in setup, and in Settings, and setup doesn't preselect it.
- **Sam never sees transcripts or quoted phrases.** Phone numbers shown anywhere come only from `lib/guidance.ts`.

## Known risks

- #24, #27, #38 and #39 all changed the English demo call after the freeze (see the test above).
- Shared API routes have no access control. Use synthetic data only.
- The database password was exposed during setup. Owen rotates it after submission.
