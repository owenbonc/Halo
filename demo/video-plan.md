# Video plan

Three minutes at most. Run `pnpm demo:reset` first. The caller's lines are in [scripts.md](scripts.md).

## Shot list

| Time | Screen | Line said |
|---|---|---|
| 0:00–0:20 | Title card: "About 62% of 2025 courier-fraud reports came from people aged 76–96. Average loss about £15k." | "Scammers pose as the police or the bank, tell her to keep it secret, and send a courier. What works is a third person they don't control." |
| 0:20–1:05 | Stage phone at `/call`, script 1 (fake police and courier). Say it is a simulated call over the web. | "Halo's screener answers and asks who's calling. A teammate is playing a fake police officer." |
| 1:05–1:30 | Her phone: the red card, the caller's phrases, the fixed steps. Tap "Read it to me". | "She gets a plain card: what they said and what to do. Don't call back. Call 159." |
| 1:30–1:50 | Her person's phone chimes and shows the alert. Tap "I'm calling her now"; her card updates. | "Her person is alerted on its own, because she chose that. They tap that they're calling her." |
| 1:50–2:05 | Script 2 (GP surgery): green card, no alert. Then script 3 (the trick): the card stays red and no number appears. | "A GP call comes back green, with no alert. A caller who tries to steer the assistant stays red, and no number from the call is shown." |
| 2:05–2:20 | Voice note (script 4), then escalation (script 5): her person doesn't tap, her phone says to call 159. | "If she answered a call herself, a voice note gets the same check. If her person doesn't reply, she's told to call 159." |
| 2:20–2:45 | Atlas shots below. | "Thirty scam scripts, searched by meaning and by words at once. Every alert is on record." |
| 2:45–3:00 | Closing card with the honest limits. | "Tested on scripts we wrote. It doesn't stop spoofed numbers she has saved, landline calls, or a call she has already answered. Apple's screener asks who's calling. Ours works out whether to believe them, and Mum decides who hears about it." |

## Atlas shots (demo step 7)

Sign in to Atlas before recording. Database `hangup` on cluster `cluster0.revh6w`.

1. **Pattern library:** `patterns` collection, then Search Indexes: show the vector index (Automated Embedding) and the text index. One line: "30 UK scam scripts, searched by meaning and by words at once."
2. **The match:** `calls` collection, filter `{ "analysis.band": "strong" }`, newest first: open the courier call and point at `analysis.matchedPatternIds`, then open that pattern in `patterns`.
3. **Audit record:** `alerts` collection, filter `{}` sorted by `createdAt: -1`: point at `trigger: "auto_strong"`, `createdAt` and `acknowledgedAt`. One line: "Every alert and every 'I'm calling her now' is on record."
4. Never show the `transcript` field on screen for longer than a glance; it's synthetic, but Sam's view never shows it, and the video shouldn't make that look otherwise.
