# AI Context Platform: research summary and recommendation

*November 2026. This combines six research reports from three product agents and three engineering agents, all in [`research/`](research/). This is product guidance, not legal advice. Figures marked "estimate" rest on assumptions spelled out in the source reports.*

**The idea.** Connect to a company's Google Workspace (and later Microsoft 365 and others) with read access the admin approves for the whole company. Turn every user's email into context that any AI agent can use. Wrap it in enough governance that companies will buy it.

---

## 1. The bottom line

1. **It can be built.** Google and Microsoft 365 have no API blockers. Every control you suggested (account limits, email exclusions, in-client opt-out, an ingestion delay) maps onto documented API features. → [04](research/04-ingestion-connectors.md)
2. **Connecting one person's mailbox to an AI is no longer a product.**
   - Google ships official Gmail, Drive and Calendar MCP servers (preview).
   - Microsoft's Work IQ API, which exposes Microsoft 365 data to agents, went generally available in June 2026.
   - ChatGPT, Claude and Gemini all ship mail connectors.

   What's left is **governed context drawn from many mailboxes at once, neutral across AI vendors**. The suites avoid this on purpose: Gemini reads Gmail one user at a time without copying it, and Glean caps how much Gmail it indexes. → [01](research/01-market-positioning.md)
3. **Governance isn't a feature added on top. It is the product.** No competitor advertises an ingestion delay or an opt-out inside the email client. Buyers (CISO, DPO, works councils) will judge you mainly on the controls.
4. **The admin's company-wide grant lets you *ingest*. It doesn't mean any agent may *read everything*.** All six reports reached this independently. By default, an agent acting for a person sees only what that person could already see in their own mailbox. Broader access comes through collections the customer sets up deliberately, is logged, and is visible to the people whose mail it is. This is legally essential (GDPR, works councils, Google policy), the main security protection, and what lets you sell it.
5. **Platform policy is the biggest risk, not technology.**
   - **Google:** only allows Gmail data to feed visible, user-facing features. A company-wide feed into any third-party agent doesn't fit its approved uses. It also needs an annual security assessment (CASA) and will charge for heavy API use (pricing not yet published).
   - **Microsoft:** steers agents toward Work IQ, and its terms from September 2026 restrict moving that data to non-Microsoft products.
   - **Slack:** bans keeping copies or indexes outright.

   → [03](research/03-legal-compliance.md), [06](research/06-agent-access-security.md)

---

## 2. Positioning and go-to-market

| Decision | Recommendation | Source |
|---|---|---|
| Positioning | "Governed email context for every AI agent, neutral across AI vendors." One policy across Claude, ChatGPT, Gemini and in-house agents. | 01 |
| Buyer | Head of AI / AI platform owner buys; the CISO and DPO must sign off. | 01 |
| Ideal customer | 300–3,000 seats. Below about 300, buyers use the free built-in connectors. Security review is enterprise-grade at any size. | 01 |
| Starting use case | **Customer-relationship context**: by default, ingest only threads with external customer domains, and let customers widen the scope. Ingesting less is part of the pitch. | 01 |
| Regions | US, UK, Netherlands, Nordics first. Germany and France need works-council agreement before go-live; plan for it rather than lead with it. | 01, 03 |
| Suites | Google first; it's the most permissive path today. Microsoft 365 is probably needed sooner than planned for EU buyers. | 01, 04 |
| Pricing | Per mailbox covered by the controls: about **$10/month** on the Business tier and **$15–20** on Enterprise, with a **$30k/year minimum**. Per-mailbox pricing rewards starting narrow. | 01 |
| Defensible differentiators | (1) One policy across all AI vendors. (2) Email-specific rules plus controls employees can see. (3) Company-level facts linked back to the email they came from, with audit evidence. | 01 |

---

## 3. Governance and controls: what to build

Your four ideas, scored against what the legal and governance agents found:

| Your idea | Verdict | How to build it |
|---|---|---|
| **Limit which accounts are ingested** | Legally required. MVP. | Include or exclude by org unit, group and user. **Exclude by default:** executives, board, HR, Legal, M&A, investigations, DPO, whistleblowing, works council, medical. **Also exclude that person's mail from everyone else's mailboxes**: excluding the CEO's mailbox does nothing if their emails sit in 500 other inboxes. Google can't limit the app's access to part of the org, so enforce this in your own policy layer. Microsoft can enforce it on its side (Exchange's RBAC for Applications). |
| **Keep some emails out** | Legally required. MVP. | Always skip drafts, spam, encrypted mail and confidential-mode mail. Rules on labels, senders and domains. Filter out bulk and automated mail. Conservative classifiers for legally privileged, HR/medical, personal, secrets and financial-account content. |
| **Opt-out inside the email client** | Useful. MVP in a simple form. | **MVP:** an `AI-Private` Gmail label or Outlook category. It needs no install, works on mobile, can be applied by Gmail filters, and **applying it later purges the email**. It excludes the whole thread. **Enterprise tier:** a Gmail add-on and an Outlook add-in for thread-level and "always exclude this sender" controls. **Separately:** a web page for the GDPR right to object (a person opting out entirely). Gmail's classification labels don't work as an opt-out: users can only set them while composing. |
| **24h delay before ingestion** | Nice to have legally. Worth having as a **setting**, not a fixed 24h. | See below. |

