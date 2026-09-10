# THE PLOT ONE — TELECALLER MODULE DEVELOPMENT PLAN

## Complete Task-by-Task Plan

**Based on confirmed flow discussions + existing codebase review**

**Legend:** ✅ EXISTS | 🔧 MODIFY | 🆕 NEW

## SCOPE BOUNDARY — READ FIRST

Confirmed with you before drafting:

- **Inbound Queue works off `Requirement` only.** `WhatsappLead`, `Enquiry` and `RequestCall` stay separate collections for now — not unified into one queue in this plan. That's a known gap for a later lead-unification task, not solved here.
- **In-house inventory CRUD/sourcing is a separate, not-yet-written module.** This plan adds the minimum needed on `Property` (a flag) so the pitch queue can match against existing in-house listings — it does not build admin tooling to create/track/source that inventory (owner mandates, brokerage-only listings, lapsed subscribers, block deals, resale, bank auction).
- **Organic-lead-to-active-campaign matching is out of scope here too** — same boundary the Agent plan drew around its "Lead Routing Engine" dependency. This plan covers qualification (assigning Tier 1/Tier 2), the in-house hold/pitch/release cycle, the Tier 2 in-house catch-all, verification, and callbacks. Once a lead is released from telecaller (no in-house match, or pitched-and-declined), the next step — matching it against an active paying campaign, or handing it to the Agent ladder — belongs to that still-unwritten Lead Routing Engine, not here.
- **The WhatsApp bot's role in "Qualify (bot + telecaller)"** (Business Flow doc) isn't built anywhere in this plan — the qualification form here assumes a human telecaller does the qualifying call. If a bot pre-qualification step is wanted before this, it's a separate scope addition — flagged again in STILL NEEDS CONFIRMATION.

## WHAT'S NEW IN THE CODEBASE FOR THIS ROLE

Telecaller doesn't exist as a role at all yet — seeded roles are `agent, builder, owner, admin, user, seller` (`seedRoles.js`). Unlike Promoter/Agent, Telecaller is **internal staff**, not a `businessType`-driven external account — no self-registration, an admin creates the account.

## INDEX

| # | Module | Tasks | Phase | Status Breakdown |
| :---- | :---- | :---- | :---- | :---- |
| M1 | Database / Models | 5 tasks | P0 | 0 EXISTS · 3 MODIFY · 2 NEW |
| M2 | Authentication & Roles | 2 tasks | P0 | 0 EXISTS · 0 MODIFY · 2 NEW |
| M3 | Qualification & In-House Engine | 6 tasks | P0 | 0 EXISTS · 1 MODIFY · 5 NEW |
| M4 | Tier 2 In-House Catch-All | 2 tasks | P1 | 0 EXISTS · 0 MODIFY · 2 NEW |
| M5 | Verification & Invalid-Lead Handling | 3 tasks | P1 | 0 EXISTS · 0 MODIFY · 3 NEW |
| M6 | Callbacks | 3 tasks | P1 | 0 EXISTS · 0 MODIFY · 3 NEW |
| M7 | Telecaller Panel UI | 6 tasks | P1 | 0 EXISTS · 0 MODIFY · 6 NEW |
| M8 | Notifications (Telecaller) | 3 tasks | P2 | 0 EXISTS · 0 MODIFY · 3 NEW |
| M9 | Admin — Telecaller Management | 3 tasks | P1 | 0 EXISTS · 0 MODIFY · 3 NEW |
| M10 | Telecaller Portal Layout | 2 tasks | P1 | 0 EXISTS · 0 MODIFY · 2 NEW |
| M11 | Automation / Cron Jobs | 2 tasks | P2 | 0 EXISTS · 0 MODIFY · 2 NEW |
| M12 | Audit Log Integration | 1 task | P0 | 0 EXISTS · 0 MODIFY · 1 NEW |

### Summary

|  | Count |
| :---- | :---- |
| **Total Modules** | **12** |
| **Total Tasks** | **38** |
| ✅ EXISTS — no change | 0 |
| 🔧 MODIFY — change existing code | 4 |
| 🆕 NEW — build from scratch | 34 |

