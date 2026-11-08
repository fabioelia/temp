# AI Context Platform: Market, Competition, Positioning and GTM

*Research date: 2026-11-08. Lane: market, competition, positioning, GTM. Governance specs, legal, ingestion, storage and security are covered by other agents. Most competitor prices are not published by the vendor. Where a figure comes from a third-party aggregator it is marked (3p); where I could not confirm it at all it is marked **unverified**. The research hit its web-search budget before every item could be cross-checked; gaps are listed in section 6.*

---

## 0. Executive summary

1. **Per-user "connect my mailbox to an AI" is already free or bundled.** Google has official remote MCP servers for Gmail, Drive, Calendar, Chat and more (Developer Preview). Microsoft's Work IQ API (MCP/A2A/REST) went GA on 16 June 2026. ChatGPT, Claude and Gemini Enterprise all ship admin-enabled Gmail and Outlook connectors. A product that only pipes mail into Claude or ChatGPT has no market.
2. **What the platforms won't do is governed, org-level context drawn from many mailboxes.** Google designed Gemini Enterprise's Gmail connector as federated and per-user. Glean's indexed Gmail stops at 90 days and 6k threads per user every 30 days. The founder's concept sits in that gap, and it can only be sold if the governance comes first.
3. **Platform risk differs a lot by suite.** Slack has *already* banned the copy-and-index model in its API terms. Microsoft is steering AI access to the metered Work IQ API, which allows delegated access only and whose terms forbid redistributing the data. Google is the most permissive path today, through domain-wide delegation and Limited Use. So "Google first" is right, and "Slack later as just another suite" is wrong.
4. **"Context layer" is a crowded 2026 label.** Jedify, Modus, Trace, Uvi, Hyperspell, Zep, Supermemory, Airweave and others all use it. Developer-facing context APIs sell for $19–$400 a month. Positioning as a "context API" means a price war against free first-party MCP servers.
5. **Recommendation:** position as **governed email context for every AI agent**, neutral across AI vendors. Sell to the Head of AI/Platform (or the CIO in mid-market), with the CISO/DPO as the required co-signer. Lead with one use case: **customer-relationship context drawn from external correspondence**. Price per governed mailbox, about $10–$20 a month, with a usage allowance.

---

## 1. Competitive map

### 1a. Enterprise search / work AI (the bundlers)