### The delay, settled

The reports agreed on most of this. Where they differed, here is the resolution.

- **It is a per-policy setting (0–72h), not a single fixed 24h.**
  - Gmail's undo-send is at most 30 seconds, and Outlook recall can come much later. Removing items when they're deleted at the source is the real protection.
  - A blanket 24h delay makes the context stale next to real-time competitors.
- **Suggested defaults:**
  - internal mail 15 min;
  - external mail 60 min, which leaves time to scan for phishing and prompt injection;
  - mail that looks sensitive 24h;
  - an "EU conservative" template with 24h across the board for pilots.
- **Build it as a delayed fetch:** store only the message ID and a due time, and fetch the content when the window ends.
  - If the message was deleted or labeled `AI-Private` in the meantime, it is simply never fetched, so there's nothing to purge.
  - When a message leaves the window, check again that it isn't in Spam or Trash and hasn't been reported as phishing.
- **A person's own mail during the window:** their agents can look it up live from Gmail or Outlook, which exposes nothing they don't already have. The delay applies to the shared, company-level layer and to any metadata that reveals an email exists.

### Other MVP controls buyers will ask for

- **Deletions propagate on contractual deadlines.** Hidden within 15 min or less, purged within 24h, and derived summaries and facts purged within 72h. Derived data is tracked back to its source emails so it can be found and deleted.
- **Tamper-proof audit logs** of every ingestion decision and every agent read (which agent, acting for whom, which items). They export to the customer's SIEM.
- **A per-employee page showing "which agent read my mail."**
- **Policy versioning and a dry-run mode** ("show me what this policy would ingest before I turn it on").
- **A registry of approved agents**, approvals for agents with broad access, volume limits, and a company-wide kill switch.
- **Templates for customers:** DPIA, legitimate-interests assessment, employee notices (including the New York, Connecticut and Delaware monitoring-notice laws), and a works-council pack.
- **A contractual and product-level ban** on using the platform to evaluate employees, and no sentiment or productivity scoring. This keeps you out of the EU AI Act's high-risk category; the ban on inferring emotions at work already applies.

→ Full catalog, policy-engine sketch and user stories in [02](research/02-governance-controls.md). Legal mapping in [03](research/03-legal-compliance.md).

---

## 4. What to store, and how agents retrieve it

**Your question:** "we don't want to duplicate all the emails but RAG is also not that great."

**What to store:** a slimmed-down, encrypted index, with the originals fetched from the source on demand. → [05](research/05-storage-retrieval.md)

- **Stored:**
  - message metadata;
  - which mailboxes hold each message (this doubles as the permission list);
  - the cleaned text with quoted replies and signatures removed, encrypted with a key per message;
  - a keyword index;
  - embeddings.
- **Not stored:** raw emails, HTML and attachment files. These are fetched from Gmail or Graph when an agent opens a message, which also confirms the message still exists and is still allowed.
- **Deduplicated across mailboxes:** one email sent to 50 people is stored once, keyed by its Message-ID header, together with the list of 50 mailboxes that hold it.
- **Size:** for 1,000 users, about 100–135 GB instead of 2.25 TB raw (**about 5%**).
- **Caveat:** the index still holds most of what the emails *say*, because embeddings and keyword indexes can be partly turned back into text. **Sell it as "a minimized, governed copy," never as "we don't store your email."**
- **Why not search Gmail or Outlook live:**
  - Gmail search returns only message IDs, with no relevance ranking, and is quota-limited.
  - Microsoft Graph search caps at 1,000 results sorted by date.
  - Google's own MCP server already does single-user live search for free.

  Live lookup remains the only option for sources that forbid keeping copies (Slack).

**How to beat plain RAG:**

