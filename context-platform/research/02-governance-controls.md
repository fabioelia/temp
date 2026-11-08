# 02 — Governance & Controls Product Surface

**Lane:** what admins, DPOs, security teams, works councils and employees can see and control. **Date:** 2026-11-08. **Assumptions:** mid-market first (200–5,000 seats), US + EU/UK, Google Workspace first and then Microsoft 365.
**Verification:** claims about vendors link to sources checked on 2026-11-08. **[unverified]** marks anything I could not confirm against a primary source.

---

## 0. Thesis: why governance is the product

Microsoft and Google both avoid giving a single AI system org-wide read access to mailboxes:
- Microsoft 365 Copilot runs "in the security context of the user who initiates the prompt" ([MS Learn](https://learn.microsoft.com/purview/dlp-microsoft365-copilot-location-learn-about)).
- Gemini Enterprise's Gmail connector uses per-user OAuth consent ([Google Cloud](https://docs.cloud.google.com/gemini/enterprise/docs/connectors/gmail)).
- Glean indexes mail, but each person searches only their own mailbox ([Glean docs](https://docs.glean.com/connectors/native/gmail/new-setup)).

Our admin-granted, org-wide ingestion is both the differentiator and what security reviews will target. Three principles: **minimize at ingestion** (don't fetch what no agent should see), **mirror at retrieval** (agents see only what their user could see; org-wide agents are an approved exception), and **prove everything** (immutable, exportable logs of every ingestion decision and retrieval).

---

## 1. Control catalog

Tier key: **M** = MVP, **E** = Enterprise tier, **L** = later.

### 1.1 Scope: whose mailboxes are ingested

| Control | Purpose | User | Tier |
|---|---|---|---|
| **Source-enforced scope** | On M365, generate an Exchange *RBAC for Applications* management scope so that Microsoft itself blocks mailboxes outside scope. The tenant-wide Entra `Mail.Read` consent must be removed, or it overrides the scope ([MS Learn](https://learn.microsoft.com/graph/auth-limit-mailbox-access)). On Google, domain-wide delegation (DWD) cannot be limited to an OU ([Google](https://support.google.com/a/answer/14437356)), so scope is enforced only by our platform. OU-level App Access Controls exist ([Workspace Updates](https://workspaceupdates.googleblog.com/2024/03/organizational-unit-level-app-access-controls.html)), but whether they limit a DWD service account is **[unverified]**. | IT admin, security | M |
| **OU / group / user include and exclude** | Staged rollout and carve-outs. Exclude always beats include. Group membership syncs every 15 minutes or less. | IT admin | M |
| **Default-excluded sensitive groups** | Pre-mapped exclusions applied at setup: executives, board, HR, Legal, M&A/deal teams, internal investigations, security incident response, works council and union reps, employee-assistance and medical staff. The setup wizard maps each one to a directory group. | DPO, General Counsel | M |
| **Counterparty exclusion** | Excluding a mailbox does not exclude that person's mail sitting in other mailboxes. This control drops or restricts any message where an excluded person is sender or recipient. The policy can apply it to all excluded groups or only to selected ones (for example Legal and HR). Buyers rarely think of this until it is pointed out. | DPO, GC | M |
| **New-hire default** | Either "pending" (not ingested until the employee acknowledges the notice and N days pass, the EU default) or "auto-include" (the US default). | HR, DPO | M |
| **Shared and service mailboxes** | Off by default. Enrolled one at a time with a named owner. The ACL comes from the mailbox's delegates. No-reply and system mailboxes are always excluded. | IT admin | M |
| **Delegated access** | Not mirrored by default, matching Gemini, which cannot see mail in inboxes delegated to the user ([Google](https://support.google.com/a/users/answer/17010577)). | IT admin | M |
| **Leavers** | Suspension or deletion in the directory stops ingestion immediately (see §1.5). | IT admin | M |
| **Scope-drift alerts** | Alert when an OU move, group change or new mailbox would widen scope. Expansions above a threshold need approval. | Security | E |

### 1.2 Content: which items are ingested

Every content rule returns one of four actions: `exclude`, `ingest_redacted`, `ingest_restricted` (only certain agents can retrieve it) or `flag`.

| Control | Default | Notes |
|---|---|---|
| **Never-ingest guardrails** (cannot be overridden) | On | Drafts, Spam, Trash. Client-side-encrypted and S/MIME bodies. Gmail confidential-mode messages: their bodies are replaced by a link, and only Vault can read the internal copy ([Google](https://support.google.com/a/answer/7684332)). Document this behavior; don't work around it. |
| **Gmail user labels / Outlook categories and folders** | Exclusion label "AI-Private" | Labels are visible through the read-only Gmail API. Categories are a standard Graph message property. |
| **Classification labels** | Map label to action | Gmail classification labels are GA ([Workspace Updates](https://workspaceupdates.googleblog.com/2025/04/data-classification-labels-for-gmail-generally-available.html)) and appear in the API as `classificationLabelValues` ([Gmail API](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages)). Purview sensitivity labels follow the same model. By default, labels that apply encryption are excluded. How a message's Purview label is read through Graph (for example via the `msip_labels` header) is **[unverified]**. |
| **Sender / recipient / domain lists** | Seeded deny-list | Outside counsel, banks, benefits and health providers, consumer webmail domains. |
| **Keyword / regex** | Empty | Deal codenames, "privileged & confidential", matter numbers. |
| **ML classifiers** | On, conservative | Attorney-client privilege, medical/HR/health, personal/non-work, credentials and secrets, financial account data (PAN/IBAN), government IDs. Each class has its own confidence threshold and action. Low-confidence hits go to a review queue that shows metadata only. Each class publishes a precision/recall target. |
| **Attachments** | Office/PDF/text only, ≤25 MB | No archives, executables or encrypted PDFs. OCR of images is opt-in. Attachments are always subject to the parent message's decision. |
| **External senders** | Ingest, tagged `untrusted` | Can be set to exclude, matching Copilot's DLP "block external email" (preview) ([MS Learn](https://learn.microsoft.com/purview/dlp-microsoft365-copilot-location-learn-about)). Prompt-injection scanning sends hits to quarantine. |
| **Calendar** | Metadata only | Private events are excluded (Google "private" visibility, Outlook `sensitivity=private`). Bodies and attachments are opt-in. Copilot's label DLP doesn't cover calendar invites, so we should. |
| **Newsletters and automated mail** | Excluded | Detected by `List-Unsubscribe`, `Precedence: bulk`, `Auto-Submitted`, and Gmail's Promotions/Social categories. |
| **BCC** | Sender's copy only | BCC recipients are never exposed to other principals. |
| **Backfill window** | 12 months | Configurable from 0 to 36 months. Glean's default is about 6 months ([Glean](https://docs.glean.com/connectors/native/gmail/new-setup)). |

### 1.3 End-user controls

**How each "do not ingest" mechanism holds up:**

| Mechanism | Works on received mail? | Mobile | Install | Retroactive | Verdict |
|---|---|---|---|---|---|
| **Gmail user label "AI-Private"** (plus Gmail filters that apply it automatically) | Yes | Yes | None | Yes. A `labelAdded` event in the History API triggers a purge. | **MVP primary.** Zero-install, works everywhere, users already understand labels. Weaknesses: users must discover it, and it is a per-user label (we provision it, or the user creates it with a fixed name). |
| **Google Workspace add-on** ("Exclude thread", "Always exclude sender", "What's ingested?") | Yes | Yes. Contextual triggers work in the Gmail mobile app ([Google](https://developers.google.com/workspace/add-ons/guides/workspace-restrictions)). | Admin installs it as a private Marketplace app. | Yes | **MVP+ / E.** Store the decision on our side so we don't need write scopes. Applying a Gmail label ourselves would require `gmail.modify` ([Gmail API](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/modify)). |
| **Gmail classification labels** | **No.** Users can apply them only while composing, not after sending, and not on mail from outside the org. Gmail search can't filter by them ([Gmail Help](https://support.google.com/mail/answer/15550077)). | Unclear: the beta was web-only and GA added mobile per secondary sources **[unverified]**. | Admin-configured. Manual labels need Business/Enterprise editions, DLP-applied labels need Enterprise ([Workspace Updates](https://workspaceupdates.googleblog.com/2024/11/open-beta-data-classification-labels-gmail.html)). | DLP can label mail after it is sent ([Google Admin](https://knowledge.workspace.google.com/admin/security/gmail-dlp-and-automatic-classification-labels)). | **Honor as a sender or admin signal** ("Confidential" applies to every copy). Don't use it as the employee opt-out. |
| **Outlook category "AI-Private"** | Yes | Mobile support **[unverified]** | None | Yes, through change notifications or delta queries | **MVP primary for M365.** Graph is restricting app writes to sensitive message properties from 2026-12-31, but categories are explicitly excluded from that ([Office365ITPros](https://office365itpros.com/2026/03/26/sensitive-message-properties-graph/)). |
| **Outlook add-in** | Yes | Read-mode add-ins on mobile | Centrally deployed through Integrated Apps | Yes | **E.** It can set categories (needs read/write item permission; [MS Learn](https://learn.microsoft.com/office/dev/add-ins/outlook/categories)) or record the decision on our side. |
| **Purview sensitivity labels** | Applied by the sender. Whether recipients can relabel is **[unverified]**. | Yes | Customer's existing taxonomy | Yes | **Honor as an admin signal.** Matches Copilot DLP's "prevent processing" for labeled email ([MS Learn](https://learn.microsoft.com/purview/dlp-microsoft365-copilot-location-learn-about)). |

**Who a marking protects.** When a sender marks a message (label at compose time, or "AI-Private" on their Sent copy), the exclusion applies to every internal copy, matched by RFC 822 `Message-ID`. When a recipient marks a message, only that recipient's copy is excluded by default. A tenant option can extend that to all copies.

**Personal-email auto-detection (M).** A classifier plus heuristics (consumer webmail counterparties, family, medical appointments, banking, school, personal purchases) excludes these by default. Employees get a monthly digest with counts only ("37 personal emails skipped") and a one-click way to report a misclassification.

**"My AI Context" transparency page (M basic, E full):** what has been ingested about me (counts by source, label and time; browse my own items); what was excluded and why; and who accessed it (which agent, on behalf of whom, which items, when, for what purpose, including org-wide agents). Break-glass access appears after a configurable disclosure delay so investigations aren't tipped off; the DPO and works council set the delay. Export as JSON/PDF, which also answers GDPR Art. 15 access requests.

**Right-to-object flow (M):** the employee objects (GDPR Art. 21; a configurable opt-out request in the US) → their ingestion is **suspended immediately and provisionally** and their items hidden → DPO queue with a 30-day SLA → decision and reasoning recorded → if upheld, purge per §1.5 (optionally with counterparty protection); if rejected, the employee is told why and ingestion resumes.

### 1.4 Time: the 24h embargo

**What a delay actually protects against:**

| Risk | How long the risk lasts | Does a 24h embargo help? | Better primary control |
|---|---|---|---|
| Undo send | Gmail: 5–30 s ([Google](https://blog.google/products-and-platforms/products/gmail/how-to-unsend-email-gmail/)) | Overkill. An unsent message never reaches the mailbox. | A few minutes of settle time |
| Misdirected email, recall | Exchange Online cloud recall hard-deletes the message from recipients' mailboxes, and can happen long after sending ([MS Exchange blog](https://techcommunity.microsoft.com/blog/exchange/cloud-based-message-recall-in-exchange-online/3744714)). Admin-set time limits (secondary sources say 5 min to 10 years) **[unverified]**. Gmail has no recall. | Partly | **Propagate deletions** (§1.5) |
| Sender regret (delete or label after sending) | Usually minutes to hours | Yes | Settle window plus retroactive label purge |
| Classifier or human review | Minutes to hours | Yes, for sensitive classes | Quarantine queue |
| Asynchronous DLP labels | Gmail applies DLP labels after delivery ([Google Admin](https://knowledge.workspace.google.com/admin/security/gmail-dlp-and-automatic-classification-labels)) | Yes | Settle window |
| Malicious mail removed after delivery | Typically minutes to hours (Defender ZAP, Gmail post-delivery removal) **[unverified timing]** | Yes, for external mail | Settle window for external mail plus injection scanning |

**What it costs:** stale agents, which breaks support triage, meeting prep and deal desks. Copilot and Gemini read mail in real time, so a blanket 24h delay is a competitive handicap that invites shadow-AI workarounds.

**Ingest-then-hide vs. fetch-later:** *Ingest-then-hide* fetches and classifies immediately, holds the item in an encrypted quarantine tier, and releases it instantly when the embargo ends. But processing has legally already happened, and items deleted meanwhile must be purged. *Fetch-later* stores only a metadata pointer and fetches content at release, so mail deleted or labeled in the meantime never leaves the source. That is the stronger minimization story for works councils, at the cost of load spikes and classifier latency at release.

**Recommendation:** make the embargo a **per-policy attribute** (by tenant, sender class, label or classifier class) set between 0 and 72 hours, not a single global setting:
- **Internal mail:** 15-minute settle window, fetch-later.
- **External inbound:** 60 minutes, fetch-later, plus injection and phishing checks.
- **Sensitive-adjacent mail** (low-confidence privilege or HR hits, counterparties in excluded groups): 24h, ingest-then-hide, released only after review or exclusion.
- **"EU Conservative" template:** 24h across all mail during the pilot, then reduce.

At release, always **re-check the item at the source** (does it still exist, what are its labels now). The embargo is never a substitute for continuous deletion propagation.

### 1.5 Lifecycle

| Event | How we detect it | Hidden from agents | Purged from primary index | Purged from derived data and backups |
|---|---|---|---|---|
| Source delete, move to Trash, or recall | Gmail History API and Pub/Sub watch; Graph change notifications and delta queries | ≤15 min | ≤24 h | Derived ≤72 h; backups ≤35 days |
| "AI-Private" label added, or user opts out | Same feeds, or our add-on | ≤5 min | ≤24 h | ≤72 h / ≤35 days |
| Policy tightened | Policy version change | Immediately, because retrieval re-evaluates | ≤24 h | ≤72 h |
| Employee departs | Directory suspend/delete event, SCIM, HRIS | ≤1 h | Configurable from 0 to 90 days (default 30) | Same |
| Tenant terminates | Contract | Immediately | ≤30 days, with a deletion certificate | Same |

**Derived data.** Every summary, extracted fact and embedding records which source items it came from. When any source item is removed, the derived artifacts that used it are deleted ("taint propagation"). Where possible they are rebuilt from the sources that remain.

**Copies agents already received** can't be recalled from a third-party agent or LLM. MCP responses carry `no-store`/TTL hints, the registry records each vendor's zero-data-retention status, and sales FAQs must state the limit plainly.

**Retention.** "AI-context retention" defaults to 12 months rolling and can never exceed the source's retention. We are not an archive: if the source no longer has an item, neither do we.

**Legal hold.** Vault and Purview remain the system of record, so index deletions continue during a hold. Retrieval logs may themselves be discoverable, so admins can preserve the audit log for named custodians and export it for eDiscovery (legal lane to review).

**Offboarding.** The leaver's own mailbox is hidden at once. Copies in colleagues' mailboxes stay, since they belong to the colleagues. A successor can get time-boxed access through an approval workflow.

### 1.6 Consumption: who can see what

**Three access modes:**
1. **User-delegated (default).** The agent acts for user X using X's token (OAuth/OBO, MCP OAuth 2.1 per the [MCP auth spec](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)). It sees only X's mailbox, plus shared mailboxes X is enrolled in.
2. **Service agent (org-wide).** The agent has its own identity, an explicit scope and a declared purpose. It must be approved and is logged in more detail.
3. **Break-glass.** Two approvers (Security plus Legal or DPO), a written justification, a time limit of 72 hours or less, recorded sessions, and delayed disclosure to affected employees.

**The agent registry (M)** records for each agent: identity (client ID or MCP CIMD URL; [Entra Agent ID](https://learn.microsoft.com/entra/agent-id/whats-new-agent-id) mapping later), owner, vendor, purpose code, data scope (sources, OUs, labels, time window), field level (metadata, snippets, body, attachments), allowed operations, redaction profile, rate limits, and expiry with 90-day recertification.

**Purpose binding.** Purposes come from a catalog (customer support, account context, meeting prep, knowledge Q&A). **Prohibited at platform level:** employee performance scoring, inferring employees' emotions (banned under EU AI Act Art. 5(1)(f) since 2025-02-02 ([Wolters Kluwer](https://legalblogs.wolterskluwer.com/global-workplace-law-and-policy/the-prohibition-of-ai-emotion-recognition-technologies-in-the-workplace-under-the-ai-act/))), and profiling union activity. Purpose is enforced through declarations, contract terms and query-pattern detection. Tell buyers honestly that it cannot be cryptographically guaranteed.

**Approval workflow (M simple, E multi-step).** Required when an agent's scope goes beyond one user, touches sensitive OUs, requests full bodies or attachments, or comes from a vendor without zero-data-retention terms. Approvers are the data owner and Security, with an optional works council notification step for EU tenants.

**Redaction at retrieval time.** PII, payment card data and secrets are masked by default for service agents. Each response is limited in length per item (for example 2,000 characters). A metadata-only mode is available.

**Rate and volume limits.** Each agent and principal has limits on items and bytes per hour. There is no bulk-export tool over MCP. Usage beyond baseline triggers a **circuit breaker** that suspends the agent automatically.

**Provenance tags.** Every returned item is tagged `internal`, `external` or `untrusted` so agents can discount injected instructions.

**LLM egress allow-list.** Per tenant, a list of which model providers context may be sent to.

### 1.7 Oversight

- **Ingestion decision log.** For each item: the decision, policy version, rule ID and classifier scores. Excluded items are logged by hashed ID only, so the log doesn't itself become sensitive.
- **Retrieval log.** Agent, on-behalf-of user, purpose, query (stored hashed or redacted per tenant setting), item IDs returned, redactions applied, and bytes. The same idea as Copilot's `AccessedResources` in Purview audit ([MS Learn](https://learn.microsoft.com/purview/audit-copilot)).
- **Integrity.** Append-only, hash-chained logs on WORM storage. Customers can verify the chain.
- **Anomaly alerts.** Volume spikes; off-hours bulk reads; **person-centric querying** (an agent pulling everything about one employee, a sign of surveillance); a new agent touching sensitive OUs; repeated hits on content just outside policy.
- **Reports.** *DPO:* scope, exclusions, objections, access requests, deletion-SLA compliance. *Works council:* aggregates only (agents, purposes, access volumes, policy changes), never individual monitoring. *CISO:* agents, approvals, alerts.
- **SIEM export.** Streaming in OCSF format to Splunk, Sentinel or Chronicle, or via S3 or webhook.
- **Admin action log.** Every policy change, approval and break-glass session.

---

## 2. Policy model sketch

**One engine, three enforcement points:** *ingest* (a metadata-only pass before fetching, then a content pass), *release* (end of embargo) and *retrieve* (every query). All three evaluate the same policy bundle, so a tightened policy applies at retrieval immediately, before the purge finishes. Build on Cedar or OPA. Unlike Glean's agent policies, which fail open ([Glean](https://docs.glean.com/administration/protect/ai-security/agent-access-policies)), **our engine fails closed**.

**Decision order:** `deny` > `quarantine` > `redact` > `allow_restricted` > `allow`. The most restrictive decision wins.

**Layers** (a lower layer can only restrict what a higher layer allows):
1. Platform guardrails
2. Legal holds and objections
3. Tenant policy
4. Delegated admin-unit policy
5. Agent scope
6. End-user opt-out

```yaml
policy: eu-conservative
version: 14
status: enforce            # draft | simulate | enforce
applies_to: { ous: ["/EU/**"], exclude_groups: [execs, hr, legal, board, mna] }
ingest:
  embargo:
    - when: { sender_class: internal }  delay: 15m  mode: fetch_later
    - when: { sender_class: external }  delay: 60m  mode: fetch_later
    - when: { classifier.privileged: ">=0.4" } delay: 24h mode: ingest_then_hide
  rules:
    - id: R1  deny:   { user_label: "AI-Private" }
    - id: R2  deny:   { counterparty_in: [legal, hr] }
    - id: R3  deny:   { classifier.personal: ">=0.7" }
    - id: R4  redact: { classifier.financial_account: ">=0.8" }
    - id: R5  deny:   { classification_label: { Sensitivity: [Restricted] } }
    - id: R6  allow_restricted: { sender_class: external, tag: untrusted }
retrieve:
  default_mode: user_delegated
  service_agents:
    - agent: support-copilot
      purpose: customer_support
      scope: { mailboxes: [support@, group:support-team], window: 90d, fields: [body] }
      redact: [pii, pan, secrets]
      limits: { items_per_hour: 2000 }
      approval: [data_owner, security]
      expires: 2027-02-01
```

```rego
default decision := "deny"
decision := "deny"  { item.excluded_by_user_or_label }        # guardrails and opt-outs first
decision := "deny"  { item.owner in data.objections }
decision := "allow" { req.mode == "user_delegated"; item.mailbox_owner == req.on_behalf_of
                      not item.restricted }
decision := "allow" { req.mode == "service"; a := data.agents[req.agent]
                      a.approved; time.now_ns() < a.expires_ns
                      item.mailbox in a.scope.mailboxes; item.age_days <= a.scope.window }
redactions := data.agents[req.agent].redact
```

**Versioning.** Policies are immutable and numbered, with a semantic diff between versions. Changes need two-person approval. Every logged decision is stamped with the policy version, and rollback is one click.

**Simulation.** *Dry-run* evaluates a draft against the last 30 days of metadata and reports counts by OU, label and classifier class, the delta from the live policy, and sample items (metadata only unless under break-glass). *Shadow mode* runs the draft alongside the live policy for 7–14 days and logs differences, like Purview's DLP simulation for Copilot ([MS Learn](https://learn.microsoft.com/purview/dlp-microsoft365-copilot-location-learn-about)) and Glean's flag-before-block rollout. Retrieval drafts are tested by *replaying* the last 7 days of retrieval logs.

**Applying changes to past data.**
- **Tightening** takes effect at retrieval immediately. A background purge job then runs, with progress tracked against the §1.5 SLAs.
- **Loosening is never applied backwards automatically.** Backfilling newly allowed content needs approval, and EU templates also require employee notice. This prevents silent scope expansion.

---

## 3. Admin console and onboarding

**Console sections:** Overview (coverage, health, SLA status) · Scope · Content policies · Agents (registry, approvals) · Employee controls · Lifecycle · Simulation · Audit and reports · Settings and roles.

**Roles:** Platform admin, Policy admin, DPO (reports and objections, **no content access**), Security analyst, Agent owner, Approver, Auditor (read-only), Works council viewer (aggregates only). No admin role can read mail content by default.

**Onboarding flow:**
1. **Connect** with read-only scopes. On M365, a wizard generates the RBAC for Applications PowerShell and checks it with `Test-ServicePrincipalAuthorization`.
2. **Pick a template** (below) and **map sensitive groups**, including counterparty exclusion.
3. **Send the employee notice**; in the EU a 7–14 day notice period runs before ingestion.
4. **Pilot an OU of 20–50 people:** dry-run simulation report signed off by DPO and Security, then two weeks of retrieval shadow mode.
5. **Expand in waves.** Each wave needs no open SLA breaches, classifier precision at target, an objection rate below threshold, and a recorded approval.

| Template | Scope default | Embargo | Classifiers | Consumption |
|---|---|---|---|---|
| **EU Conservative** | Opt-in by OU, all sensitive groups excluded with counterparty protection, new hires pending | 24h during pilot, then 15/60 min | All on, low thresholds | User-delegated only. Service agents need DPO approval and works council notice. |
| **US Standard** | Whole domain minus sensitive groups, new hires auto-included | 15 min internal / 60 min external | All on | Service agents need Security approval |
| **Regulated (FS/Health)** | Like EU Conservative, plus PHI/PCI deny rules | 24h for external mail | Strict | Metadata-only by default |
| **Pilot Minimal** | One OU | 15 min | All on | User-delegated only |

**Employee notice (short form, EU variant):**
> "From [date], [Company] will make work email from [scope] available to approved AI assistants. They help you and your colleagues find information. Assistants see only what the person they are acting for could already see, unless an org-wide assistant has been approved for a stated purpose such as [purpose]. Personal, HR, legal and medical email is excluded automatically. To exclude any message, apply the **AI-Private** label (Gmail) or category (Outlook). At [link] you can see what has been ingested about you and who accessed it, and you can object. Questions: [DPO contact]."

Also ship: a US variant (shorter, notice and acknowledgment), a FAQ, a manager briefing, a works council information pack (purposes, data flows, aggregate reporting, prohibited uses), and an in-product banner for the add-on.

---

## 4. Prioritization

### What competitors treat as table stakes

| Capability | Glean | Microsoft Copilot + Purview | Gemini Enterprise / Workspace |
|---|---|---|---|
| Agents limited to the user's own permissions | Yes ([Protect](https://docs.glean.com/administration/protect/overview)) | Yes, always in user context | Yes. Per-user OAuth and source ACLs |
| Inclusion/exclusion of users and content | Per-connector rules; Gmail scope by users, groups, domains | RBAC for Applications scoping; DLP | Admin allow-lists of connectors and actions ([release notes](https://docs.cloud.google.com/agentspace/docs/release-notes)) |
| Excluding items by label | Protect+ hides flagged items | DLP "prevent processing" for labeled email sent on or after 2025-01-01 | DLP for Gemini covers **Drive only** ([Google](https://knowledge.workspace.google.com/admin/security/about-dlp-for-gemini)) |
| External email excluded | Not found | Preview | Not found |
| Agent-level runtime policies | Protect+ block/filter/flag, CEL expressions, most restrictive wins | Agent 365 / Entra Agent ID (GA 2026 per secondary sources) | Organization policy constraints on connectors (GA July 2026) |
| Simulation mode | Flag mode | DLP simulation | Not found |
| Retrieval audit | Audit logs | `CopilotInteraction` records with `AccessedResources` | Query and response logs in Cloud Logging |
| Oversharing controls | Sensitive findings | Restricted Content Discovery (Restricted SharePoint Search retires 2027-01-31) ([MC1427972](https://mc.merill.net/message/MC1427972)) | IRM-protected files are skipped |

### Release plan

| MVP (needed to sell mid-market) | Enterprise tier | Later |
|---|---|---|
| OU/group/user scope; default sensitive-group exclusions; counterparty exclusion | Source-enforced scope wizard (M365); scope-drift approvals | Slack, Drive and Chat scope parity |
| Never-ingest guardrails; label, category, sender and domain rules; newsletter and automated-mail filter | Custom regex; per-class tuning; human review queue | Customer-trained classifiers |
| Classifiers: personal, credentials/secrets, financial, HR/medical, privilege (conservative) | Honor Purview and Gmail classification labels; injection quarantine | Legal-hold-aware custodial preservation |
| "AI-Private" label (Gmail) and category (Outlook); basic transparency page; objection flow | Workspace add-on and Outlook add-in; full access history; disclosure delay | Cross-tenant identity (subsidiaries) |
| Per-policy embargo (15/60 min, 24h for sensitive), fetch-later | Ingest-then-hide quarantine with review | Learned embargo values per sender |
| Deletion and label propagation with contractual SLAs; lineage-based purge of derived data; offboarding | Retention tied to customer policy; successor access workflow | BYOK-scoped crypto-shredding (storage lane) |
| User-delegated retrieval; agent registry; simple approvals; rate limits; provenance tags | Service agents with purpose binding; multi-step approvals; break-glass; redaction profiles; circuit breaker | Entra Agent ID / Google agent identity federation |
| Immutable ingestion and retrieval logs; CSV/JSON export; SIEM webhook | OCSF streaming; anomaly detection; DPO and works council reports | Customer-verifiable log transparency |
| Policy versioning; dry-run | Shadow mode; retrieval replay; admin units | Policy-as-code with Git sync |

---

## 5. Gaps the founder didn't mention but buyers will ask about

1. **The counterparty problem.** Excluding the CEO's mailbox doesn't exclude the CEO's email in 4,000 other mailboxes. Counterparty exclusion and sender-marking that applies to every copy (§1.2, §1.3) are the answer.
2. **Copies held by agents.** Data already sent to third-party LLMs can't be deleted. Mitigate with a zero-data-retention registry, TTL hints and an LLM egress allow-list.
3. **Email as a prompt-injection channel.** Any external sender can write instructions to the customer's agents. Mitigate with provenance tags, quarantine and an option to exclude external mail (matching Copilot).
4. **Admins as insiders.** A platform with org-wide read is a super-search. No admin role reads content by default, break-glass needs two approvers, and every admin action is logged.
5. **Using the platform to surveil employees.** Org-wide agents could be pointed at individual employees. Mitigate with person-centric query detection, prohibited purposes, works council aggregate reports, and the German §87(1) no. 6 BetrVG co-determination right over tools capable of monitoring employees ([Covington](https://www.cov.com/-/media/files/corporate/publications/2026/07/works-council-rights-in-ai-implementation-projects.pdf)).
6. **Waiving privilege.** Sending privileged email to outside AI could be argued to waive privilege. Use a deny-by-default privilege classifier. Legal lane to confirm.
7. **Being able to verify scope on Google.** DWD can't be scoped per OU, so customers will want proof that out-of-scope mailboxes were never accessed. Offer customer-auditable impersonation logs, reconciled with Workspace audit logs where possible **[unverified that per-call DWD activity is visible to customers]**.
8. **eDiscovery and records for agent interactions.** Are retrievals and agent answers discoverable or retained? Offer custodial audit preservation and export.
9. **Kill switch.** One click to pause all ingestion and retrieval, per tenant or per agent.
10. **Also expect questions on:** which ACLs are mirrored for delegated, shared and group mailboxes; SCIM/HRIS leaver triggers (so terminations don't wait for IT); an exit deletion certificate and published sub-processor list (LLMs, OCR); residency of the index and derived data, including whether EU mail stays out of US-hosted model calls (storage lane); and classifier accountability (published precision/recall, user-reported misclassifications, no inferences about individual employees).
