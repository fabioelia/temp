## Agent access layer, threat model and extension directions for the AI context platform (status as of 2026-11-08)

Your brief was cut off after "`brief_`". I assumed the next tool was `brief_for_meeting`, and I also covered auth, scoping, events and audit. Anything marked **(unverified)** I could not confirm from a primary source. Anything marked **(secondary)** comes only from vendor blogs or press.

---

### Summary

1. **The admin's org-wide grant gives the platform the right to ingest mail. It does not authorize any particular agent to read it.**
   - Every agent read has to be decided for a specific principal: a human, or a service agent with a written charter.
   - The decision also covers the specific client and the purpose.
   - By default, a user's agent sees only what that user could already see in their own mailbox.
   - With per-user connectors, Google or Microsoft enforce that boundary. Here, **our policy engine is the only boundary**, so a bug in it exposes other users' mail.
2. **Build two separate planes.**
   - The ingestion plane holds the all-powerful upstream credentials (Google domain-wide delegation, Microsoft Graph application permissions) and never talks to agents.
   - The access plane holds only short-lived, per-principal tokens bound to a single audience.
   - Agents never receive Google or Microsoft tokens; the MCP spec forbids passing them through anyway.
3. **Standards to build to:**
   - MCP **2026-07-28**: stateless, with Client ID Metadata Documents (CIMD) as the preferred client registration and Dynamic Client Registration (DCR) deprecated.
   - Protected resource metadata (RFC 9728) and resource indicators (RFC 8707) are required, and issuer validation (RFC 9207) is now in the spec.
   - Two stable auth extensions: **Enterprise-Managed Authorization** (the customer's identity provider issues an identity-assertion token, "ID-JAG") and **OAuth Client Credentials**.
   - OAuth 2.1 is still an Internet-Draft (draft -17, 31 Oct 2026).
4. **Prompt injection is the top threat because anyone on the internet can write into the corpus.** Anyone can email anyone in the org, with zero clicks.
   - Precedents: EchoLeak (Microsoft 365 Copilot, CVSS 9.3) and ShadowLeak (Gmail data exfiltrated through ChatGPT Deep Research).
   - Every response we return carries two legs of the "lethal trifecta" (private data plus untrusted content). The client usually supplies the third (a way to send data out).
   - Org-wide visibility makes it worse: an email sent to user A can steer an agent into user B's context.
5. **The platform becomes the most valuable OAuth target in each customer's tenant.** Precedents:
   - Salesloft Drift tokens were used to read Google Workspace mail (Aug 2025).
   - A compromised Google Workspace OAuth app belonging to Context.ai, a third-party AI tool, led to the Vercel breach and affected "hundreds of users across many organizations" (Apr 2026).
   - Midnight Blizzard abused an OAuth app with `full_access_as_app` against Microsoft (Jan 2024).
   - Design on the assumption that our upstream credential gets stolen.
6. **Google's developer policies now contain explicit agent requirements.** The Workspace API user-data policy:
   - requires developers to "granularly require users to confirm the MCP, tool, skill, or other agentic behavior invocation";
   - requires protection against prompt injection "using Google Cloud Platform's Model Armor" or an equivalent;
   - bans training general AI/ML models on the data.
   - Separately, restricted Gmail scopes require an annual third-party security assessment (CASA) once the data is stored or transmitted on servers.
7. **Platform risk is rising.**
   - Google introduced a usage-tier model for Workspace APIs in May 2026, aimed at "large-scale data egress", with charges above standard daily thresholds.
   - Slack's 2025 API terms ban bulk export and persistent indexes.
   - Exchange Web Services (EWS) has been blocked by default since 1 Oct 2026.
   - Google and Microsoft now ship their own mail MCP servers (preview). "MCP over Gmail" is not a differentiator. Cross-user, cross-source context under governance is, and that is the riskiest capability, so the governance and security story *is* the product.

---

## A. Agent access layer

### A1. Who an agent acts for, and what it can see (the most important design choice)

| Principal | How it authenticates | Default visibility |
|---|---|---|
| Employee using Claude, ChatGPT or Gemini | Per-user OAuth (CIMD or DCR), or Enterprise-Managed Authorization for auto-connect | T0 |
| Employee using the customer's own agent | Per-user OAuth or token exchange; the agent is recorded in the token's `act` claim | T0 |
| Headless customer service agent | Client Credentials extension with `private_key_jwt` only, no client secrets | Collections named in its charter only (e.g. the support@ mailbox), never "all mail" |
| Third-party SaaS agent | Admin-approved client; per-user delegated tokens only | T0 |
| Admin, compliance, vendor support | Separate break-glass plane with dual control and just-in-time approval. **Never exposed over MCP.** | n/a |

**Visibility tiers** (enforced by a relationship-based policy engine, Zanzibar-style, e.g. OpenFGA or SpiceDB):
- **T0:** the caller's own mailbox, plus threads the caller is a party to.
- **T2:** org-level metadata with no content, e.g. "who here has talked to Acme". This is sensitive in itself (M&A, HR), so it needs its own scope and is shown to the people it concerns.
- **T3:** other users' content, only through sharing the customer has configured: shared mailboxes, account teams, delegation. Opt-in per collection, with a justification, logged, and visible to the person whose mail it is.

**Rules that follow from the tiers:**
- **Derived data inherits its sources' access lists.** A summary, embedding, person profile, timeline or commitment computed over threads X, Y and Z is visible only to principals who can see all three. Either compute these per principal at query time, or cache them keyed by the principal's visibility set. A precomputed org-wide `person_profile` leaks by construction. Treat embeddings as content, since they can be inverted.
- **Check access on every object fetch** (`get_thread(id)`), not just on search. Handles are names, not capabilities; the 2026-07-28 spec says this explicitly.
- **Define exclusion semantics precisely.** Excluding a mailbox does not remove that person's mail: their messages also sit in every correspondent's mailbox. Offer:
  - (a) exclude a mailbox;
  - (b) exclude a person everywhere, as sender or recipient (the right setting for the CEO, legal, HR);
  - (c) exclude by domain (e.g. outside counsel);
  - (d) exclude by label (e.g. "Privileged").

  Enforce at ingest (drop before storage) **and** again at query time. Where possible, also enforce upstream: in Exchange Online, **RBAC for Applications** scopes the app to specific mailboxes and replaces Application Access Policies. The tenant-wide `Mail.Read` grant has to be removed, or it overrides the scoping.
- **Opt-out semantics.** Opting out removes the user's mailbox and stops T2/T3 features (profiles, "who knows") from describing them. Their messages in other people's mailboxes stay visible to those people at T0, because those people legitimately hold them.
- **The 24-hour embargo also works as a phishing quarantine.**
  - When a message comes out of embargo, check again that it still exists, is not in Spam or Trash, and was not reported as phishing.
  - Apply the embargo to events and to metadata saying a message exists, not just to content. "New thread with acme-legal" is itself a leak.
  - Recommend that, by default, the embargo applies to T2/T3. Whether T0 self-access waits is a product decision.
- **Defense-in-depth option for the storage lane:** encrypt each mailbox under its own key, released by the policy engine only to entitled principals. A query bug alone then cannot decrypt someone else's mailbox.

### A2. Authorization server and MCP auth profile (P0 checklist)

- Act as an OAuth 2.1 resource server and serve RFC 9728 metadata.
  - Return `401` with `resource_metadata` and `scope` in `WWW-Authenticate`.
  - Claude ignores `WWW-Authenticate` on a `200` and uses only the first `authorization_servers` entry.
- The authorization server supports RFC 8414 or OpenID Connect discovery and advertises `code_challenge_methods_supported: ["S256"]` (clients MUST refuse to proceed without it).
- **CIMD:**
  - Advertise `client_id_metadata_document_supported: true`. Claude needs **both** that and `"none"` in `token_endpoint_auth_methods_supported`, plus `private_key_jwt` for its confidential-client path.
  - The metadata fetcher must be safe from server-side request forgery: no private IPs, no redirects, size and time limits.
  - Keep a per-tenant allowlist of client domains.
  - Show the client name and redirect host on the consent screen, and warn when only localhost redirects are registered.
- **DCR** is supported for backwards compatibility only. DCR-registered clients land in a quarantine tier: lowest scopes, admin approval required.
- **RFC 8707 audience binding.** Use **per-tenant MCP URLs and issuers** (`https://{tenant}.mcp.vendor.com/mcp`) for isolation between tenants and for data residency. In Claude's directory, a URL pattern needs the "Verified" label and CIMD or DCR; Anthropic-held client credentials can't be used with URL patterns.
- **RFC 9207:** put `iss` in authorization responses. This defends against authorization-server mix-up, the class behind the 2026 MCP Python SDK OAuth flaw.
- **Tokens:**
  - Short-lived access tokens (5–10 min).
  - Rotate refresh tokens for public clients; `invalid_grant` on revocation.
  - DPoP sender-constraining where clients support it (MCP client support for DPoP is **unverified**).
  - Treat a client's known egress range (Anthropic: `160.79.104.0/21`) as a risk signal, not a control.
- **Scopes:** coarse for consent, fine-grained in the policy engine:
  - `context.read.self`
  - `context.read.shared`
  - `context.read.org_metadata`
  - `context.read.attachments`
  - `context.write.drafts`
  - `context.write.labels`

  Step-up uses `403 insufficient_scope`, listing all required scopes in one challenge.
- **Enterprise-Managed Authorization (ID-JAG)** should be P1 and is the enterprise selling point.
  - The customer's Okta or Entra decides which users may use which clients with which scopes.
  - Claude supports it as "auto-connect".
  - The underlying IETF draft is at -06 (31 Oct 2026), not yet an RFC, so pin the version.
- **Disallow Claude's beta `static_headers` mode** (one org-wide API key) for any tool that returns user content. It carries no user identity, so per-user authorization is impossible.
- **Consume revocation signals via Shared Signals and CAEP** (final since Sept 2025): a user is terminated, every agent token dies immediately. Also emit these signals to customers' security tools.

### A3. Interfaces

**Remote MCP (2026-07-28, while still supporting 2025-11-25 clients):**
- Stateless Streamable HTTP and `server/discover`. Cursors and result sets are server-minted handles that are re-authorized on every call.
- `tools/list` may vary by token (the spec allows this), so return only the tools the token permits, in deterministic order.
- **Set `cacheScope: "private"` on every per-principal list or read.** `public` would let shared intermediaries serve one user's results to another.
- The required `Mcp-Method` and `Mcp-Name` headers let a web application firewall or gateway rate-limit per tool at the edge.
- **Never mark `query` or any content parameter with `x-mcp-header`.** Header values are visible to intermediaries and end up in logs.
- Annotations: `readOnlyHint: true` and `openWorldHint: false` on read tools. Clients treat annotations as untrusted, so they are a usability aid, not a control.
- Use the multi-round-trip input-request pattern for confirmations; Google's policy requires per-invocation confirmation for agent actions.
- **MCP Apps** (stable): show drafts and citations in a sandboxed UI. Raw email content can carry `audience: ["user"]` so it is shown to the human rather than fed to the model; whether clients honor this is **unverified**.
- **Tasks** (beta) for long-running briefs. Carry OpenTelemetry trace context in `_meta` for audit correlation, but treat client-supplied `baggage` as untrusted.
- Don't build on Sampling, Roots or Logging; they are deprecated (12-month window).

**REST (primary programmatic interface):**
- Same authorization server, but a **different audience** from the MCP endpoint, so tokens are not interchangeable.
- Cursor pagination over per-principal result sets, hard volume caps, idempotency keys on writes.
- Every response carries a policy-decision ID and provenance.

**GraphQL:** only with persisted (allowlisted) queries, depth and cost limits, and field-level authorization. Nested queries are a bulk-exfiltration primitive. Defer it.

**SDKs (TypeScript and Python):**
- Generated from OpenAPI, with DPoP and token refresh built in.
- An `UntrustedText` type plus delimiting helpers, so developers keep email text out of system prompts.
- Adapters for the major agent frameworks are mostly "use the MCP server".

**Events:**
- *Upstream from Google:*
  - Gmail push goes through Pub/Sub; the watch must be renewed at least every 7 days.
  - At most 1 notification per second per user.
  - The payload is only `emailAddress` and `historyId`, so follow up with `history.list`. Notifications can be dropped, so poll as a fallback.
- *Upstream from Microsoft (Graph):*
  - Mail subscriptions last at most 10,080 minutes.
  - "Rich" notifications that include resource data last at most 1,440 minutes and require an encryption certificate.
  - Handle lifecycle notifications.
  - EWS has been blocked by default since 1 Oct 2026, with full retirement 1 Apr 2027, so build on Graph only.
- *Downstream to customers:*
  - **Thin events with no content** (`thread.updated {id, change_type}`). The consumer fetches with its own token, so opt-out, embargo and exclusions are re-evaluated at fetch time.
  - Signed deliveries (Standard Webhooks pattern, or asymmetric signatures), a replay window, a server-side request forgery-safe URL validator, and subscriptions that expire automatically so nothing outlives an offboarded user.
  - Optional delivery into the customer's own cloud queue.

### A4. Tool catalog and design rules

| Tool | Notes |
|---|---|
| `search_threads(query, time_range=90d, participants?, account?, limit≤20, cursor?)` | Returns snippets, participants, timestamps, `why_visible` and a deep link. The principal is implicit; there is **no `as_user` parameter**. |
| `get_thread(thread_id, fields[], max_messages)` | Bodies wrapped as `untrusted_content` with provenance: internal or external sender, first-time sender, **SPF/DKIM/DMARC results**. |
| `get_attachment_text(id, pages)` | Content-type allowlist, size cap, data-loss-prevention scan. |
| `person_profile(person)` | **External contacts:** relationship facts drawn from the caller's visible threads. **Internal people:** directory data only. **No sentiment or performance inference**; the EU AI Act bans emotion recognition in the workplace (Art. 5). |
| `timeline(topic\|account, range)` / `open_commitments(owed_by_me\|owed_to_me)` / `brief_for_meeting(event_id)` | Computed from visible sources at call time; each item carries citations and is marked "stated" or "inferred". |
| `who_knows(account\|topic)` | T2 scope only. Returns people, never content. Rate-limited, and visible to the people it names. |
| `create_draft(...)` | Separate scope, human confirmation, **draft only**. |

**No** `send_email`, `fetch_url` or `export` tools. That follows Meta's "Agents Rule of Two": a session that reads untrusted email and private data must not also be able to communicate externally.

**Design rules:**
- Return structured output (`outputSchema`) plus concise text.
- Strip quoted reply chains, signatures and disclaimers by default.
- Return full bodies only on explicit request.
- **Sanitize before returning:**
  - convert HTML to text;
  - drop hidden text (white-on-white, zero-size, `display:none` — ShadowLeak's technique);
  - remove Unicode tag and invisible characters;
  - defang URLs and markdown image or reference links (EchoLeak's channel), replacing them with opaque references.
- Run a prompt-injection classifier (Model Armor, Prompt Shields, or our own) and flag hits in the response metadata.
- Redact secrets and regulated identifiers by default.
- A denial looks exactly like "not found". Saying "embargoed" reveals that the message exists.

### A5. Quotas and audit

- **Budgets per principal × client × tool** (full bodies per hour, distinct people profiled per day), with anomaly detection for enumeration, breadth spikes and exfiltration-shaped queries.
- **Serve agents from our index, not live Google calls.**
  - For projects created from 1 May 2026, Gmail allows 1.2M quota units per minute per project and 6,000 per user (from Google's quota page via search summary).
  - Usage above standard daily thresholds will be billed.
  - Quotas are **per Google Cloud project**, so a single multi-tenant project makes tenants compete for quota and charges. Shard projects.
- **Audit log** records: principal, client (the CIMD URL is a stable client identity), tool, query, IDs of returned objects (not content), policy decision, token `jti`, and trace ID.
  - Write-once storage, exportable to the customer's SIEM.
  - **Visible to the employee:** "which agent read my mail, and when."
  - Also log which AI provider received the content.

---

## B. Threat model

**Assets:**
- per-tenant upstream credentials;
- the index (mail, embeddings, derived profiles);
- access tokens;
- policy configuration;
- audit logs.

**Trust boundaries:**
- Google/Microsoft ↔ ingestion;
- ingestion ↔ store;
- store ↔ policy engine and access plane;
- access plane ↔ agent clients;
- clients ↔ LLM providers;
- webhook receivers;
- vendor staff;
- customer admins.

**Ranked threats:**

| # | Threat | Evidence | Key mitigations |
|---|---|---|---|
| 1 | **Zero-click indirect prompt injection** via inbound mail, leading to exfiltration through the client's other tools, or across users via org-level tools | EchoLeak CVE-2025-32711; ShadowLeak (exfiltration from OpenAI's cloud, invisible to enterprise controls); GitHub MCP (May 2025); Permiso XPIA phishing in Copilot summaries (Jan 2026) | T0 by default; untrusted-content marking and sanitization; minimal content (a tool-less model writes summaries, i.e. the "dual LLM" pattern); no attacker URLs; egress budgets; no send or fetch tools; customer guidance not to install web-fetch or send tools alongside ours. This is unsolved, per Meta, so the goal is to limit blast radius. |
| 2 | **Theft of the upstream all-powerful credential** | Midnight Blizzard; Drift Email tokens (9 Aug 2025); Context.ai to Vercel (Apr 2026); ShinyHunters OAuth wave (Gainsight, Anodot/Snowflake, Klue), per the CSA note of Jul 2026 | See detail below |
| 3 | **Authorization bugs in our layer**: insecure direct object references, handles treated as capabilities, cached lists served to the wrong user, summaries computed over a union of users | Asana MCP (Jun 2025) cross-org exposure | Access check on every fetch; private caching; per-mailbox keys; property-based and red-team tests |
| 4 | **Leakage between tenants** | Asana MCP | Tenant ID in the token **and** row-level security; per-tenant keys and vector indexes (no shared index filtered by metadata); per-tenant audience and issuer; canary tenants |
| 5 | **Abuse by a customer insider**: a manager or admin uses agents to surveil staff | n/a | T0 by default; T3 needs policy, a justification and transparency to the person concerned; no "search as user"; dual control for admin search |
| 6 | **Vendor insider** | Google Limited Use bans human reading without the user's affirmative agreement for specific messages | No standing access; customer-approved just-in-time access; customer-held keys (BYOK/HYOK) for crypto-shredding |
| 7 | **Governance bypass**: excluded or opted-out data surviving in derived artifacts, embeddings, caches, events, or agents' memory | n/a | Purge propagation through lineage; enforce at ingest; contracts and logs for data already handed to third parties |
| 8 | **Supply chain** | postmark-mcp silently BCC'd every email (Sep 2025); mcp-remote CVE-2025-6514; MCP Python SDK OAuth flaw GHSA-qx49-fqc8-xw99 (2026; dates vary across sources); Smithery token exposure (Oct 2025) | Remote-only official server; no local server holding credentials; SBOM, pinned dependencies, signing; publish official endpoints so customers can spot fakes |
| 9 | **Access token theft or client impersonation** | n/a | Section A2 |
| 10 | **Memory or fact poisoning**: crafted mail rewrites profiles ("Acme's CFO is now x@attacker") | n/a | Weight facts by provenance (authenticated internal and DMARC-pass sources first); never merge identities based on email content alone; show trust levels |
| 11 | **Webhook abuse**: server-side request forgery, replay, zombie subscriptions | n/a | Section A3 |
| 12 | **Denial of wallet / quota**: agent loops driving live upstream calls into Google's billed tier | n/a | Index-first serving; per-tenant budgets |

**Detail on threat 2 (upstream credential theft).** Mitigations:
- **No exported service-account keys.** Sign tokens through IAM impersonation from a locked-down workload, and set the org policy that disables key creation. For Entra, use federated or managed credentials rather than secrets.
- **No single credential that works across all customers.**
  - A single multi-tenant Marketplace service account, or a single multi-tenant Entra app, means one stolen credential opens every customer.
  - Default to a **service account per tenant**: the customer admin grants domain-wide delegation to that tenant's client ID.
  - Offer an **"isolated mode"** where the service account or app registration is owned by the customer.
- Minimal scopes: `gmail.readonly` rather than `mail.google.com`, and `gmail.metadata` for a metadata-only tier.
- Upstream mailbox scoping where available (Exchange RBAC for Applications).
- Network isolation of ingestion, and anomaly detection on upstream usage.
- Publish our client IDs as indicators of compromise, as Vercel did, and keep a revocation runbook.

**Rollout priorities:**
- **P0 (before the first customer):**
  - keyless, per-tenant upstream credentials;
  - per-tenant isolation;
  - T0 default;
  - an access check on every object;
  - sanitization;
  - no send or fetch tools;
  - audit visible to the people concerned;
  - exclusions enforced at ingest;
  - full MCP 2026-07-28 auth compliance;
  - CASA readiness.
- **P1:**
  - Enterprise-Managed Authorization;
  - Shared Signals / CAEP;
  - DPoP;
  - egress anomaly detection;
  - data-loss-prevention redaction;
  - customer-held keys;
  - isolated mode.
- **P2:**
  - externalize the policy engine via the AuthZEN Authorization API 1.0 (final since Jan 2026);
  - the COAZ-MCP binding is still a draft;
  - Transaction Tokens (draft -11) for internal service chains;
  - confidential computing.

---

## C. Which directions the platform can extend into

**Sources:**

| Source | Feasibility | Notes |
|---|---|---|
| Microsoft 365 mail | **Go** | Graph only (EWS is off). RBAC for Applications enforces exclusions on Microsoft's side, which beats doing it only ourselves. Competing or channel: Microsoft's own Work IQ Mail MCP (preview, requires a Copilot license) and the Copilot Retrieval API. Teams access via Graph "protected APIs" approval: **unverified**. |
| Google Calendar | **Go** | Highest value for `brief_for_meeting`; low risk at T0. |
| Google Drive | **Go, carefully** | Mirror the source access lists and re-check them at read time; don't invent our own. |
| Google Chat | Probable | Google's own Chat MCP is in preview. The domain-wide delegation details for a third-party ingester: **unverified**. |
| Slack | **Federated only** | Terms in force since 29 May / 30 Jun 2025 ban bulk export and persistent copies or indexes, and LLM training (secondary source). Non-Marketplace apps are limited to 1 request/minute with 15 messages per `conversations.history` call. Indexing Slack is not viable; querying it live with the user's token after Marketplace approval is. The "Real-time Search API" details: **unverified**. |
| CRM, meeting transcripts, ticketing, GitHub | Go, with user-delegated tokens | Lower sensitivity than mail. These integrations are now the favourite ShinyHunters target, so the same token hygiene applies. |

**Strategic implication:** platform owners are fencing off agent access to their data. Google's tiering, Slack's terms and Microsoft's push toward Copilot APIs all point the same way. Build **federated query-time retrieval** as a first-class mode alongside indexing; bulk-copy rights cannot be assumed.

**Product directions:**
1. **Context firewall / MCP gateway (high feasibility, defensible).**
   - Sell the governance (exclusions, embargo, audit, injection defense, per-client policy).
   - Sell it even in front of Google's Workspace MCP and Microsoft's Work IQ.
   - There are competing MCP gateway vendors; how strong they are is **unverified**.
2. **Commitments and follow-ups at T0:** high value, low risk.
3. **Relationship intelligence at the T2 metadata tier:** high sales value, but privacy-sensitive. Needs transparency and opt-out.
4. **Account timelines for customer success:** shared within account teams at T3.
5. **In-tenant / bring-your-own-cloud deployment:** the strongest answer for regulated buyers; removes vendor-insider and cross-tenant risk.
6. **Write-back (drafts, labels, calendar holds, CRM updates):** feasible behind confirmation flows (Google requires them). Avoid autonomous sending.
7. **Security use of org-wide context (BEC and phishing detection):** fits the org-wide grant, but the market is crowded.

**Avoid:**
- people analytics, sentiment or performance scoring (EU AI Act Art. 5; Annex III employment obligations reportedly delayed to 2 Dec 2027, entry into force **unverified**);
- training models on customer data (Google and Slack both ban it);
- "any employee can search anyone's mail";
- bulk indexing of Slack;
- agents sending email on their own.

---

## Unverified or open items

- **Google domain-wide delegation scoping:** whether delegation can be limited to an org unit, and how Marketplace admin-install scoped to OUs or groups (which is verified) interacts with service-account delegation.
- **CASA exemptions:** whether there is any exemption for apps admin-installed via Marketplace. Assume there isn't: the "only used within your own domain" exemption does not apply to a vendor.
- **Client support:**
  - DPoP support in MCP clients.
  - Whether ChatGPT and Gemini Enterprise support MCP 2026-07-28 and Enterprise-Managed Authorization. Gemini Enterprise's custom MCP is in preview per vendor blogs. OpenAI's help page returned 403 to fetching; its RBAC and per-action controls are known from search snippets only.
  - Whether clients honor `audience: ["user"]`.
- **Google Workspace MCP specifics (secondary):** tool names (`search_threads`, `get_thread`, `create_draft`, which collide with our proposed names), the absence of a send tool, and Google's advice not to combine Gmail, Drive and Chat.
- **Dates and claims needing primary confirmation:** exact dates for the MCP Python SDK flaw; Midnight Blizzard details (MSRC text was not fetched directly); Teams protected-API status; the Slack Real-time Search API.

## Sources

**MCP spec:**
- https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
- https://modelcontextprotocol.io/specification/2026-07-28/changelog
- https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration
- https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations
- https://modelcontextprotocol.io/specification/2026-07-28/server/tools
- https://modelcontextprotocol.io/docs/extensions/overview
- https://raw.githubusercontent.com/modelcontextprotocol/ext-auth/main/specification/stable/enterprise-managed-authorization/2026-07-28/enterprise-managed-authorization.mdx
- https://raw.githubusercontent.com/modelcontextprotocol/ext-auth/main/specification/stable/oauth-client-credentials/2026-07-28/oauth-client-credentials.mdx

**IETF and OpenID:**
- https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/
- https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/
- https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/
- https://datatracker.ietf.org/doc/draft-ietf-oauth-transaction-tokens/
- https://openid.net/authorization-api-1-0-final-specification-approved/
- https://openid.github.io/authzen/authzen-mcp-profile-1_0.html
- https://www.helpnetsecurity.com/2025/09/22/openid-standards-real-time-security-event-sharing/

**Clients:**
- https://claude.com/docs/connectors/building/authentication
- https://help.openai.com/en/articles/12584461 (search snippet only)

**Google:**
- https://developers.google.com/workspace/workspace-api-user-data-developer-policy
- https://developers.google.com/terms/api-services-user-data-policy
- https://developers.google.com/workspace/gmail/api/auth/scopes
- https://developers.google.com/workspace/gmail/api/guides/push
- https://developers.google.com/workspace/tools-safety
- https://developers.google.com/workspace/gmail/api/reference/quota
- https://workspaceupdates.googleblog.com/2026/05/agent-tools-and-security-updates-for-workspace-developers.html
- https://knowledge.workspace.google.com/admin/apps/domain-wide-delegation-best-practices
- https://knowledge.workspace.google.com/admin/apps/install-marketplace-apps-for-your-organization

**Microsoft:**
- https://learn.microsoft.com/Exchange/permissions-exo/application-rbac
- https://learn.microsoft.com/graph/api/resources/subscription
- https://techcommunity.microsoft.com/blog/exchange/exchange-online-ews-your-time-is-almost-up/4492361
- https://mc.merill.net/message/MC1227454
- https://learn.microsoft.com/microsoft-agent-365/tooling-servers-overview
- https://learn.microsoft.com/microsoft-365-copilot/extensibility/copilot-apis-overview

**Slack:**
- https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps
- https://api.slack.com/changelog/2025-05-terms-rate-limit-update-and-faq

**Incidents:**
- https://vercel.com/kb/bulletin/vercel-april-2026-security-incident
- https://thehackernews.com/2025/08/google-warns-salesloft-oauth-breach.html
- https://labs.cloudsecurityalliance.org/research/csa-research-note-shinyhunters-oauth-saas-abuse-20260716-csa/
- https://www.wiz.io/blog/midnight-blizzard-microsoft-breach-analysis-and-best-practices
- https://thehackernews.com/2025/06/zero-click-ai-vulnerability-exposes.html
- https://thehackernews.com/2025/09/shadowleak-zero-click-flaw-leaks-gmail.html
- https://permiso.io/blog/copilot-prompt-injection-ai-email-phishing
- https://authzed.com/blog/timeline-mcp-breaches
- https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp

**Agent security patterns:**
- https://ai.meta.com/blog/practical-ai-agent-security/
- https://simonwillison.net/2025/Nov/2/new-prompt-injection-papers/
- https://arxiv.org/abs/2506.08837
- https://www.giskard.ai/knowledge/owasp-top-10-for-agentic-application-2026

**EU AI Act (secondary):**
- https://secureprivacy.ai/blog/eu-ai-act-digital-omnibus-the-new-high-risk-ai-deadlines-after-council-approval
