# Safety, privacy, legal and AI-failure risks: LLM scam analysis for older adults with trusted-contact alerts (UK)

All sources accessed 2026-10-23 unless stated. UK law unless labelled otherwise. Nothing here is a statement of compliance. Items marked "LEGAL Q" need review by a qualified UK data protection or communications lawyer.

## 1. UK data protection (UK GDPR / DPA 2018 as amended by the Data (Use and Access) Act 2025)

### Takeaway
A DPIA is almost certainly needed: the ICO's own high-risk list names innovative technology including AI and vulnerable individuals (it explicitly cites elderly people), and the product also involves invisible processing of third-party senders and possible special category inferences. DUAA 2025 commencement status for specific provisions (recognised legitimate interests, ADM changes) is reported inconsistently by secondary sources and must be checked against legislation.gov.uk before relying on it.

### Cited Findings
- ICO list of processing "likely to result in high risk" includes: innovative technology (the ICO says this includes "artificial intelligence, machine learning and deep learning"), data matching, invisible processing (where Article 14 privacy information is impossible or disproportionate), tracking, targeting children or other vulnerable individuals, and risk of physical harm — [ICO: When do we need to do a DPIA?](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/when-do-we-need-to-do-a-dpia/)
- The same ICO page cites "elderly people" among vulnerable individuals, and lists the EDPB/WP248 criteria (systematic monitoring, sensitive/highly personal data, vulnerable data subjects, innovative technology, etc.); two criteria together usually indicate a DPIA is needed, and one can be enough — [ICO DPIA page](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/when-do-we-need-to-do-a-dpia/)
- The ICO DPIA page carries a notice that it is under review because of the Data (Use and Access) Act and may change (no page date shown) — [ICO DPIA page](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/when-do-we-need-to-do-a-dpia/)
- ICO position: inferred information can be special category data depending on whether the inference is intentionally drawn or someone is intentionally treated differently because of it; the guidance no longer treats the certainty of the inference as a relevant factor — [ICO: Special category data](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/special-category-data/)
- ICO: where payments are made to or from organisations such as health organisations or trade unions, special-category details may be inferable; financial information by itself is not special category data — [ICO: Special category data](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/special-category-data/); [ICO innovation advice: previously asked questions](https://ico.org.uk/for-organisations/advice-and-services/innovation-advice/previously-asked-questions/) (older Q&A uses a "reasonable degree of certainty" test that conflicts with the newer page; treat as possibly superseded)
- Processing special category data needs both an Article 6 lawful basis and a separate Article 9 condition — [ICO: What are the rules on special category data?](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/special-category-data/what-are-the-rules-on-special-category-data/)
- DUAA 2025 (secondary sources, not verified on legislation.gov.uk): most substantial data protection reforms reported as commenced 5 February 2026 (Commencement No. 6 Regulations); recognised legitimate interests removes the balancing test for listed purposes but the necessity test and right to object remain; solely automated decisions permitted with safeguards (representations, human intervention, challenge), with the stricter rule mainly kept for significant decisions based on special category data; complaints-handling duty reported for 19 June 2026 — [digit.fyi](https://www.digit.fyi/ico-issues-guidance-as-duaa-2025-enacted/); [Clyde & Co](https://www.clydeco.com/en/insights/2025/07/the-data-use-and-access-act-2025); [Trowers & Hamlins](https://www.trowers.com/insights/the-data-use-and-access-act-2025). An earlier (Nov 2025) source said the recognised legitimate interests provisions were not yet in force — sources conflict.
- International transfer to US: The Data Protection (Adequacy) (United States of America) Regulations 2023 (SI 2023/1028), in force 12 October 2023 ("UK-US data bridge"), cover transfers only to US organisations certified to the Data Privacy Framework and its UK Extension; the ICO flagged risks, including the need to clearly specify sensitive data transfers — [Dechert](https://www.dechert.com/knowledge/onpoint/2023/9/bridge-over-troubled-data-flows--uk-us-data-bridge-approved.html); [DAC Beachcroft](https://www.dacbeachcroft.com/en/articles/2023/october/the-uk-us-data-bridge-and-the-implications-for-transatlantic-data-transfers/); [Doyle Clayton](https://doyleclayton.co.uk/resources/news/personal-data-transfers-uk-us-data-bridge-opens-on-12-october)

### Inferences
- Lawful basis for the older adult's own data: consent or legitimate interests are the obvious candidates, but consent from someone whose capacity may fluctuate, possibly set up by a family member, is fragile. Contract (providing the service they signed up for) may also be arguable. LEGAL Q.
- Third-party senders (scammers, but also genuine friends, GP surgeries, banks) never receive privacy information; this matches the ICO's "invisible processing" item. Analysing a GP appointment text or a debt letter can create health or financial inferences. Minimise by not storing raw content and not producing persistent per-sender profiles.
- Alerts to the trusted contact disclose the older adult's communications content to a third party; each alert is a separate disclosure needing a basis and clear upfront transparency.
- Whether Google is a processor or (for any abuse logging) an independent controller, and whether Google LLC's transfers rely on the UK data bridge or IDTA/Addendum, needs checking in Google's data processing terms. LEGAL Q.

### Gaps
- Could not confirm on legislation.gov.uk which DUAA 2025 provisions are in force as of 2026-10-23, or whether final ICO guidance on recognised legitimate interests and the AI/ADM code has been published.
- Did not retrieve ICO "Guidance on AI and data protection" text in this session; cite it directly when writing up.
- No ICO guidance found specifically on consumer apps monitoring an adult's communications at a relative's request.
- Current status of the UK-US data bridge after 2023 not verified.

## 2. Communications law: IPA 2016, PECR, Ofcom

### Takeaway
The Investigatory Powers Act 2016 makes intentional interception of a communication in the course of transmission on a public telecoms system, without lawful authority, an offence. Consent from just one party is not lawful authority on its own. Section 44 needs both sender and recipient to consent, or one party's consent plus a RIPA Part 2 surveillance authorisation, which a consumer app cannot get. Live call listening, call forwarding to an analysis service, and server-side mailbox scanning all need specialist legal review before building.

### Cited Findings
- s.3 IPA 2016: offence to intentionally intercept a communication in the course of its transmission via a public telecommunication system (or private system / public postal service) in the UK without lawful authority; previously a RIPA offence — [legislation.gov.uk s.3](https://www.legislation.gov.uk/ukpga/2016/25/section/3); [Explanatory notes](https://www.legislation.gov.uk/ukpga/2016/25/notes/division/6/index.htm)
- s.3 exception for private systems: no offence where the person has a right to control the system's operation or use, or acts with that controller's express or implied consent. This applies to private systems only, not public telecoms — [legislation.gov.uk s.3](https://www.legislation.gov.uk/ukpga/2016/25/section/3)
- s.4 IPA 2016: interception = a "relevant act" (modifying/interfering with the system, including attaching apparatus, or monitoring transmissions) that makes content available "to a person who is not the sender or intended recipient". Making content available includes diverting or recording it so it can be accessed later. The "relevant time" includes any time the communication is stored in or by the system, before or after transmission — [legislation.gov.uk s.4](https://www.legislation.gov.uk/ukpga/2016/25/section/4)
- s.44 IPA 2016: interception is authorised if "the sender and the intended recipient of the communication have each consented to its interception", or if the communication is sent by or to a consenting person and surveillance by that interception is authorised under RIPA Part 2 (or the Scottish equivalent) — [legislation.gov.uk s.44](https://www.legislation.gov.uk/ukpga/2016/25/section/44)
- Ofcom: suspicious texts go to 7726 (free; lets the mobile provider investigate and block); messages from apps such as WhatsApp usually cannot be forwarded to 7726 and should be reported in-app; scam calls go to Report Fraud (0300 123 2040), or Police Scotland on 101 in Scotland; Ofcom itself takes reports of silent/abandoned calls (0300 123 3333) — [Ofcom: What to do about a scam call, text or message](https://www.ofcom.org.uk/phones-and-broadband/scam-calls-and-messages/what-to-do-about-a-scam-call-text-or-message); [Ofcom 7726 guide](https://www-bau.ofcom.org.uk/topic-and-subtopics/phones-and-broadband/scam-calls-and-messages/7726-reporting-scam-texts-and-calls)

### Inferences
- A user who records or pastes their own call, or forwards a message they've already received, to the app is lower risk: the content is already with the intended recipient. Whether the app or the LLM provider then becomes "a person who is not the sender or intended recipient" at a "relevant time" (stored "in or by the system") is the key question. LEGAL Q.
- A service that joins or diverts a live call (call-forwarding, conference bridge, or carrier integration) and streams audio to a cloud LLM looks most like s.4 "monitoring transmissions" or "diverting". The caller (the scammer or anyone else) has not consented, so s.44(1) does not apply. Highest legal risk; treat as a stop condition until a lawyer advises.
- Reading an email mailbox via API (stored communications) may also fall within "stored in or by the system". LEGAL Q.
- On-device analysis after receipt (OS-level, no third-party transmission) is likely lower risk, but this is not established.

### Gaps
- PECR: not researched in this session. Open points: whether PECR confidentiality rules (and the DUAA-raised PECR penalties) apply to a service that processes call/message content or traffic data, and the rules on any marketing texts or emails the app sends to the trusted contact. LEGAL Q.
- No authoritative UK guidance found on the "personal recording by one party" position for consumer apps. The common view that a party may record their own calls for personal use was not verified from a primary source here.
- Ofcom General Conditions relevance (only if the service becomes a communications provider) not researched.

## 3. LLM-specific failure modes and evidence on LLM scam/phishing detection

### Takeaway
Published evaluations show high headline accuracy on curated datasets but recurring weaknesses relevant here: low recall on phone-scam transcripts, sensitivity to rephrasing, inflated false positives when LLMs are used as standalone classifiers, failure to follow output format, and hallucination. Prompt injection inside analysed content is an OWASP #1 risk with "no confirmed foolproof prevention". So the system must never present "this looks safe" as a guarantee, and must never let the model write phone numbers or URLs.

### Cited Findings
- OWASP LLM01:2025 Prompt Injection: indirect injection happens when the model ingests external content (web pages, files) carrying instructions, which may be invisible to humans; scenario #5 is an LLM email assistant exploited via injected prompts to access sensitive info and alter email content; scenario #2 is hidden instructions inserting an attacker URL to exfiltrate conversation data. Mitigations: constrain behaviour via system prompt; define and validate output formats with deterministic code; filter inputs and outputs; least privilege (privileged functions in code, not exposed to the model); human approval for high-risk actions; segregate and label untrusted content; regular adversarial testing. OWASP states there is no confirmed foolproof prevention — [OWASP GenAI LLM01](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- Google (June 2025) describes indirect prompt injection via emails, documents and calendar invites. Its layered defences for Gemini: adversarial training of Gemini 2.5, prompt-injection classifiers, security-reinforcement prompting, markdown sanitisation with suspicious-URL redaction, user confirmation steps, and end-user notifications — [Google blog: Mitigating prompt injection attacks](https://blog.google/security/mitigating-prompt-injection-attacks/); [Google Security Blog June 2025](https://security.googleblog.com/2025/06/); [Workspace admin article](https://knowledge.workspace.google.com/admin/security/indirect-prompt-injections-and-googles-layered-defense-strategy-for-gemini) (details from excerpts; full pages not read)
- Shen et al., "Combating Phone Scams with LLM-based Detection: Where Do We Stand?" (arXiv 2409.11643, Sep/Oct 2024): names biased datasets, "relatively low recall" and hallucinations as unresolved challenges for real-time phone-scam detection — [arXiv 2409.11643](https://arxiv.org/abs/2409.11643)
- arXiv 2411.13874 ("Next-Generation Phishing"): on LLM-rephrased phishing emails GPT-4 kept the highest accuracy; Gemini struggled with rephrased emails, especially zero-shot — [arXiv 2411.13874](https://arxiv.org/pdf/2411.13874) (via search summary)
- PhishDebate (arXiv 2506.15656, websites): GPT-4o 96.5% accuracy, 5.2% FPR; Gemini-2.0 had the highest TPR (99.2%) but failed to follow the binary output instruction 8 times; counting those as errors raised its FPR to 14.4% — [arXiv 2506.15656](https://arxiv.org/pdf/2506.15656) (via search summary)
- arXiv 2511.09606: across 19,131 phishing and 243 benign sites (heavily imbalanced), GPT detected 93.86%; false negatives mainly come from missing phishing signals, and false positives from sensitivity to requests for data — [arXiv 2511.09606](https://arxiv.org/html/2511.09606v2) (via search summary)
- arXiv 2601.21261: LLMs used as standalone classifiers "often yield elevated false-positive rates"; RAG cut Llama4-Scout's FPR from 12% to 4% (open-source models only) — [arXiv 2601.21261](https://arxiv.org/html/2601.21261v1) (via search summary)
- arXiv 2511.15165: Gemini 2.5 Pro had the highest zero-shot accuracy on one benchmark, while GPT-4o reached FNR 99.8% on one subset. Results vary widely by dataset — [arXiv 2511.15165](https://arxiv.org/pdf/2511.15165) (via search summary)
- Older ChatGPT phishing-site work (arXiv 2306.05816, 2023); the related ChatSpamDetector reported 99.70% accuracy for GPT-4 but excluded emails without links — [arXiv 2306.05816](https://arxiv.org/pdf/2306.05816) (via search summary)
- arXiv 2506.06180 builds an adversarial set of scam-like benign transcripts to test detectors' false positives; arXiv 2502.03964 is an HCI study of real-time LLM phone-scam warnings — [arXiv 2506.06180](https://arxiv.org/pdf/2506.06180); [arXiv 2502.03964](https://arxiv.org/html/2502.03964v1) (via search summary)

### Inferences
- Benchmark accuracy doesn't transfer: the datasets are mostly websites or emails with links, often imbalanced, mostly not UK and not elderly-targeted, and they rarely test conversational authorised-push-payment (APP) and impersonation scams or adversarial rephrasing. Expect worse real-world recall.
- "Looks safe" false negatives are the most dangerous output for this user group: they can actively reassure someone into paying. Design so the app never certifies a message as safe. Use "no warning signs found; if it asks for money, codes or urgency, call your bank via 159 or the number on your card".
- False positives (bank, GP, delivery texts) lead to alert fatigue for the trusted contact and to embarrassment or loss of autonomy for the older adult; the evidence above shows FPR rising with format failures and with standalone classification.
- Prompt injection in analysed content can flip the verdict to "safe" or plant a callback number; treat all analysed content as untrusted, use structured JSON output validated in code, and take every phone number and URL shown to the user from a hard-coded verified list, never from model output.
- Calibration: none of the papers found evaluate calibrated confidence. Use coarse categories and abstain or escalate when unsure, rather than giving percentage scores.
- The OWASP 2025 list also has entries on misinformation and improper output handling; these were not fetched this session. Verify before citing.

### Gaps
- No elderly-specific or UK-specific LLM scam benchmark found.
- No peer-reviewed measurement found of LLMs hallucinating phone numbers or URLs in scam-advice contexts; that risk rests on general hallucination findings (e.g., arXiv 2409.11643) plus the OWASP URL-injection scenario.
- Several papers were read only via search summaries; numbers should be checked against the PDFs before publication.

## 4. Gemini API data terms and MongoDB Atlas

### Takeaway
Under the Gemini API terms (last updated 2026-04-28), Unpaid Services data may be used to improve Google products and be read by human reviewers. Developers serving users in the EEA, Switzerland or UK may use only Paid Services, and the Paid data terms apply even to unpaid quota for those users. Paid Services still log prompts for abuse detection for an unspecified "limited period". The terms also bar use for medical advice and say not to rely on the services for financial or legal advice.

### Cited Findings
- Unpaid Services: Google uses submitted content and responses "to provide, improve, and develop" its products and ML technologies; "human reviewers may read, annotate, and process your API input and output"; "Do not submit sensitive, confidential, or personal information to the Unpaid Services." — [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
- Paid Services: prompts and responses are not used to improve products. Google "logs prompts and responses for a limited period of time, solely for detecting and preventing violations" of the Prohibited Use Policy (no period stated). Grounding with Google Search stores prompts, context and output for 30 days — [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
- EEA/Switzerland/UK: "You may use only Paid Services when making API Clients available to users in the European Economic Area" (Switzerland and UK also named); Paid data-use terms apply to all Services, including AI Studio and unpaid quota, for users in these regions — [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
- Must be 18+; may not be used in API clients directed at or likely accessed by under-18s; no use "in clinical practice, to provide medical advice"; "Don't rely on the Services for medical, mental health, legal, financial, or other professional advice." Page "Last updated 2026-04-28 UTC" — [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms)
- Project logs (billing-enabled projects only) are kept for a default maximum of 55 days, configurable in AI Studio to 7/14/28/55 days. These are separate from abuse-monitoring logs. Datasets that users choose to share may be used to train models and seen by human reviewers. An invite-only "Contributor Tier" gives up to 50% off token costs in exchange for data use — [Gemini API logs policy](https://ai.google.dev/gemini-api/docs/logs-policy)
- MongoDB Atlas: AES-256 encryption at rest by default (provider-managed keys, cannot be disabled); optional customer-managed keys via AWS KMS / Google Cloud KMS / Azure Key Vault using envelope encryption; revoking the key makes the data unreadable; Client-Side Field-Level Encryption and Queryable Encryption decrypt only on the client — [MongoDB Atlas data encryption](https://mongodb.com/docs/atlas/architecture/current/data-encryption)

### Inferences
- Never ship this product on the free tier or AI Studio free keys. Turn off project logging or set it to the minimum, never share datasets, and never join the Contributor Tier.
- Because the Paid abuse-logging period is unstated, the DPIA and privacy notice can't give users a precise retention period for content sent to Google. Seek contractual clarification or a zero-retention option. LEGAL Q.
- "Not financial advice" in Google's terms means the app's own advice text should be fixed and drawn from official sources, not generated.
- Use Atlas CSFLE or Queryable Encryption for any stored message excerpts or contact details, plus a UK region (not verified to exist; see Gaps).

### Gaps
- Not verified whether Gemini API offers zero data retention, a UK or EEA processing region, or which Google entity is processor for UK users (Google Cloud Vertex AI terms may differ from ai.google.dev; not researched).
- Atlas UK region availability and data-residency guarantees not confirmed in this session.

## 5. Wrong-contact alerts, financial exposure, coercive control, and Care Act safeguarding

### Takeaway
Care Act 2014 s.42 puts the safeguarding enquiry duty on local authorities, not on consumer app providers. But its definition of abuse expressly includes financial abuse, including by people in a position of trust. A "trusted contact" feature can itself become a tool for financial abuse or coercive control, so it needs design-level safeguards.

### Cited Findings
- Care Act 2014 s.42: the duty to make enquiries falls on the local authority, for an adult in its area who (a) has care and support needs, (b) is experiencing or at risk of abuse or neglect, and (c) because of those needs cannot protect themselves. "Abuse" includes financial abuse: theft of money or property, being defrauded, being put under pressure over money or property, and misuse of money or property — [legislation.gov.uk Care Act 2014 s.42](https://www.legislation.gov.uk/ukpga/2014/23/section/42)

### Inferences
- The app is not a statutory safeguarding body. It could still signpost: "if you think someone is being financially abused, contact the local council's adult social care team". Exact wording should come from official sources.
- Risks from the trusted contact:
  - The contact may be the abuser: family members can commit financial abuse.
  - Alerts may reveal bank names, amounts or account fragments.
  - The contact may use the feature to monitor or control.
  - An ex-partner or estranged relative may remain registered as the contact.
- Mitigations:
  - The older adult chooses the contact and confirms it periodically.
  - The older adult can pause or remove the contact without the contact being notified, or after a delay.
  - Alerts carry minimal content: risk level and category, not the message text or financial details.
  - The older adult is told whenever an alert is sent.
  - The contact cannot read message history.
  - The contact's number is verified with a confirmation code at setup.
- Wrong-contact risk: a typo or recycled number sends alerts to a stranger, which is a personal data breach.
- Capacity: where the user lacks capacity, a lasting power of attorney or deputyship may matter. The Mental Capacity Act 2005 was not researched (LEGAL Q).

### Gaps
- Not researched: Mental Capacity Act 2005, statutory guidance on Care Act safeguarding (Care and Support Statutory Guidance ch.14), or whether coercive or controlling behaviour offences (Serious Crime Act 2015 s.76) are relevant to app design. Flag for review.
- No official UK guidance found on consumer "trusted contact" scam tools. The FCA's trusted-contact concept for financial firms was not researched.

## 6. Verified UK escalation and reporting channels (official sources only)

### Takeaway
Action Fraud has been replaced by **Report Fraud** (reportfraud.police.uk, 0300 123 2040), which soft-launched 4 December 2025 with full public launch in January 2026, covering England, Wales and Northern Ireland; Scotland reports to Police Scotland on 101. Other channels confirmed on official or charity sources: 7726 (texts), report@phishing.gov.uk (emails), 159 (your bank), Age UK Advice Line 0800 678 1602.

### Cited Findings
- Report Fraud replaces Action Fraud and the National Fraud Intelligence Bureau. It has three parts: a contact centre and online reporting, a National Crime Analysis Service, and a Victim Service. Website reportfraud.police.uk; phone 0300 123 2040 (unchanged). Covers England, Wales and NI; Scotland via Police Scotland on 101. Soft launch December 2025, full public launch January 2026; Action Fraud redirects kept for at least six months — [City of London Police](https://www.cityoflondon.police.uk/news/city-of-london/news/2025/december/report-fraud-service-goes-live-with-full-public-launch-in-january-2026/); [techUK](https://www.techuk.org/insights/news/report-fraud-service-replaces-action-fraud-as-uk-s-official-fraud-reporting-portal)
- NCSC: forward suspicious emails to report@phishing.gov.uk; "Don't click on any links in a suspicious email"; if money was lost, report to Report Fraud (https://www.reportfraud.police.uk/, 0300 123 2040) or Police Scotland on 101; do not report crimes to the NCSC this way. The fetched page obfuscates the address in its text — NCSC's established address, verify on the live page — [NCSC: Report a scam email](https://www.ncsc.gov.uk/collection/phishing-scams/report-scam-email)
- 7726: forward suspicious texts free so the mobile provider can investigate and block. Mobile call numbers can be texted to 7726 too — [Ofcom](https://www.ofcom.org.uk/phones-and-broadband/scam-calls-and-messages/what-to-do-about-a-scam-call-text-or-message); [NCSC: report scam text](https://www.ncsc.gov.uk/collection/phishing-scams/report-scam-text-message)
- 159: you dial it yourself to reach your own bank's fraud team; it never calls you. It is usually charged at national rate and works on major networks (BT/EE, O2, Sky, Three, Vodafone, TalkTalk, Virgin Media, etc.). Participating banks include Barclays, HSBC, Lloyds, Halifax, Nationwide, NatWest, Santander, Monzo, Starling, Revolut and others. If your bank is not on the list, use the number on your card — [Stop Scams UK: 159](https://www.stopscamsuk.org.uk/159)
- Age UK: Advice Line 0800 678 1602, free, "open 8am-7pm, 365 days a year"; forward texts to 7726; use 159 or the number on the back of your bank card; TPS registration is free (text "TPS" and your email to 85095 for mobiles); free call blockers for the most vulnerable via doctor, Trading Standards or council referral. Page last updated 19 Aug 2026; older Age UK material lists 0800 169 65 65 (superseded) — [Age UK: Phone scams](https://www.ageuk.org.uk/information-advice/money-legal/scams-fraud/phone-scams/)
- Age Scotland, Age Cymru and Age NI run their own advice numbers — [Age UK scams advice](https://www.ageuk.org.uk/information-advice/money-legal/scams-fraud/)
- Ofcom: silent/abandoned calls to Ofcom on 0300 123 3333; WhatsApp and similar app messages should be reported in-app — [Ofcom](https://www.ofcom.org.uk/phones-and-broadband/scam-calls-and-messages/what-to-do-about-a-scam-call-text-or-message)

### Inferences
- Hard-code these channels in a reviewed config with source URL and last-verified date, and re-verify quarterly. The Action Fraud to Report Fraud change shows numbers and brands do change.
- Country routing is needed: Report Fraud does not cover Scotland, and Age UK's line is for England.
- The 999 advice for a crime in progress was not verified from an official source in this session. Wording should come from police.uk before use.

### Gaps
- 999 guidance wording for fraud in progress (e.g., someone at the door or a courier collecting cash) not retrieved from police.uk this session.
- Age Scotland, Age Cymru and Age NI numbers not retrieved.
- Report Fraud's own site (reportfraud.police.uk) not fetched directly; details come from City of London Police and NCSC.

## 7. Ethics and licensing of test data

### Takeaway
Use synthetic UK-style scam scenarios as the main test set, plus public corpora only after checking their licences. The UCI SMS Spam Collection's licence could not be confirmed in this session, and most phishing corpora are not UK-, voice- or elderly-specific.

### Cited Findings
- UCI SMS Spam Collection: 5,574 labelled SMS messages for spam research. Users are asked to cite Almeida, Gómez Hidalgo & Silva (2013). The readme has a LICENSE/DISCLAIMER section, but the licence terms were not retrieved — [UCI ML Repository #228](https://archive.ics.uci.edu/dataset/228/); [IBM Data Platform entry](https://dataplatform.cloud.ibm.com/exchange/public/entry/view/37d8b0ccf1abb870fde60a6ccde334d0)
- A public multimodal set of 100 aligned audio-transcript pairs of scam and benign calls (Turkish) evaluated seven LLMs; transcripts outperformed direct audio (authors Eren, Cheung, Zhang, Ngai, Fu; arXiv ID not confirmed) — [papers.cool listing](https://papers.cool/arxiv/2606.24523); [catalyzex](https://www.catalyzex.com/author/Arda%20Eren)
- arXiv 2506.06180 built adversarial "scam-like benign" transcripts, which are useful for false-positive testing — [arXiv 2506.06180](https://arxiv.org/pdf/2506.06180)
- Gemini logs policy advises "Do not include personal, sensitive, or confidential information" in shared datasets — [Gemini API logs policy](https://ai.google.dev/gemini-api/docs/logs-policy)

### Inferences
- Real messages forwarded by beta users are personal data of both the user and the sender. Don't build test sets from them without a lawful basis, de-identification and a retention limit.
- Synthetic sets should cover UK APP fraud types (bank or police impersonation, courier fraud, romance, investment, HMRC, delivery) and benign lookalikes (real bank and NHS texts), plus prompt-injection payloads embedded in messages.

### Gaps
- Licences for UCI SMS Spam, Enron-derived phishing sets, Nazario phishing corpus, and Kaggle mirrors are unverified.
- No UK-specific public scam corpus found.

## 8. Risk register seeds and legal questions for qualified review

### Takeaway
The highest-severity risks are live-call interception (legal), "looks safe" false negatives (harm), injected or hallucinated contact details (harm), and the trusted contact as abuser (safeguarding). Each needs a stop condition before launch. Rows below are inferences built on the findings above.

### Cited Findings
- Interception offence and consent rule: [IPA s.3](https://www.legislation.gov.uk/ukpga/2016/25/section/3), [s.4](https://www.legislation.gov.uk/ukpga/2016/25/section/4), [s.44](https://www.legislation.gov.uk/ukpga/2016/25/section/44)
- DPIA triggers: [ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/when-do-we-need-to-do-a-dpia/)
- Prompt injection, no foolproof fix: [OWASP LLM01](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- Low recall and hallucination: [arXiv 2409.11643](https://arxiv.org/abs/2409.11643)
- Gemini region and tier terms: [ai.google.dev terms](https://ai.google.dev/gemini-api/terms)
- Financial abuse definition: [Care Act s.42](https://www.legislation.gov.uk/ukpga/2014/23/section/42)

### Inferences
Risk register seeds (risk | severity | mitigation | residual | stop condition):
- Live call capture or forwarding to cloud LLM is unlawful interception | Critical | Do not build. Analyse only content the user deliberately shares after receipt; get specialist IPA advice | Unknown until advised | Any live-call feature without written legal advice
- "Looks safe" false negative leads to a payment | Critical | Never output "safe"; fixed advice to verify via 159 or the card number before paying; escalation biased towards recall; measure FNR on a UK synthetic set | Medium | FNR above an agreed threshold on test set, or any real-world loss linked to a "safe" message
- Model outputs a scammer's phone number or URL (injected or hallucinated) | Critical | Contact details only from a hard-coded verified list; strip or ignore numbers and URLs in model output; validate structured output | Low | Any model-generated number or URL reaching the UI in testing
- Prompt injection flips the verdict or leaks data | High | Untrusted-content delimiting, JSON schema validation, no tools or actions available to the model, adversarial test suite | Medium (no foolproof fix per OWASP) | Injection test pass rate below target
- False positives cause alert fatigue or loss of autonomy | Medium | Tiered alerts; user sees the reason first; send to contact only on high-risk categories with user notified | Medium | Contact-alert opt-out or complaint rate spikes
- Trusted contact is the abuser / coercive control | High | User-controlled contact, minimal-content alerts, no history access, periodic re-confirmation, safeguarding signposting | Medium | Any report of misuse by a contact; or the design requires the contact to see raw messages
- Wrong-contact alert (typo or recycled number) | High | Confirmation-code verification, periodic re-verification, minimal alert content | Low | Unverified contact able to receive alerts
- Third-party sender data, special category inferences, invisible processing | High | DPIA; no raw-content retention; no sender profiling; short TTL; privacy notice | Medium | DPIA not completed or residual high risk not resolved (ICO prior consultation)
- US transfer and Google abuse logging retention unknown | Medium | Paid tier only, logging off, check DPF/IDTA basis, contractual retention terms | Medium | Using free tier or AI Studio free keys for UK users (prohibited by terms)
- Stale reporting numbers (e.g., Action Fraud) | Medium | Config with source and verified date, quarterly re-check, country routing | Low | Any channel unverified for more than 90 days

LEGAL Qs for qualified review (not answered here):
1. Does analysing a call recording or transcript made by one party, or a received SMS or email, through a cloud LLM count as "interception" under IPA ss.3-4 (especially the "stored in or by the system" limb)? Does s.44 or any other lawful authority apply?
2. Is any live-call product design (call diversion, conference bridge, on-device streaming) lawful without both parties' consent?
3. Does PECR apply (confidentiality of communications or traffic data), and do the PECR penalty levels increased by DUAA 2025 apply?
4. What is the lawful basis for the older adult (consent, contract, legitimate interests or recognised legitimate interests), and for third-party senders' data? Is the DUAA recognised legitimate interests provision in force, and does any listed purpose (e.g., crime prevention or safeguarding vulnerable individuals) fit?
5. Is Article 9 engaged by health or financial-vulnerability inferences, and if so which condition applies?
6. What are the controller/processor roles for the app, Google and the trusted contact? Is the transfer basis for Google LLC the UK-US data bridge or IDTA?
7. Is there a duty to consult the ICO before launch if the DPIA residual risk stays high?
8. How should capacity, LPA and deputyship be handled when a relative sets up the service for someone who may lack capacity (Mental Capacity Act 2005)?
9. Does any safeguarding referral pathway or duty apply to a consumer app (Care Act 2014 s.42 duty is on local authorities)? Could the app be liable for negligent "safe" assessments?
10. Do Gemini API terms ("not for financial advice"), consumer protection law, or FCA perimeter rules restrict giving scam or payment-related guidance?

### Gaps
- Severity, residual-risk ratings and thresholds above are judgement-based, not sourced; they need agreement with the product owner and a legal reviewer.
