# THE PLOT ONE — AGENT MODULE DEVELOPMENT PLAN

## Complete Task-by-Task Plan

**Based on confirmed flow discussions + existing codebase review**

**Legend:** ✅ EXISTS | 🔧 MODIFY | 🆕 NEW

## SCOPE BOUNDARY — READ FIRST

This plan starts **once a lead is already tiered (Tier 1 / Tier 2) and has no campaign or in-house match** — i.e. the moment it enters the agent ladder. It does **not** cover:

- The in-house conditional hold (24h/6h) or campaign matching — owned by a separate **Lead Routing Engine** plan, not yet written.
- Telecaller qualification (the step that actually assigns Tier 1 vs Tier 2) — owned by the **Telecaller panel** plan, not yet written.

This plan assumes those upstream stages hand it a `Requirement` already carrying `tier` and an `agentRoutingStatus` of `tier2_ladder` or `tier1_open`. Building this module before the routing engine exists means the ladder has to be triggered manually (or by a temporary stub) until that plan lands — flagged again in STILL NEEDS CONFIRMATION.

## THE SHAREDLEAD DECISION (confirmed)

The codebase already has a working lead-distribution system (`SharedLead.js`, `leadController.js`, `requirementController.js`) that broadcasts a lead to every seller on a plan tier and — for "exact match" leads — lets **multiple sellers simultaneously accept the same buyer**. This directly contradicts the exclusivity rule repeated across every source document (`0. Developer Handover Brief` §3.2, `3. Proposal - Agents`, `5. SYSTEM BUILD v5.0`), which the documents treat as non-negotiable.

**This plan replaces that exact-match multi-accept path with a new exclusive offer engine (Module 3).** The one part of the old system worth keeping is the *non-exact-match* branch's atomic single-winner accept (`findOneAndUpdate({status:'pending'})`) — that logic is ported into the new `LeadOffer` accept flow rather than reused in place, since `SharedLead` has no concept of `tier`, `campaignId`, or timed windows. Cutover timing (big-bang vs. phased) is still an open operational decision — see STILL NEEDS CONFIRMATION.

## INDEX

| # | Module | Tasks | Phase | Status Breakdown |
| :---- | :---- | :---- | :---- | :---- |
| M1 | Database / Models | 7 tasks | P0 | 0 EXISTS · 2 MODIFY · 5 NEW |
| M2 | Authentication & Roles | 2 tasks | P0 | 0 EXISTS · 1 MODIFY · 1 NEW |
| M3 | Lead Distribution Engine | 8 tasks | P0 | 0 EXISTS · 2 MODIFY · 6 NEW |
| M4 | Agent Plan & Payment | 4 tasks | P0/P1 | 0 EXISTS · 2 MODIFY · 2 NEW |
| M5 | Wallet & Add-ons | 4 tasks | P0/P1 | 0 EXISTS · 0 MODIFY · 4 NEW |
| M6 | Agent Lead Management | 5 tasks | P1 | 0 EXISTS · 0 MODIFY · 5 NEW |
| M7 | My Properties + Boost | 3 tasks | P1 | 0 EXISTS · 1 MODIFY · 2 NEW |
| M8 | Requirement Board & Co-Brokerage | 5 tasks | P1 | 0 EXISTS · 0 MODIFY · 5 NEW |
| M9 | Performance Score | 2 tasks | P1/P2 | 0 EXISTS · 0 MODIFY · 2 NEW |
| M10 | Notifications (Agent) | 4 tasks | P0/P2 | 0 EXISTS · 0 MODIFY · 4 NEW |
| M11 | Admin — Agent Management | 4 tasks | P1 | 0 EXISTS · 1 MODIFY · 3 NEW |
| M12 | Agent Portal Layout | 3 tasks | P1 | 0 EXISTS · 0 MODIFY · 3 NEW |
| M13 | Automation / Cron Jobs | 4 tasks | P2 | 0 EXISTS · 0 MODIFY · 4 NEW |
| M14 | Audit Log Integration | 1 task | P0 | 0 EXISTS · 0 MODIFY · 1 NEW |

### Summary

|  | Count |
| :---- | :---- |
| **Total Modules** | **14** |
| **Total Tasks** | **56** |
| ✅ EXISTS — no change | 0 |
| 🔧 MODIFY — change existing code | 9 |
| 🆕 NEW — build from scratch | 47 |

### Phase Overview