### Phase Overview

| Phase | Focus | Modules Involved | Task Count |
| :---- | :---- | :---- | :---- |
| **Phase 1 (P0)** | Core backend — models, role guard, qualification + in-house hold engine, audit log | M1, M2, M3, M12 | 14 tasks |
| **Phase 2 (P1)** | UI complete — catch-all, verification, callbacks, panel screens, admin management, portal | M4, M5, M6, M7, M9, M10 | 19 tasks |
| **Phase 3 (P2)** | Automation & polish — reminders, stale-queue alerts | M8, M11 | 5 tasks |

## CONFIRMED TELECALLER FLOW (Reference)

1\. Lead arrives (ad/reel/website/call/walk-in) → created as a `Requirement`, appears in Inbound Queue, oldest first
2\. Telecaller opens Qualification Form → system auto-suggests Tier 1/Tier 2, telecaller confirms or overrides with a reason
3\. If the `Requirement` already carries a `campaignId` (CSV-imported) → telecaller still calls and appends qualification notes, but routing is already locked to that promoter — no hold, no in-house pitch
4\. Otherwise (organic) → check in-house inventory match: no match → skip hold, release immediately for the next stage (out of scope here); match found → HOLD (Tier 1 = 24h, Tier 2 = 6h), matching listing shown on the same screen
5\. Telecaller pitches the in-house listing → interested → closes as an in-house deal (2–3% brokerage) → not interested / no answer → **RELEASE IMMEDIATELY**, never wait out the clock
6\. If a lead comes back later having exhausted the entire Agent ladder with no acceptance → surfaces in the Tier 2 In-House queue, highest priority, telecaller's own brokerage
7\. Verification tasks: confirm site visits happened, confirm closures with the buyer directly, review invalid-lead claims from promoters (48h window)
8\. Callbacks scheduled with reminders; My Stats shows calls, qualified, converted vs target

# MODULE 1 — DATABASE / MODELS

**Module Estimated Time: 3 hr (5 tasks)**

## TASK 1.1 — Modify Requirement — Qualification & In-House Hold Fields 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** server/models/Requirement.js (already touched by the Promoter and Agent plans — additive here)

**Add:**
- qualifiedTier          (enum: tier1/tier2)             // set here for organic leads; CSV-imported campaign leads already default to tier1 per the Promoter plan and aren't re-tiered
- qualificationNotes     (String)
- qualifiedBy            (ref: User)                      // telecaller
- qualifiedAt            (Date)
- inHouseHoldStatus      (enum: not_applicable/holding/pitched_interested/pitched_not_interested/released, default: not_applicable)
- inHouseHoldExpiresAt   (Date)
- matchedInHouseProperty (ref: Property)
- routingStage           (enum: awaiting_qualification/in_house_hold/awaiting_campaign_match/closed_in_house, default: awaiting_qualification)

**Handoff point:** when `routingStage` becomes `awaiting_campaign_match`, this module's job on that lead is done — the (not-yet-written) Lead Routing Engine picks it up from there.

## TASK 1.2 — Telecaller Role + Staff Target Fields 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** server/scripts/seedRoles.js, server/models/User.js

Add `"telecaller"` to the seeded roles list. Add to `User.js`:
- dailyCallTarget       (Number)
- dailyQualifyTarget    (Number)
- dailyConvertTarget    (Number)

Admin-settable per telecaller (Task 9.2) — feeds "My Stats vs target" (Task 7.6). No target numbers are specified anywhere in the source docs, so these are configurable fields rather than hardcoded constants.

## TASK 1.3 — Callback Model 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/models/Callback.js

Fields:
- requirement   (ref: Requirement, required)
- telecaller    (ref: User, required)
- scheduledAt   (Date, required)
- status        (enum: scheduled/completed/missed, default: scheduled)
- notes         (String)
- Timestamps

## TASK 1.4 — Invalid Lead Claim Model 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/models/InvalidLeadClaim.js

**Purpose:** backs the promoter commitment "replacement of any invalid lead reported within 48 hours" (Proposal - Promoters).

