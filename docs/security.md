# Demo security and implementation

This is a single-household demo using synthetic speech and stories only. These changes are explicitly approved by the user across slices; `lib/types.ts` and the other slices' status files remain keeper-owned. The Notion keeper must apply the specification changes below before treating its older role-picker description as current.

## What Halo does

The caller opens `/call` and streams microphone audio directly to Gemini Live using a short-lived, single-use token. The browser plays three allowlisted bundled Kokoro screening clips, discards generated model audio, and submits the conversation. The alternative recorded-message flow uploads audio to Gemini Flash. The older person's voice-note flow also uses Flash.

Analysis retrieves five relevant synthetic scam patterns using Atlas semantic Automated Embedding (`voyage-4`) and English text search combined with `$rankFusion`. Argon returns structured observations, parsed with Zod. Deterministic rules choose strong/some/none warning bands and fixed guidance. Failed model analysis produces an explicitly degraded warning rather than a green assurance. Model and caller text cannot supply a displayed destination: summaries, cues and readable transcripts use the shared scrubber.

MongoDB stores raw synthetic transcripts and analyses in `calls`, consent settings in `settings`, and alert creation/acknowledgement in `alerts`. The older person sees scrubbed transcripts; caretakers receive only authorized alert projections, with no raw transcript or cues. Phones poll while the app is open. Escalation is computed from elapsed time when an alert is read; no SMS, push delivery or telephone-network integration exists.

Raw transcripts remain stored until an operator resets demo data. Uploaded recordings are processed in memory and sent to Google; the app does not persist recordings. Do not record personal audio or use real caller content.

## Connect the demo devices

Configure separate random `ELDER_DEMO_ACCESS_CODE` and `CALL_DEMO_ACCESS_CODE` values, each 16–256 characters, privately in the server environment. Keep existing `.env` values. Never use `NEXT_PUBLIC_`, paste codes into issues, or store them in URLs. Missing/short configuration refuses access, including local development.

1. Open the role picker on the older person's phone. Choose setup and enter its private operator code and a device name. Complete setup together; the consent choice belongs to the older person.
2. In that phone's Settings, create a caretaker invitation. On the caretaker phone choose “I look out for someone” and enter the invitation and its device name. The code lasts ten minutes, works once, and is shown only when created. Creating another invitation cancels the previous code. No SMS is sent.
3. Open `/call` on the caller phone and enter its separate private operator code.

Sessions last eight hours and use random opaque cookies: HttpOnly, SameSite=Strict, Path=/, Secure in production with a `__Host-` name. MongoDB stores token hashes, device roles, names and expiry. Codes/tokens are never saved in localStorage. Settings lists connected caretaker devices and lets the older person revoke them. Changing the caretaker name revokes every caretaker device and invitation and starts a new recipient identity. A cosmetic name change therefore also requires pairing again. Disconnect deletes the current session; browser role choices alone grant no permissions.

Caretakers may read settings and their recipient's alerts and acknowledge them. They cannot read calls/transcripts, change settings, invite devices, start calls or upload voice notes. Caller devices may start/transcribe/submit only their own sessions. All mutations require matching Origin. Private JSON responses are no-store. A phone that loses access clears polled data and returns to pairing on its next request. Revocation cannot erase information a person already saw.

## Consent, persistence and limits

Alerts store private recipient identity and the summary authorized at creation. A later change to automatic sharing cannot expose a previously withheld summary. Current ask-first/pause settings suppress previously authorized summaries. Legacy alerts without recipient metadata are not shared with a newly paired caretaker. Replacing a caretaker cannot transfer the previous recipient's history. If no caretaker device has active access, a call is saved without claiming an automatic alert was sent.

Settings reads return an ETag; updates require the matching If-Match value. Missing preconditions return 428; stale changes return 412 and must be reviewed again. Clients serialize writes and show Saved only after confirmation. Settings writes, pairing/revocation and alert creation serialize through the household record. Calls, eligible alerts and completion receipts commit in one MongoDB transaction. Analysis is outside transaction callbacks so database retries do not repeat model calls.

