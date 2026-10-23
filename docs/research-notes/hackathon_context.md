# Hackathon context: Encode London 2026, tracks, judging, sponsors, Saint

All pages accessed 2026-10-23 (the event's first day). The official Encode programme page is a JavaScript app. Plain fetch returned only the title, so it was rendered in a browser and read in full, including the expanded FAQ. Model names on the Gemini pages (for example "Gemini 4 Argon" and "gemini-3.8-flash") postdate my training data. They are reported exactly as the official pages state them.

## 1. What is Encode London 2026: dates, venue, build window, teams, submission and originality rules

### Takeaway
Encode Club organises Encode London 2026. It is an in-person, three-day hackathon at Encode Hub in Shoreditch, from Fri 23 Oct to Sun 25 Oct 2026. Hacking starts Fri 5:00pm and submissions close Sun 12:00pm London time, which leaves about 43 hours of build time. Solo entrants and teams are both allowed, and no maximum team size is published. Each team submits one project, and that one project can be entered into several challenges.

### Cited Findings
- **Organiser:** Encode Club. The event is presented and hosted by Encode Club on Luma. — [Luma event page](https://luma.com/encode-london-2026)
- **Dates and venue:** Fri 23 to Sun 25 October 2026, at Encode Hub, 41 Pitfield St, London N1 6DA. The page describes it as "a three-day hackathon exploring the latest in Tech and AI." — [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)
- **Friday schedule:**
  - 12:00pm doors open; 2:00pm welcome.
  - 2:30pm Google DeepMind workshop; 3:00pm Arc workshop; 3:30pm MongoDB workshop; 4:00pm Saint workshop ("Hiring your first AI employee").
  - 4:30pm challenges and team formation; 5:00pm hacking begins.
  - Source: [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)
- **Saturday and Sunday:** Saturday is a full building day with mentors. On Sunday, "Submissions close 12:00pm · event ends 4:30pm". Luma adds that all timings are "provisional". — [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026); [Luma](https://luma.com/encode-london-2026)
- **Registration:** The page states "Programme has started but you can still apply!" The Encode team reviews every registration. Once approved, entrants get access to the hackathon platform for project creation, team codes and submission. — [Encode programme page FAQ](https://www.encodeclub.com/programmes/encode-london-2026)
- **Tickets:** Luma lists Guaranteed Entry, Standard (ballot) and Student (requires approval). — [Luma](https://luma.com/encode-london-2026). Third-party listings mention £36 for guaranteed entry and £0 for students. That price is not confirmed on the official pages. — [web3voyager listing](https://web3voyager.com/event/encode-london-hackathon-conference-26-10)
- **Team size:** "Both solo and team participation are allowed." Teams are formed through a team code on the platform, on Discord, or in person after Friday's opening. **No maximum team size is stated.** — [Encode programme page FAQ](https://www.encodeclub.com/programmes/encode-london-2026)
- **One project, many entries:** "Each team submits one project, and that project can be entered into several challenges and bounties as long as it meets each one's requirements." — [Encode programme page FAQ](https://www.encodeclub.com/programmes/encode-london-2026)
- **General submission requirements:**
  - Submit on the platform before Sun 25 Oct, 12:00pm London time.
  - Every submission needs a project description, "an explanation of how it meets each challenge you're entering", a link to the code repository and a demo video.
  - Some challenges add their own requirements.
  - Source: [Encode programme page FAQ](https://www.encodeclub.com/programmes/encode-london-2026)
- **Deployed link:** A live deployed URL is **not** a general requirement. The Real World track requires "A working demo (web, mobile or hardware)". — [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)
- **Code originality:**
  - The Google DeepMind brief disqualifies or marks down "Anything built before kickoff" and says "Open-source libraries and starter templates are fine, but your demo must only show code written during the hackathon."
  - No event-wide originality rule was found on the programme page or in the FAQ.
  - Source: [Encode programme page, DeepMind bounty](https://www.encodeclub.com/programmes/encode-london-2026)
- **Facilities:** Desks (first come, first served), a workshop room, food and drinks, Wi-Fi and a shower. Sleeping at the venue is not allowed. — [Encode programme page FAQ](https://www.encodeclub.com/programmes/encode-london-2026)
- **Overall prizes:**
  - Every builder gets $20 of Treg credits. Treg gives agents "one key for 4,000+ tools and data APIs".
  - The overall top three projects win Treg credits: $500, $250 and $100.
  - Source: [Encode programme page FAQ](https://www.encodeclub.com/programmes/encode-london-2026)
- **How winners are chosen:**
  - Partner bounties: "each partner's judges choose the winners of their own bounty".
  - Open challenges: "a panel of external judges chooses the winners of The Real World and Agents That Ship."
  - Source: [Encode programme page FAQ](https://www.encodeclub.com/programmes/encode-london-2026)

### Inferences
- The real build window runs from Friday 5pm to Sunday 12pm, about 43 hours. The project gets two working evenings and one full day, not three full days. The demo video has to be recorded before noon on Sunday.
- The Gemini bounty says a demo must "only show code written during the hackathon". Anything the team has already built should be treated as a library or template, and not shown as the project.

### Gaps
- No event-wide rules on IP ownership, licensing or code originality were found. The only originality language is in the DeepMind bounty.
- No maximum team size is published.
- Prize amounts for the two open challenges are not published. Luma says more prizes and judges are "to be announced soon".
- Ticket prices on the official pages could not be confirmed.

## 2. The "Real World AI" track, the other tracks, sponsor bounties, and judging criteria

### Takeaway
The track is officially called **"The Real World: AI that understands the world around us."** It is for software that makes sense of the physical world from photos, audio, maps and open data. Judges weigh four criteria, with no weightings published: real-world usefulness, how well the software reads messy real inputs, technical execution, and responsibility (privacy and honesty about uncertainty). Three partner bounties sit alongside it: Google DeepMind/Gemini ($15k in credits), MongoDB Atlas (cash pool reported as £6,800 on Luma) and Saint (£200 plus Saint subscriptions). The second open track, **Agents That Ship**, rewards human-approval steps for risky actions.

### Cited Findings

**The Real World track** (source for all bullets below: [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026))
- **Brief:** "Build software that makes sense of the physical world from photos, audio, maps and open data… Combine vision, audio and language models with maps and public datasets."
- **Example ideas** (the brief says these are "starting points, not tracks"):
  - an accessibility guide for venues
  - a "what's happening near me" explorer
  - a trip or hike conditions planner
  - a wildlife ID tool
  - a noise or air-quality map
  - a tool to report a problem from a photo to the council
  - a sound-aware assistant for deaf users
  - a label or menu allergen reader
  - a flood and heat risk checker
- **Suggested data sources:** OpenStreetMap, the TfL Unified API, London Datastore, the Met Office, Open-Meteo, Breathe London, the Environment Agency flood API, iNaturalist and GBIF.
- **Judging criteria** (no weightings given):
  1. Real-world usefulness: "a clear user and a problem that exists outside the hackathon".
  2. How well it reads the world: "accuracy, and sensible handling of messy inputs such as blurry photos, background noise or gaps in the data".
  3. Technical execution: "a working end-to-end demo that combines AI models with real data".
  4. Responsibility: "respect for privacy (faces, number plates, people's locations), and honesty about uncertainty when the model isn't sure".
- **Submission requirements:**
  - a working demo (web, mobile or hardware)
  - a repository with a README and setup instructions
  - a **2 to 4 minute demo video showing it working on real inputs**
  - a short note on the models and data sources used

**Agents That Ship track** (same source)
- **Brief:** "Build an AI agent that does a real job end to end, not just a chatbot… A person should stay in control where it matters, approving the risky steps."
- **Judging criteria:** does the job, reliability ("knows when to stop and ask a human"), usefulness, technical depth, and safety and control ("approval steps for risky actions and a clear record of what the agent did").
- **Submission requirements:** an end-to-end demo, a repository with a README, a 2 to 4 minute video, and a description of the agent's tools and steps, including where a human approves.

**Google DeepMind bounty: "Build with Gemini 4 Argon"** (source unless noted: [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026))
- **Requirement:** The project must be powered by `gemini-4-argon` and solve "a specific problem for a real person you can name". Companion models are allowed, for example `gemini-3.8-live` for real-time voice and `gemini-3.8-flash` for subagents.
- **Pathway 2:** This pathway is titled "The Real World, Hard Tech & Multimodal Creation". Its example ideas include "a hands-free voice and screen navigator in 70+ languages with human confirmation before any form is submitted."
- **Prizes:** $15,000 in Gemini API and Google Cloud credits, paid as 1st $7,000, 2nd $5,000 and 3rd $3,000 in Gemini API credits.
- **Judging weightings** (the only published weightings at the event):
  - Working live demo: 50%
  - Problem and usefulness: 25%
  - Originality, or needing Gemini 4 Argon: 15%. This criterion includes "Does it keep people in control of actions that affect external systems, money or private data?"
  - Clarity of pitch: 10%
- **Demo format:** a 3-minute live demo plus 2 minutes of Q&A, with no slides.
- **Projects to avoid** (disqualified or low-scoring):
  - "A basic chat wrapper or simple Q&A bot over a single PDF"
  - "An unverified medical diagnosis, mental health counselling or financial advice bot without human-in-the-loop safeguards"
  - "Anything built before kickoff"
- **Submission requirements:** a GitHub repo, a 3-minute demo video plus a live demo, and a statement of which Gemini models and agents were used.
- **Credits:** collected from the Google DeepMind team at kickoff. Onsite mentors are Amit Vadi and Geneviève Huskens.
- **SDK and API:** google-genai 2.3.0 or later, with the Interactions API (`client.interactions.create`) recommended.

**MongoDB bounty: "Build Anything, Change Everything with MongoDB Atlas"**
- **Requirements:** The app "must rely on a MongoDB Atlas database for its core functionality". It must use at least one of Atlas Search, Atlas Vector Search, Hybrid Search, Automated Embedding, Atlas Stream Processing and Voyage AI models. "The more of them you use, the more points you get." — [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)
- **Credit:** Every participant can collect a $100 Atlas credit at the MongoDB booth on the ground floor. MongoDB advises preparing a cluster in advance. — [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)
- **Submission requirements:** a GitHub repo and a 3-minute demo video "showing the app in action and MongoDB in use." — [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)
- **Prize conflict:**
  - The Encode programme page says "Prizes: To be announced."
  - Luma states a "£6,800 cash" prize pool.
  - Source: [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026), contradicted by [Luma](https://luma.com/encode-london-2026)

**Saint bounty: "Best Use of Saint AI Agent"** (see section 3)
- **Prize:** £200 cash for one winning team, a Saint for each team member, and 3 months of Saint free. — [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)

**Sponsors**
- Gold sponsors are Google DeepMind, MongoDB, Arc and Saint. Treg is also listed. — [Luma](https://luma.com/encode-london-2026); [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)

### Inferences
- **Fit with The Real World track:** A scam-protection tool for older adults fits as long as it reads real-world inputs. Examples are call audio, photos of letters or texts, and screenshots, checked against open or public data such as company registers or official warning lists. If the core is only a text chatbot, the project fits poorly and may fall into the DeepMind "chat wrapper" category.
- **Built-in pitch angle:** The "Responsibility" criterion (privacy, honesty about uncertainty) suits a scam-protection project that stores very little data and shows calibrated "likely scam" confidence instead of a definite verdict.
- **Fit with Agents That Ship:** This may be the better fit if the product takes actions, such as alerting a family contact, blocking a payment or drafting a report to the authorities, behind human approval.
- **Recommended strategy:** One project can be entered into one open track plus Gemini plus MongoDB. Live demo quality makes up 50% of the DeepMind score, so a reliable live demo matters more than breadth.
- **Disqualification risk:** The DeepMind ban on unverified "financial advice" bots without safeguards could apply to a scam advisor. The project needs explicit human-in-the-loop handling, for example "pause and call a trusted contact" instead of telling the user to pay or not to pay.

### Gaps
- No weightings are published for the two open tracks or for MongoDB.
- The MongoDB prize amount is in conflict (TBA versus £6,800 cash).
- Judges for the open challenges are not named.

## 3. What is "Saint" / "Saint AI by ENCODE"?

### Takeaway
**Verified:** Saint (saint.work) is a commercial "AI employee" product. It is run through WhatsApp and email, with its own email address and WhatsApp number, plus voice calls, web browsing and media generation. Its founder, Anthony Beaumont, is also listed as CEO of Encode Club, which explains the "Saint AI by ENCODE" association. At the hackathon, only **10 teams** get a Saint agent. Teams must sign up at the **Friday 6pm check-in**, and the agents are set up on **Saturday morning**.

### Cited Findings
- **Founder link:** The Encode guest list names "Anthony Beaumont — CEO @ Encode Club and Founder @ Saint.work". He runs the Friday 4pm Saint workshop, "Hiring your first AI employee". — [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)
- **Bounty description:**
  - "Saint is an AI colleague that works inside real email, calendars, documents, browsers and terminals. You give it a job in plain English and it gets on with it, then tells you what it did and asks before anything risky."
  - Source: [Encode programme page, Saint bounty](https://www.encodeclub.com/programmes/encode-london-2026)
- **Access at the event:**
  - "Teams going for this bounty get their own Saint AI agent for the whole hackathon."
  - "Only 10 teams get one, set up on Saturday morning, so tell us in the Friday 6pm check-in if you're in. Only sign up if you're serious about building with it."
  - Source: [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)
- **Existing integrations at Encode Hub:**
  - Saint runs the Hub's Sonos.
  - It orders snacks through Amazon and Costco.
  - It opens the front door from a WhatsApp chat.
  - Source: [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)
- **Challenge options:**
  - "Reverse-engineer something cool" by connecting Saint to a system that was never designed for an agent
  - build something that runs a space or community, or that makes Saint more powerful
  - "Dream up a business" and have Saint do the work
  - Source: [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)
- **What Saint judges look for:**
  - Cool factor
  - Working proof ("Saint actually doing the job in your demo… with the before and the after")
  - Real-world use ("would this still be running on Monday?")
  - Human control ("where it stops and asks first")
  - Source: [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)
- **Saint submission requirements:** "A 2–4-minute demo of Saint doing the thing, end to end," plus a note on what Saint was asked to do and which tools, devices and accounts it used. — [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)
- **Product site** ("Saint — Hire Your First AI Employee"):
  - Each Saint gets "a real email address and WhatsApp number".
  - Users can give it access to calendar, inbox, spreadsheets and CRM.
  - It handles admin, invoices, meetings and clients.
  - It is marketed to UK small businesses: estate agents, tradespeople, agencies and contractors.
  - Source: [saint.work](https://saint.work/)
- **Plans and pricing** (labelled early-access, 75% off):

  | Plan | Price | What's included |
  |---|---|---|
  | Part time | £49/month | 800 weekly credits; voice calls, WhatsApp and email; web browsing; image, video and music generation; "Build and publish websites with logins and databases" |
  | Full time | £99/month | 2,400 weekly credits |
  | Senior | £199/month | "Frontier intelligence" |
  | PrivateAI | From £699/month | On-premises hardware with local models |

  - Source: [saint.work](https://saint.work/)
  - A third-party aggregator lists the same prices. — [AI Agent Store](https://aiagentstore.ai/ai-agent/saint)
- **Similar names:** A web search for "Saint AI" + Encode Club turned up unrelated namesakes:
  - Saint AI Foundation (a nonprofit)
  - a confession app
  - saintai.eu (a construction AI consultancy)
  - an Amsterdam creative agency
  - Source: [search results incl. saintaifoundation.org](https://saintaifoundation.org/); [saintai.eu](https://saintai.eu/)
  - None of these is the Encode-linked Saint, so the team should not confuse them.

### Inferences
- **Fit for scam protection:** Saint already has a WhatsApp number, email, voice calls and an "asks before anything risky" behaviour. That could make it a natural "trusted second opinion" or family-alert agent: an older adult forwards a suspicious message to Saint on WhatsApp, and Saint checks it and alerts a relative. This is an inference. It has not been tested, and Saint's actual API, extensibility and limits are not documented publicly.
- **Conflict of interest:** Saint belongs to Encode's own CEO. The bounty is small (£200), and only 10 teams get access. Signing up means committing at the Friday 6pm check-in, before the team has hands-on access, and building around a tool that only arrives on Saturday morning. That is real schedule risk inside a 43-hour window.
- **Privacy:** Sending real older adults' messages through a third-party agent with inbox and WhatsApp access counts against the Real World "Responsibility" criterion unless the demo uses synthetic data.

### Gaps
- No public developer documentation, API, SDK or terms for programmatic access to Saint were found. No information was found on rate limits, which models it uses, or data retention.
- The privacy policy, terms and data processing agreement are linked from saint.work but were not read.
- Whether a team can enter the Saint bounty while also building its own codebase (for example, Saint as one part of a larger app) is not stated explicitly. The "make Saint more powerful" option suggests it can.

## 4. Sponsor resources: MongoDB offerings and Gemini credits, free tier and rate limits

### Takeaway
MongoDB offers a $100 Atlas credit per participant and points for each Atlas search or AI feature used. The Gemini bounty **requires Gemini 4 Argon, which has no free tier**, so the team needs the DeepMind credits handed out at kickoff. Companion Flash and Live models do have free tiers. However, free-tier content "is used to improve products", which matters for sensitive data about older adults. Google no longer publishes per-model free-tier RPM/TPM/RPD on the docs page; it points to AI Studio instead.

### Cited Findings
- **MongoDB at this event:** $100 Atlas credit per participant from the booth. Points scale with the Atlas features used (Vector, Atlas Search, Hybrid, Automated Embedding, Stream Processing, Voyage AI). Any of C, C++, C#, Go, Java, Kotlin, Node.js, PHP, Python, Ruby, Rust or Scala is accepted, and "AI tools: use any you like". — [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)
- **Gemini rate-limits page** (last updated 2026-10-15):
  - It gives no fixed free-tier or Tier 1 RPM, TPM or RPD figures. Limits "depend on a variety of factors", and the page links to the AI Studio rate-limit dashboard.
  - Spend caps per 10 minutes: Free N/A, Tier 1 $10, Tier 2 $50, Tier 3 $200.
  - Moving from the free tier to Tier 1 requires setting up billing and is "typically instant".
  - Preview and experimental models have "more restrictive limits".
  - Source: [ai.google.dev rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- **Gemini pricing page** (last updated 2026-10-22). Prices are paid Standard tier, USD per 1M tokens:

  | Model | Free tier | Paid price |
  |---|---|---|
  | Gemini 4 Argon | **No** | $2 in / $10 out until 30 Nov 2026; $4 / $20 from 1 Dec 2026 |
  | Gemini 3.8 Flash | Yes | $0.75 in / $3.75 out; doubles from 1 Jan 2027 |
  | Gemini 3.5 Flash-Lite | Yes | $0.30 in / $2.50 out |
  | Gemini 2.5 Flash | Yes | $0.30 in / $2.50 out |
  | Gemini 3.8 Live (Live API) | Yes | Audio in $3.00/M (about $0.005/min); audio out $12.00/M (about $0.018/min) |
  | Gemini 3.5 Transcribe Live | Yes | Not recorded in these notes |
  | Gemini 2.5 Flash Native Audio (Live) | Yes | Not recorded in these notes |
  | Gemini Embedding 2 | Yes | $0.20/M text |
  | Gemma 4 | Free tier only | Not offered on paid tier |

  - Source: [ai.google.dev pricing](https://ai.google.dev/gemini-api/docs/pricing)
- **Free-tier data use:** The pricing page's "Used to improve our products" row is **Yes** for free tiers and **No** for paid tiers. — [ai.google.dev pricing](https://ai.google.dev/gemini-api/docs/pricing)
- **DeepMind API rules for Argon:**
  - Use `thinking_level` instead of `thinking_budget`.
  - Remove temperature, top_p and top_k.
  - Set `background=True` to generate more than 65,536 tokens.
  - Source: [Encode programme page](https://www.encodeclub.com/programmes/encode-london-2026)

### Inferences
- **Credits and key setup:** Real call audio or scam texts, even synthetic examples, should run on a paid or credit-funded key. Event credits likely make the key "paid" and avoid free-tier training use, but that has not been verified.
- **Bounty compliance:** To qualify for the DeepMind bounty, Argon has to sit in the core path, for example as orchestrator or reasoning model. A Live model such as gemini-3.8-live can handle the real-time call-listening layer.
- **Live API cost:** About $0.005 per minute of input audio, which is negligible for a demo.

### Gaps
- Exact free-tier RPM, TPM and RPD per model could not be retrieved, because the docs defer to the AI Studio dashboard, which requires a login.
- It is not documented whether the event-issued Gemini credits put a project on a paid tier (no training use) or come as a pre-provisioned account.
- MongoDB's general hackathon prize norms (for example, a "best use of Atlas" pattern at other events) were not researched beyond this event's brief.

## 5. Past Encode winners, scam or fraud-related hackathon projects, and what judges reward

### Takeaway
Recent Encode AI winners are projects that applied AI to a concrete, real-world domain and demoed working end to end: chemistry tracing, wildlife conservation, genomics, and sign-language accessibility for deaf children. Generic tools did not win. No Encode winner focused on scams was found. One non-Encode scam-awareness project for older adults (HughKnew) won a 2026 hackathon. Scam protection is therefore a recognisable theme, and the team needs a clear angle to stand out.

### Cited Findings
- **AI London 2026** (Encode Hub, 20 to 22 March 2026):
  - Overall: 1st ChemTrace, 2nd RangerAI, joint 3rd Genomebook and SignQuest.
  - Civic bounty: 1st FixFlow, 2nd PhotoPal, 3rd RangerAI.
  - Source: [Encode AI London 2026 programme page](https://www.encodeclub.com/programmes/ai-london-2026); [Encode blog recap](https://www.blog.encode.club/ai-london-hackathon-conference-2026-969e6dcf7cb4)
- **AI London 2026 scale and finalists:** The recap reports "300+ builders". The top 5 finalists covered "AI agents that reproduce biologically, to wildlife conservation pipelines, scientific research automation, and accessibility tools for children with hearing disabilities." — [Encode blog recap](https://www.blog.encode.club/ai-london-hackathon-conference-2026-969e6dcf7cb4)
- **AI London 2026 judging process:**
  - Judges shortlisted top projects to pitch on stage for 3 minutes.
  - AI Agents criteria were Autonomy, Usefulness, Technical depth and Creativity.
  - Prizes "take into account team size and the strength of the field."
  - Source: [Encode AI London 2026 programme page](https://www.encodeclub.com/programmes/ai-london-2026)
- **Encode's first AI hackathon (March 2024):** Winners were Sign-chan, EduAction and RAGnarok. — [Encode Club on X](https://x.com/encodeclub/status/1766900088889098309)
- **Encode London 2025 (October):** Per a search summary, the winners were KEYFLOW (1st), Drone Missions on Demand and Proof of Pain. This was **not verified against a primary page**. The available sources ([Envio blog](https://docs.envio.dev/blog/encode-london-2025)) cover sponsor-specific winners only.
- **Scam-related comparison project:** HughKnew, a weekend hackathon project that won "Clawckathon 2026". It trains families and older adults to recognise AI voice-clone "grandchild" scams through simulated calls. The source is a vendor case study, the claims are unverified, and the project is not confirmed as UK-based. — [Resemble.ai](https://www.resemble.ai/resources/could-you-tell-your-grandsons-voice-from-a-clone-of-it-hughknew-was-built-to-find-out-safely)
- **Commercial UK prior art:** CallGuard by Phonely analyses calls for scam phrases and alerts a "trusted person" through an app. — [Today's Wills and Probate](https://todayswillsandprobate.co.uk/company-creates-cutting-edge-ai-product-to-protect-elderly-targets-of-phone-scammers-after-fraud-incidents-lead-to-death-and-residential-care/)

### Inferences
- **What the published criteria reward:** Across this event's briefs, judges reward:
  - a named real user
  - a working live demo on real or messy inputs
  - human-in-the-loop control over risky actions
  - privacy and honesty about uncertainty
  - (for sponsors) deep use of the sponsor's technology
- **Implications for an older-adult scam project:**
  - Do not pitch "call listener plus alert trusted contact" as new. CallGuard and HughKnew already do it.
  - Instead, stand out through The Real World framing: reading physical letters, texts and calls, plus checks against UK open data.
  - Show a strong live demo on synthetic scam samples.
  - Show visible uncertainty handling.
- **Three-day scope calibration:** About 43 build hours. A good scope is one sharp end-to-end flow, roughly input → analysis with confidence → human-approved action, recorded in a 2 to 4 minute video before Sunday noon. A multi-channel platform is too much for that window.

### Gaps
- No public one-line descriptions were found for ChemTrace, RangerAI, Genomebook, SignQuest or FixFlow. Their domains are inferred only from the blog's summary of finalist themes.
- Encode London 2025 overall winners and their judging criteria could not be confirmed on a primary source.
- No UK hackathon winner focused on scams or fraud was confirmed.