Fields:
- requirement    (ref: Requirement, required)
- campaign       (ref: Campaign)
- claimedBy      (ref: User, required)          // promoter
- reason         (String, required)
- status         (enum: pending/approved/rejected, default: pending)
- reviewedBy     (ref: User)                    // telecaller or admin
- reviewedAt     (Date)
- Timestamps

## TASK 1.5 — In-House Inventory Flag on Property 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** server/models/Property.js

**Add (minimum only — full sourcing/CRUD is the deferred separate module):**
- isInHouseInventory  (Boolean, default: false)

# MODULE 2 — AUTHENTICATION & ROLES

**Module Estimated Time: 1 hr 45 mins (2 tasks)**

## TASK 2.1 — Telecaller Role Guard Middleware 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/middleware/telecallerMiddleware.js

Unlike `promoterMiddleware.js`/`agentMiddleware.js` (which check `businessType`), Telecaller is staff — checked via `role_id`:

```
const isTelecaller = async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('role_id');
  if (!user.role_id || user.role_id.role_name !== 'telecaller') {
    return res.status(403).json({ message: 'Telecaller access only' });
  }
  next();
};
```

## TASK 2.2 — Admin: Create Telecaller Staff Account 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/controllers/userController.js (extend existing staff-creation path, or add one if none exists)

Admin-only. No OTP self-registration for this role — an admin creates the account directly with `role_id: 'telecaller'`.

# MODULE 3 — QUALIFICATION & IN-HOUSE ENGINE

**Module Estimated Time: 8 hr 15 mins (6 tasks)**

## TASK 3.1 — Qualification Submit API 🆕 NEW

**Estimated Time:** 2 hr

**File:** server/controllers/telecallerController.js

**Route:** PUT /api/telecaller/requirements/:id/qualify

```
Body: { qualifiedTier: 'tier1'|'tier2', qualificationNotes, overrideReason? }

Auto-suggestion shown to the telecaller before they submit:
  - budget confirmed AND needTimeframe <= 30 days -> suggest tier2
  - otherwise -> suggest tier1
  (telecaller can override; if overriding the suggestion, overrideReason is required)

On submit:
  requirement.qualifiedTier = body.qualifiedTier
  requirement.qualifiedBy = req.user._id
  requirement.qualifiedAt = now
  -> proceed to Task 3.2 (in-house match check)
```

**Exact auto-suggestion thresholds aren't specified in the source docs** — this is a proposed default, flagged in STILL NEEDS CONFIRMATION.

## TASK 3.2 — In-House Match Check 🆕 NEW

**Estimated Time:** 2 hr

**File:** server/utils/inHouseMatchCheck.js

Reuses the existing `getPropertyMatchQuery` helper already built in `requirementController.js`, with an added filter: `isInHouseInventory: true`.

```
if campaignId is already set on this requirement:
  routingStage = 'awaiting_campaign_match' immediately  // no hold, no pitch — see Task 3.6
  return

const match = await Property.findOne({ ...matchQuery, isInHouseInventory: true });
if (!match) {
  // "skip the hold entirely when no in-house listing matches"
  requirement.routingStage = 'awaiting_campaign_match';
} else {
  requirement.matchedInHouseProperty = match._id;
  requirement.inHouseHoldStatus = 'holding';
  requirement.routingStage = 'in_house_hold';
  requirement.inHouseHoldExpiresAt = now + (qualifiedTier === 'tier2' ? 6*60*60*1000 : 24*60*60*1000);
}
```

## TASK 3.3 — In-House Hold Timer 🆕 NEW

**Estimated Time:** 45 mins

Covered inline in Task 3.2 (`inHouseHoldExpiresAt` set at match time) — this task is the sweeper that acts on it once it passes; see Task 11.1.

## TASK 3.4 — In-House Pitch Outcome API 🆕 NEW

**Estimated Time:** 2 hr

**File:** server/controllers/telecallerController.js

**Route:** PUT /api/telecaller/requirements/:id/pitch-outcome

