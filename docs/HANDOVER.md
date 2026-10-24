# Handover: Owen is away on Saturday 24 Oct

The app is called **Halo**. The Vercel URL and the GitHub repo keep their old names.

Owen is at another hackathon all Saturday and replies to messages slowly, if at all. Until he's back:

- **Keeper: A (ish24cho).** A merges to main and owns `lib/types.ts`, the shared routes and deploy settings, the same way Owen did (AGENTS.md).
- **Slice C and design are open to the team.** Anyone may change Grandma's screens, the setup flow or `DESIGN.md`, including a redesign. Owen's hand-drawn wireframes were never shared, so there is no redesign brief: it's your call. Keep the semantic tokens and `components/ui/`, update `DESIGN.md` when you change a rule, and keep all seven demo-script steps working.

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
| `GEMINI_API_KEY` | **Missing**: the live call and real transcription won't work |
| `CALL_DEMO_ACCESS_CODE` | **Missing**: `/call` refuses every call (503) until it's set |
| `MONGODB_DB`, `ESCALATE_AFTER_MIN`, `DEMO_FALLBACK` | Not needed: the code defaults to `hangup`, 3 minutes and off |

### Owen's checklist (Saturday morning, before he leaves)

- [ ] Add `GEMINI_API_KEY` and `CALL_DEMO_ACCESS_CODE` to Vercel production (as Secrets), then push or redeploy. Send the access code privately to whoever plays the caller.
- [ ] Invite the team to the Atlas project (Project → Access Manager → Invite).
- [x] Invite D as a GitHub collaborator. **D: accept the invite email** (or go to github.com/owenbonc/grandma-s-phone/invitations); until then you can't push.

If a box is still empty when you read this, ask Owen in the group chat.

## The database

- MongoDB Atlas, free M0 cluster `cluster0.revh6w` on AWS us-east-1, in Owen's organisation. The database is `hangup`.
- Production uses the user `app`, whose password lives only in Vercel. Once you're invited, make **your own** database user (Database & Network Access) and put your own connection string in your local `.env`. Never share one in the repo, an issue or a chat with an AI.
- Production has no calls yet. Its settings fall back to the seed (her name "Grandma", contact Sam) until someone runs `/setup` on the stage phone or `pnpm demo:reset` against Atlas.
- Still to do on Atlas: B's `pnpm seed:patterns`. Nobody has checked yet that a free M0 cluster supports B's Automated Embedding; `seed:patterns` will show.
- Demo step 7 shows Atlas on screen, so whoever presents needs to be signed in to Atlas.

## What's on main

- **Role picker** (`/`): "Set up a phone for someone" or "I look out for someone". Each phone remembers its role.
- **Setup** (`/setup`): the caretaker fills it in on her phone (her name, their own name, an optional backup and her text size). Then they hand the phone over and she chooses how her person is told.
- **Grandma's app** (`/grandma`): Alerts (one call at a time like a deck, with big Get Sam, What to do, What they said and Read it to me buttons), Past calls and Settings tabs, the voice note, and "I've dealt with this".
- **Caretaker's app** (`/caretaker`): Alerts, History and Profile, with a floating "I'm calling her now". It was built by C at Owen's request; D builds on it.
- **The call** (`/call`): A's live Gemini screener with Kokoro voice clips (PR #7), including the `recordedFixture` contract.
- **Not merged yet:** B's brain (`slice/b-brain`). `analyse` on main is still the stub.

## Open work

**Keeper (A)**
- Review and merge B's brain once it's a PR; verify the combined app.
- A's P1s from `docs/status/A-call.md`: access control on shared routes, submission recovery, session expiry.
- Small keeper fixes: give `speak()` in `lib/recorder.ts` `lang: 'en-GB'`; delete `BAND_LABEL.icon` and `.tone`; add a dialable number to `GUIDANCE.call_159`.

**A**
- The screener's fixed opening says "you've reached Grandma's call assistant" (`lib/screener-prompt.ts`, `app/call/voice/clips.json` and its clip), but her name is now set at setup. Make the line name-free, or agree a persona name and put it in `lib/seed.ts` too.
- Move `/call` onto `DESIGN.md` tokens: it still uses raw Tailwind colours.

**B**
- Land the brain and run `pnpm seed:patterns` on Atlas.
- Make sure `analyse()` strips digits and URLs from `summary`. For screener calls, drop `different_phone`. A green summary shouldn't repeat the card title.

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
- `lib/db.ts` keeps a failed MongoDB connection until the server restarts. One Atlas blip can keep production failing until the next deploy.
- Functions run in London (lhr1) and the database is in Virginia, which adds about 80 ms per query. That's fine for the demo.
- The database password was exposed during setup. Owen rotates it after submission.

## Timeline (London)

Checkpoints Sat 13:00, 18:00 and 22:30. Feature freeze Sat 23:00. Three clean demo runs and the video Sun 08:00–09:30. Submit Sun 10:00; the deadline is 12:00.
