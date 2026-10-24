# Halo

**Apple's screener asks who's calling. Halo works out whether to believe them, and she decides who hears about it.**

Live: https://hang-up-and-check.vercel.app · Built at Encode London 2026 (Real World track, Google DeepMind and MongoDB bounties).

## The problem
The UK scams that cost older people the most start with a phone call: someone pretending to be the police or the bank coaches them to keep it secret, then sends a courier for cash or gets a bank transfer. About 62% of 2025 courier-fraud reports came from people aged 76–96, with an average loss of about £15k (police figures from secondary copies; sources in [docs/research.md](docs/research.md)). The UK measures that work bring in a third person the scammer doesn't control.

## What it does
1. An AI screener answers unknown callers and asks who's calling and why.
2. Gemini 4 Argon compares the story with a MongoDB Atlas library of UK scam scripts; fixed rules set the warning level.
3. She gets a plain card: red, amber or green, the caller's own phrases, and fixed next steps (don't call back, call 159).
4. If it's serious and she chose it, her person's phone lights up: "Please call her." They tap "I'm calling her now"; if they don't, she's told to call 159.
5. If she answered a call herself, a voice note gets the same check.

## What's real and what's faked
| Real | Faked, and why |
|---|---|
| The screener's live voice conversation (Gemini Live) | Calls come through the `/call` web page, not the phone network. Production would forward silenced calls through a paid telephony provider such as Twilio |
| Argon's analysis and the Atlas pattern search | One seeded household. Sam's verification code shows on screen instead of by SMS |
| The alert, acknowledgement and escalation, stored in Atlas | Both phones keep the web app open and poll every 2 seconds. Production would push or text |
| Voice-note transcription | A recorded fallback analysis and caller audio exist for a failed live call (`DEMO_FALLBACK=1`), used only then |

All test data is synthetic: the scam scripts were written by the team.

## How it uses Gemini and MongoDB Atlas
- **Gemini Live:** the screener's conversation. **Gemini 4 Argon:** judges the transcript (structured output; the transcript is treated as untrusted data). **Gemini Flash:** transcribes voice notes.
- **Atlas Vector Search with Automated Embedding plus Atlas Search,** fused with `$rankFusion`: finds the closest scam scripts. **Atlas collections** for calls, alerts (the audit log) and settings.

## Privacy
- Her person never sees transcripts or quoted phrases, and sees a summary only if she chose automatic alerts.
- No phone number from a caller or a model is ever shown; numbers come from one fixed list.
- She can pause alerts at any time, and the server enforces it.

## Honest limits
It doesn't stop spoofed numbers she has saved, landline calls, or a call she has already answered. It has only been tested on scripts the team wrote. It adds to Apple's screening, the banks and 159; it doesn't replace them.

## Run it
Node 24 and pnpm 9.

```bash
pnpm install
cp .env.example .env   # MONGODB_URI, GEMINI_API_KEY
pnpm seed:patterns     # load the scam library into Atlas
pnpm demo:reset && pnpm dev
```

Open http://localhost:3000 and pick a role on each phone; open http://localhost:3000/call to play the caller.

## Team
| Slice | Who |
|---|---|
| The call (screener) | ish24cho |
| The brain (Argon and Atlas) | Josh Lim |
| Her app and the design | Owen |
| Her person's app, alerts, pitch | Josh Lim |

## Developing
Read [AGENTS.md](AGENTS.md), [SPEC.md](SPEC.md) (a copy of the Notion specification; Notion wins), [docs/briefs/README.md](docs/briefs/README.md) and [docs/HANDOVER.md](docs/HANDOVER.md) first. Work on your own `slice/*` branch, never on `main`, and update your file in `docs/status/` after each step.

```bash
pnpm db:local        # temporary in-memory database for offline work (MONGODB_URI=mongodb://127.0.0.1:27017)
pnpm dev             # the app on http://localhost:3000
pnpm demo:reset      # restore the demo household before every run
pnpm test            # unit tests
scripts/verify.sh    # typecheck, lint, test, build and secrets scan: must print READY
```