```
Body: { outcome: 'interested' | 'not_interested' | 'no_answer' }

if outcome === 'interested':
  requirement.inHouseHoldStatus = 'pitched_interested'
  requirement.routingStage = 'closed_in_house'
  requirement.status = 'Closed'
  // 2-3% brokerage — ties to Finance module (Phase 3), out of scope here
  writeAudit('IN_HOUSE_DEAL_CLOSED', ...)

else: // not_interested or no_answer
  requirement.inHouseHoldStatus = 'pitched_not_interested'
  requirement.routingStage = 'awaiting_campaign_match'
  // RELEASE IMMEDIATELY — never wait out the remaining hold clock
  writeAudit('IN_HOUSE_HOLD_RELEASED', ...)
```

## TASK 3.5 — Hold Expiry Sweeper (Cron) 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/utils/cronJobs.js

**Frequency:** every 15 minutes (matches the `inhouseHoldExpiry` job named in System Build Part 7).

Finds `Requirement{inHouseHoldStatus: 'holding', inHouseHoldExpiresAt <= now}` with no telecaller action yet → auto-releases: `routingStage = 'awaiting_campaign_match'`, `inHouseHoldStatus = 'released'`. Write AuditLog: `IN_HOUSE_HOLD_RELEASED` (reason: expired).

## TASK 3.6 — Campaign-Lead Parallel Qualification 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** server/controllers/telecallerController.js

For `Requirement`s that already carry `campaignId` (CSV-imported per the Promoter plan): they still appear in the Inbound Queue and can be qualified/noted by a telecaller, but qualification here **never** changes `routingStage` or `inHouseHoldStatus` — the campaign already locked the destination. This is a lighter code path than Tasks 3.1–3.5, note-only.

# MODULE 4 — TIER 2 IN-HOUSE CATCH-ALL

**Module Estimated Time: 3 hr (2 tasks)**

## TASK 4.1 — Tier 2 In-House Queue API 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/controllers/telecallerController.js

**Route:** GET /api/telecaller/requirements/tier2-catchall