- **Index whole threads, not chunks.** Strip quoted replies first, and filter out automated mail with simple rules before any LLM call.
- **Combine keyword and vector search**, then rerank, and filter by people, dates and direction (sent or received).
- **Give agents tools over MCP and let them iterate.** For example: `search_threads`, `get_thread`, `person_profile`, `timeline`, `open_commitments`, `brief_for_meeting`. This beats grabbing the top few results once.
- **Hand the model whole threads** within a budget of roughly 20–60k tokens, not loosely related fragments.
- **Filter permissions before searching, not after.** One person's mailbox is about 0.2% of the company's mail, so filtering a normal vector search afterwards returns nothing useful.
- **Summaries and facts are only as visible as the emails they came from.** A summary built from threads X, Y and Z is visible only to someone who can see all three.

**Knowledge graph:**
- **v1:** a who-talks-to-whom graph from email metadata. It costs nothing in LLM spend.
- **v2:** commitments and decisions with dates and links back to the source email, stored in Postgres.
- **Avoid:** GraphRAG-style summaries that merge many people's mail. They can't be filtered per user or cleanly deleted.

**Cost per 1,000 seats (estimate):**

| Item | Estimate |
|---|---|
| Embeddings, one-time | about $300–900 |
| Tiered, as-needed summaries (Claude Haiku 5.5, batch) | about $1,000 |
| Ongoing processing | about $80/month |

Storage cost is negligible. The real unknown is **Google's new charges for heavy API use** (below).

**Stack:**
- **MVP:** Postgres with vector and keyword search as the single system of record. Shared infrastructure, with an encryption key per tenant and optional customer-managed keys. A batch model for summaries, and a remote MCP server.
- **v2:** move search to a dedicated engine (Turbopuffer, or Vespa if ranking quality becomes the differentiator), with one namespace per tenant. Dedicated deployments for enterprise.

---

## 5. Ingestion and connectors

→ [04](research/04-ingestion-connectors.md)

- **Google mechanics:**
  - A **separate Google service account for each tenant**, with no long-lived private keys anywhere.
  - Backfill through the Gmail API.
  - Incremental sync from Gmail's change history, with Pub/Sub push notifications as triggers.
  - A weekly ID-only check to catch missed notifications.
- **How opt-out and deletion surface:**
  - Gmail's change history reports labels being added or removed, and messages being deleted.
  - That drives the `AI-Private` purge and the deletion tombstones.
  - Content shared across mailboxes is deleted when the last mailbox drops it.
