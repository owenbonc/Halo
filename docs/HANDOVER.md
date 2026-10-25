# Handover: Owen is away on Saturday 24 Oct

The app is called **Halo**. The GitHub repo is `owenbonc/Halo`; the Vercel URL keeps its old name.

Owen is at another hackathon all Saturday and replies to messages slowly, if at all. Until he's back:

- **Keeper: A (ish24cho).** A merges to main and owns `lib/types.ts`, the shared routes and deploy settings, the same way Owen did (AGENTS.md).
- **Slice C and design are open to the team.** Anyone may change the loved one's screens, the setup flow or `DESIGN.md`, including a redesign. Owen's hand-drawn wireframes were never shared, so there is no redesign brief: it's your call. Keep the semantic tokens and `components/ui/`, update `DESIGN.md` when you change a rule, and keep all seven demo-script steps working.

## The live app

**https://hang-up-and-check.vercel.app**

- Every push to `main` deploys production automatically, in about a minute. Other branches get preview links. Previews have no environment variables, so their data routes fail; that's expected.
- `main` must always be demoable: `scripts/verify.sh` prints READY before every push to main, and you click through the real thing.
- Run `git config core.hooksPath .githooks` once in your checkout. The hook scans for keys and env files before every push, so a pasted secret never reaches GitHub. CI scans too, but only after it's pushed.
- CI's `smoke` job checks the live site about a minute after each push to main. A red ❌ on `smoke` means production is broken even though the code passed: tell Owen, since only he can see the Vercel logs.
- The Vercel project sits on Owen's personal Hobby account. Only Owen can open its dashboard, read its logs or change its environment variables. If something breaks in production and the cause isn't obvious, reproduce it locally first.

| Environment variable | Production |
|---|---|
| `MONGODB_URI` | Set (Atlas) |
| `GEMINI_API_KEY` | Set (Secret) |
| `CALL_DEMO_ACCESS_CODE` | Set (Secret) |
| `MONGODB_DB`, `ESCALATE_AFTER_MIN`, `DEMO_FALLBACK` | Not needed: the code defaults to `hangup`, 3 minutes and off |

### Owen's checklist (Saturday morning, before he leaves)

- [x] Add `GEMINI_API_KEY` and `CALL_DEMO_ACCESS_CODE` to Vercel production (as Secrets), then push or redeploy.
- [ ] Send the access code privately to whoever plays the caller.
- [ ] Invite the team to the Atlas project (Project → Access Manager → Invite).
- [x] Invite D as a GitHub collaborator. **D: accept the invite email** (or go to github.com/owenbonc/Halo/invitations); until then you can't push.

If a box is still empty when you read this, ask Owen in the group chat.

## The database

- MongoDB Atlas cluster `cluster0.lhbq6vr`, B's seeded cluster, with database `hangup`. Production switched to it on Sat 24 Oct; Owen's old `cluster0.revh6w` is no longer used.
- Production's connection string lives only in Vercel. Make **your own** database user (Database & Network Access) and put your own connection string in your local `.env`. Never share one in the repo, an issue or a chat with an AI.
- Network Access allows `0.0.0.0/0`, because Vercel's servers have no fixed IPs. Removing it takes production's data routes down.
- The 30 patterns and both search indexes (`patterns_semantic`, `patterns_phrases`) are seeded and READY. Run `pnpm demo:reset` against this cluster before every demo run.
- Demo step 7 shows Atlas on screen, so whoever presents needs to be signed in to Atlas.

## What's on main

- **Role picker** (`/`): "Set up a phone for someone" or "I look out for someone". Each phone remembers its role.
- **Setup** (`/setup`): the caregiver fills it in on her phone (her name, their own name, an optional backup and her text size). Then they hand the phone over and she chooses how her person is told.
- **Loved one's app** (`/loved-one`): Alerts (one call at a time like a deck, with a ring of big Get Sam, What to do, Their words and Read aloud buttons around the verdict), Past calls and Settings tabs, the voice note, and "I've dealt with this".
- **Caregiver's app** (`/caregiver`): Alerts, History and Profile, with a floating "I'm calling her now". It was built by C at Owen's request; D builds on it.
- **The call** (`/call`): A's live Gemini screener with a tailored, checked follow-up and prerecorded lines in Gemini's Sulafat voice, including the `recordedFixture` contract.
- **Not merged yet:** B's brain (`slice/b-brain`). `analyse` on main is still the stub.

## Open work

**Keeper (A)**
- Review and merge B's brain once it's a PR; verify the combined app.
- A's P1s from `docs/status/A-call.md`: access control on shared routes, submission recovery, session expiry.
- Small keeper fix: add a dialable number to `GUIDANCE.call_159`.
- Owen's decisions on Kota's review (PR #15): recorded messages are transcribed for real, and the preset police-call sample is served only under `DEMO_FALLBACK=1` (the call page says so); `CALL_RECORDED_TRANSCRIPTION_READY` is gone. Sam sees the summary when she was on automatic alerts at the time the alert went out, tap or automatic, so `AlertRecord` now stores `alertMode`. Run `pnpm demo:reset` after merging: older alerts lack the field.

**A**
- Move `/call` onto `DESIGN.md` tokens: it still uses raw Tailwind colours.

**B**
- Run the live Gemini eval once a working key is in place.

**D**
- README, pitch and video. Keep the stage dialogue in line with B's `demo-*` test cases.

**Anyone**
- Update the Notion spec's "One app, two roles" bullet to match `SPEC.md`. Notion is the source of truth.
- Test on real phones: the mic, the voice note, read-aloud, `/call` over HTTPS, and two phones for the alert.

## Settled decisions (don't reopen without Owen)

- **No allowlist of "official" numbers.** Her saved contacts already ring through on her phone. Trusting bank, police or council numbers would let through exactly the spoofed calls the app exists to catch.
- **The consent choice is hers.** It's made after the hand-over screen in setup, and in Settings.
- **Sam never sees transcripts or quoted phrases.** Phone numbers shown anywhere come only from `lib/guidance.ts`.

## Known risks

- Shared API routes have no access control. Use synthetic data only.
- The database password was exposed during setup. Owen rotates it after submission.

## Timeline (London)

Checkpoints Sat 13:00, 18:00 and 22:30. Feature freeze Sat 23:00. Three clean demo runs and the video Sun 08:00–09:30. Submit Sun 10:00; the deadline is 12:00.
