# 04 — Ingestion and connector layer: feasibility, mechanics, limits, effort

*Lane: connectors and ingestion. Research date 2026-11-08. Every number below was checked against the linked official page on that date unless marked **(unverified)**. Two platform changes since late 2025 drive most of the conclusions: Google's **May 2026 Workspace API quota and tiering change**, and Slack's **2025 API Terms**.*

---

## 0. Executive summary

| Question | Answer |
|---|---|
| Is org-wide Gmail ingestion with governance hooks feasible? | **Yes.** Every hook (OU, group or user scope; label and sender exclusion; label-based opt-out; embargo; deletion propagation) maps onto documented Gmail and Admin SDK primitives. |
| Biggest constraint | **Gmail quota economics after 1 May 2026.** New Cloud projects get 6,000 units/min per user and 1.2M units/min per project. `messages.get` with `format=raw` now costs 60 units. A daily billing threshold of 80M units per project applies, and charges above it are "planned later in 2026". |
| Backfill, 2,000 users × 40k messages (80M messages) | **About 67 h (2.8 days)** at the project ceiling, if usage above the daily threshold is accepted. **About 60 days** if the job stays under the free threshold. Per user, the floor is about 6.7 h. |
| Microsoft 365 | Feasible, and backfill is faster per mailbox: 10,000 requests per 10 min and 4 concurrent requests per app per mailbox. **RBAC for Applications** gives Exchange-enforced mailbox scoping. EWS is retiring, so the connector is Graph-only. |
| Slack | **Do not index.** The Slack API Terms forbid bulk export and forbid "persistent copies, archives, indexes" of other orgs' data for the Data Access and Real-time Search (RTS) APIs. Build a federated connector on the Real-time Search API instead. |
| Embargo | **Delayed fetch** (store IDs only, fetch after the window, re-check state at fetch time). |
| Build vs. buy | **Build** the Google and M365 connectors. Use self-hosted **Nango** for OAuth and token plumbing on the long-tail SaaS connectors. Do not put Nylas or the unified APIs in the core email path. |
| Effort | Google MVP with governance hooks: **about 21 engineer-weeks**. M365: **about 13**. Extensions: 2–8 each (see §6). |

---

## 1. Google Workspace (deep dive)

### 1.1 Auth: domain-wide delegation (DWD) vs. a Marketplace app

