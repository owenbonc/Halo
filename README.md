# Halo

An AI call screener for older people: it answers unknown callers, works out whether their story matches a UK scam script, gives Grandma a plain card telling her what to do, and lets her chosen person know when it matters.

Built at Encode London 2026. Submissions close **Sunday 25 Oct, 12:00 London time**.

> This README is the team's starting point during the build. Slice D rewrites it for judges before submission.

## Start here (everyone)

1. **Get access:** Owen adds you as a collaborator. Accept the email invite.
2. **Find your slice** in the table below and open your GitHub issue: it's your checklist. Owen's one-off setup is [#1](https://github.com/owenbonc/grandma-s-phone/issues/1).
3. **Set up your laptop** (Node 24 and pnpm 9):

   ```bash
   git clone https://github.com/owenbonc/grandma-s-phone.git
   cd grandma-s-phone
   git config user.name "Your Name"
   git config user.email "you@example.com"
   pnpm install
   cp .env.example .env
   ```

   In `.env`, set `MONGODB_URI=mongodb://127.0.0.1:27017` to work offline, or the Atlas string B shares with you privately.

4. **Run it** (two terminals):

   ```bash
   pnpm db:local
   ```

   ```bash
   pnpm demo:reset && pnpm dev
   ```

   Open http://localhost:3000 and pick Grandma or Caretaker. Open http://localhost:3000/call to play the caller.

5. **Work on your own branch,** never on `main`:

   ```bash
   git switch -c slice/<a-call|b-brain|c-grandma|d-caretaker>
   ```

6. **Start your AI agent** with:

   > You are working on slice X of Halo. Read AGENTS.md, SPEC.md, docs/briefs/README.md, docs/briefs/X-….md and every file in docs/status/ before doing anything.

7. **After each finished step:** update your own file in `docs/status/`, commit, and push your branch. Owen merges into `main` once `scripts/verify.sh` prints READY.

## Who does what

| Slice | What you build | Checklist | Brief | Status |
|---|---|---|---|---|
| **A: The call** | The `/call` page and the AI screener's voice conversation | [#2](https://github.com/owenbonc/grandma-s-phone/issues/2) | [A-call.md](docs/briefs/A-call.md) | [A-call](docs/status/A-call.md) |
| **B: The brain** | Scam analysis with Gemini 4 Argon and the MongoDB Atlas pattern library | [#3](https://github.com/owenbonc/grandma-s-phone/issues/3) | [B-brain.md](docs/briefs/B-brain.md) | [B-brain](docs/status/B-brain.md) |
| **C: Grandma's app** | Role picker, Grandma's cards, setup and consent, voice note, shared look | [#4](https://github.com/owenbonc/grandma-s-phone/issues/4) | [C-grandma.md](docs/briefs/C-grandma.md) | [C-grandma](docs/status/C-grandma.md) |
| **D: Caretaker's app** | Alerts, "I'm calling her now", escalation, then README, video and pitch | [#5](https://github.com/owenbonc/grandma-s-phone/issues/5) | [D-caretaker.md](docs/briefs/D-caretaker.md) | [D-caretaker](docs/status/D-caretaker.md) |

The rules every slice follows are in [docs/briefs/README.md](docs/briefs/README.md). The short version: only edit your own files, never edit `lib/types.ts` (request changes in your status file), never push to `main`, never commit `.env` or keys, and only use made-up test data.

## Where things are

- **What we're building:** [SPEC.md](SPEC.md), a copy of the [Specification in Notion](https://app.notion.com/p/14297080891e838fae6c01ef02aa20d8). Notion wins if they differ.
- **Why:** [docs/research.md](docs/research.md), the research behind the idea.
- **Rules for AI agents:** [AGENTS.md](AGENTS.md).

## Timeline (London time)

| When | What |
|---|---|
| Fri tonight | Each slice's prep task (see your issue). A's phone test by 21:00 |
| Sat 09:00 | Build your slice from the skeleton on `main` |
| Sat 13:00, 18:00, 22:30 | Whole team runs the demo together on the deployed app |
| Sat 23:00 | Feature freeze: fixes and polish only after this |
| Sun 08:00–09:30 | Three clean demo runs, record the video |
| Sun 10:00 | Submitted |

## Commands

```bash
pnpm dev             # the app on http://localhost:3000
pnpm db:local        # temporary in-memory database for offline work
pnpm demo:reset      # restore the demo household before every run
pnpm test            # unit tests
scripts/verify.sh    # typecheck, lint, test, build and secrets scan: must print READY
```