| Phase | Focus | Modules Involved | Task Count |
| :---- | :---- | :---- | :---- |
| **Phase 1 (P0)** | Core backend — models, offer engine, quota/wallet debit correctness, push-gate, audit log | M1, M2, M3, M4 (backend), M5 (wallet debit core), M14 | 27 tasks |
| **Phase 2 (P1)** | UI complete — inbox, properties, board, co-brokerage, admin views, portal | M4 (UI), M6, M7, M8, M9 (UI), M11, M12 | 23 tasks |
| **Phase 3 (P2)** | Automation & polish — cron jobs, score calc, reminders | M9 (calc), M10 (partial), M13 | 5 tasks |
| **Phase 4 (P3)** | WhatsApp push-fallback | M10 (remainder) | 1 task |

## CONFIRMED AGENT FLOW (Reference)

1\. Lead reaches the agent ladder → tagged `tier2_ladder` or `tier1_open` (upstream, out of scope here)
2\. Tier 2: engine offers to ONE eligible agent at a time, by plan-tier window, 15 min each → Tier 1: engine offers to 3–5 agents at once, 4h, first accept wins
3\. Agent gets a push notification → opens Lead Detail → phone masked
4\. Agent accepts → quota or wallet debited (never on offer) → contact revealed → all sibling offers for that lead voided
5\. Agent calls within 2h → logs status → schedules site visit → OTP verifies the visit
6\. Deal closes → co-brokerage split if applicable → Deal Registration Certificate issued
7\. Agent's own listings and their enquiries never touch quota, unless the enquiry came from a paid ad
8\. Agent buys wallet top-ups / Boost My Listing / extra leads whenever they want — no admin approval step

**Agent never sees:** which campaign (if any) produced a lead, ad spend, cost per lead, targeting, another agent's leads or performance, the unassigned lead pool.

# MODULE 1 — DATABASE / MODELS

**Module Estimated Time: 5 hr 30 mins (7 tasks)**

## TASK 1.1 — Agent Profile / KYC Model 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/models/AgentProfile.js

**Purpose:** Mirrors the existing `BuilderProfile.js` pattern (already used for promoters) for the agent side — System Build §6.5 lists "Profile & KYC" as an agent panel screen; none of it exists today.

Fields:
- user              (ref: User, required, unique)
- phonePrimary      (String)
- email             (String)
- reraAgentNumber   (String)               // ties to launch checklist "RERA agent registration position confirmed"
- panNumber         (String)               // encrypted at rest — see Task 1.1 note below
- experienceYears   (Number)
- languagesKnown    [String]
- kycStatus         (enum: pending/submitted/approved/rejected, default: pending)
- kycDocuments      [{ type: String, url: String }]   // e.g. aadhaar, pan, rera_certificate, photo
- verifiedBy        (ref: User)            // admin who approved
- verifiedAt        (Date)
- Timestamps

**Encryption note:** `panNumber` must be encrypted at rest per Handover Brief §4 ("Phone and PAN encrypted at rest"). Use field-level encryption (e.g. mongoose-encryption or app-level AES before save), not just restricted API exposure.

**Open item:** exact mandatory KYC document list isn't specified in the source docs — flagged in STILL NEEDS CONFIRMATION.

## TASK 1.2 — Wallet + WalletTransaction Models 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/models/Wallet.js, server/models/WalletTransaction.js

**Purpose:** No wallet model exists anywhere in the codebase today. Pricing V7 §3 requires wallet top-ups, and per-transaction history for dispute resolution (same append-only philosophy as AuditLog).

Wallet fields:
- user       (ref: User, required, unique)
- balance    (Number, default: 0)
- Timestamps

WalletTransaction fields (append-only — no update/delete, same rule as AuditLog):
- wallet            (ref: Wallet, required)
- user              (ref: User, required)
- type              (enum: topup/debit/refund)
- amount            (Number, required)
- reason            (String)             // "Extra Tier1 lead", "Boost My Listing", "Wallet top-up via Razorpay"
- relatedId         (ObjectId)           // linked LeadOffer / Boost / order id
- relatedModel      (String)
- balanceAfter      (Number)
- razorpayPaymentId (String)             // for top-ups
- Timestamps (immutable)

## TASK 1.3 — Lead Offer Model 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/models/LeadOffer.js

**Purpose:** The core record of the new exclusive offer engine. Tracks each individual offer of a `Requirement` to a specific agent, so history of who-was-offered-what survives even after one agent accepts. This is what replaces `SharedLead`'s exact-match multi-accept path.