Call sessions belong to the issuing device. Unused sessions expire after ten minutes; successful receipts remain for twenty-four hours. Repeating the same payload returns the saved call without another analysis or alert; changing it returns 409. A processing lease bounds concurrent work and allows recovery after a failed process. A recovered process can repeat an upstream request if it crashed before saving the provider result; quotas still apply. Analysis/transcription results cached for recovery are removed on successful completion. Recordings and failed client submissions are held only in page memory.

MongoDB counters enforce global limits across server instances: authentication 10/minute and 100/hour; token issuance, transcription and analysis each 6/minute and 60/hour. They do not rely on client IP headers. Limits return 429 with Retry-After. They bound admitted operations, not an exact financial spend; configure provider spending caps separately. The Live token is valid for two minutes and one connection. Provider requests have deadlines.

Body readers enforce actual stream limits before JSON/form parsing: 128 KiB JSON, 10 MiB audio plus 64 KiB multipart overhead. Content-Length is an early rejection hint, never the only check. Uploads time out after thirty seconds. Invalid/empty/unsupported audio is rejected before Gemini; normal transcription failures return a plain 502. Errors do not log credentials, caller content or raw provider responses.

## API additions and requirements for the keeper

Existing successful response shapes and `lib/types.ts` are unchanged.

| API | Body or headers | Access/result |
|---|---|---|
| `POST /api/session` | `{ role: "grandma" | "caller" | "caretaker", code, name }` | Private operator code or caretaker invitation; sets cookie; returns `{ role, expiresAt }` |
| `GET /api/session` | Cookie | Returns current `{ role, expiresAt }` |
| `DELETE /api/session` | Cookie, Origin | Revokes session, clears cookie; `{ signedOut: true }` |
| `POST /api/invitations` | Cookie, Origin | Older person only; `{ code, expiresAt }` |
| `GET /api/devices` | Cookie | Older person only; caretaker `{ id, name, createdAt, expiresAt }[]` |
| `DELETE /api/devices/:id` | Cookie, Origin | Older person only; `{ revoked: true }` |
| `PUT /api/settings` | Existing body plus `If-Match` | Older person only; returns new ETag |
| `POST /api/transcribe` | Existing multipart plus `X-Call-Session-Id` | Caller-owned session only |
| `POST /api/voice-note` | Existing multipart plus random UUID `X-Voice-Note-Id`, reused on retry | Older person only; idempotent recording submission |

Update the Notion source to these device roles, invitation/revocation flow, consent snapshot semantics, API headers, raw transcript storage and `analyse(transcript, source)`. The unavailable captured fallback must be described as pending, not delivered. `DEMO_FALLBACK=1` explicitly refuses call starts with 503; a recorded message still uses live Flash and Argon. `recordedFixture` remains in the keeper's response contract and is false.

## Operations and outstanding validation

Use a MongoDB replica set for transactions. `pnpm db:local` starts a temporary single-node replica set; Atlas already supports transactions. Unique indexes reject duplicate call/alert/settings identifiers without deleting any records. Device, invitation, receipt and rate documents have TTL indexes; access checks enforce deadlines without waiting for asynchronous TTL cleanup.

Destructive scripts print only the sanitized host/database and require `CONFIRM_DEMO_TARGET=host/database` for remote targets. The approved shared target is `cluster0.lhbq6vr.mongodb.net/hangup`. Seeding replaces only `patterns`; resetting removes calls, alerts, call sessions, devices and invitations and restores settings, so reconnect every phone afterwards. Never reset the shared database while teammates are using it.

The keeper must confirm the deployed target, set both private access codes, rotate the previously exposed MongoDB password and Gemini key privately, and check Vercel deployment access. Repository scans cannot revoke exposed credentials.

Gemini billing remains deferred at the user's request. The 45 Argon evaluations, actual synthetic WAV/WebM transcription, a captured fixed police/courier fallback and three consecutive deployed runs of each demo scenario remain outstanding. Do not claim a matched Atlas pattern alone proves Argon ran: the strict live evaluator rejects degraded providers. Physical microphone/speaker tests and pairing/revocation on deployed phones remain necessary. No changes establish readiness for real personal data.
