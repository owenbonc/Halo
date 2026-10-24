# Video plan

## Atlas shots (demo step 7)

Sign in to Atlas before recording. Database `hangup` on cluster `cluster0.revh6w`.

1. **Pattern library:** `patterns` collection, then Search Indexes: show the vector index (Automated Embedding) and the text index. One line: "30 UK scam scripts, searched by meaning and by words at once."
2. **The match:** `calls` collection, filter `{ "analysis.band": "strong" }`, newest first: open the courier call and point at `analysis.matchedPatternIds`, then open that pattern in `patterns`.
3. **Audit record:** `alerts` collection, filter `{}` sorted by `createdAt: -1`: point at `trigger: "auto_strong"`, `createdAt` and `acknowledgedAt`. One line: "Every alert and every 'I'm calling her now' is on record."
4. Never show the `transcript` field on screen for longer than a glance; it's synthetic, but Sam's view never shows it, and the video shouldn't make that look otherwise.