Fields:
- requirement      (ref: Requirement, required)
- agent            (ref: User, required)
- tier             (enum: tier1/tier2)
- offerType        (enum: sequential/open)      // tier2 = sequential one-at-a-time, tier1 = open to 3-5
- planTierAtOffer  (String)                     // which plan window this belongs to (3999/1999/999/free)
- status           (enum: pending/accepted/declined/expired/expired_by_other, default: pending)
- offeredAt        (Date, default: now)
- expiresAt        (Date)                       // offeredAt + 15min (tier2) or +4h (tier1)
- respondedAt      (Date)
- contactRevealed  (Boolean, default: false)
- Timestamps

**Indexes:** `{ requirement: 1, status: 1 }`, `{ agent: 1, status: 1 }`

**Critical — one active assignment per lead (Handover Brief §3.2):**

```
// Partial unique index — at most ONE accepted offer may ever exist per requirement
LeadOfferSchema.index(
  { requirement: 1 },
  { unique: true, partialFilterExpression: { status: 'accepted' } }
);
```

## TASK 1.4 — Modify Requirement Model — Agent Routing Fields 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** server/models/Requirement.js (already touched by the Promoter plan's Task 1.3 — this is additive)

**Add:**
- agentRoutingStatus  (enum: not_started/in_house_hold/campaign_matched/tier2_ladder/tier1_open/agent_assigned/inhouse_closed/expired_no_taker, default: not_started)
- assignedAgent       (ref: User)          // denormalized pointer to the currently accepted agent, kept in sync with LeadOffer
- ladderStartedAt     (Date)