- **Backfill time** (2,000 users × 40k messages, new Cloud project, Google's May 2026 quota model):
  - about **3 days** at the project ceiling, *if you pay above Google's free daily threshold*;
  - about **60 days** if you stay under it.

  → Do a **90-day backfill first** and fill in deeper history after. Use a **separate Google Cloud project per tenant**, for isolation and so tenants don't compete for quota; whether this also gives each tenant its own free threshold needs checking.
- **Microsoft 365:** Graph only (Exchange Web Services has been blocked by default since October 2026). Exchange's RBAC for Applications can **limit the app to specific mailboxes on Microsoft's side**, which is stronger than Google. A 2,000-user tenant backfills in under a day.
- **Build vs. buy:** build Google and M365 yourself. The unified-API vendors (Merge, Paragon, Nango, Nylas and others) don't support Google's company-wide access mode, high-volume backfill or your governance hooks. Nylas would require uploading the service-account private key. Use self-hosted Nango only for OAuth plumbing on long-tail connectors.

---

## 6. Access layer and security principles

→ [06](research/06-agent-access-security.md) for detail.

- **Two separate halves.**
  - The ingestion side holds the powerful Google and Microsoft credentials and never talks to agents.
  - The access side serves agents using short-lived tokens, each tied to a specific person and agent.
  - Agents never receive Google or Microsoft tokens.
- **Standards:**
  - A remote MCP server built to the current MCP authorization spec (2026-07-28 revision).
  - A REST API using the same authorization but issuing separate tokens.
  - Lightweight webhooks that carry no content; the consumer re-fetches with its own token, so policy is checked again.
  - Enterprise sign-in through the customer's identity provider as a P1 feature.
- **Treat inbound email as untrusted input.** Anyone on the internet can email an employee. Mark external content as such, clean it before returning it, and **offer only read and draft tools**: no sending, no fetching URLs, no bulk export. Google's developer policy now explicitly requires prompt-injection protection and user confirmation for agent actions.
- **Assume your own credentials are the prime target.** A breach would expose every customer's email, and recent OAuth-app breaches show it happens. Use a separate credential per tenant, with no long-lived keys. Offer an **isolated mode** where the customer owns the Google service account or Entra app.
- **Your own policy engine is the only barrier between users' mailboxes.** Check permissions on every object fetched, not just on search. Test cross-user and cross-tenant isolation as release blockers.

---

## 7. Extension directions

| Direction | Call | Why |
|---|---|---|
| Microsoft 365 mail | **Go** (about 13 engineer-weeks) | Required for EU and mid-market; Microsoft can enforce mailbox scoping on its side. |
| Google Calendar | **Go** (2–3 weeks) | Highest value per unit of effort; powers `brief_for_meeting`. |
| Google Drive | **Go, carefully** (6–8 weeks) | Mirror Drive's own sharing permissions and re-check them when content is read. |
| Chat, Meet, Teams, SharePoint/OneDrive | Later | Feasible; see 04 for effort. |
| Slack | **Live lookup only** (3–4 weeks) | Terms ban storing copies or indexes. Use the Real-time Search API through a Marketplace listing. |
| CRM, Notion, Jira/Confluence, GitHub, Zoom | Later (2–6 weeks each) | Lower sensitivity, per-user tokens. |
| **Governance gateway in front of Google's and Microsoft's own MCP servers** | **Strong strategic option** | Sells the governance layer even where the suites own the connector. Hedges platform risk. |
| Commitments and follow-ups ("what do I owe / am I owed") | **Go (v2)** | High value, low risk, works within a person's own mail. |
| Relationship intelligence ("who here knows Acme") | Careful | Strong for sales, but sensitive even as metadata. Needs its own permission, transparency to the people named, and opt-out. |
| Customer-owned / in-tenant deployment | **Go (enterprise)** | Best answer for regulated buyers; also eases the Google policy question. |
| Write-back (drafts, labels, calendar holds) | Later, with user confirmation | Google requires confirmation. Never send email autonomously. |
| **Avoid** | n/a | People analytics; sentiment, productivity or flight-risk scoring; "any employee can search anyone's mail"; training models on customer data (Google and Slack ban it); indexing Slack; autonomous sending. |

---

## 8. Cost and time to first pilot (estimates)

| Workstream | Estimate |
|---|---|
| Google connector with governance hooks | about 21 engineer-weeks (about 3 engineers × 7–8 weeks) |
| Policy engine, admin console, audit, employee transparency page | about 3 engineers × 8–10 weeks (synthesis estimate) |
| Index, retrieval and MCP server | about 2 engineers × 8 weeks (synthesis estimate) |
| CASA security assessment, DPA, privacy pack | 6–12 weeks, run in parallel |
| **First paid pilot** | **2–4 months of compliance work, $75–200k** (legal estimate); engineering about 4–5 months with 4–5 engineers |
| EU-ready (EU hosting, works-council pack) | +3–6 months, +$60–180k |
| Enterprise (SOC 2 Type II, ISO 27001/42001, Microsoft 365 Certification, BAA) | +6–12 months, +$150–400k |

---

## 9. Decisions for you

1. **Default scope.** Recommended: start with external customer-domain threads, not all mail.
2. **Pilot deployment.** Run the first design partners on a **customer-owned Google app** (internal app, customer's own service account). It reduces Google verification friction and credential risk while you get policy clarity. Then move to a verified Marketplace app.
3. **Confirm Google policy fit first.** Before significant build, get counsel's read, and ideally Google's, on how Google's Limited Use rules and the "building databases" clause apply to a company-wide feed for agents.
4. **Buyer.** The AI/platform team, not end-users. This shapes the product (admin console, API and MCP first, minimal end-user UI).

## 10. Two-week spikes before committing

- Keyless federated identity working end to end with Google's company-wide delegation.
- Whether an app that uses only domain-wide delegation, with no Marketplace listing, still needs Google verification and CASA.
- Gmail's actual per-user concurrency limit, and real backfill throughput under the new quota model.
- Whether a Cloud project per tenant gets its own free quota threshold.
- Reading Microsoft Purview sensitivity labels through Graph, so customers' existing labels can drive exclusions.
- Retrieval quality on a real (consented) mailbox: thread-level hybrid search vs. chunked RAG, measured against an email-specific test set.

---

## Research reports

| # | Report | Lane |
|---|---|---|
| 01 | [Market and positioning](research/01-market-positioning.md) | Competitors, platform risk, positioning, pricing |
| 02 | [Governance and controls](research/02-governance-controls.md) | Control catalog, policy model, admin console, priorities |
| 03 | [Legal and compliance](research/03-legal-compliance.md) | Google/Microsoft/Slack approvals, GDPR, works councils, AI Act, certifications |
| 04 | [Ingestion and connectors](research/04-ingestion-connectors.md) | Gmail/Graph mechanics, quotas, delay, opt-out/deletion, effort |
| 05 | [Storage and retrieval](research/05-storage-retrieval.md) | What to store, retrieval design, permissions, cost, stack |
| 06 | [Agent access and security](research/06-agent-access-security.md) | MCP/auth, tool design, security principles, extensions |

Items marked "unverified" in each report still need primary-source confirmation.