Surfaces `Requirement`s where `agentRoutingStatus = 'expired_no_taker'` (set by the Agent module's offer-expiry sweeper when the entire Tier 1/Tier 2 ladder has been exhausted with nobody accepting) — highest priority, telecaller's own brokerage.

## TASK 4.2 — Tier 2 In-House Pitch Outcome 🆕 NEW

**Estimated Time:** 2 hr

Reuses the same outcome mechanics as Task 3.4, scoped to this queue.

# MODULE 5 — VERIFICATION & INVALID-LEAD HANDLING

**Module Estimated Time: 2 hr 15 mins (3 tasks)**

## TASK 5.1 — Site Visit Verification Task List 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/controllers/telecallerController.js

**Route:** GET /api/telecaller/verification/site-visits

Surfaces `Requirement`s with `promoterStatus: 'site_visit_scheduled'` (Promoter plan) or an accepted `LeadOffer` awaiting the buyer-side OTP (Agent plan) — read-only cross-module view, for telecaller follow-up confirmation calls.

## TASK 5.2 — Closure Verification Task 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/controllers/telecallerController.js

Telecaller calls the buyer directly to confirm a claimed closure before it's marked verified — System Build Part 5: "verified by buyer feedback."

## TASK 5.3 — Invalid Lead Claim Review 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/controllers/telecallerController.js

**Routes:**
POST /api/promoter/leads/:id/claim-invalid   (promoter submits, within 48h — creates `InvalidLeadClaim`)
PUT  /api/telecaller/invalid-claims/:id/review  (telecaller/admin approves or rejects)

On approve: decrement `Campaign.deliveredCount` / `Property.deliveredLeads` — it no longer counts against the committed minimum. Write AuditLog: `INVALID_LEAD_CLAIM_APPROVED`.

# MODULE 6 — CALLBACKS

**Module Estimated Time: 3 hr (3 tasks)**

## TASK 6.1 — Schedule Callback API 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/controllers/telecallerController.js

Uses the `Callback` model (Task 1.3).

## TASK 6.2 — Callback Reminder Push 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/utils/notificationService.js

Reuses the existing ✅ `sendPushNotification` utility.

## TASK 6.3 — Callbacks — Frontend 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/telecaller/pages/Callbacks.jsx

# MODULE 7 — TELECALLER PANEL UI

**Module Estimated Time: 7 hr 45 mins (6 tasks)**

## TASK 7.1 — Inbound Queue — Frontend 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/telecaller/pages/InboundQueue.jsx

Oldest first, age badge on each row.

## TASK 7.2 — Qualification Form — Frontend 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/telecaller/pages/QualificationForm.jsx

Shows the auto-suggested tier (Task 3.1) with an override control and a required reason field when overridden.

## TASK 7.3 — In-House Pitch Queue — Frontend 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/telecaller/pages/InHousePitchQueue.jsx

**Non-negotiable per the source doc:** the matching in-house property must be shown **on the same screen** — "a telecaller switching tabs to find what to pitch will not pitch it."

## TASK 7.4 — Tier 2 In-House Queue — Frontend 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/telecaller/pages/Tier2InHouseQueue.jsx

## TASK 7.5 — Verification Tasks — Frontend 🆕 NEW

**Estimated Time:** 1 hr 30 mins

**File:** client/src/modules/telecaller/pages/VerificationTasks.jsx

Visit confirmations, closure checks, invalid-lead claims — three tabs on one screen.

## TASK 7.6 — My Stats — Frontend 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/telecaller/pages/MyStats.jsx

Calls made, leads qualified, converted — each against the admin-set daily target (Task 1.2/9.2).

# MODULE 8 — NOTIFICATIONS (TELECALLER)

**Module Estimated Time: 2 hr 15 mins (3 tasks)**

## TASK 8.1 — New Inbound Lead Alert 🆕 NEW

**Estimated Time:** 45 mins

Push on new `Requirement` creation, reusing ✅ `sendPushNotification`.

## TASK 8.2 — Hold Expiring Soon Reminder 🆕 NEW

**Estimated Time:** 45 mins

Push at the halfway point of the 24h/6h hold window, so a hold doesn't silently expire unpitched.

## TASK 8.3 — Tier 2 In-House Catch-All Alert 🆕 NEW

**Estimated Time:** 45 mins

High-priority ping the moment a lead lands in the catch-all queue (Task 4.1) — it's the telecaller's own brokerage on the line.

# MODULE 9 — ADMIN: TELECALLER MANAGEMENT

**Module Estimated Time: 3 hr (3 tasks)**

## TASK 9.1 — Telecaller Performance Overview 🆕 NEW

**Estimated Time:** 1 hr 30 mins

**File:** client/src/modules/admin/pages/telecaller/PerformanceOverview.jsx

Calls, qualified, converted per telecaller, vs target.

## TASK 9.2 — Set Daily Targets 🆕 NEW

**Estimated Time:** 45 mins

**File:** client/src/modules/admin/pages/telecaller/PerformanceOverview.jsx

Admin sets `dailyCallTarget`/`dailyQualifyTarget`/`dailyConvertTarget` per telecaller (Task 1.2 fields).

## TASK 9.3 — Invalid Lead Claims Overview (Admin) 🆕 NEW

**Estimated Time:** 45 mins

**File:** client/src/modules/admin/pages/telecaller/InvalidClaims.jsx

All `InvalidLeadClaim`s across all telecallers, with review status.

# MODULE 10 — TELECALLER PORTAL LAYOUT

**Module Estimated Time: 2 hr 30 mins (2 tasks)**

## TASK 10.1 — Telecaller Portal Layout 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/telecaller/layout/TelecallerLayout.jsx

```
THE PLOT ONE
──────────────
📥 Inbound Queue
🏠 In-House Pitch Queue
🔥 Tier 2 In-House
✅ Verification Tasks
📞 Callbacks
📊 My Stats
──────────────
🔔 Notifications
🚪 Logout
```

## TASK 10.2 — Telecaller Routes Setup 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/telecaller/TelecallerRoutes.jsx

```
/telecaller/inbound
/telecaller/inbound/:id/qualify
/telecaller/in-house-pitch
/telecaller/tier2-catchall
/telecaller/verification
/telecaller/callbacks
/telecaller/stats
```

# MODULE 11 — AUTOMATION / CRON JOBS

**Module Estimated Time: 1 hr 45 mins (2 tasks)**

## TASK 11.1 — In-House Hold Expiry Sweeper 🆕 NEW

**Estimated Time:** 1 hr

Consolidates Task 3.5 into the scheduled runner — every 15 minutes.

## TASK 11.2 — Stale Inbound Queue Alert 🆕 NEW

**Estimated Time:** 45 mins

Leads sitting unqualified past a threshold get flagged — covers the "Telecaller absent" failure mode from System Build Part 8 ("leads still deliver raw to promoters; queue ages visibly").

# MODULE 12 — AUDIT LOG INTEGRATION

**Module Estimated Time: 45 mins (1 task)**

## TASK 12.1 — Audit Events (Telecaller Module) 🆕 NEW

**Estimated Time:** 45 mins

**File:** uses the existing ✅ `writeAudit` utility

```
LEAD_QUALIFIED
IN_HOUSE_HOLD_STARTED
IN_HOUSE_HOLD_RELEASED
IN_HOUSE_DEAL_CLOSED
TIER2_INHOUSE_ASSIGNED
INVALID_LEAD_CLAIM_APPROVED / INVALID_LEAD_CLAIM_REJECTED
CALLBACK_SCHEDULED / CALLBACK_COMPLETED
```

# PHASE PLAN

## PHASE 1 — Core Backend (Build First)

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Database Models | 1.1 to 1.5 | 🔴 P0 |
| Auth Guard + Staff Account Creation | 2.1, 2.2 | 🔴 P0 |
| Qualification & In-House Engine | 3.1 to 3.6 | 🔴 P0 |
| Audit Log Events | 12.1 | 🔴 P0 |

## PHASE 2 — UI Complete

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Tier 2 In-House Catch-All | 4.1, 4.2 | 🟡 P1 |
| Verification & Invalid-Lead Handling | 5.1 to 5.3 | 🟡 P1 |
| Callbacks | 6.1 to 6.3 | 🟡 P1 |
| Telecaller Panel UI (all 6 screens) | 7.1 to 7.6 | 🟡 P1 |
| Admin — Telecaller Management | 9.1 to 9.3 | 🟡 P1 |
| Telecaller Portal Layout | 10.1, 10.2 | 🟡 P1 |

## PHASE 3 — Automation & Polish

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Notifications (reminders, catch-all alert) | 8.1 to 8.3 | 🟢 P2 |
| Cron consolidation | 11.1, 11.2 | 🟢 P2 |

# COMPLETE TASK COUNT

| Status | Count |
| :---- | :---- |
| ✅ EXISTS — no change | 0 |
| 🔧 MODIFY — existing code changes | 4 |
| 🆕 NEW — build from scratch | 34 |
| **Total** | **38 tasks** |

# STILL NEEDS CONFIRMATION

| Question | Blocks Task |
| :---- | :---- |
| Exact auto-suggested-tier thresholds (budget confirmed + timeframe rule proposed here is a guess, not sourced from the documents) | 3.1 |
| Daily call/qualify/convert target numbers — no figures given anywhere in the source docs; made admin-configurable instead | 1.2, 9.2 |
| Is a WhatsApp bot pre-qualification step ("Qualify: bot + telecaller" per the Business Flow doc) in scope anywhere, or does every lead reach a human telecaller first? | Scope boundary — affects 3.1, 7.1 |
| Lead unification across Requirement/WhatsappLead/Enquiry/RequestCall — confirmed out of scope for this plan, but still an open gap for the platform overall | Scope boundary |
| In-house inventory sourcing/CRUD — confirmed out of scope for this plan (separate module), this plan only reads the `isInHouseInventory` flag | 1.5, 3.2 |
| 2–3% in-house brokerage invoicing — ties to the Phase 3 Finance/GST module, not planned anywhere yet | 3.4 |

*Development Plan prepared: 05 Sep 2026*

*Flow confirmed through discussion — ready for schema review*