**No forward/share/transfer function:** no field or endpoint may set `assignedAgent` to anyone other than the one agent recorded on the matching `LeadOffer(status: 'accepted')`. Decline or expiry only ever advances the SAME requirement to the next offer — it never duplicates it to two agents at once (Tier 1's simultaneous 3–5 is the one designed exception, and even there only one can end up accepted).

**Reminder:** a `campaignId`-bearing requirement may never reach `tier2_ladder`/`tier1_open` unless `project.releaseToAgents = true` (Task 1.5).

## TASK 1.5 — Modify Property Model — Release-to-Agents Toggle 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** server/models/Property.js

**Add:**
- releaseToAgents    (Boolean, default: false)   // System Build Part 1: "default OFF, requested as a service. Never automatic."
- agentNetworkSize   (Number)                    // 5 / 15 / 30 by promoter's campaign plan

## TASK 1.6 — Requirement Board Post Model 🆕 NEW

**Estimated Time:** 1 hr 30 mins

**File:** server/models/RequirementPost.js

**Purpose:** The agent-facing "post a wanted-property, others respond with properties" feature (System Build §6.5; Agent Proposal). **Deliberately a separate model from `Requirement.js`** (the Lead entity) — confirmed decision, since the Promoter branch is developing in parallel on `Requirement.js` and this avoids any merge collision or semantic confusion between "a lead" and "a board post."

Fields:
- postedBy    (ref: User, required)     // agent
- area, minBudget, maxBudget, propertyType, usageType, notes
- status      (enum: open/fulfilled/closed, default: open)
- responses:  [{ respondedBy: ref User, property: ref Property, message: String, respondedAt: Date }]
- Timestamps

**Rule (Agent Proposal):** "Builders and other agents respond with properties, never asking for your buyer. Your client stays yours." Enforce: a response may only ever link a `Property`, never a counter-requirement or the poster's buyer contact.

## TASK 1.7 — Co-Brokerage Model 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/models/CoBrokerage.js

**Purpose:** "Work a deal with another agent, register it together, split it however you agree. We take nothing." (Agent Proposal)

Fields:
- requirement       (ref: Requirement)
- agents:           [{ agent: ref User, splitPercent: Number }]
- registeredAt      (Date)
- dealStatus        (enum: registered/site_visit/closed_won/closed_lost)
- certificateIssued (Boolean, default: false)
- Timestamps

# MODULE 2 — AUTHENTICATION & ROLES

**Module Estimated Time: 1 hr 30 mins (2 tasks)**

## TASK 2.1 — Agent Role Guard Middleware 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/middleware/agentMiddleware.js

Mirrors the existing `promoterMiddleware.js` pattern exactly:

```
const isAgent = async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('businessType');
  if (!user.businessType || user.businessType.name !== 'Agent') {
    return res.status(403).json({ message: 'Agent access only' });
  }
  next();
};
```

**Use on:** all agent-specific API routes.

## TASK 2.2 — Push Permission Mandatory Before Paid Plan Activation 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** server/controllers/subscriptionController.js (`verifyPayment` — already generic across business types)

**Add validation:** for `businessType === 'Agent'` and a non-free plan, block activation unless a `PushSubscription` already exists for `req.user._id`. Handover Brief §5: "An agent cannot activate a paid plan without granting it." Return a clear error directing the agent to grant push permission first.

# MODULE 3 — LEAD DISTRIBUTION ENGINE

**Module Estimated Time: 9 hr 30 mins (8 tasks)**

## TASK 3.1 — Tier 2 Sequential Offer Job 🆕 NEW

**Estimated Time:** 2 hr

**File:** server/utils/agentLadderEngine.js

**Trigger:** Requirement.agentRoutingStatus = 'tier2_ladder' and no accepted LeadOffer exists yet.

```
// Window order per Pricing V7 §3: "Tier 2 window | 4th | 3rd | 2nd | 1st"
const windowOrder = ['3999', '1999', '999', 'free']; // 1st crack -> last crack

// Pick ONE eligible agent in the current window:
// - active subscription at that plan tier
// - monthly quota not exhausted (or has wallet-purchased Tier2 credit)
// - daily accept cap not exhausted (Task 3.6)
// - AgentProfile.kycStatus === 'approved'

createLeadOffer({ requirement, agent, tier: 'tier2', offerType: 'sequential',
                   planTierAtOffer: currentWindow, expiresAt: now + 15*60*1000 });
sendPushNotification(agent, { title: 'New Ready-Buyer Lead', ... });
```

On expiry with no accept → advance to next eligible agent in the same window, then the next window, per Task 3.5.

## TASK 3.2 — Tier 1 Open Offer Job 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/utils/agentLadderEngine.js

**Trigger:** Requirement.agentRoutingStatus = 'tier1_open'.

Select 3–5 eligible agents (priority order per plan's Tier1 window field, but offered **simultaneously**, not sequentially) → create one `LeadOffer` per agent, all `status: 'pending'`, `expiresAt: now + 4h`, phone masked in every one. First accept wins (Task 3.3); the rest are voided automatically.

## TASK 3.3 — Accept Lead Offer API 🆕 NEW

**Estimated Time:** 2 hr

**File:** server/controllers/leadOfferController.js

**Route:** PUT /api/agent/leads/offers/:offerId/accept

```
Step 1: Atomically claim the offer:
  LeadOffer.findOneAndUpdate(
    { _id: offerId, agent: req.user._id, status: 'pending', expiresAt: { $gt: new Date() } },
    { status: 'accepted', respondedAt: new Date(), contactRevealed: true }
  )
  // If null -> 409 "This lead is no longer available" (covers race + expiry)

Step 2: Requirement.assignedAgent = agent; agentRoutingStatus = 'agent_assigned'

Step 3: Daily accept cap check (Task 3.6) — BEFORE Step 1, reject early if exceeded

Step 4: Debit — ONLY here, never on offer (Handover Brief §3.3):
  - "other lead" (Tier1) -> decrement agent's monthly quota, unless using a wallet-purchased
    lead credit, then debit wallet instead
  - "guaranteed requirement lead" (Tier2) -> decrement guaranteedRequirementLeads counter

Step 5: Void all sibling pending LeadOffers for the same requirement -> 'expired_by_other'

Step 6: Write AuditLog: LEAD_OFFER_ACCEPTED

Step 7: Return full requirement contact details (now unmasked)
```

## TASK 3.4 — Decline Lead Offer API 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/controllers/leadOfferController.js

**Route:** PUT /api/agent/leads/offers/:offerId/decline

Sets `status: 'declined'`. **Never** touches quota or wallet — declines are free. Immediately triggers the next step of the ladder (advance Tier 2 window, or simply remove this agent from the Tier 1 pool — the others keep racing).

## TASK 3.5 — Offer Expiry Sweeper (Cron) 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/utils/cronJobs.js

**Frequency:** every 1 minute (Tier 2 windows are only 15 minutes — needs finer granularity than the campaign-pacing cron's daily cycle).

Finds `LeadOffer{status:'pending', expiresAt <= now}` → marks expired. Tier 2 → advances to next agent/window. Tier 1 → if all 3–5 expire with no accept, `agentRoutingStatus = 'expired_no_taker'`, which hands the requirement back to the (out-of-scope) in-house fallback.

## TASK 3.6 — Daily Accept Cap Enforcement 🆕 NEW

**Estimated Time:** 45 mins

**File:** part of the accept API (Task 3.3), before Step 1

```
const acceptedToday = await LeadOffer.countDocuments({
  agent: req.user._id, status: 'accepted',
  respondedAt: { $gte: startOfToday }
});
if (acceptedToday >= plan.dailyAcceptCap) {
  return res.status(403).json({ message: `Daily accept limit (${plan.dailyAcceptCap}) reached.` });
}
```

Caps per plan (Pricing V7 §3): Free = 1, ₹999 = 3, ₹1,999 = 6, ₹3,999 = 10.

## TASK 3.7 — Own-Listing Enquiry Free/Paid-Ad Exception 🔧 MODIFY

**Estimated Time:** 1 hr 15 mins

**File:** server/models/Enquiry.js, server/controllers/enquiryController.js

**Add to Enquiry model:**
- paidAdSourced (Boolean, default: false)   // mirrors leads.paidAdSourced from Pricing V7 §3

**Logic:** an enquiry on an agent's own listing never touches quota — **except** when `paidAdSourced = true` (the promoter/platform ran a paid ad for that listing), in which case it debits quota exactly like Task 3.3 Step 4.

## TASK 3.8 — Deprecate SharedLead Exact-Match Path 🔧 MODIFY / DEPRECATE

**Estimated Time:** 45 mins

**File:** server/controllers/leadController.js, server/controllers/requirementController.js

Retire once the new engine is verified in production:
- `getSharedLeads`, `acceptLead` (exact-match branch), `rejectLead`, `updateLeadStatus`
- `shareRequirement`, `internalShareLeadWithPlanName`, `triggerLeadSharingTimer`, `stopLeadSharingTimer`, `checkRequirementExpiry`

The non-exact-match branch's atomic single-winner accept pattern is ported into Task 3.3 rather than reused in place — `SharedLead` has no `tier`, `campaignId`, or timed-window concept to build on. **Cutover timing (hard replace vs. phased) is not decided — see STILL NEEDS CONFIRMATION.**

# MODULE 4 — AGENT PLAN & PAYMENT

**Module Estimated Time: 3 hr 30 mins (4 tasks)**

## TASK 4.1 — Agent Plan Selection — Frontend 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/agent/pages/plans/SelectPlan.jsx

```
┌──────┬──────────┬──────────┬──────────┐
│ FREE │  ₹999    │ ₹1,999 ⭐│ ₹3,999 🔥│
└──────┴──────────┴──────────┴──────────┘
Guaranteed requirement leads: 0 / 0 / 2 / 5
Daily accept cap:             1 / 3 / 6 / 10
Free listings:                 0 / 2 / 5 / 10
```

## TASK 4.2 — Extend createOrder/verifyPayment for Agent Business Type 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** server/controllers/subscriptionController.js

Already generic across business types. Add: on first-ever Agent subscription for a user, create their `Wallet` document if one doesn't exist. Wire in the push-permission-mandatory gate from Task 2.2.

## TASK 4.3 — Agent Plan Fields on SubscriptionPlan 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** server/models/SubscriptionPlan.js

**Add** (alongside the promoter-side `committedMinimum`/`tier2Minimum` from the Admin plan's Task 7.1):
- guaranteedRequirementLeads  (Number)   // 0/0/2/5
- dailyAcceptCap              (Number)   // 1/3/6/10
- tier2WindowOrder            (Number)   // 4/3/2/1, lower = earlier in the ladder
- freeListingsAllowed         (Number)   // 0/2/5/10
- browseInventoryLimit        (Number)   // 3/8/15/-1 (unlimited)
- networkConnectionsLimit     (Number)   // 0/1/3/-1
- postRequirementsPerMonth    (Number)   // 0/0/2/-1
- coBrokerageEnabled          (Boolean)

## TASK 4.4 — Agent Billing Page — Frontend 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/agent/pages/plans/Billing.jsx

Plan status, payment history, quota used/remaining, wallet balance summary link.

# MODULE 5 — WALLET & ADD-ONS

**Module Estimated Time: 5 hr (4 tasks)**

## TASK 5.1 — Wallet Top-up API 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/controllers/walletController.js

Razorpay order + verify for a top-up amount → credits `Wallet.balance` → writes `WalletTransaction(type: 'topup')`.

## TASK 5.2 — Wallet-Funded Purchases 🆕 NEW

**Estimated Time:** 2 hr

**File:** server/controllers/walletController.js

Extra Tier 1 ₹549 · 5-pack ₹2,499 · Tier 2 ₹1,499 · 3-pack ₹3,999 · area priority ₹1,500/mo. Each debits the wallet and writes a `WalletTransaction`. Lead-packs grant wallet lead credits **separate from plan quota — these never expire** (Agent Proposal: "Wallet leads never expire").

## TASK 5.3 — Boost My Listing Purchase 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/controllers/walletController.js or a dedicated boostController.js

₹2,999, 7-day commitment of 10–15 enquiries on ONE of the agent's own properties. Per the Visibility Rules doc's "Agent with a Boost" exception, the agent must see outcomes for this specific boost (enquiries delivered vs. 10–15 committed, days remaining, views) but no mechanics — same split as a promoter campaign, just scoped to one listing.

**Open item:** reuse the `Campaign` model (agent-as-promoter) or build a lighter `BoostRecord` model — flagged in STILL NEEDS CONFIRMATION.

## TASK 5.4 — Wallet Balance & Transaction History — Frontend 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/agent/pages/wallet/Wallet.jsx

# MODULE 6 — AGENT LEAD MANAGEMENT

**Module Estimated Time: 5 hr (5 tasks)**

## TASK 6.1 — Lead Inbox API 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/controllers/leadOfferController.js

**Route:** GET /api/agent/leads?view=offers|mine|closed

## TASK 6.2 — Lead Detail API (masked until accept) 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/controllers/leadOfferController.js

Reuses the exact masking pattern already working in `leadController.js`'s `getSharedLeads` (`fullName: "Contact Masked"`, `phoneNumber: "XXXXXXXXXX"` until `contactRevealed`), confirmed as the approach to follow — field-level only, no telephony vendor.

## TASK 6.3 — Update Lead Status (Agent) 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/controllers/leadOfferController.js

Same status-transition pattern already built for promoters (pending → contacted → site_visit_scheduled → visited → interested/not_interested → closed_won/lost), scoped to the agent's own accepted leads only.

## TASK 6.4 — Site Visit OTP Verification 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/controllers/leadOfferController.js

Reuses the existing OTP mechanism already on `User.js` (`otp`/`otpExpires` fields, currently used for login) — applied to the **buyer's** phone instead, to verify a site visit actually happened.

## TASK 6.5 — Lead Inbox & Detail — Frontend 🆕 NEW

**Estimated Time:** 1 hr 30 mins

**File:** client/src/modules/agent/pages/leads/LeadInbox.jsx, LeadDetail.jsx

# MODULE 7 — MY PROPERTIES + BOOST

**Module Estimated Time: 3 hr (3 tasks)**

## TASK 7.1 — Post Property (Agent, plan-limited) 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** server/controllers/propertyController.js

**Note — opposite of the Promoter change:** the Promoter plan removed the listing limit entirely (unlimited, free). For agents, the limit is **not** unlimited — it's `SubscriptionPlan.freeListingsAllowed` (0/2/5/10). Restore a limit check here, but source the number from the plan field instead of a hardcoded constant.

## TASK 7.2 — My Properties Page (Agent) — Frontend 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/agent/pages/properties/MyProperties.jsx

## TASK 7.3 — Boost My Listing — Frontend Flow 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/agent/pages/properties/BoostListing.jsx

# MODULE 8 — REQUIREMENT BOARD & CO-BROKERAGE

**Module Estimated Time: 7 hr (5 tasks)**

## TASK 8.1 — Post Requirement API 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** server/controllers/requirementPostController.js

Uses the `RequirementPost` model (Task 1.6). Enforces `postRequirementsPerMonth` plan limit.

## TASK 8.2 — Respond to Requirement API 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** server/controllers/requirementPostController.js

A response links only a `Property` — never the poster's buyer contact.

## TASK 8.3 — Requirement Board — Frontend 🆕 NEW

**Estimated Time:** 1 hr 30 mins

**File:** client/src/modules/agent/pages/requirements/RequirementBoard.jsx

## TASK 8.4 — Co-Brokerage Registration API 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/controllers/coBrokerageController.js

Uses the `CoBrokerage` model (Task 1.7).

## TASK 8.5 — Deal Registration Certificate Generator 🆕 NEW

**Estimated Time:** 2 hr

**File:** server/utils/certificateGenerator.js

On `dealStatus: 'closed_won'`, generates a certificate naming the agent, buyer and property. Writes AuditLog: `DEAL_CLOSED` / `CERTIFICATE_ISSUED`.

# MODULE 9 — PERFORMANCE SCORE

**Module Estimated Time: 2 hr 15 mins (2 tasks)**

## TASK 9.1 — Performance Score Calculation (Cron) 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/utils/cronJobs.js

Nightly. Inputs: offer response speed, visit-log completion rate, close rate. Feeds back into Task 3.1's agent-selection logic as the tie-break among agents in the same plan-tier window — Agent Proposal: "score decides who gets first refusal on ready buyers."

## TASK 9.2 — Performance Score — Frontend 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/agent/pages/Performance.jsx

Agent sees their own score and what drives it — never another agent's score (Visibility Rules doc).

# MODULE 10 — NOTIFICATIONS (AGENT)

**Module Estimated Time: 3 hr 15 mins (4 tasks)**

## TASK 10.1 — New Lead Offer Push Notification 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/utils/notificationService.js

Reuses the existing ✅ `sendPushNotification` utility (server/utils/pushNotification.js) — already functional, VAPID-configured, handles legacy + new subscription models.

## TASK 10.2 — Offer Expiring Soon Reminder 🆕 NEW

**Estimated Time:** 45 mins

Push at the halfway point of the 15-min (Tier 2) / 4h (Tier 1) window.

## TASK 10.3 — Push-Down WhatsApp Fallback (after 10 min) 🆕 NEW

**Estimated Time:** 45 mins

Per System Build Part 4.1/Part 8. **Blocked on the same WhatsApp provider decision already open in the Promoter plan** (Twilio / Wati / Meta Cloud) — Phase 4, later.

## TASK 10.4 — Quota / Wallet Low-Balance Alerts 🆕 NEW

**Estimated Time:** 45 mins

# MODULE 11 — ADMIN: AGENT MANAGEMENT

**Module Estimated Time: 2 hr 45 mins (4 tasks)**

## TASK 11.1 — Agent KYC Review Queue (Admin) 🆕 NEW

**Estimated Time:** 45 mins

**File:** client/src/modules/admin/pages/agents/KycQueue.jsx

Approve/reject `AgentProfile.kycStatus`.

## TASK 11.2 — Agent List & Detail (Admin) 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** client/src/modules/admin/pages/SellerList.jsx (extend, mirroring the promoter-side pattern) or a new AgentList.jsx

Shows plan, wallet balance, quota used, performance score, accepted leads.

## TASK 11.3 — Manual Quota/Wallet Adjustment (Admin) 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/controllers/agentController.js

For goodwill credits and dispute resolution — every adjustment writes to AuditLog.

## TASK 11.4 — Agent Ladder Monitor (Admin) 🆕 NEW

**Estimated Time:** 45 mins

**File:** client/src/modules/admin/pages/agents/LadderMonitor.jsx

Live view of pending `LeadOffer`s, which window each is in, expiry countdowns. This is the "Distribution Control" panel named in System Build §6.1's Super Admin module list.

# MODULE 12 — AGENT PORTAL LAYOUT

**Module Estimated Time: 3 hr 45 mins (3 tasks)**

## TASK 12.1 — Agent Portal Layout 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/agent/layout/AgentLayout.jsx

```
THE PLOT ONE
──────────────
📥 Lead Inbox
🏠 My Properties
📋 Requirement Board
🤝 Co-Brokerage
📊 Performance
💳 Plan & Wallet
👤 Profile & KYC
──────────────
🔔 Notifications
🚪 Logout
```

## TASK 12.2 — Agent Home Dashboard 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/agent/pages/Dashboard.jsx

## TASK 12.3 — Agent Routes Setup 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/agent/AgentRoutes.jsx

```
/agent/dashboard
/agent/leads/inbox
/agent/leads/:offerId
/agent/properties
/agent/properties/add
/agent/requirements
/agent/requirements/post
/agent/co-brokerage
/agent/performance
/agent/wallet
/agent/plans
/agent/profile
```

# MODULE 13 — AUTOMATION / CRON JOBS

**Module Estimated Time: 3 hr 15 mins (4 tasks)**

## TASK 13.1 — Ladder Engine Cron 🆕 NEW

**Estimated Time:** 1 hr

Consolidates Tasks 3.1/3.2/3.5 into the scheduled runner — every 1 minute.

## TASK 13.2 — Daily Accept Cap Reset 🆕 NEW

**Estimated Time:** 45 mins

Midnight — implicit via the `respondedAt >= startOfToday` query in Task 3.6, but worth a lightweight audit sweep to confirm no stale counters.

## TASK 13.3 — Monthly Quota Reset 🆕 NEW

**Estimated Time:** 45 mins

On each agent's own subscription renewal date (not calendar month) — ties to the existing `endDate`-based Subscription cycle already used for promoters.

## TASK 13.4 — Performance Score Nightly Recompute 🆕 NEW

**Estimated Time:** 45 mins

Consolidates Task 9.1 into the scheduled runner.

# MODULE 14 — AUDIT LOG INTEGRATION

**Module Estimated Time: 45 mins (1 task)**

## TASK 14.1 — Audit Events (Agent Module) 🆕 NEW

**Estimated Time:** 45 mins

**File:** uses the existing ✅ `writeAudit` utility (server/utils/auditLogger.js, built in the Promoter plan)

Events to log:

```
LEAD_OFFERED               → when an offer is created
LEAD_OFFER_EXPIRED         → offer times out
LEAD_OFFER_ACCEPTED        → agent accepts
LEAD_OFFER_DECLINED        → agent declines
QUOTA_DEBITED              → on accept
WALLET_TOPUP               → Razorpay top-up verified
WALLET_DEBIT                → wallet-funded purchase
BOOST_PURCHASED            → Boost My Listing bought
KYC_SUBMITTED / KYC_APPROVED / KYC_REJECTED
CO_BROKERAGE_REGISTERED
DEAL_CLOSED / CERTIFICATE_ISSUED
REQUIREMENT_POSTED
```

# PHASE PLAN

## PHASE 1 — Core Backend (Build First)

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Database Models | 1.1 to 1.7 | 🔴 P0 |
| Auth Guard + Push Gate | 2.1, 2.2 | 🔴 P0 |
| Lead Distribution Engine (full) | 3.1 to 3.8 | 🔴 P0 |
| Plan & Payment (backend) | 4.2, 4.3 | 🔴 P0 |
| Wallet Core (top-up + debit) | 5.1, 5.2 | 🔴 P0 |
| Audit Log Events | 14.1 | 🔴 P0 |

## PHASE 2 — UI Complete

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Plan Selection + Billing UI | 4.1, 4.4 | 🟡 P1 |
| Boost + Wallet UI | 5.3, 5.4 | 🟡 P1 |
| Agent Lead Management (full) | 6.1 to 6.5 | 🟡 P1 |
| My Properties + Boost flow | 7.1 to 7.3 | 🟡 P1 |
| Requirement Board & Co-Brokerage | 8.1 to 8.5 | 🟡 P1 |
| Performance UI | 9.2 | 🟡 P1 |
| Admin — Agent Management | 11.1 to 11.4 | 🟡 P1 |
| Agent Portal Layout | 12.1 to 12.3 | 🟡 P1 |

## PHASE 3 — Automation & Polish

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Performance Score Calc | 9.1 | 🟢 P2 |
| Offer-expiring / low-balance alerts | 10.2, 10.4 | 🟢 P2 |
| Cron consolidation | 13.1 to 13.4 | 🟢 P2 |

## PHASE 4 — Later

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| WhatsApp push-fallback | 10.3 | 🟢 P3 |

# COMPLETE TASK COUNT

| Status | Count |
| :---- | :---- |
| ✅ EXISTS — no change | 0 |
| 🔧 MODIFY — existing code changes | 9 |
| 🆕 NEW — build from scratch | 47 |
| **Total** | **56 tasks** |

# STILL NEEDS CONFIRMATION

| Question | Blocks Task |
| :---- | :---- |
| Exact mandatory KYC document list for agent onboarding | 1.1, 11.1 |
| Boost My Listing — reuse Campaign model (agent-as-promoter) or a lighter BoostRecord model? | 5.3 |
| WhatsApp API provider (Twilio / Wati / Meta Cloud) — same open item as the Promoter plan | 10.3 |
| SharedLead cutover timing — hard replace on go-live, or a phased/dual-run window for in-flight subscriptions? | 3.8 |
| Lead Routing Engine / Telecaller plan not yet written — this module assumes leads already arrive tiered. Until that plan exists, Tier 1/2 assignment needs a manual/stub trigger for testing | 3.1, 3.2 |
| Is a lightweight version of Module 3 needed for launch before the full multi-window ladder (e.g. just Tier 1 open-offer, no Tier 2 sequencing) to match a "sell manually first" timeline like the Promoter plan's CSV-first approach? | 3.1–3.6 |

*Development Plan prepared: 05 Sep 2026*

*Flow confirmed through discussion — ready for schema review*
