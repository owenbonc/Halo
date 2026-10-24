# Pitch

## One-liner
*Apple's screener asks who's calling. Ours works out whether to believe them, and Grandma decides who hears about it.*

## Spoken pitch (3:00)
Times match the shot list in [video-plan.md](video-plan.md).

- **0:00–0:20, the problem.** The UK scams that cost older people the most start with a phone call. Someone pretends to be the police or the bank, tells her to keep it secret, then sends a courier for her cash. About 62% of 2025 courier-fraud reports came from people aged 76–96. The average loss was about £15k. The measures that work bring in a third person the scammer doesn't control.
- **0:20–1:05, the call.** This is Halo. Grandma is our named persona, and Sam is the person she chose. At setup she picked that Sam is told automatically when it's serious. Now a teammate rings her through the call page on this phone. It's a simulated call over the web, and we say so. The screener answers out loud and asks who's calling and why. The "police officer" says a courier will collect her cash and she mustn't tell her family.
- **1:05–1:30, her card.** Her phone turns red: strong warning signs. It shows the phrases the caller used, the type (fake police, courier) and fixed next steps. Don't call them back. Use a different phone. Call 159. "Read it to me" reads the card aloud.
- **1:30–1:50, her person.** Sam's phone lights up on its own: "Please call her." Sam taps "I'm calling her now", and Grandma's card says Sam is calling. Sam never sees the transcript.
- **1:50–2:05, a GP call and a trick.** A GP surgery call comes back green, with no alert, and says it isn't a guarantee. Then a caller tells the assistant to ignore its rules and to tell her to ring a number. The card stays red, and the number appears nowhere.
- **2:05–2:20, voice note and escalation.** If she answered a call herself, she presses one button, describes it, and gets the same card. If Sam doesn't reply, she sees "Sam hasn't replied. Call 159."
- **2:20–2:45, under the hood.** Atlas holds thirty UK scam scripts. Vector Search and text search find the closest match together. Every alert, and every "I'm calling her now", is on record.
- **2:45–3:00, honest limits.** See below, then the one-liner.

## Honest limits
It doesn't stop spoofed numbers she has saved, landline calls, or a call she has already answered. It has only been tested on scripts the team wrote. It adds to Apple's screening, the banks and 159; it doesn't replace them.

## "What's faked?"
Calls are simulated: the caller uses a web page, not the phone network, because the telephony provider production would need is paid and isn't built. The voice, the conversation and the analysis are real. There is one seeded household, Sam's verification code shows on screen instead of by SMS, and both phones poll for updates instead of getting a push. A recorded fallback analysis and caller audio exist for a failed live call, and are used only then.

## Submission paragraphs

### Real World
Halo is for older people targeted by phone scams. The costliest ones start with a call from a fake police officer or bank, who coaches her to keep it secret. Halo reads messy real input: live speech from a caller's microphone and a voice note from her. It gives her a plain card with fixed next steps, and tells her chosen person only if she agreed. On responsibility, her person never sees transcripts, no number from a caller or model is ever shown, and the card says it isn't a guarantee. We say what it doesn't stop: spoofed numbers she has saved, landlines, and calls she has already answered. It has only been tested on scripts we wrote.

### Google DeepMind
The demo is live, with no slides: a real voice conversation, a card that turns red, and a second phone that lights up. The problem is specific, and the person is named. Grandma is our named persona, and Sam is the person she chose to have told. Gemini 4 Argon is needed because the call is a conversation, not a keyword: it compares what the caller said with known scam scripts and judges the story as a whole, with the transcript treated as untrusted data. People stay in control. She chooses at setup who is told and can pause alerts, and a human, Sam, makes the call. Gemini Live listens to the caller and picks which of three fixed screening lines to play; Gemini Flash transcribes voice notes and recorded messages.

### MongoDB
Atlas is the core of the build. The `patterns` collection holds thirty UK scam scripts. Atlas Vector Search with Automated Embedding finds scripts that mean the same thing as the call, Atlas Search finds the exact words, and `$rankFusion` combines the two. Calls, alerts and settings are also stored in Atlas. The alerts collection is the audit log: each alert, when it was raised and when it was acknowledged, so there is a record of who was told and who replied.