| | Service account + DWD | Marketplace app, admin-installed domain-wide |
|---|---|---|
| Admin setup | A super admin pastes the client ID and scopes under Security → API controls → Manage Domain Wide Delegation. Multi-party approval may apply. ([Google](https://knowledge.workspace.google.com/admin/apps/control-api-access-with-domain-wide-delegation)) | One-click install from the listing. Google says service accounts used by a Marketplace-installed app "don't need to be manually set-up". ([Classroom DWD guide](https://developers.google.com/workspace/classroom/guides/key-concepts/domain-wide-delegation)) The page is written for Education, so whether this holds for all editions is **unverified**. |
| Scoping | The grant covers the **whole domain**. OU and group scoping has to be enforced in our code. | Install can be targeted at OUs or groups, so Google enforces part of the scope. **Unverified** for the Gmail-scope case. |
| Google review | Unclear. Google documents no explicit verification or CASA exemption for third-party DWD-only apps, and an open Sept-2026 forum thread asking exactly this has no answer ([thread](https://discuss.google.dev/t/does-oauth-app-verification-casa-apply-to-a-service-account-using-only-domain-wide-delegation-no-consent-screen-not-on-marketplace/395705)). **Unverified.** | `gmail.readonly` is a restricted scope and needs an annual security assessment ([Marketplace help](https://support.google.com/marketplace/answer/180490)), plus Marketplace review. Plan on weeks to months. |
| Google's stance | "Use domain-wide delegation only with a critical business case… Try alternatives such as OAuth with user consent or use Marketplace apps." ([DWD best practices](https://knowledge.workspace.google.com/admin/apps/domain-wide-delegation-best-practices)) | Preferred path. |

**Recommendation:** run design partners on **keyless DWD**. Start Marketplace listing and CASA Tier 2 on day one, in parallel, for GA. Enterprise security reviews will ask for CASA either way.

**Keyless options.** Google states that keys are "not necessary to perform domain-wide delegation. Use the signJwt API instead." ([best practices](https://knowledge.workspace.google.com/admin/apps/domain-wide-delegation-best-practices)) The flow:

1. The workload's own identity holds `roles/iam.serviceAccountTokenCreator` on the DWD service account. That identity is a GKE Workload Identity or an attached service account on GCP, or a **Workload Identity Federation** principal from AWS or Azure.
2. Call `iamcredentials.googleapis.com …/serviceAccounts/{sa}:signJwt` with claims `{iss: sa, sub: user@customer.com, scope, aud: "https://oauth2.googleapis.com/token", iat, exp≤1h}`.
3. POST the signed JWT to `oauth2.googleapis.com/token` using `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`. This returns a 1-hour token for that user. ([jpassing walkthrough](https://jpassing.com/2022/01/15/using-domain-wide-delegation-on-google-cloud-without-service-account-keys/))

WIF cannot do the user impersonation itself. It authenticates as the DWD service account, and that account then performs the delegation ([forum](https://discuss.google.dev/t/using-workload-identity-federation-for-admin-sdk-api/141779)). Validate WIF → signJwt end to end in a spike. **(unverified for our exact topology)**

**Admin setup steps (DWD path):**
1. *Vendor:* host the DWD service accounts in a dedicated project ([Google](https://knowledge.workspace.google.com/admin/apps/domain-wide-delegation-best-practices)). Use one SA per tenant to limit blast radius; see the [DeleFriend](https://hunters.security/en/blog/delefriend-a-newly-discovered-design-flaw-in-domain-wide-delegation-could-leave-google-workspace-vulnerable-for-takeover) design-flaw write-up. Set the org policy that disables SA key creation. Enable the Gmail, Admin SDK, Pub/Sub and IAM Credentials APIs.
2. *Customer super admin:* add the client ID with these scopes: `gmail.readonly`, `admin.directory.user.readonly`, `admin.directory.group.readonly`, `admin.directory.orgunit.readonly`. Add `gmail.labels` only if we will pre-create the opt-out label.
3. *Customer:* create a read-only custom admin role and user for Directory API impersonation. Optionally mark the app "Trusted" in App access control.
4. *Vendor:* create the Pub/Sub topic and grant publish to `gmail-api-push@system.gserviceaccount.com`. Org policies that restrict sharing to the domain may need an exception ([push guide](https://developers.google.com/workspace/gmail/api/guides/push)). The topic's project **must match** the project that calls `watch` ([watch ref](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users/watch)).

**BYO-project variant (enterprise tier).** The customer creates the SA in *their* GCP project and grants our WIF principal Token Creator on it. The customer gets its own quota pool, billing and a revocation switch, and we avoid the appearance of sharding projects to dodge limits. The [Google APIs ToS §2(d)](https://developers.google.com/terms) says "You agree to, and will not attempt to circumvent, such limitations." The constraint is that the watch topic must live in the customer's project, or the customer runs a small relay.

**Policy constraints on data use.** The [Workspace API User Data Policy](https://developers.google.com/workspace/workspace-api-user-data-developer-policy) forbids using user data "to create, train, or improve a machine learning or artificial intelligence model" beyond a user's personalized model. Its "Limited use" note also cites the ToS ban on "scraping, building databases" and permanent copies. Whether a customer-owned index falls under that note is a **legal review item**. Retrieval-only use with no training is the defensible position.

### 1.2 Directory (Admin SDK)

- `users.list` (`customer=my_customer`, up to 500 per page), `orgunits.list` and `groups.list` / `members.list`. Default quota is 2,400 queries/min per user per project. A per-account 429 limit also exists and cannot be raised ([limits](https://developers.google.com/workspace/admin/directory/v1/limits)).
- **Change detection:** push notifications exist **only for the Users resource** (add, delete, update, makeAdmin, undelete). Channels must be renewed by hand ([push](https://developers.google.com/workspace/admin/directory/v1/guides/push)). Group-membership and OU changes must be polled, every 10–15 min with a diff. The Reports API admin and groups activity logs can serve as a faster hint **(unverified event names)**.
- **Scope engine:** effective scope = (included OUs ∪ included groups ∪ included users) − (excluded OUs, groups or users) − opted-out users. When a user leaves scope, the connector calls `users.stop` on their Gmail watch, deletes their checkpoints and emits a mailbox-level purge.

### 1.3 Gmail backfill

**Mechanics:** call `messages.list` (5 units per page of up to 500 IDs, newest first). Then fetch each message in batches, at most 50 per batch. Each call inside a batch is charged individually, and "larger batch sizes are likely to trigger rate limiting" ([batch guide](https://developers.google.com/workspace/gmail/api/guides/batch)).

**Format trade-off.** All costs are from the [quota page](https://developers.google.com/workspace/gmail/api/reference/quota).

| `format` | Cost (new quotas) | Gives you | Use |
|---|---|---|---|
| `minimal` / `metadata` | 20 | IDs and labels, or headers too | Label re-checks; the header-only policy pre-pass |
| `full` | 60 | Parsed MIME tree. Attachments need a separate `attachments.get` call at **20 each**. | Avoid |
| `raw` | 60 | The complete RFC 822 message, base64url-encoded, attachments inline, plus `labelIds`, `threadId` and `historyId` | **Default.** One call per message, full fidelity, and suitable for dedup and hashing. |

A metadata pre-pass (20) followed by raw (60) only pays off if more than a third of mail is excluded. Push label, sender and date exclusions into the `messages.list` `q` string instead; that is almost free. Re-check after fetching, because the search index can lag.

**Quotas.** Per project: 1,200,000 units/min. Per user per project: 6,000 units/min. Daily billing threshold: 80,000,000 units per project, and it cannot be raised. "Cloud projects created on or after May 1, 2026 are subject to the new API quotas." Projects that used the API between Nov 2025 and Apr 2026 keep their old quotas. Charges above the threshold are "planned… later in 2026" with 90 days' notice, and pricing is not yet published ([quota page](https://developers.google.com/workspace/gmail/api/reference/quota); [tiering announcement](https://developers.google.com/workspace/tools-safety)). Other costs: `history.list` 2, `watch` 100, `threads.get` 40 (120 for full). Tools built for the old model fail under the new one; GYB's limiter assumed 250 units/s and 5 units per get and now hits 403 `rateLimitExceeded` ([GYB #546](https://github.com/GAM-team/got-your-back/issues/546)). A new startup project lands on the new model.

**Worked example: 2,000 users × 40,000 messages = 80M messages, `format=raw`:**

| Constraint | Math | Result |
|---|---|---|
| Per user | 40k × 60 = 2.4M units ÷ 6,000/min | **6.7 h per mailbox** (about 1.7 msg/s) |
| Per project | 80M × 60 = 4.8B units ÷ 1.2M/min | **4,000 min ≈ 67 h ≈ 2.8 days.** About 333 msg/s, about 200 mailboxes in flight at full per-user rate. |
| Daily free threshold | 80M units/day ÷ 60 | 1.33M msg/day, so **about 60 days** to stay under the threshold |
| Listing overhead | 160k list calls × 5 | 0.8M units, negligible |
| Bandwidth (assume 75 KB/msg, **unverified average**) | 333 msg/s × 75 KB | About 25 MB/s; about 6 TB total |

**Implication:** backfill cost, not feasibility, is the constraint. Use **tiered backfill**. Pass 1 covers the last 90 days for every in-scope user: about 3k msgs per user, 360M units, about 5 h at the project cap or about 4.5 days under the threshold. Pass 2 covers deep history, throttled to the budget. The steady state is cheap: about 120 new messages per user per day at 60 units, plus `history.list` and a daily `watch`, comes to about 7.5k units per user per day. One project therefore carries **about 10k mailboxes** of steady state under the free threshold. For large tenants, file quota-increase requests (billing must be enabled) or use BYO projects.

**Safe parallelization:**
- Debit a two-level Redis token bucket (100 units/s per user, 20k units/s per project) by the method's cost *before* each call.
- Keep about 4–8 requests in flight per user. Gmail's per-user concurrency 429 threshold is undocumented **(unverified)**.
- On 403 `rateLimitExceeded`, 429 or 5xx, use truncated exponential backoff with jitter, capped at 32–64 s (Google's guidance), and shrink that user's bucket for 5 min (AIMD).
- Checkpoint `(user, pageToken)` per page. Use weighted fair queuing across tenants, and always run incremental sync ahead of backfill.
- Capture the `historyId` from `getProfile` **before** listing, so incremental sync picks up without a gap.

### 1.4 Incremental sync, opt-out and deletion

- **`users.watch`** delivers to Pub/Sub. "You must call the watch method at least once every 7 days." Google recommends calling it daily. The notification carries only `{emailAddress, historyId}`. There is a cap of **1 notification per second per user**, and notifications above it are dropped. Delivery is "typically… within a few seconds", but notifications "might be delayed or dropped", so fall back to polling `history.list` ([push guide](https://developers.google.com/workspace/gmail/api/guides/push)). Treat a notification as a *hint* and coalesce per user. Pub/Sub delivery is at-least-once.
- **`users.history.list`**: `historyTypes` = `messageAdded | messageDeleted | labelAdded | labelRemoved`, up to 500 per page, returned in increasing `historyId` order. `messagesDeleted` means "deleted (not Trashed)". An invalid or out-of-date `startHistoryId` returns **404**, and the client must run a full sync ([history ref](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.history/list)). History is "typically available for at least one week… might be significantly shorter" ([sync guide](https://developers.google.com/workspace/gmail/api/guides/sync)).
- **Full resync and reconciliation:** list every message ID, which costs about 400 units for a 40k mailbox. Diff against the stored set: missing IDs become deletes, new IDs become fetches. Run this **weekly for every mailbox** even without a 404, because push can drop notifications.

**Opt-out via label:**
1. The label name is configured by the admin, e.g. `AI-Exclude`. Label IDs are per mailbox, so resolve name → ID with `labels.list` (1 unit) on each cycle, or pre-create the label with `labels.create` under the `gmail.labels` scope.
2. When a `labelsAdded` event contains the opt-out ID, add the **threadId** to the user's exclusion set and emit `DELETE(reason=opt_out)` for every message in the thread. Gmail's UI applies labels to the whole conversation, but future replies will not carry the label, so the exclusion has to be thread-level.
3. When `labelsRemoved` removes it, the thread becomes eligible again. Re-fetch subject to the embargo.
4. Treat `TRASH` and `SPAM` as deletion-equivalent (policy-configurable). Trash auto-purges after 30 days and then produces `messageDeleted`.

**Deletion propagation:** `messageDeleted`, a trash event, a scope exit or a user deletion produces an idempotent tombstone for `(tenant, mailbox, gmail_id)`. Canonical content is reference-counted across mailboxes (see §5 dedup) and is hard-deleted when the last reference goes. Ingestion publishes `DELETE` events that the storage lane must apply to chunks, embeddings and caches. Track a **deletion SLA metric**: p99 time from the Gmail event to a confirmed purge in all derived stores.

### 1.5 Embargo: ingest-and-hide vs. delayed fetch

| | Ingest-and-hide | **Delayed fetch (recommended)** |
|---|---|---|
| Mechanics | Fetch at once and store with `visible_after = internalDate + N`; retrieval filters on it | Store only `(user, id, due_at)` from `messageAdded`. At `due_at`, `messages.get(raw)` and re-evaluate. |
| Deleted inside the window | Purge required: content, derived artifacts, backups | `get` returns 404, so the message is never ingested |
| Opt-out label applied inside the window | Purge required | `labelIds` in the raw response show the label, so it is dropped |
| Privacy claim | "We hold it but hide it" | "We never fetched it" (much stronger) |
| Quota | Wasted fetches for mail that is later deleted | Fetch only what survives the window |
| Cost | Visibility gating bugs leak data; embeddings exist early | A due-time scheduler, and a freshness lag equal to N |

Backfill honours the embargo with `q=before:<now−N epoch-seconds>`. With N = 0 the same pipeline degenerates to immediate fetch. Even after the window, opt-out and deletion events keep flowing, so the history consumer runs either way.

### 1.6 Attachments, threads, Vault

- **Attachments:** `raw` already contains them, at about 1.33× size after base64. Gmail accepts messages up to 50 MB ([Gmail help](https://support.google.com/mail/answer/6584), **not re-verified**). Files sent as Drive links are *not* in the message and need the Drive connector and its ACLs. Parse with Tika or unstructured inside a sandbox with per-file size, time and recursion caps (zip bombs). Expect encrypted PDFs, `winmail.dat` (TNEF), `.ics` and inline images; OCR is optional and costly. Messages protected by client-side encryption (CSE) cannot be read server-side.
- **Threads:** Gmail `threadId` is per mailbox. Build a cross-mailbox conversation key from the RFC 5322 `Message-ID`, `In-Reply-To` and `References` headers.
- **Vault API as a source:** not for the MVP.
  - It needs a Vault licence and Vault privileges (licence tiers **unverified**).
  - Allows no more than **20 exports in progress per organization**; export writes are 20/min per project ([Vault limits](https://developers.google.com/workspace/vault/limits)).
  - Exports expire after 15 days, and exports still running after 24 h return partial results ([Vault help](https://support.google.com/vault/answer/2473458)).
  - It has no change feed, and it returns *retained* mail that users deleted, which breaks deletion semantics unless reconciled against Gmail IDs (that mapping is **unverified**).
  - Its one use: a quota-free bulk accelerator for very large tenants.

### 1.7 Other Workspace sources (brief)

| Source | Mechanics | Limits and gotchas | Feasibility |
|---|---|---|---|
| **Drive** | Per user via DWD, or per shared drive: `changes.getStartPageToken` / `changes.list` with `files.watch`. Permissions have to be mirrored for retrieval-time ACLs. **Drive Labels** can carry a file-level opt-out. | New quotas: 1M units/min per project; List = **100** units; download/export = **200**; daily threshold 400M units and 1 TB egress ([Drive limits](https://developers.google.com/workspace/drive/api/guides/limits)). Docs export size cap **unverified**. The ACL model (inherited, link-shared, groups) is the hard part. | High value, 6–8 wks |
| **Calendar** | `events.list` with `syncToken` (410 → full sync) plus watch channels | 600 req/min per user, **10k/min per project**, 1M/day threshold ([Calendar quota](https://developers.google.com/workspace/calendar/api/guides/quota)). The project cap binds during onboarding. Private events need special handling. | Easy |
| **Chat** | DWD per user: `spaces.list` then `spaces.messages.list` (page size up to 1,000). Dedupe across members. | App auth (`chat.app.messages.readonly`) needs admin approval and Marketplace publication. The app must be a member of the space and "only returns public messages" ([messages.list](https://developers.google.com/workspace/chat/api/reference/rest/v1/spaces.messages/list); [auth](https://developers.google.com/workspace/chat/authenticate-authorize-chat-app)). Quotas not checked **(unverified)**. | Medium |
| **Meet** | Meet REST `conferenceRecords` → transcripts/entries, recordings. Transcript Docs also land in the organizer's Drive (`drive.meet.readonly`). | Transcript entries are deleted **30 days** after the conference ([Meet artifacts](https://developers.google.com/meet/api/guides/artifacts)), so ingest promptly. Docs can take hours to appear. Recordings are video (we would transcribe at our own cost). | Medium |

---

## 2. Microsoft 365

**Auth and scoping.** Use a multi-tenant Entra app with an application permission (`Mail.Read`; or `Mail.ReadBasic.All` for metadata only). Use certificate or federated-identity credentials so no secret exists **(FIC details unverified)**. For scoping, **RBAC for Applications in Exchange Online** replaces Application Access Policies:
1. `New-ServicePrincipal`, pointing at the Entra service principal.
2. `New-ManagementRoleAssignment -Role "Application Mail.Read" -App … -CustomResourceScope <filter>` or `-RecipientAdministrativeUnitScope`.
3. `Test-ServicePrincipalAuthorization` to check the result.

Gotchas:
- Grants are a **union** with any Entra-consented `Mail.Read`. The customer must *not* consent to tenant-wide `Mail.Read`, or scoping does nothing.
- Permission changes cache for **30 min to 2 h**.
- `MemberOfGroup` scope filters ignore nested groups.
- Exclusive scopes don't restrict apps.

([Microsoft Learn](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac))

This is *better* than Google: the platform enforces mailbox scope.

**Directory:** use Graph `users/delta` and `groups/delta`. Directory subscriptions last up to about 29 days.

**Backfill:**
- Enumerate `mailFolders` recursively, then list messages with `$select`. Fetch MIME with `GET /users/{id}/messages/{id}/$value`.
- Outlook limits are **per app per mailbox**: **10,000 requests per 10 min**, **4 concurrent**. Graph JSON batches go to Outlook at most 4 at a time. The global ceiling is 130,000 requests per 10 s per app across all tenants ([throttling](https://learn.microsoft.com/en-us/graph/throttling-limits)).
- Ceiling is about 16 msg/s per mailbox, so a 40k mailbox takes 40–90 min. With about 500 mailboxes in parallel, a 2,000-user tenant finishes in **under a day** (planning estimate; Exchange backend throttling is not fully documented).
- **EWS** is disabled by default from Oct 1, 2026 and shut down from Apr 1, 2027 ([MC1227454](https://mc.merill.net/message/MC1227454)), so use Graph only.

**Incremental:**
- **Message delta** is **per folder**. Its only `$filter` is `receivedDateTime ge|gt`. `@removed` with `"reason":"deleted"` fires on *delete or move out of the folder* ([delta](https://learn.microsoft.com/en-us/graph/api/message-delta)). Request immutable IDs (`Prefer: IdType="ImmutableId"`) to tell moves from deletes.
- **Change notifications** on `/users/{id}/messages` last up to **10,080 min** (basic) or **1,440 min** when rich, with resource data ([subscription](https://learn.microsoft.com/en-us/graph/api/resources/subscription)). Rich notifications require `$select` for messages, an RSA encryption certificate, and JWT validation-token checks ([rich notifications](https://learn.microsoft.com/en-us/graph/change-notifications-with-resource-data)).
- Recommended pattern: basic notifications as a trigger, then delta, plus lifecycle notifications (`missed` → re-delta).

**Opt-out and deletion:** the user applies an `AI-Exclude` **Outlook category**, or moves the message to an excluded folder. Delta then reports the message as updated, and `categories` carries the category. Deletion arrives as an `@removed` entry that has no matching `created` in another folder.

**Sensitivity labels:** Graph has no first-class property for a message's label. Read the `msip_labels` header as an extended property `String {00020386-0000-0000-C000-000000000046} Name msip_labels` ([MS Q&A](https://learn.microsoft.com/en-us/answers/questions/681331/set-sensitivity-label-on-mail-message-using-graph?page=2), community-sourced, **verify**). Map label GUIDs to names via the [sensitivityLabels API](https://learn.microsoft.com/en-us/graph/api/security-informationprotection-list-sensitivitylabels). Bodies under Purview encryption are unreadable without super-user rights. Use labels as a policy input (e.g. exclude "Highly Confidential").

**Export options:**
- **Mailbox import/export API.** GA was announced May 2026 ([devblog](https://devblogs.microsoft.com/microsoft365dev/announcing-general-availability-of-the-mailbox-import-and-export-microsoft-graph-apis/)). It returns an **opaque** stream, at most 20 items per call, and Microsoft says it is not for backup. Not useful for AI ingestion.
- **Microsoft Graph Data Connect.** Bulk extraction into the customer's Azure. Last published rate is $0.75 per 1K objects (2023), so 80M messages ≈ $60k ([pricing post](https://devblogs.microsoft.com/microsoft365dev/microsoft-graph-data-connect-pricing-updates/); **verify current**). A niche accelerator only.

**Teams:**
- `GET /users/{id}/chats/getAllMessages` and `/teams/{id}/channels/getAllMessages` allow **200 rps per app per tenant** ([throttling](https://learn.microsoft.com/en-us/graph/throttling-limits)).
- These are **protected APIs** that need a request form ([MS Learn](https://learn.microsoft.com/en-us/graph/teams-changenotifications-chatmessage)).
- "Starting August 25, 2025, the Teams APIs are no longer metered" ([metered list](https://learn.microsoft.com/en-us/graph/metered-api-list)). Whether the `model=` parameter is still required is **unverified**.
- Tenant-wide subscriptions on `/chats/getAllMessages` support rich notifications. They last at most 3 days and need a `lifecycleNotificationUrl`.
- Images are hosted contents; files live in OneDrive or SharePoint.

**SharePoint/OneDrive:** `driveItem` delta per drive; subscriptions up to about 30 days. `Sites.Selected` allows scoped access. ACL mirroring is the main cost.

---

## 3. Extension connectors

| Connector | API viability | Key limits | ToS / policy risk | Eng-wks |
|---|---|---|---|---|
| **Slack** | **Index-based: no.** The API Terms (effective Oct 10, 2025) bar third parties from "bulk export Slack message and file data" except under an additional agreement. For the Data Access and Real-time Search APIs, "you may not create persistent copies, archives, indexes, or long-term data stores of other organizations' API Data". They also forbid using API data "to train a large language model" ([Slack API ToS](https://slack.com/terms-of-service/api)). The **Discovery API** is Enterprise-Grid-only and "may only be used for security and compliance use cases… eDiscovery, archiving, and data loss prevention" ([ToS](https://slack.com/terms-of-service/api); [help](https://slack.com/help/articles/360002079527)). **Viable:** a federated connector on the **Real-time Search API** (`assistant.search.context`), queried at agent time. It is limited to Marketplace or internal apps; "no unlisted distributed apps" ([RTS docs](https://docs.slack.dev/apis/web-api/real-time-search-api)). | Unlisted commercial apps: `conversations.history`/`replies` limited to **1 req/min, 15 objects** since May 29, 2025 ([changelog](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps)) | **High.** Commercial distribution requires Marketplace or a partner agreement. A "customer-built internal app pushes to us" workaround needs legal review. | 3–4 (RTS) |
| **Zoom** | Server-to-Server OAuth; recordings and transcripts APIs plus webhooks | Limits are **per account, shared across all apps**. Heavy and resource-intensive calls on Pro share 30k/day ([Zoom](https://developers.zoom.us/docs/api/rate-limits/)). We can starve the customer's other integrations. | Low–Med | 2–3 |
| **Notion** | Public OAuth integration that sees only pages granted to it. No org-wide admin content read was found **(unverified)**. | 180 req/min per connection (600 on Business and Enterprise), plus a workspace-wide limit ([Notion](https://developers.notion.com/reference/request-limits)) | Low | 2–3 |
| **Confluence / Jira** | Forge or OAuth 3LO apps. Page restrictions complicate the ACLs. | **Points-based hourly quotas enforced since Mar 2, 2026** for Forge, Connect and 3LO apps ([Jira rate limiting](https://developer.atlassian.com/cloud/jira/platform/rate-limiting); [Atlassian blog](https://www.atlassian.com/blog/development/evolving-api-rate-limits)). Backfill of large sites will be slow. | Low–Med | 4–5 (both) |
| **Salesforce** | REST plus Bulk API 2.0 queries. The sharing model is complex. | Enterprise Edition: 100k + 1k per licence per 24 h ([cheatsheet](https://developer.salesforce.com/docs/platform/salesforce-app-limits-cheatsheet/guide/salesforce-app-limits-platform-api.html)). Bulk 2.0: 10k query jobs per 24 h ([Bulk limits](https://developer.salesforce.com/docs/platform/api-asynch/guide/bulk-common-limits.html)). | Medium (AppExchange review if listed) | 4–6 |
| **HubSpot** | OAuth public app; webhooks | 110 requests per 10 s per account for public apps ([HubSpot](https://developers.hubspot.com/docs/developer-tooling/platform/usage-guidelines)) | Low | 2–3 |
| **GitHub** | GitHub App; webhooks | 5k req/h per installation, scaling to 12.5k (15k on Enterprise Cloud); 100 concurrent; 900 REST points/min ([GitHub](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)) | Low | 2–3 |

---

## 4. Build vs. buy

| Vendor | Helps with | Falls short on |
|---|---|---|
| **Nylas** | The most email-specific option. "Bulk authentication grants": Google service account with DWD, and Microsoft app permissions ([Nylas](https://developer.nylas.com/docs/v3/auth/bulk-auth-grants/)). Normalized message model and webhooks. | Google bulk auth needs the **SA's JSON private key uploaded to Nylas** ([Nylas SA guide](https://developer.nylas.com/docs/provider-guides/google/google-workspace-service-accounts.md)), which contradicts our keyless requirement. Google per-user quotas still apply ([Nylas cookbook](https://developer.nylas.com/docs/cookbook/email/gmail-api-quotas/)). Nylas adds a sub-processor, adds residency constraints, and prices per account. We would still have to build embargo, opt-out, dedup and deletion fan-out. |
| **Nango** | Open-source, **self-hostable** OAuth, token refresh and sync framework for hundreds of APIs. Good residency story. | No email-specific value. We write the sync logic regardless. Pricing **unverified**. |
| **Merge** | Unified CRM, ticketing, file-storage and knowledge-base models | No email category found **(unverified)**. Per-linked-account pricing. Lowest-common-denominator schemas. Data stored at Merge. |
| **Paragon** | "Managed Sync" for RAG with permission sync for file storage and ticketing ([Paragon](https://docs.useparagon.com/managed-sync/overview)) | Oriented to per-user OAuth. Gmail ingestion not shown. Governance hooks not ours. |
| **Unified.to** | Real-time pass-through (no storage at the vendor); usage pricing | Not built for 80M-message backfills or DWD **(unverified)** |
| **Composio** | Agent *actions* and tool-calling with per-user auth | Not an ingestion system **(general knowledge, unverified)**. Complementary for the agent API lane. |

**Recommendation.** Build Google and M365 in-house. They are the product's core, and every differentiator lives there: DWD and app-only auth, quota scheduling, pre-ingest policy, embargo and deletion SLAs. Adopt self-hosted Nango for OAuth and token management on the long-tail connectors. Revisit Merge or Unified.to only if customers demand breadth in CRM and ticketing faster than we can build it.

---

## 5. Reference pipeline design

```
 Admin config ─► Scope engine (Directory sync, OU/group/user rules, opt-out users)
                       │ in-scope mailbox set (diffed every 10–15 min)
                       ▼
 Scheduler ──► per-tenant work queues (backfill | incremental | reconcile | due-fetch)
   ▲  quota ledger (Redis token buckets: per user, per project/app, per tenant fair share)
   │
 Pub/Sub / Graph webhooks ─► Notification coalescer (per user, debounced) ─┘
                       ▼
 Sync workers (stateless; lease per mailbox) ─► history/delta reader ─► ID events
                       ▼
 Embargo store (id, due_at) ─► Due-fetch worker ─► raw fetch
                       ▼
 PRE-INGEST POLICY: scope → label/sender/category → sensitivity label → content rules
   │ excluded → audit log (id, rule, policy_version), no content persisted
   ▼ included
 Normalizer (MIME, charset, HTML→text, attachments sandbox) ─► canonical message
                       ▼
 Dedup/ref-count (Message-ID + content hash) ─► outbox ─► UPSERT / DELETE events ─► storage lane
 DLQ (poison messages, parse failures, retries exhausted) + replay tooling
```

**Canonical message schema (abridged):**
- `tenant_id`, `source`, `mailbox_id`, `source_msg_id`, `source_version` (historyId or changeKey)
- `rfc822_message_id`, `content_sha256`, `conversation_key`
- `from`, `to`, `cc`, `bcc` (bcc only from the mailbox's own copy), `sent_at`, `subject`, `body_text`, `body_html_ref`
- `attachments[{name, mime, size, sha256, text_ref}]`
- `labels | categories`, `sensitivity_label`, `policy_version`, `visible_after`, `acl_mailboxes[]`

**Dedup:** the same message lands in the sender's Sent folder and in N inboxes. Store content once, keyed by `Message-ID` plus `content_sha256`. Message-ID can be missing or duplicated, so fall back to a hash of From, Date, Subject and body. Keep a per-mailbox **edge** that carries labels, ACL and deletion state. Opt-out and deletion remove an *edge*; content is purged when the ref-count reaches 0. *Product decision:* does a sender's opt-out remove recipients' copies? Default is no (per-mailbox semantics); make it a tenant toggle.

**Idempotency:** upserts are keyed by `(tenant, mailbox, source_msg_id)` with a monotonic `source_version`. Deletes are versioned tombstones. Checkpoints (`historyId`, deltaLink) are committed **only after** events are durably in the outbox (transactional outbox), so delivery is at-least-once with idempotent consumers.

**Per-tenant isolation:** a separate SA or app credential per tenant, partitioned queues (key `tenant:mailbox`), per-tenant fair-share quotas, per-tenant KMS keys (security lane), region cells for residency, and no cross-tenant batching.

**Observability:** sync lag per mailbox, quota burn vs. budget, 429 and history-404 rates, watch expiry horizon, DLQ depth, exclusions per rule, deletion-SLA p99, and reconciliation drift.

**Illustrative Gmail incremental sync loop (Python, not runnable as-is):**

```python
HIST_TYPES = ["messageAdded", "messageDeleted", "labelAdded", "labelRemoved"]
DELETE_LIKE = {"TRASH", "SPAM"}            # tenant-configurable

def sync_mailbox(t, user, gmail, store, policy, out):
    st = store.state(t, user)              # history_id, optout_label_id, embargo_s
    st.optout_label_id = st.optout_label_id or resolve_label(gmail, user, policy.optout_label)
    page, newest = None, st.history_id
    try:
        while True:
            r = call(gmail.users().history().list(userId=user, startHistoryId=st.history_id,
                     historyTypes=HIST_TYPES, maxResults=500, pageToken=page), cost=2, user=user)
            for h in r.get("history", []):
                for e in h.get("messagesDeleted", []):
                    out.delete(t, user, e["message"]["id"], reason="deleted")
                for e in h.get("labelsAdded", []):
                    m, added = e["message"], set(e["labelIds"])
                    if st.optout_label_id in added:
                        store.exclude_thread(t, user, m["threadId"])
                        out.delete_thread(t, user, m["threadId"], reason="opt_out")
                    elif added & DELETE_LIKE:
                        out.delete(t, user, m["id"], reason="trashed")
                for e in h.get("labelsRemoved", []):
                    m, removed = e["message"], set(e["labelIds"])
                    if st.optout_label_id in removed:
                        store.unexclude_thread(t, user, m["threadId"])
                    if st.optout_label_id in removed or removed & DELETE_LIKE:
                        store.schedule_fetch(t, user, m["id"], due=now())   # re-evaluate
                for e in h.get("messagesAdded", []):
                    store.schedule_fetch(t, user, e["message"]["id"],
                                         due=now() + st.embargo_s)          # delayed fetch
            newest = r.get("historyId", newest)
            page = r.get("nextPageToken")
            if not page:
                break
    except HttpError as err:
        if err.status == 404:              # history expired -> full resync + reconcile
            return full_resync(t, user, gmail, store, out)
        raise                              # 403/429/5xx handled by call() backoff + DLQ
    out.flush()                            # transactional outbox first...
    store.commit_history_id(t, user, newest)   # ...then checkpoint

def fetch_due(t, user, msg_id, gmail, store, policy, out):
    try:
        m = call(gmail.users().messages().get(userId=user, id=msg_id, format="raw"),
                 cost=60, user=user)
    except HttpError as err:
        if err.status == 404:              # deleted inside embargo window
            return out.delete(t, user, msg_id, reason="gone_before_fetch")
        raise
    labels, st = set(m.get("labelIds", [])), store.state(t, user)
    if (st.optout_label_id in labels or labels & DELETE_LIKE
            or store.thread_excluded(t, user, m["threadId"])):
        return out.delete(t, user, msg_id, reason="excluded_at_fetch")   # no-op if absent
    mime = parse_rfc822(b64url_decode(m["raw"]))
    d = policy.evaluate(tenant=t, user=user, labels=labels, mime=mime)   # sender/content/DLP
    if d.excluded:
        return store.audit_exclusion(t, user, msg_id, d.rule, policy.version)
    out.upsert(normalize(t, user, m, mime), key=(t, user, msg_id), version=int(m["historyId"]))

def full_resync(t, user, gmail, store, out):
    start = call(gmail.users().getProfile(userId=user), cost=1)["historyId"]  # capture BEFORE listing
    live = set(list_all_ids(gmail, user))  # messages.list, 5 units/500 ids
    for gone in store.known_ids(t, user) - live:
        out.delete(t, user, gone, reason="reconcile_missing")
    for new in live - store.known_ids(t, user):
        store.schedule_fetch(t, user, new, due=now())
    out.flush(); store.commit_history_id(t, user, start)
```

---

## 6. Feasibility verdict and effort

**Verdict: feasible.** There are no API blockers for Google or M365. The risks, in order:
1. **Gmail quota cost and billing**, which is not yet priced. It affects backfill time and cost, and possibly unit economics.
2. **Google verification and policy.** CASA, the ambiguity around DWD verification, and the policy note against "building databases" all need legal sign-off.
3. **Slack.** Index-based ingestion is contractually barred; federated retrieval is the only path.
4. **ACL fidelity** for Drive and SharePoint.

| Work item | Eng-weeks |
|---|---|
| **Google MVP total** | **≈21** (3 engineers × about 7–8 weeks, plus CASA calendar time running in parallel) |
| …Keyless DWD auth, token cache, tenant onboarding checks | 1.5 |
| …Directory sync and scope engine | 2 |
| …Quota-aware backfill orchestrator | 3 |
| …watch, Pub/Sub, history, renewal, 404 resync, reconciliation | 3 |
| …Policy engine, opt-out label, delayed-fetch embargo | 3 |
| …MIME normalizer, attachments sandbox, threads, dedup | 3 |
| …Deletion propagation, tombstones, outbox | 1.5 |
| …Observability, DLQ, replay, admin config API | 2 |
| …Test harness (synthetic mailboxes, fault injection), security review | 2 |
| **M365 mail connector** (reuses the pipeline) | **≈13**: auth + RBAC for Applications onboarding 1.5; directory 1.5; backfill 2.5; delta + notifications + lifecycle 3; categories, opt-out, move vs. delete 1.5; sensitivity labels 1; testing 2 |
| Google Drive (ACLs, labels, changes) | 6–8 |
| Google Calendar / Chat / Meet transcripts | 2–3 / 3–4 / 2 |
| Teams (protected-API approval adds calendar time) | 5–7 |
| SharePoint/OneDrive | 6–8 |
| Slack (RTS federated, no index) | 3–4 |
| Zoom / Notion / HubSpot / GitHub | 2–3 each |
| Confluence + Jira / Salesforce | 4–5 / 4–6 |

**Unverified items to close in a spike:** WIF → signJwt → DWD end to end; whether DWD-only apps need restricted-scope verification; whether legacy-project Gmail method costs changed; Gmail's per-user concurrency ceiling; the scoping behaviour of a Marketplace install for Gmail scopes; Graph's `msip_labels` extended-property read under `Mail.Read`; current MGDC pricing; whether Teams export still requires the `model=` parameter.
