# Handover: overnight into Sunday 25 Oct

The app is called **Halo**. The GitHub repo is `owenbonc/Halo`; the Vercel URL keeps its old name.

Owen is asleep and back at **09:00**. Until then:

- **Keeper: Kota (kota511).** Kota merges to main and owns `lib/types.ts`, the shared routes and deploy settings, the same way Owen does (AGENTS.md).
- **The feature freeze has passed.** Only fixes to the demo path land on main, each through a PR with `scripts/verify.sh` READY and a click-through of the real thing.
- **UK clocks go back at 02:00 tonight.** Every time below is UK time after the change.

## Sunday

| When | What |
|---|---|
| First thing | Kota tests the new call on production (next section) |
| 08:00–09:30 | Three clean demo runs and the video. Owen joins at 09:00 |
| by 10:00 | Submit. The hard deadline is 12:00 |
| after 12:00 | Pitch |

## First: test the new call on production (Kota)

PR #24 merged at 01:26, after the freeze, on Owen's call. English calls now ask a follow-up tailored to what the caller said, checked before it's spoken, and every line is in Gemini's voice. A real call worked end to end locally against live Gemini. It hasn't yet been tried from a real phone on production.

1. On a phone, open https://hang-up-and-check.vercel.app/call, enter the access code and tap **Start call**.
2. Read the fake police script from `demo/scripts.md`.
3. The call passes when the opening plays, one follow-up question plays (tailored, or the prerecorded "Could you tell me a little more…"), the closing plays, and a card reaches `/loved-one`. Whether the card is red is the analysis (D's gate below), not this change.
4. If the call stalls, sounds wrong or no card arrives, revert it: on PR #24 press **Revert**, then merge that PR once CI is green. Production redeploys in about a minute with the previous Kokoro lines.

## The demo phones changed tonight

- **New routes:** `/loved-one` (her phone) and `/caregiver` (Sam's). `/grandma` and `/caretaker` are gone (404). Update the bookmarks.
- **Each phone forgets its role once.** On Sam's phone, tap "I look out for someone". On her phone, open `/loved-one` or run setup again.
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

- **Role picker** (`/`): "Set up a phone for someone" or "I look out for someone". Each phone remembers its role.
- **Setup** (`/setup`): the caregiver fills it in on her phone (her name, their own name, an optional backup and her text size). Then they hand the phone over and she chooses how her person is told. Nothing is preselected.
- **Loved one's app** (`/loved-one`): Alerts (one call at a time like a deck, with a ring of big Get Sam, What to do, Their words and Read aloud buttons around the verdict), Past calls and Settings tabs, the voice note, and "I've dealt with this".
- **Caregiver's app** (`/caregiver`): Alerts, History and Settings, with a floating "I'm calling her now".
- **The call** (`/call`): the live Gemini screener with a tailored, checked follow-up and prerecorded lines in Gemini's Sulafat voice, plus the recorded-message option.
- **The analysis:** B's `analyse`: Gemini 4 Argon over the transcript and the matched Atlas patterns, with fixed word rules as the floor.

## Open work

**Kota (keeper)**
- Test #24 on production first (above).
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

- PR #24 changed every English demo call after the freeze (see the test above).
- Shared API routes have no access control. Use synthetic data only.
- The database password was exposed during setup. Owen rotates it after submission.
