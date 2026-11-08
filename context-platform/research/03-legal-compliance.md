# 03 — Legal & Compliance Gates for the AI Context Platform

*Prepared 2026-11-08 by product counsel / compliance lead. This is practical product guidance, not legal advice. Engage qualified counsel in each jurisdiction before relying on it. Items marked **[unverified]** could not be confirmed against a primary or reliable source in this research pass. The web-search budget ran out before every item could be checked.*

---

## 0. Bottom line

1. **Google is the first hard gate.** `gmail.readonly` is a *restricted* scope. A multi-tenant app that stores email needs restricted-scope verification **plus** an annual CASA assessment (now AL1/AL2). Plan on 6–12 weeks and about $540–8k a year in lab fees, plus remediation work. The bigger risk is **policy fit**. Transfers must serve "user-facing features that are visible and prominent" in your UI, "with the user's consent". The policy now also asks apps to "granularly require users to confirm the MCP, tool, skill, or other agentic behavior invocation". A headless, org-wide pipe into arbitrary agents is exactly what reviewers question.
2. **Retrieval/RAG is allowed. Training generalized models is not.** You must never train or improve non-personalized models on Workspace data, including derived or anonymized data. That restriction flows down to every LLM sub-processor, so you need zero-data-retention and no-training terms.
3. **In the EU, the product is employee monitoring in law even if it is not marketed that way.** A DPIA is effectively mandatory. The lawful basis is legitimate interests, not consent. In Germany, co-determination under §87(1) no. 6 BetrVG applies wherever a tool is *objectively capable* of monitoring. French CSE consultation is required even for pilots: courts suspended AI rollouts in 2025. In practice, works-council readiness decides deal velocity.
4. **The AI Act is a contract-and-design problem, not yet a product-certification problem.** Annex III high-risk obligations moved to **2 December 2027** (Reg. (EU) 2026/1744). The platform is not high-risk if its intended purpose excludes performance or behaviour evaluation. Keep it that way by contract and by design.
5. **The most legally load-bearing control is permission-mirrored retrieval.** An agent may only see what the invoking human could already see in the source system. Without it, "org-wide email as context" becomes internal mass disclosure. Next come mailbox scoping, category exclusions, deletion propagation, audit export, and a contractual plus technical ban on HR or performance use.

---

## 1. Platform approval gates

### 1.1 Google Workspace