| Player | Ingests | Copy vs federate | Governance advertised | Public pricing | Buyer |
|---|---|---|---|---|---|
| **Glean** | 100+ apps incl. Gmail, Outlook, Slack, Drive | Mostly indexes; Gmail offered both ways: indexed add-on (90 days, 6k threads/30 days cap) or federated ([docs](https://docs.glean.com/connectors/native/gmail-federated/about), [setup](https://docs.glean.com/connectors/native/gmail/new-setup)) | Permission-aware at query time, group include/exclude, remote MCP server for Claude/ChatGPT covered by its DPA | Not published. ~$45–$65/user/mo, ~100-seat minimum (3p: [eesel](https://www.eesel.ai/blog/glean-ai-pricing)). ARR $200M Dec 2025 ([Fortune](https://fortune.com/2025/12/08/exclusive-glean-hits-200-million-arr-up-from-100-million-nine-months-back/)); ~$300M mid-2026 (3p, unverified) | CIO, enterprise |
| **Microsoft 365 Copilot + Copilot (Graph) connectors + Work IQ** | All M365. External sources via connectors: 50M items per tenant included ([MS Learn](https://learn.microsoft.com/en-gb/MicrosoftSearch/licensing)) | M365 native; connectors index; Work IQ is live retrieval ("no vector stores") | Purview labels, permission trimming; Agent 365 registry to approve or block MCP servers incl. third-party ([MS Learn](https://learn.microsoft.com/microsoft-agent-365/tooling-servers-overview)) | Copilot $30/user/mo; Copilot Business $21 (≤300 users) ([MS Tech Community](https://techcommunity.microsoft.com/t5/microsoft-365-copilot-blog/act-now-lock-in-current-pricing-on-microsoft-365-copilot/ba-p/4502628)). Work IQ: Copilot Credits, 0.1 credit per tool call ([MS Licensing](https://www.microsoft.com/en-us/licensing/news/work-iq-general-availability)) | CIO |
| **Google Gemini Enterprise (ex-Agentspace) + Gemini in Workspace** | Workspace plus third-party connectors incl. Outlook, Jira, ServiceNow | **Gmail federated by design**, using per-user `gmail.readonly` ([Google docs](https://docs.cloud.google.com/gemini/enterprise/docs/connectors/gmail), [admin guide](https://discuss.google.dev/t/admin-guide-best-practices-dos-and-donts-for-setting-up-gemini-enterprise-connectors/398175)); Outlook can be ingested or federated | IdP-enforced ACLs, admin MCP allowlist | Business $21, Standard/Plus from $30/seat/mo at launch ([TechRadar](https://techradar.com/pro/google-unveils-gemini-enterprise-the-new-front-door-for-ai-in-the-workplace)). Gemini in Gmail bundled into Workspace since Jan 2025, with a ~$2 price rise ([9to5Google](https://9to5google.com/2025/01/15/google-workspace-gemini-price-increase/)) | CIO, Google shops |
| **Atlassian Rovo** | Atlassian + 50–100 connectors (Drive, Slack…); Gmail not confirmed | Teamwork Graph index | Permission-aware; advanced governance on Premium/Enterprise (3p) | Bundled into paid Cloud plans with credits ([Atlassian](https://www.atlassian.com/licensing/rovo)) | Atlassian admin |
| **Slack AI / Enterprise Search** | Slack + connected apps | Slack native; MCP server and Real-time Search for third parties ([Slack](https://slack.com/blog/news/feature-drop-feb26)) | Inherits Slack permissions | Enterprise Search in Enterprise+ (3p, [eesel](https://eesel.ai/blog/slack-ai-enterprise-search)) | Slack owner/CIO |
| **Notion AI connectors** | Slack, Drive, GitHub, Jira, Teams, SharePoint, **Gmail** (Business+) | Read-only connectors; indexed/federated not documented | Workspace permissions; zero data retention on Enterprise | Business ~$20/user/mo includes AI (3p, [eesel](https://www.eesel.ai/blog/notion-ai-connector-for-gmail)) | Team leads, mid-market |
| *Also:* **ChatGPT company knowledge**, **Claude connectors**, **Amazon Quick Suite** | Gmail, Outlook, Drive, Slack… | Per-user auth after admin enables ([VentureBeat](https://venturebeat.com/ai/openai-launches-company-knowledge-in-chatgpt-letting-you-access-your-firms), [Claude Help](https://support.claude.com/en/articles/10166901)) | Admin on/off, write actions off by default | Included in Enterprise plans; Quick Suite ~$20/$40/user plus a $250/account fee (3p, unverified) | CIO / AI lead |

### 1b. Agent context / memory infrastructure

| Player | Ingests | Copy vs federate | Governance | Pricing | Buyer |
|---|---|---|---|---|---|
| **Dust** | Slack, Notion, GitHub, Drive, 20+ more; MCP | Copies into "Spaces" | Spaces segmentation, SSO; SCIM, audit logs, single-tenant, US/EU residency on Enterprise | Pro €24, Max €120/seat/mo (annual); Enterprise custom ([Dust](https://dust.tt/home/pricing)) | Ops/AI lead, EU mid-market |
| **Credal** | Drive, Confluence, Slack, etc.; MCP gateway | Indexes; permissions enforced at query time | Permission mirroring, audit and SIEM export, SOC 2; multi-tenant, single-tenant or on-prem | Custom: builder seats + user seats + indexing + tokens ([Credal](https://www.credal.ai/pricing)) | CISO / AI platform, regulated |
| **Onyx (ex-Danswer)** | 40+ connectors (Gmail listed by 3p) | Indexes; open source / self-host | Permission sync on Enterprise Edition only | Business $20/user/mo; Enterprise custom ([Onyx](https://onyx.app/pricing)) | Eng/IT, self-hosters |
| **Zep** | Drive, Slack, Notion, **Gmail**, Granola; Teams/SharePoint on Enterprise | Copies into a temporal knowledge graph | BYOK, BYOC, SOC 2, HIPAA (Enterprise) | Flex $125/mo, Flex Plus $375/mo, Enterprise custom ([Zep](https://www.getzep.com/pricing)) | Developers |
| **Mem0** | Agent conversation memory, no notable SaaS connectors | Copies | SSO, audit, on-prem (Custom) | Free tier; Custom by quote ([Mem0](https://mem0.ai/pricing)) | Developers |
| **Letta** | Agent state/memory framework | Copies | n/a | Pro ~$20/mo (3p, **unverified**) | Developers |
| **Supermemory** | Drive, Notion, OneDrive; **Gmail on Max+** | Copies | Per-tag access, SOC 2, self-host on Scale | $19 / $100 / $399 per mo + usage ([Supermemory](https://supermemory.ai/pricing.md)) | Developers |
| **Hyperspell** (YC F25) | 50+ incl. Gmail, Slack, Drive, Salesforce | Stores summaries and extracted memories (copy) | Inherits OAuth permissions, user-controlled deletion, SOC 2 | Not published ([Hyperspell](https://www.hyperspell.com/)) | CTOs building agents |
| **Newer 2026 entrants** | Jedify ($24M A, Jun 2026, warehouse + Slack + meetings; [SiliconANGLE](https://siliconangle.com/2026/06/10/jedify-raises-24m-give-enterprise-ai-agents-business-context-lack/)); Modus ($10M seed, Jul 2026, "Context Warehouse" for data/BI; [TNW](https://thenextweb.com/news/modus-10m-seed-insight-partners-context-warehouse-enterprise-ai)); Trace ($3M; [Trace](https://www.trace.so/blog/trace-raised-dollar3m-to-build-the-context-layer-for-ai-at-work)); Uvi ($7.5M, Oct 2026; [SiliconANGLE](https://siliconangle.com/2026/10/14/uvi-raises-7-5m-help-ai-agents-learn-business-context/)); Airweave (OSS, Gmail connector; [docs](https://docs.airweave.ai/docs/connectors/gmail.md)); Ragie (Gmail connector, from $100/mo; [Ragie](https://ragie.ai/pricing)) | Mostly copy | Varies | Varies | Data/eng teams |
| **MCP governance gateways** | None (they sit in front of tools) | n/a | Per-user/per-tool access, audit, threat detection | Runlayer, $42M raised incl. a Jun 2026 round ([Runlayer](https://www.runlayer.com/mcp-gateway)); MintMCP | CISO |
| **Vertical analog: People.ai** | "Every email, meeting, and chat" exposed to Claude/ChatGPT/Copilot over MCP (Feb 2026; [People.ai](https://people.ai/newsroom/people-ai-brings-complete-revenue-intelligence-to-ai-workflows-through-model-context-protocol-mcp-integration)) | Copies | CRM-matching, revenue-scoped | Enterprise | CRO / RevOps |

### 1c. Integration / unified-API infrastructure

| Player | Model | Governance | Pricing | Buyer |
|---|---|---|---|---|
| **Merge (incl. Agent Handler)** | Unified APIs (copy/sync) plus Agent Handler tool-call layer | Tool Packs, DLP scan/block/redact of tool calls, audit trail, SCIM; "for Employees" governs Claude/ChatGPT/Copilot connections ([Merge](https://www.merge.dev/blog/agent-handler-employees)) | Free 2k credits; Pro ~$1k/mo for 25k credits (3p, [review](https://rywalker.com/research/merge-agent-handler)); employee tier seat-based | Platform eng, IT |
| **Nango** | Auth, syncs and tools (OSS) | SSO/SCIM, self-host/BYOC on Enterprise; **no EU cloud** | $50/mo PAYG; $0.29/connection, $0.72/compute-hr ([Nango](https://www.nango.dev/pricing)) | Developers |
| **Paragon (ActionKit)** | Embedded iPaaS, managed sync, MCP | n/a | Custom by connected users; ~$1k+/mo (3p, unverified) | SaaS product teams |
| **Unified.to** | Real-time pass-through unified API + MCP | SSO, IP restrictions; single-tenant/on-prem on Enterprise | $750 / $1,500 / $3,000+ per mo by API calls ([Unified](https://unified.to/pricing)) | SaaS product teams |
| **Composio** | Agent tool calls/MCP, 3k+ tools | Auth management | Repriced Aug 2026; roughly $0 / $29 / $229–$599 per mo (3p, in flux; [usagepricing](https://usagepricing.com/blueprint/composio)) | Agent developers |
| **Pipedream** | 3k+ connectors, Connect/MCP | n/a | **Workday agreed to acquire, 19 Nov 2025** ([Workday](https://newsroom.workday.com/2025-11-19-Workday-Signs-Definitive-Agreement-to-Acquire-Pipedream)); close **unverified** | Now part of Workday's agent strategy |

### 1d. Email-specific APIs and AI

| Player | Model | Pricing | Relevance |
|---|---|---|---|
| **Nylas** | Per-account email/calendar sync API (copy + pass-through) | $15/mo incl. 5 accounts, then ~$2/account ([Nylas](https://nylas.com/pricing/); 3p detail) | Per-user consent; not built for org-wide governance |
| **Unipile** | Per-account API (email, calendar, LinkedIn) | €49 for ≤10 accounts, then €5 → €3.50/account ([Unipile](https://www.unipile.com/it/nylas-alternativo/)) | Sets the commodity price floor: ~$2–$5 per mailbox |
| **Superhuman** (Grammarly renamed itself Superhuman in 2025) | AI mail client | Mail $25 / $33 per user/mo annual (3p, [dupple](https://dupple.com/learn/superhuman-pricing)) | Per-user AI; consumes, doesn't expose |
| **Shortwave** | AI Gmail client | $18 / $30 / $45 / $120 per seat/mo after Jun 2026 rise (3p) | Shows the seat price buyers accept for email AI |

### 1e. First-party MCP servers and agent APIs

- **Google:** remote MCP servers for Gmail, Drive, Docs, Sheets, Slides, Calendar, Chat, People and Classroom, in **Developer Preview** ([Google](https://developers.google.com/workspace/guides/configure-mcp-servers)). Gmail is read plus drafts/labels, with no send. They use per-user OAuth with a new "AI-powered agent" client flag, and also accept domain-wide delegation. Each server acts as one signed-in user and cannot serve shared or organization views.
- **Microsoft:** **Work IQ API/MCP GA 16 Jun 2026** covers mail, calendar, OneDrive/SharePoint, Teams, people and Planner. It uses **Entra delegated auth only ("application-only authentication isn't supported")** and is billed in Copilot Credits ([MS Learn](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/api-overview)). Microsoft calls it "the recommended foundation for new agentic … applications". The older per-workload Mail/Calendar MCP servers are now marked backward-compatibility only.
- **Slack:** MCP server plus Real-time Search API (Feb 2026), which retrieve data "without storing customer information on external servers" ([Slack changelog](https://docs.slack.dev/changelog/2026/02/17/slack-mcp)).

**What the map says**
- No one owns "governed org-wide email context for third-party agents". Glean comes closest, but email is a secondary corpus for it and it caps how much mail it indexes. People.ai does it for revenue only. Developer memory tools offer Gmail per user with light governance.
- Advertised governance means permission mirroring, DLP/redaction on tool calls, audit/SIEM, group include/exclude, and admin MCP allowlists. **I found no competitor advertising an ingestion delay or an opt-out inside the email client.** The closest precedent is Salesforce Einstein Activity Capture: admins exclude domains and addresses, and users mark mail private ([SalesforceBen](https://www.salesforceben.com/ultimate-guide-to-einstein-activity-capture-sync-email-as-activity-and-more/)).
- The platforms are moving toward **federation**: Gemini's federated Gmail, Slack's ban on indexing, Work IQ's live retrieval.

---

## 2. Platform risk

| Platform | Bundle risk | Block / tax risk | Evidence |
|---|---|---|---|
| **Google** | **Already bundled per user.** Org-level governed context: low–medium within 24 months | **Low–medium.** No 2026 change to domain-wide delegation found. Policy hooks are accumulating | Gemini is in all Business/Enterprise plans, and the Gmail MCP server is in preview. Gemini Enterprise's Gmail is *federated per user*, so Google itself avoids pooling mail across users. Limited Use: data may only serve user-facing features; no transfers to brokers/ads; humans may not read it without consent; and "using user data to create, train, or improve a machine learning or artificial intelligence model" beyond a personalized model is prohibited ([Workspace API policy](https://developers.google.com/drive/api/policy), [User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)). Apps planning generalized training get their verification closed ([Google](https://support.google.com/cloud/answer/13805798?hl=en)). Restricted scopes require an annual third-party security assessment, but apps used only inside the customer's own organization are exempt from these additional requirements. DWD changes can require multi-party approval ([Google](https://workspaceupdates.googleblog.com/2024/08/multi-party-approvals-for-domain-wide-delegation-actions.html)). The new "AI agent" OAuth flag gives admins a future way to treat agent access separately (speculative) |
| **Microsoft** | **High.** Copilot, Work IQ and Agent 365 cover the same job | **Medium–high, as a tax and terms risk rather than an outright block** | **Correcting the premise:** Graph *mail* APIs are **not metered**. The metered list (updated Apr 2026) contains only `assignSensitivityLabel`, and Teams APIs stopped being metered on 25 Aug 2025 ([MS Learn](https://learn.microsoft.com/en-us/graph/metered-api-list)). The real risk is that Microsoft steers agent access to **Work IQ**: delegated-only, priced per call (0.1 credit per tool call; $0.20–$1.50 per Chat/Context call, illustrative), and customers pay even when a *third-party* agent makes the call ([MS Licensing](https://www.microsoft.com/en-us/licensing/news/work-iq-general-availability)). The Microsoft IQ Product Terms (15 Sep 2026) bar using the APIs to "redistribute, resell or sublicense data", bar migrating data to non-Microsoft products, and limit third-party use to qualifying "Microsoft AI Customer Solutions" ([SAMexpert](https://samexpert.com/microsoft-product-terms-october-2026/)). Whether similar terms will reach Graph application permissions is **unverified**, but the direction is clear |
| **Slack** | High (Slack AI, Enterprise Search) | **Already blocked for copy-and-index** | API Terms (effective 10 Oct 2025): for Data Access/RTS data, "you may not create persistent copies, archives, indexes, or long-term data stores"; no bulk export; no "use API Data to train a large language model"; no using one org's data to benefit another ([Slack](https://slack.com/terms-of-service/api)). Commercial apps not approved for the Marketplace are limited to **1 req/min and 15 messages per call** on `conversations.history/replies` for installs after 29 May 2025. Internal customer-built apps are exempt ([Slack](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps)). Dust told customers the terms prohibit enterprise-search-style bulk indexing (3p) |
| **AI vendors** (OpenAI, Anthropic, Google) | Already bundled per user; org-wide connectors possible | Low | ChatGPT company knowledge and Claude connectors are admin-enabled but authenticated per user. The rational response is to *be* the governed MCP source they plug into, as Glean does |

**Takeaways:** (1) Build Microsoft support around Work IQ from day one, and treat Graph application permissions as a capability that may not last. (2) Slack must be federated-only, approved on the Marketplace or deployed as the customer's own app. It is not a "similar suite". (3) A **customer-owned app registration** deployment mode (the customer's own Google OAuth client or service account, Entra app and Slack app) lowers exposure on all three platforms. It is a GTM feature as much as a legal one. (4) Never market "training on company email". Market retrieval for the customer's own agents.

---

## 3. Wedge and positioning

**Buyers.** Head of AI/Platform (in mid-market often the CIO or VP IT) owns the agent program and the budget. The CISO, DPO/GC and, in Germany, the works council hold vetoes. RevOps or CS Ops is the business champion. Surveys are directional and vendor-sponsored, but they line up: only ~16% of organizations govern AI agents' access effectively, and 81% of CISOs worry about excessive AI access ([Kiteworks summary](https://www.kiteworks.com/cybersecurity-risk-management/ai-agents-governance-gap-surveys/), [Saviynt](https://saviynt.com/ciso-ai-risk-report-2026)).

**Job to be done:** "Let our agents (Claude/ChatGPT Enterprise, Copilot, our internal agents, vendor agents) use what the company knows from email, without creating an un-auditable shadow copy of everyone's inbox that I can't defend to employees, regulators or the board."

**Consumers:** assistants connecting over MCP (Claude, ChatGPT, Gemini Enterprise allowlist, Copilot via Agent 365 bring-your-own MCP registration); internal agents through the API/SDK; vertical SaaS agents in support, sales and legal.

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **A. Context API for agents** (developer/platform buyer) | Fast adoption, product-led | Crowded (Hyperspell, Zep, Supermemory, Airweave, Merge, Nango, Composio). Prices $19–$400/mo. First-party MCP servers are free. Developers don't need org-wide admin access | Reject as the lead; offer as a channel |
| **B. Governed company memory** (IT/security buyer) | Matches the top 2026 pain. Org-level context is what platforms avoid. Supports $30k+ ACVs | CISO is a blocker rather than a budget owner. Glean, Credal and Merge for Employees overlap | **Lead with this, but sell to the AI/Platform budget** |
| **C. Vertical** (e.g. RevOps account context) | Clear ROI and budget; People.ai proves demand | Well-funded incumbents (Salesforce EAC, Gong, People.ai); smaller market | Use as the **entry use case**, not the identity |

**Recommendation.** *"Governed email context for every AI agent: neutral across Google, Microsoft and every AI vendor, with controls your CISO, DPO and employees can sign off on."* Enter with **customer-relationship context**. By default, ingest only threads with external, CRM-matched customer and partner domains, so agents can answer "what's our full history with Acme?" across every permitted mailbox. That default removes most of the privacy risk (internal, HR and personal mail stay out), delivers value a single user's own connector cannot, and gives RevOps/CS a budget reason to buy. Expand to project and decision memory and to more agents afterwards.

**Three differentiators that survive bundling**
1. **Neutral on the consuming side.** One policy and one audit log across Claude, ChatGPT, Gemini, Copilot and custom agents. Google won't govern what Claude reads from Exchange. Microsoft's IQ terms actively restrict moving data outward. Mid-market AI programs are multi-vendor by default.
2. **Email-native governance plus controls employees can see.** Rules on sender, recipient, domain, label and OU; external-only defaults; privileged/HR/health classifiers; a configurable cooling-off window (the 24h delay); an opt-out inside Gmail and Outlook; per-agent purpose scopes. Platforms enforce "who can see this mail". They do not enforce "should any agent use this mail at all", because their incentive is to maximize AI usage.
3. **Org-level derived context with provenance and audit evidence.** Each fact links to its source thread and to the policy decision that admitted it. Deletion propagates. DPIA and works-council reports are exportable. The first-party offerings are per-user by design (Gemini's Gmail connector, Google's Gmail MCP server, Work IQ's delegated auth), so this is the layer they are least likely to bundle.

**Testing the hypothesis.** "Governance-first, neutral cross-suite context layer" is **partly supported**. Governance-first is right, and it is the only thing that makes org-wide email sellable. **Neutrality across AI vendors is stronger than neutrality across suites**: most mid-market companies run either Google *or* Microsoft (unverified as a statistic, but it is the norm), so cross-suite value appears mostly at enterprise scale and after M&A. Neutrality alone is not a moat. Depth in email-specific policy and employee-facing consent is.

**Founder assumptions challenged**
- *"Read all users' email org-wide"*: Google and Glean both limit pooled mail (Gmail federated in Gemini; Glean's indexing caps). Default to **narrow ingestion that customers widen deliberately**. Charging per governed mailbox (section 4) turns that restraint into a selling point.
- *"Fixed 24h delay"*: agent builders value freshness. Make the delay a policy setting per OU or label. Give each mailbox owner's own agents live, federated access, and apply the delay to the shared org-level layer.
- *"Slack later, like M365"*: Slack's terms forbid the copy model. Plan it as federated-only.
- *"Google first, M365 second"*: fine for US tech-forward mid-market, which also builds the most agents. EU/UK mid-market leans Microsoft (unverified), so EU traction needs M365, built on Work IQ, earlier than planned.
- *"US and EU/UK at launch"*: in Germany, email-system software triggers works-council co-determination for both introduction and ongoing use (§87(1) no. 6 BetrVG; [Mayer Brown](https://www.mayerbrown.com/en/insights/publications/2026/10/internal-investigations-role-and-rights-of-employee-representatives), [Covington](https://www.cov.com/en/news-and-insights/insights/2026/07/works-council-rights-in-ai-implementation-projects)). Launch in the US, UK, Netherlands and Nordics. Enter DACH with a works-council pack.
- *"Mid-market from 200 seats"*: security review of org-wide mail access is enterprise-grade at any size. Below ~300 seats buyers will use free connectors. Target 300–3,000 seats with a ~$30k ACV floor.

---

## 4. Pricing and packaging

**Benchmarks (per month)**

| Layer | Reference points |
|---|---|
| Commodity email APIs | Nylas ~$2/account; Unipile €3.50–€5/account |
| Developer context/memory | Supermemory $19–$399; Zep $125–$375; Nango $0.29/connection; Unified $750–$3,000; Merge Pro ~$1k (3p) |
| Agent platforms | Onyx $20/user; Dust €24/€120 per seat; Credal custom (seats + indexing + tokens) |
| Work AI suites | Copilot $30 (Business $21); Gemini Enterprise $21/$30; Glean ~$45–$65 (3p); Notion Business ~$20 |
| Email AI clients | Superhuman $25–$33; Shortwave $18–$120 |
| First-party metered | Work IQ 0.1 Copilot Credit per tool call; $0.20–$1.50 per Chat/Context call (illustrative) |

**Recommended model:** a platform minimum, plus a price **per governed mailbox** (only mailboxes actually ingested are billed), plus a pooled allowance of retrieval calls. Don't charge per agent, because that discourages exactly the expansion you want. Per-mailbox pricing ties revenue to the governance story ("pay only for what you let AI see"), and it sits well above commodity APIs and below the assistant seats it supports.

| Tier | For | Includes | List price |
|---|---|---|---|
| **Pilot** (90 days) | 1 suite, ≤500 mailboxes, ≤3 agents | Core policies, MCP endpoint, 30-day audit | $15k fixed, credited against year 1 |
| **Business** | 300–2,500 mailboxes | Google + M365, unlimited MCP/API consumers, full policy engine (scoping, domain/label rules, cooling-off, in-client opt-out add-on, purpose scopes), DLP/redaction, audit + SIEM export, SSO/SCIM, US *or* EU region | **$10/governed mailbox/mo**, $30k/yr minimum; 3,000 retrieval calls per mailbox per month (pooled); overage $1.50 per 1k |
| **Enterprise** | 2,500+ or regulated | + single-tenant or BYOC/VPC, customer-managed keys, customer-owned app registrations, legal-hold/retention sync, DPIA and works-council pack, custom classifiers, SLA | $15–$20/mailbox/mo or a platform fee from $120k/yr |
| **Add-ons** | | Slack (federated), Drive/Calendar context, premium classifiers | +$2–$4/mailbox/mo |

Check: 1,000 governed mailboxes on Business comes to ~$120k a year. For comparison, Copilot or Gemini for the same 1,000 users costs $252k–$360k a year, and median Glean contracts are reported around $66k–$99k (3p). Discount for multi-year terms, not by lowering the per-mailbox price.

---

## 5. What "marketable" requires (buyer view, brief)

- **Trust center on day one:** SOC 2 Type II, plus ISO 27001 for EU deals; Google's restricted-scope security assessment letter; a pen-test summary; subprocessor list; DPA with SCCs/UK addendum; AI commitments (no training, Limited Use statement, which LLM providers if any, zero retention); public data-flow diagrams.
- **Deployment ladder:** multi-tenant SaaS in US and EU regions → single-tenant → BYOC/VPC → customer-managed keys. Competitors already offer these at the top end (Zep BYOK/BYOC, Credal on-prem, Dust single-tenant, Unified on-prem). Also the **customer-owned app registration** mode from section 2.
- **Proof points:** 3–5 named design partners (one regulated-adjacent, one EU); published prompt-injection red-team results, since Google's own MCP guide warns about injection through email content; a sample works-council agreement and DPIA; kill switch and deletion SLAs; listings in Google Workspace Marketplace, Agent 365 bring-your-own MCP, and the Claude and ChatGPT connector directories.
- **Channels:** Google and Microsoft resellers/MSPs, and the enterprise sales teams at Anthropic and OpenAI, who need governed connectors to close deals.

---

## 6. Verification notes

- **Not published by vendors (third-party estimates only):** Glean, Paragon, Credal, Hyperspell, Merge Pro, Superhuman, Shortwave, Quick Suite, Letta, Composio (repriced Aug 2026).
- **Unverified:** whether the Pipedream acquisition closed; Glean ~$300M ARR; Modern Relay; whether Microsoft IQ terms extend to Graph; the exact Google DWD/Limited Use treatment of a third-party SaaS that exposes Gmail data to customer-chosen LLMs (route to the legal agent); EU suite-share and single-suite-mid-market claims; Gemini Enterprise Plus price (~$50, 3p).
- The search budget ran out before I could check Glean's 2026 agent/API announcements, Gong's email exclusions, and Microsoft Graph Data Connect pricing.