| Gate | What is required | Time / cost | Status |
|---|---|---|---|
| Restricted scope | `gmail.readonly`, `gmail.metadata`, `gmail.modify` and `mail.google.com/` are all **restricted** (Drive full-read and Chat message scopes are restricted too). "If you store restricted scope data on servers (or transmit), then you must go through a security assessment." ([Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)) | — | Verified |
| OAuth verification | Brand verification, then restricted-scope review. You must name an approved Gmail use case. | 4–8+ weeks per consultants ([Unipile](https://www.unipile.com/integrating-google-oauth-2-0-user-authentication-into-your-app/)) | Timeline is an estimate |
| CASA | Risk-based. "Applications are assigned to either the AL1 or AL2 assurance level"; "All applications must be revalidated every year" ([Google](https://support.google.com/cloud/answer/13465431?hl=en)). Google, not the developer, picks the level ([ADA](https://appdefensealliance.dev/casa/casa-tiering)). Expect **AL2** (lab-tested, covering app, infrastructure and data stores) for an app reading all mail across an org. | Lab fees run from about $540 (TAC Tier 2 basic) to $4.5–8k for lab-tested assessments; turnaround 1–6 weeks ([Switch Labs comparison, 2024 prices](https://switchlabs.dev/post/casa-tier-2-tier-3-security-review-providers-pricing-and-the-cheapest-option)). Remediation engineering is usually the larger cost. | Prices **[unverified for 2026]** |
| Limited Use disclosure | Your privacy policy must state that Workspace API data is not used to "develop, improve, or train generalized/non-personalized AI and/or ML models". An app that trains generalized models has its verification request **closed** ([Google](https://support.google.com/cloud/answer/13805798?hl=en)). | — | Verified |

**Distribution model, and what changes when a third party uses domain-wide delegation (DWD)**

- *Marketplace app with admin install (recommended).* Admin install grants scopes for the whole domain without per-user consent screens, but public apps using these scopes must still be verified ([Marketplace docs](https://developers.google.com/workspace/marketplace/authorizing)). Buyers' security teams also look for the CASA Letter. A lab-tested CASA result earns a Marketplace security badge ([Switch Labs](https://switchlabs.dev/post/casa-tier-2-tier-3-security-review-providers-pricing-and-the-cheapest-option)).
- *Vendor service account with DWD.* The customer pastes your client ID into Admin Console. This is the most powerful and least reviewable option, and many enterprise admins refuse to grant it to third parties. Google text quoted in forums says domain-wide install waives only *brand* verification: "if your app utilizes restricted or sensitive scopes, app verification is required." Whether CASA applies to a DWD-only app is **unresolved**; Google has not answered public questions on it ([forum](https://discuss.google.dev/t/does-oauth-app-verification-casa-apply-to-a-service-account-using-only-domain-wide-delegation-no-consent-screen-not-on-marketplace/395705)). **[unverified]** Don't build go-to-market on an exemption.
- *Customer-owned "internal" app.* Apps used only inside the org that owns the project are exempt from verification ([Google](https://support.google.com/cloud/answer/13464323?hl=en)), and admins can mark apps as trusted. This can unblock **design-partner pilots before verification**. The data policies still apply, and the exemption is weaker when the vendor hosts the data. **[grey zone]**

**Limited Use and AI: what is allowed** ([Workspace API User Data and Developer Policy](https://developers.google.com/workspace/workspace-api-user-data-developer-policy); [API Services User Data Policy, updated 15 Feb 2024](https://developers.google.com/terms/api-services-user-data-policy))

- **Allowed:** using data to provide "user-facing features that are visible and prominent" in your UI. Generative AI summaries are now an explicit Gmail example. Retrieval/RAG at query time fits here.
- **Prohibited:** using data "to create, train, or improve a machine learning or artificial intelligence model" beyond "that specific user's personalized model". This covers raw and derived data alike. Also prohibited: selling the data, ads, credit decisions, and transfers to brokers.
- **Transfers** are allowed only for a user-facing feature "and only with the user's consent", or for security, legal compliance, or M&A with prior consent. Sending context to the customer's ChatGPT, Claude or Gemini agent is a *transfer*, so you need clear consent and connection UX for each agent. LLM sub-processors must be bound to no-training and zero-retention terms.
- **Humans may not read data** except with the user's affirmative agreement for specific items, for security, for legal compliance, or in aggregated internal-ops form. This affects support, debugging and labelling workflows.
- **New agentic and MCP clauses (2025–26):** the policy now covers "MCPs, and other developer tools requesting access to user data". It asks apps to "granularly require users to confirm the MCP, tool, skill, or other agentic behavior invocation". It requires prompt-injection protection, via Google's Model Armor "or other prompt injection protection", and that you follow the MCP security best practices. OAuth tokens must be "encrypted at rest". I could not find the exact dates these clauses were added **[unverified]**.
- **Approved Gmail use cases** are email clients, backup, productivity enhancement (CRM, mail merge, AI summaries), and "reporting or monitoring services for the benefit of users." An org-wide feed to third-party agents is not a named category. Frame the product as user-benefiting productivity with a visible UI, never as employer monitoring.
- **Google APIs ToS §5(e):** do not "build databases, or otherwise create permanent copies" of API content "unless expressly permitted by the content owner" ([Terms](https://developers.google.com/terms)). Rely on the customer's express authorization in your MSA, and mirror source retention.

### 1.2 Microsoft 365

| Gate | Detail | Time / cost |
|---|---|---|
| Graph `Mail.Read` (application) | App-only permission. It needs tenant **admin consent** and by default reaches *every* mailbox. | — |
| Publisher verification | Requires a verified Microsoft AI Cloud Partner Program account. Since Nov 2020, under risk-based step-up consent, users can't consent to most unverified multi-tenant apps. Free, and takes "minutes" once prerequisites are met ([Microsoft](https://learn.microsoft.com/en-us/entra/identity-platform/publisher-verification-overview)). | Days |
| M365 App Compliance | Phase 1 is **Publisher Attestation**, a self-assessment against more than 80 risk factors. Phase 2 is **Microsoft 365 Certification**: an audited review that requires publisher verification and is renewed annually ([Microsoft](https://learn.microsoft.com/en-us/microsoft-365-app-certification/docs/userguide)). Not legally required, but enterprise Entra admins filter on it. | Attestation: 1–3 weeks of effort. Certification: 2–4 months; assessor cost **[unverified]** |
| **RBAC for Applications** (Exchange Online) | Grants `Application Mail.Read` scoped to a management scope or administrative unit, for Graph and EWS. "It replaces Application Access Policies." Critically, Entra and RBAC grants form a **union**. You must *remove* the tenant-wide Entra `Mail.Read` consent, or the scoping does nothing. Changes can take 30 minutes to 2 hours to apply ([Microsoft Learn, updated Oct 2026](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac)). | Customer admin setup; ship a runbook |
| Protected / metered APIs | Teams export APIs (`getAllMessages`) are **protected**: you must request access by form. They have been **unmetered since 25 Aug 2025**, but the `model=A/B` licensing parameter still applies ([Microsoft metered API FAQ](https://learn.microsoft.com/en-us/graph/metered-api-faq); [Teams licensing](https://learn.microsoft.com/en-us/graph/teams-licenses)). | Weeks |
| 2026 Product Terms | Third-party summaries report a July 2026 acceptable-use addition that bans scraping and "attempt[s] to circumvent the limitations Microsoft sets on the use of any APIs". A Sept/Oct 2026 Microsoft IQ / Work IQ section bars redistributing Work IQ data ([SAMexpert Jul](https://samexpert.com/microsoft-product-terms-july-2026/), [Oct](https://samexpert.com/microsoft-product-terms-october-2026/)). Use supported Graph endpoints within throttling limits. **[secondary source only]** | Watch item |

EWS retirement in Exchange Online, reported from October 2026: build on Graph only. **[unverified]**

### 1.3 Slack

The 2025 change is real, and it is the most restrictive of the three platforms:
- **API Terms (effective 10 Oct 2025 version):** for data from the Data Access and Real-time Search APIs, "you may not create persistent copies, archives, indexes, or long-term data stores". Bulk export is prohibited "except where expressly allowed by an additional agreement". You may not "use API Data to train a large language model" or "use data collected from one organization to directly benefit a different organization" ([Slack API ToS](https://slack.com/terms-of-service/api)).
- **Rate limits:** from 29 May 2025, *new* commercially distributed non-Marketplace apps get 1 request per minute and 15 objects per call on `conversations.history` and `conversations.replies`. Marketplace and internal customer-built apps are unaffected ([Slack changelog](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps)).
- **Replacement path:** the Real-time Search API and Slack MCP server (announced 17 Feb 2026) query live "without storing customer information on external servers" ([Slack](https://docs.slack.dev/changelog/2026/02/17/slack-mcp)). Glean rebuilt its connector this way ([Glean](https://docs.glean.com/connectors/native/slack-rts/home)).
- **Implication:** "ingest and index" is not available for Slack. Plan on a federated, query-time connector listed in the Marketplace.

---

## 2. Privacy and employment law

### 2.1 GDPR / UK GDPR (customer = controller, vendor = processor)

| Topic | Position | Product or contract consequence |
|---|---|---|
| **Lawful basis** | Legitimate interests (Art. 6(1)(f)), backed by a documented legitimate interests assessment (LIA). Consent is generally invalid in employment because of the power imbalance, as the ICO and EDPB both say ([ICO monitoring guidance, Oct 2023, via commentary](https://www.insideprivacy.com/data-privacy/uk-information-commissioners-office-releases-rew-guidance-for-monitoring-at-work/)). Germany: the BAG reportedly held §26(1) sentence 1 BDSG inapplicable after CJEU C‑34/21, so employers rely on GDPR Art. 6 directly ([secondary](https://nexvyra.de/fakten/beschaeftigtendatenschutz-26-bdsg.html)) **[verify]**. A works agreement cannot legitimise processing the GDPR does not allow, and courts review its necessity in full (CJEU C‑65/23, 19 Dec 2024; [CMS](https://cms.law/en/deu/legal-updates/european-court-of-justice-no-deviation-from-gdpr-standards-via-works-agreements)). | Ship an LIA template. Never present a consent toggle as the lawful basis. |
| **DPIA** | Almost certainly mandatory. It meets several EDPB high-risk criteria: systematic monitoring, employees as vulnerable data subjects, large scale, innovative technology, and likely special-category content. The ICO says employers must do a DPIA *before* monitoring emails and messages. | DPIA template pre-filled with your architecture, sub-processors, retention and controls. |
| **Purpose limitation / minimisation** | "All email for any agent" is hard to justify. Define purposes (for example, answering work questions) and scope mailboxes and categories to match. | Mailbox scoping, category exclusions, purpose-bound agent access. |
| **Transparency** | Art. 13 notice to employees before go-live. Covert monitoring is only for exceptional cases. ECtHR *Bărbulescu v Romania* (GC, 2017) requires prior notice of the nature and extent of monitoring **[not re-verified]**. | Employee notice pack, in-product "what is shared" view. |
| **Special categories (Art. 9)** | Mailboxes hold health, union and similar data. No legitimate-interests route exists for Art. 9 data, and AI summarisation makes inferences easier. | Classifiers that exclude or flag sensitive content. Exclude HR, occupational-health and union mailboxes by default. |
| **Data subject rights** | Embeddings, summaries and agent memory are personal data. French Cour de cassation (18 Jun 2025, reported) held work emails are personal data the employee can request ([secondary](https://www.donneespersonnelles.fr/controle-messagerie-salarie)) **[verify]**. UK DUAA 2025 now limits DSAR searches to "reasonable and proportionate" ones. Practitioner trackers say most DUAA reforms commenced 5 Feb 2026, but sources conflict ([JD Supra](https://www.jdsupra.com/legalnews/key-data-protection-changes-under-the-6191325/)) **[verify]**. | Per-person index: DSAR export and erasure by email address, covering derived data. Deletion propagation SLA. |
| **External third parties** | Senders and recipients outside the org never see the employee notice. The controller relies on Art. 14(5)(b) (disproportionate effort) plus a public privacy notice, and on balancing. | Domain or sender exclusions. No vendor use of external contacts (enrichment or sales). Retention that mirrors the source. |
| **Whistleblowing** | The EU Whistleblower Directive Art. 16 requires confidentiality of reporter identity **[not re-verified]**. Ingesting hotline or compliance mailboxes into broad agent context risks a breach. | Hard-exclude hotline, ethics, DPO and legal mailboxes. |
| **Transfers** | EU–US Data Privacy Framework (DPF) upheld by the General Court (*Latombe*, 3 Sept 2025). An appeal (C‑703/25 P) is pending, and Nordic DPAs advise having an exit plan ([WilmerHale](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework)). | Self-certify to the DPF **and** sign SCCs (Module 2 for customers, Module 3 for sub-processors), the UK Addendum, and a transfer impact assessment (TIA). |
| **Residency** | Not legally required, but DE, FR and public-sector buyers expect EU hosting *including inference*. OpenAI offers EU-resident API projects with in-region zero retention ([OpenAI](https://openai.com/index/introducing-data-residency-in-europe/)). Anthropic's first-party API offers only `us` or `global` inference and `us` workspace storage ([Anthropic docs](https://platform.claude.com/docs/en/build-with-claude/data-residency)). EU Claude routes via Bedrock or Vertex regional endpoints are reported, not verified here. | EU tenant: EU storage, EU embeddings, EU-pinned LLM endpoint. |
| **Pending law** | The GDPR side of the Digital Omnibus is **not law**. The Council mandate came on 21 Oct 2026, and the Parliament committee vote is expected in early 2027 ([eudigitalpolicy.eu](https://eudigitalpolicy.eu/instruments/data-omnibus/)). Plan on current GDPR. | — |

### 2.2 Works councils: where deals stall

- **Germany:** under §87(1) no. 6 BetrVG, co-determination applies to any technical system *objectively suitable* for monitoring behaviour or performance. No intent is needed. The BAG treated Office 365 as such a system and assigned it to the group works council (BAG 1 ABR 20/21, 8 Mar 2022; [Hensche](https://www.hensche.de/bag-beschluss-vom-08.03.2022-1-abr-20-21-zustaendigkeit-des-gesamtbetriebsrats-bei-unternehmenseinheitlicher-nutzung-von-microsoft-office-365.html)). Expect a works agreement *before* production, and sometimes before a pilot. Typical delay is 2–9 months **[estimate]**. A dedicated Employee Data Act is still only a draft **[status unverified]**.
- **France:** CSE consultation is required before introducing new technology. Nanterre (14 Feb 2025) and Créteil (15 Jul 2025) suspended AI tool rollouts, pilots included, until consultation finished ([CMS](https://cms.law/en/fra/legal-updates/l-ia-suspendue-le-juge-exige-la-consultation-du-cse-avant-tout-deploiement)).
- **Netherlands:** Art. 27 WOR gives the works council a **consent right** over monitoring systems and personnel-data regulations. A decision taken without consent is voidable ([GGI](https://www.ggi.com/news/employment/ai-from-algorithm-to-decision-the-position-of-the-works-council-in-the-netherlands)).

**Features that shorten negotiations:** aggregate-only admin metrics with minimum group sizes; no manager or HR view of an employee's queries; a "who accessed whose data" audit log exportable to the DPO or works council; four-eyes approval for admin and support access; per-jurisdiction feature switches; a model *Betriebsvereinbarung* clause set, German technical and organisational measures (TOMs) and a CSE pack; and a contractual ban on using outputs for evaluation or discipline.

### 2.3 EU AI Act

- **Timeline:** prohibitions, including Art. 5(1)(f) emotion recognition in the workplace, have applied since 2 Feb 2025. Annex III high-risk obligations were deferred from 2 Aug 2026 to **2 Dec 2027** by Reg. (EU) 2026/1744, in force since 27 Jul 2026 ([summary](https://www.euaiact.com/digital-omnibus-ai); [OJ](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ%3AL_202601744)). The AI-literacy duty (Art. 4) was softened to "taking measures to support" literacy.
- **Is the platform high-risk?** Annex III(4)(b) covers AI *intended* to decide on promotion or termination, allocate tasks based on behaviour, or "monitor and evaluate the performance and behaviour" of workers. A context and retrieval layer for productivity is **not** high-risk on its intended purpose. It becomes high-risk if marketed or configured for evaluation.
- **Roles:** you are the provider of your system (summarisation and retrieval). Customers are deployers. A customer that repurposes it for HR evaluation can become a *provider* under Art. 25. Employer-deployers of high-risk AI must inform workers' representatives first (Art. 26(7)).
- **Emotion recognition:** text-only sentiment analysis likely falls outside Art. 5(1)(f), because the definition is tied to biometric data ([FPF](https://fpf.org/blog/red-lines-under-eu-ai-act-unpacking-the-prohibition-of-emotion-recognition-in-the-workplace-and-education-institutions/)). It remains a GDPR and works-council red flag.
- **Action:** ban Annex III(4) uses in the AUP, document the intended purpose, adopt AI-literacy measures, and keep Art. 25(4) supplier terms ready for HR-adjacent customers.

### 2.4 United States

- **ECPA / Stored Communications Act:** the employer, as provider of the email service, may authorise access to stored communications (18 U.S.C. §2701(c)(1)), and the vendor acts as its agent. Wiretap Act exposure (consent and ordinary-course exceptions) arises mainly for real-time capture. Lesson from *In re Otter.AI Privacy Litigation* (N.D. Cal.): claims under ECPA and California's wiretap law (CIPA) reportedly survived dismissal in Aug 2026 on a theory that the vendor was a third-party interceptor that used the data for its *own* purposes, including training ([BuildBetter tracker](https://blog.buildbetter.ai/ai-notetaker-lawsuits-2026-how-to-record-meetings-legally/)) **[secondary]**. Stay a strict service provider: no vendor-side use of content.
- **State notice laws:** New York Civ. Rights Law §52‑c requires notice and acknowledgment at hire, plus posting. Connecticut §31‑48d requires prior written notice and posting. Delaware 19 Del. C. §705 requires notice and acknowledgment, with a $100 penalty per violation ([MoFo](https://www.mofo.com/resources/insights/211115-new-york-enacts-employee-monitoring-notification-law)). California workplace-surveillance bills AB 1331 and AB 1221 failed in early 2026 ([CalMatters](https://calmatters.digitaldemocracy.org/bills/CA_202520260AB1221)).
- **CCPA/CPRA:** employee data has been fully covered since 2023. The CPPA's rules on automated decision-making technology (ADMT) and risk assessments were approved 23 Sept 2025. ADMT compliance is due 1 Jan 2027, and risk-assessment reports are due 1 Apr 2028 ([Hunton](https://www.hunton.com/privacy-and-cybersecurity-law-blog/cppa-finalizes-ccpa-regulations-on-automated-decision-making-technology-risk-assessments-and-cybersecurity-audits)). You need a CCPA service-provider contract. Colorado repealed and replaced its AI Act with SB 26‑189, effective 1 Jan 2027, which focuses on ADMT ([EPIC](https://epic.org/colorado-legislature-again-amends-landmark-ai-law/)) **[secondary]**.
- **HIPAA:** a vendor that stores PHI is a business associate even when the data is encrypted. A BAA is needed with the customer, and the chain must flow down to your cloud and LLM providers ([NatLawReview on HHS cloud guidance](https://natlawreview.com/article/department-health-and-human-services-issues-guidance-hipaa-and-cloud-providers)).
- **GLBA / FINRA / SEC:** financial customers must oversee service providers by contract, so expect security addenda. Your index is not the book of record, but agent-generated client communications may be records. Support legal hold and never alter source mail.
- **Attorney–client privilege:** *United States v. Heppner* (S.D.N.Y., Rakoff J., Feb 2026) held that a defendant's Claude chats were not privileged and that feeding privileged material to a consumer AI tool waived privilege ([Orrick](https://www.orrick.com/Insights/2026/03/Court-Rules-AI-Conversations-Are-Not-Privileged-What-United-States-v-Heppner-Means-for-You)). Enterprise terms (confidentiality, no training, zero retention) and keeping privileged material out of broad context reduce the risk. Default-exclude legal mailboxes and privilege-tagged threads.
- **Export controls (ITAR/EAR):** controlled technical data in email must not reach foreign-person staff or proscribed locations. The encryption carve-out needs end-to-end encryption where the provider holds no keys ([Baker McKenzie](https://sanctionsnews.bakermckenzie.com/ddtc-issues-itar-rule-affecting-technology-transfers-encryption-and-cloud-computing/)). Offer an "export-controlled tenant" mode (US-person support, US-only inference) or exclude those customers.

---

## 3. Certifications and contracts buyers demand

| # | Item | When | Rough cost | Rough time |
|---|---|---|---|---|
| 1 | MSA + **AUP** (no unlawful monitoring, no Annex III employment use, no covert use) + **DPA** (Art. 28, SCCs, UK Addendum) + public **sub-processor list** (cloud, LLMs with zero retention/no training, observability) + privacy policy with Google Limited Use language | Before the first pilot | $25–75k outside counsel **[estimate]** | 4–8 weeks |
| 2 | Google verification + CASA; Microsoft publisher verification + Publisher Attestation | Before the first pilot | See §1 | 6–12 weeks |
| 3 | Third-party pen test (repeat yearly and on major releases) | Before the first pilot | $10–40k **[estimate]** | 2–4 weeks |
| 4 | SOC 2 Type I, then Type II | Type I before pilots or early; Type II report by enterprise | Audit: Type I $5–25k, Type II $7–50k. All-in year one: $30–150k ([Bright Defense](https://www.brightdefense.com/resources/soc-2-certification-cost/)) | Type I 1–2 months; Type II 3–12-month window |
| 5 | Cyber + tech E&O insurance ($2–5M mid-market, $5–10M enterprise) | Before the first paid contract | $10–60k/yr **[estimate]** | 2–4 weeks |
| 6 | Security questionnaire library (SIG Lite/Core, CAIQ), security whitepaper, trust center | Before scaling sales | Internal effort | 2–4 weeks |
| 7 | DPF self-certification, DPIA/LIA/notice templates, works-council pack, EU hosting | Before EU customers | $20–60k plus infrastructure **[estimate]** | 2–4 months |
| 8 | ISO 27001 (DACH buyers often prefer it to SOC 2) | Before EU enterprise | Certification audit $20–40k; surveillance $10–20k/yr ([GetAgency](https://blog.getagency.com/articles/iso-27001-certification-cost)) | 6–12 months |
| 9 | ISO/IEC 42001 (AI management system) | Differentiator for enterprise | $15–40k **[unverified]** | 4–9 months; shares much of the ISO 27001 work |
| 10 | Microsoft 365 Certification; CASA AL2; BAA (HIPAA) with an LLM BAA chain; customer-managed keys | Enterprise / regulated | **[unverified]** | 2–6 months |

---

## 4. Legally load-bearing product controls

### 4.1 Requirement → feature map

| Legal requirement | Feature that satisfies it | Load-bearing? |
|---|---|---|
| GDPR confidentiality and need-to-know; Google "user consent" for transfers; works councils | **Permission-mirrored retrieval**: an agent acting for user X sees only what X can see in the source. Org-wide queries are limited to explicitly designated shared or role mailboxes. | **Critical** |
| Data minimisation (Art. 5(1)(c)); RBAC for Applications | **Mailbox scoping** by OU, group or admin unit, enforced at the platform where possible (Microsoft RBAC for Apps) and always vendor-side | **Yes** |
| Art. 9; whistleblower confidentiality; privilege; employee-representative protections | **Default category exclusions**: HR, legal, executive, DPO, hotline, works-council and union, and medical mailboxes. Sensitive-content and privilege classifiers. A "private" label. | **Yes** |
| Purpose limitation; AI Act intended purpose; works councils | **Purpose-bound agent access**: per-agent allowlist and scopes, no HR or performance connectors, and an AUP ban that is also enforced technically | **Yes** |
| Google Limited Use; Slack ToS; *Otter* theory | **No training, no cross-tenant learning**; LLM zero-retention contracts; no human reading without documented consent | **Yes (hard platform gate)** |
| Erasure, storage limitation, Google "permanent copies" | **Deletion propagation SLA** (source delete or retention expiry → index, embeddings and caches purged within ≤24–72h), respecting **legal holds** | **Yes** |
| Access and erasure rights covering derived data | **DSAR tooling** by email address: export and erase across raw, derived and agent-memory stores | **Yes** |
| Accountability; works council; DPO oversight | **Immutable audit log** (who, which agent, what query, which items returned) with **audit export** | **Yes** |
| Transparency (Art. 13/14; NY/CT/DE) | **Notice pack**: employee notice templates, acknowledgment flow, external-party privacy-notice language, in-product "what's shared" view | **Yes** (customer-executed) |
| DPIA (Art. 35); ICO guidance | **DPIA + LIA templates** pre-filled with your controls | **Yes** for EU/UK sales |
| Art. 21 objection right | **Per-user objection / opt-out** honoured within a set time | **Yes** (EU/UK) |
| Google prompt-injection and token-security clauses | **Prompt-injection screening** on retrieved content; tokens encrypted at rest; per-invocation confirmation for agent tool calls | **Yes (Google policy)** |
| Transfers / residency | **EU tenant** (storage, embeddings and inference in the EU) | Commercially load-bearing |

### 4.2 The founder's governance ideas

| Idea | Verdict |
|---|---|
| **Limit which accounts are ingested** | **Legally meaningful.** Core minimisation control, and the first thing a DPO or works council asks for. On Microsoft, enforce it through RBAC for Applications (and remove the tenant-wide consent). On Google, enforce it vendor-side because DWD is all-or-nothing. Ship with sensitive mailboxes excluded by default. |
| **Keep some emails out** | **Legally meaningful for defined categories**: personal or private mail, special categories, privileged, hotline and HR. Generic keyword filters are nice-to-have. |
| **User opt-out in the email client** | **Meaningful as an Art. 21 objection mechanism and a works-council concession.** The opt-out doesn't have to live in the email client; a portal is enough. Be candid that one person's opt-out does not remove their mail from colleagues' mailboxes or from external threads. |
| **24h ingestion delay** | **Mostly nice-to-have.** It lets users label or delete private mail before ingestion, which modestly helps balancing and transparency. It also marginally strengthens the "stored, not intercepted" ECPA posture, though delivered mail is generally treated as stored anyway. It is **not** a substitute for deletion propagation. Make it a tenant setting, not a default. |

### 4.3 Legally risky to build: avoid, or keep out of EU SKUs

Avoid: employee sentiment or "burnout" scoring; per-person productivity metrics; flight-risk or insider-threat scoring (unless sold as a separate, DPIA-backed security product); manager dashboards of an individual's communications; "what does X think about Y" profiling; emotion inference from voice or video (prohibited under AI Act Art. 5(1)(f)); inferring health, union or political views; vendor-side enrichment from external contacts; training shared models on customer mail; covert deployment. Each of these turns the product into employee monitoring. That pulls it toward Annex III(4)(b), hands German works councils a veto, and breaches Google's and Slack's terms.

---

## 5. Gating checklist

### Gate A: before the first paid pilot (US mid-market, Google first)
*About 2–4 months; $75–200k all-in, including counsel, CASA, pen test, insurance and SOC 2 Type I* **[estimates]**
- [ ] Google restricted-scope verification and CASA letter in hand. For design partners before that, use a customer-owned internal or trusted app, with written acknowledgment of the grey zone.
- [ ] Microsoft publisher verification and Publisher Attestation, plus a runbook for RBAC for Applications.
- [ ] MSA, AUP, DPA and CCPA service-provider terms. Sub-processor list. LLM zero-retention and no-training contracts.
- [ ] Privacy policy with the Limited Use statement and the generalized-model disclaimer.
- [ ] Shipped: permission-mirrored retrieval, mailbox scoping, default sensitive-mailbox exclusions, audit log, deletion propagation, token encryption, prompt-injection screening.
- [ ] Employee notice templates (NY, CT, DE). Pen test. SOC 2 Type I, or a Type II window already running. Cyber and E&O insurance.

### Gate B: before EU/UK customers
*About 3–6 months more; $60–180k plus EU infrastructure* **[estimates]**
- [ ] DPIA and LIA templates. Art. 13/14 notice pack. DSAR tooling covering derived data. Per-user objection.
- [ ] Works-council pack: model *Betriebsvereinbarung* clauses, German TOMs, CSE pack, aggregate-only analytics, audit export.
- [ ] SCCs, UK Addendum and TIA, plus DPF self-certification.
- [ ] EU tenant with EU-pinned inference.
- [ ] AI Act AUP ban on Annex III(4) uses. AI-literacy measures. No emotion inference.
- [ ] SOC 2 Type II report, or a bridge letter. ISO 27001 underway.

### Gate C: before enterprise / regulated buyers
*About 6–12 months more; $150–400k* **[estimates]**
- [ ] SOC 2 Type II (12-month period). ISO 27001 certificate. ISO 42001 as an option.
- [ ] Microsoft 365 Certification. CASA AL2. Annual pen tests. SIG/CAIQ library.
- [ ] BAA with a downstream BAA chain. GLBA addendum. Legal-hold integration. Privilege controls. Export-controlled tenant mode.
- [ ] Customer-managed keys. EU and UK residency options. $5–10M insurance.
- [ ] Slack via Marketplace listing and the Real-time Search API, federated with no persistent index.
- [ ] Annex III readiness review before 2 Dec 2027 if any HR-adjacent customer use is contemplated.

---

## 6. Open items to verify

Verify with counsel or platform reps: CASA for vendor DWD-only apps; dates of the Google MCP clauses; 2026 CASA prices and level; Microsoft 365 Certification fees; Microsoft 2026 Product Terms text; EWS retirement date; DUAA commencement; BAG 8 AZR 209/21 and Cass. 18 Jun 2025; the German Employee Data Act; the *Otter* ruling; Colorado SB 26‑189; EU Claude regions; ISO 42001, insurance and pen-test costs.
