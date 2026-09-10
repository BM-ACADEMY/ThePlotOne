# THE PLOT ONE — PROMOTER MODULE DEVELOPMENT PLAN

## Complete Task-by-Task Plan

**Based on confirmed flow discussions**

**Legend:** ✅ EXISTS | 🔧 MODIFY | 🆕 NEW

**Timeline note:** every estimate below is raw hands-on-keyboard implementation time for that task alone — it does not include testing, code review, integration debugging, or meetings. Treat these totals as a floor on effort, not a calendar delivery date.

## INDEX

| # | Module | Tasks | Phase | Status Breakdown | Est. Time |
| :---- | :---- | :---- | :---- | :---- | :---- |
| M1 | Database / Models | 6 tasks | P0 | 0 EXISTS · 3 MODIFY · 3 NEW | 5h 00m |
| M2 | Authentication & Roles | 2 tasks | P0 | 1 EXISTS · 0 MODIFY · 1 NEW | 30m |
| M3 | Project Listing | 5 tasks | P0/P1 | 0 EXISTS · 4 MODIFY · 1 NEW | 3h 20m |
| M4 | Plan & Payment | 5 tasks | P0/P1 | 0 EXISTS · 2 MODIFY · 3 NEW | 6h 35m |
| M5 | Lead Management (Promoter) | 4 tasks | P0/P1 | 0 EXISTS · 0 MODIFY · 4 NEW | 3h 30m |
| M6 | Notifications | 5 tasks | P0 | 1 EXISTS · 0 MODIFY · 4 NEW | 1h 50m |
| M7 | Admin — Campaign Management | 5 tasks | P0/P1 | 0 EXISTS · 0 MODIFY · 5 NEW | 5h 40m |
| M8 | Admin — CSV Lead Import | 3 tasks | P0/P1 | 0 EXISTS · 0 MODIFY · 3 NEW | 5h 10m |
| M9 | Admin — Promoter Management | 2 tasks | P1 | 0 EXISTS · 2 MODIFY · 0 NEW | 1h 40m |
| M10 | Promoter Portal Layout | 3 tasks | P1 | 0 EXISTS · 0 MODIFY · 3 NEW | 2h 05m |
| M11 | Automation / Cron Jobs | 3 tasks | P2 | 0 EXISTS · 0 MODIFY · 3 NEW | 2h 45m |
| M12 | Audit Log Integration | 1 task | P0 | 0 EXISTS · 0 MODIFY · 1 NEW | 30m |

### Summary

|  | Count |
| :---- | :---- |
| **Total Modules** | **12** |
| **Total Tasks** | **44** |
| ✅ EXISTS — no change | 2 |
| 🔧 MODIFY — change existing code | 11 |
| 🆕 NEW — build from scratch | 31 |
| **Total Estimated Time** | **38h 35m** |

### Phase Overview

| Phase | Focus | Modules Involved | Task Count |
| :---- | :---- | :---- | :---- |
| **Phase 1 (P0)** | Core backend — DB, API, Admin activation, CSV import | M1, M2, M5, M6, M7, M8, M12 | 21 tasks |
| **Phase 2 (P1)** | UI complete — all frontend pages | M3, M4, M9, M10 | 15 tasks |
| **Phase 3 (P2)** | Automation — cron jobs, pacing, expiry | M11 | 3 tasks |
| **Phase 4 (P3)** | WhatsApp delivery | — | Later |

## CONFIRMED PROMOTER FLOW (Reference)

1\. Promoter posts project          → Free, unlimited, no expiry  
2\. Promoter selects plan \+ pays    → Razorpay inside portal  
3\. Admin activates campaign        → Backend only, invisible to promoter  
4\. Admin uploads CSV leads         → Matched to project (area \+ budget \+ type)  
5\. Leads appear in portal          → Portal notification sent to promoter  
6\. Promoter calls buyer            → Updates lead status in portal  
7\. Lead limit reached              → Promoter \+ Admin both notified

**Campaign \= Admin tool only. Promoter never sees the word "Campaign".**

# MODULE 1 — DATABASE / MODELS

**Module Estimated Time: 5h 00m (6 tasks)**

## TASK 1.1 — Campaign Model 🆕 NEW

**Estimated Time:** 1h 00m

**File:** server/models/Campaign.js

**Purpose:** Internal admin tool — links a promoter's project to a plan with committed lead count.

Fields:  
\- promoter          (ref: User, required)  
\- project           (ref: Property, required)       // 1:1 with a listing  
\- plan              (ref: SubscriptionPlan, required)  
\- committedMinimum  (Number, required)              // 22 / 50 / 85 by plan  
\- deliveredCount    (Number, default: 0\)            // leads uploaded so far  
\- status            (enum: draft/active/paused/completed/expired)  
\- discountTier      (Number, enum: 1/2/3/4)         // volume discount position  
\- goLiveAt          (Date)  
\- expiresAt         (Date)  
\- paceStatus        (enum: on\_track/behind/ahead/completed)  
\- activatedBy       (ref: User)                     // admin who activated  
\- cityId            (String)  
\- notes             (String)                        // admin internal notes  
\- Timestamps

**Indexes:** promoter, project, status

## TASK 1.2 — Modify Subscription Model 🔧 MODIFY

**Estimated Time:** 30m

**File:** server/models/Subscription.js

**Current:** One subscription per account

**Change:** One subscription per campaign (project-specific)

Add:  
\- campaign     (ref: Campaign)     // links subscription to one campaign  
\- project      (ref: Property)     // which project this plan was bought for  
\- invoiceNo    (String, unique)    // billing reference  
   
Remove:  
\- leadsUsed    (moved to Campaign.deliveredCount)

## TASK 1.3 — Modify Lead / Requirement Model 🔧 MODIFY

**Estimated Time:** 1h 15m

**File:** server/models/Requirement.js

**Current:** Generic buyer requirement, no campaign linkage

**Add fields:**

\- campaignId        (ref: Campaign, immutable)   // set once, NEVER changes  
\- matchedProject    (ref: Property)              // project this lead is matched to  
\- csvImportBatch    (ref: CsvImport)             // which upload batch  
\- tier              (enum: tier1/tier2)          // general / ready-buyer  
\- source            (enum: meta\_ad/reel/website/walkin/call)  
   
// Promoter-side status tracking  
\- promoterStatus    (enum: pending/contacted/site\_visit\_scheduled/  
                           visited/interested/not\_interested/  
                           closed\_won/closed\_lost,  default: pending)  
\- promoterStatusUpdatedAt (Date)  
\- promoterNotes     (String)  
   
\- deliveredAt       (Date)      // when lead appeared in promoter portal  
\- notifiedAt        (Date)      // when portal notification was sent

**Critical — campaignId immutability:**

// Pre-save middleware in Requirement model  
RequirementSchema.pre('save', function(next) {  
  if (\!this.isNew && this.isModified('campaignId')) {  
    return next(new Error('campaignId is immutable once set'));  
  }  
  next();  
});

**Matching fields (used during CSV import to validate lead relevance):**

Lead field          ↔   Project field  
preferredLocation   ↔   city \+ locality  
minBudget-maxBudget ↔   sell.minPrice \- sell.maxPrice  
propertyType        ↔   propertyType  
usageType           ↔   usageType

## TASK 1.4 — CSV Import Batch Model 🆕 NEW

**Estimated Time:** 45m

**File:** server/models/CsvImportBatch.js

**Purpose:** Track each admin CSV upload for audit and deduplication.

Fields:  
\- campaign          (ref: Campaign, required)  
\- uploadedBy        (ref: User, required)          // admin  
\- fileName          (String)  
\- totalRows         (Number)  
\- imported          (Number)                       // successfully added  
\- duplicates        (Number)                       // skipped as duplicate  
\- failed            (Number)                       // validation failed rows  
\- status            (enum: processing/completed/failed)  
\- errorLog          (Array of Strings)  
\- Timestamps

## TASK 1.5 — Modify Property / Listing Model 🔧 MODIFY

**Estimated Time:** 45m

**File:** server/models/Property.js

**Changes:**

Add:  
\- isCampaignActive   (Boolean, default: false)  
\- activeCampaign     (ref: Campaign)  
\- committedLeads     (Number, default: 0\)   // from plan  
\- deliveredLeads     (Number, default: 0\)   // uploaded so far  
\- totalUnits         (Number)               // optional: total plots in layout  
\- availableUnits     (Number)               // optional: remaining plots  
   
Remove logic:  
\- expiresAt tied to subscription plan    → listings never expire now  
\- propertyLimit check                    → listings are free and unlimited

## TASK 1.6 — Audit Log Model 🆕 NEW

**Estimated Time:** 45m

**File:** server/models/AuditLog.js

**Purpose:** Append-only log of every state change. Ships in Phase 1\.

Fields:  
\- actor         (ref: User, required)  
\- actorRole     (String)                    // promoter/admin/system  
\- action        (String, required)          // CAMPAIGN\_CREATED, LEAD\_DELIVERED etc.  
\- entity        (String, required)          // Campaign/Lead/Subscription/Property  
\- entityId      (ObjectId, required)  
\- before        (Mixed)  
\- after         (Mixed)  
\- reason        (String)  
\- timestamp     (Date, default: now, immutable)  
   
// NO update, NO delete ever allowed on this collection

# MODULE 2 — AUTHENTICATION & ROLES

**Module Estimated Time: 30m (2 tasks)**

## TASK 2.1 — Promoter Role Guard Middleware 🆕 NEW

**Estimated Time:** 20m

**File:** server/middleware/promoterMiddleware.js

// Verify user is a promoter (businessType \= Builder)  
const isPromoter \= async (req, res, next) \=\> {  
  const user \= await User.findById(req.user.\_id).populate('businessType');  
  if (\!user.businessType || user.businessType.name \!== 'Builder') {  
    return res.status(403).json({ message: 'Promoter access only' });  
  }  
  next();  
};

**Use on:** All promoter-specific API routes

## TASK 2.2 — Promoter Onboarding Check ✅ EXISTS (minor check)

**Estimated Time:** 10m

Current OTP-based auth works fine. Just verify businessType is set to "Builder" when promoter registers. No major change needed.

# MODULE 3 — PROJECT LISTING

**Module Estimated Time: 3h 20m (5 tasks)**

## TASK 3.1 — Remove Subscription Gate from Property Creation 🔧 MODIFY

**Estimated Time:** 20m

**File:** server/controllers/propertyController.js

**Current logic to REMOVE:**

// DELETE THIS ENTIRE BLOCK:  
const propertyCount \= await Property.countDocuments({ seller: req.user.\_id });  
if (propertyCount \>= propertyLimit) {  
  return res.status(403).json({ message: 'Property limit reached' });  
}

**New logic:**

// Listings are FREE and UNLIMITED for promoters  
// No limit check — just create it

## TASK 3.2 — Remove Listing Expiry Tied to Subscription 🔧 MODIFY

**Estimated Time:** 20m

**File:** server/controllers/propertyController.js

**Current:** expiresAt calculated from subscription.plan.propertyValidity

**Change:** Listings never expire. Remove expiresAt calculation for promoters.

// Remove:  
const validityDays \= plan?.propertyValidity || FREE\_TIER\_VALIDITY;  
const expiresAt \= new Date(Date.now() \+ validityDays \* 86400000);  
   
// Replace with:  
const expiresAt \= null; // listings are permanent

## TASK 3.3 — My Projects API — Add Campaign Status 🔧 MODIFY

**Estimated Time:** 40m

**File:** server/controllers/propertyController.js

**Route:** GET /api/properties/my-listings

**Add to response per listing:**

{  
  ...existingFields,  
  isCampaignActive: true/false,  
  campaignPlan: "Growth",           // plan name if campaign active  
  committedLeads: 50,               // from plan  
  deliveredLeads: 23,               // uploaded so far  
  remainingLeads: 27,               // committedLeads \- deliveredLeads  
}

## TASK 3.4 — Post Property Form — Frontend Update 🔧 MODIFY

**Estimated Time:** 45m

**File:** client/src/modules/promoter/pages/properties/PostProperty.jsx

**Remove:**

* Subscription limit warning message

* "You can add X more properties" counter

* Expiry countdown

**Add (optional fields):**

* Total Units / Plots in project

* Available Units / Plots

**Keep everything else as-is** (form fields are comprehensive already)

## TASK 3.5 — My Projects Page — Frontend 🔧 MODIFY

**Estimated Time:** 1h 15m

**File:** client/src/modules/promoter/pages/properties/MyProjects.jsx

**Remove:**

* Subscription expiry alert

* Property limit counter

**Add per project card:**

┌─────────────────────────────────────────────┐  
│ Villianur Layout             📍 Villianur   │  
│                                             │  
│ Plan: Growth   Leads: 23 / 50  ████████░░  │  
│                                             │  
│ \[View Leads\]     \[Edit\]     \[Mark Sold Out\] │  
└─────────────────────────────────────────────┘  
   
┌─────────────────────────────────────────────┐  
│ Bahour Layout                📍 Bahour      │  
│                                             │  
│ No Active Plan                              │  
│                                             │  
│ \[View Project\]   \[Edit\]   \[Buy a Plan\]      │  
└─────────────────────────────────────────────┘

# MODULE 4 — PLAN & PAYMENT

**Module Estimated Time: 6h 35m (5 tasks)**

## TASK 4.1 — Plan Selection — Project Specific 🔧 MODIFY

**Estimated Time:** 2h 00m

**File:** client/src/modules/promoter/pages/plans/SelectPlan.jsx

**Current:** Generic plan selection for account

**New:** Promoter selects WHICH PROJECT the plan is for first

**Flow:**

Step 1: Select project from My Projects list  
        "Which project do you want to run leads for?"  
   
Step 2: Select plan  
        ┌──────────┬──────────┬──────────┐  
        │ STARTER  │ GROWTH ⭐│   PRO    │  
        │ ₹9,999   │ ₹24,999  │ ₹39,999  │  
        │ 22 leads │ 50 leads │ 85 leads │  
        └──────────┴──────────┴──────────┘  
   
        If 2nd campaign:  
        → Starter is DISABLED (grey)  
        → Volume discount shown: "20% off — ₹19,999"  
   
        If 5th campaign:  
        → All plans DISABLED  
        → "Contact admin for Enterprise plan"  
   
Step 3: Review & Pay via Razorpay  
        Project: Villianur Layout  
        Plan: Growth — ₹24,999  
        \[Pay Now\]  
   
Step 4: Success page  
        "Payment received\! Admin will activate your  
         leads within 24 hours."

## TASK 4.2 — Create Campaign Order API 🔧 MODIFY

**Estimated Time:** 1h 30m

**File:** server/controllers/subscriptionController.js

**Route:** POST /api/campaigns/create-order

**Changes from current createOrder:**

// New validations to add:  
1\. Validate projectId belongs to this promoter  
2\. Check no active campaign already exists for this project  
3\. Count active campaigns for this promoter  
   \- If 4 active → block, return Enterprise message  
4\. If 2nd+ campaign:  
   \- Block Starter plan  
   \- Calculate discountTier (2→20%, 3→25%, 4→30%)  
   \- Apply discount to price  
5\. Create Razorpay order with project \+ plan metadata  
6\. Create Campaign with status: 'draft'  
7\. Create Subscription linked to campaign (status: pending)

## TASK 4.3 — Verify Payment & Create Pending Campaign 🔧 MODIFY

**Estimated Time:** 1h 15m

**File:** server/controllers/subscriptionController.js

**Route:** POST /api/campaigns/verify-payment

**Changes from current verifyPayment:**

// After Razorpay signature verified:  
1\. Update Campaign.status \= 'payment\_received' (NOT active yet)  
2\. Update Subscription.status \= 'active'  
3\. Set Property.committedLeads \= plan.committedMinimum  
4\. Create PaymentHistory record linked to campaign \+ project  
5\. Write to AuditLog: PAYMENT\_RECEIVED  
6\. Notify admin: "New payment received — activate campaign for \[Promoter Name\] / \[Project\]"  
7\. Return success to promoter: "Payment received, admin activating soon"  
   
// Campaign stays in 'payment\_received' status until admin activates  
// Admin activation is SEPARATE step (Task 7.2)

## TASK 4.4 — Volume Discount Logic 🆕 NEW

**Estimated Time:** 20m

**File:** server/utils/discountUtils.js

const getVolumeDiscount \= (activeCampaignCount) \=\> {  
  // activeCampaignCount \= number of CURRENTLY ACTIVE campaigns  
  switch(activeCampaignCount) {  
    case 0: return { tier: 1, discount: 0 };      // 1st campaign — full price  
    case 1: return { tier: 2, discount: 20 };     // 2nd campaign — 20% off  
    case 2: return { tier: 3, discount: 25 };     // 3rd campaign — 25% off  
    case 3: return { tier: 4, discount: 30 };     // 4th campaign — 30% off  
    default: return null;                          // 5th+ — Enterprise only  
  }  
};

## TASK 4.5 — Billing Page — Frontend 🆕 NEW

**Estimated Time:** 1h 30m

**File:** client/src/modules/promoter/pages/plans/Billing.jsx

Active Plans:  
┌─────────────────────────────────────────────┐  
│ Villianur Layout                            │  
│ Growth Plan — ₹24,999                       │  
│ Leads: 23/50  |  Status: Active             │  
│ \[Download Invoice\]                          │  
└─────────────────────────────────────────────┘  
   
Payment History:  
┌────────────┬──────────────────┬────────┬───────────┐  
│ Date       │ Project          │ Plan   │ Amount    │  
├────────────┼──────────────────┼────────┼───────────┤  
│ 01 Aug 26  │ Villianur Layout │ Growth │ ₹24,999   │  
│ 15 Jul 26  │ Bahour Layout    │ Growth │ ₹19,999   │  
└────────────┴──────────────────┴────────┴───────────┘

# MODULE 5 — LEAD MANAGEMENT (PROMOTER SIDE)

**Module Estimated Time: 3h 30m (4 tasks)**

## TASK 5.1 — My Leads API 🆕 NEW

**Estimated Time:** 45m

**File:** server/controllers/leadController.js

**Route:** GET /api/leads/my-leads

// Returns all leads for this promoter across all their projects  
Query params:  
\- projectId   (optional — filter by specific project)  
\- status      (optional — filter by promoterStatus)  
\- page, limit  
   
Response per lead:  
{  
  \_id,  
  fullName,  
  phoneNumber,  
  email,  
  preferredLocation,  
  minBudget,  
  maxBudget,  
  propertyType,  
  usageType,  
  message,  
  source,  
  tier,  
  deliveredAt,  
  promoterStatus,  
  promoterNotes,  
  matchedProject: { title, locality }  
}

## TASK 5.2 — Update Lead Status API 🆕 NEW

**Estimated Time:** 45m

**File:** server/controllers/leadController.js

**Route:** PUT /api/leads/:leadId/status

Body: {  
  promoterStatus: 'contacted' | 'site\_visit\_scheduled' |  
                  'visited' | 'interested' |  
                  'not\_interested' | 'closed\_won' | 'closed\_lost',  
  promoterNotes: 'Called, interested in 30x40 plot'  
}  
   
Validation:  
\- Lead must belong to this promoter's project  
\- Status must follow allowed transitions  
   
Write to AuditLog: LEAD\_STATUS\_UPDATED

**Status Transitions:**

pending  
  → contacted  
      → site\_visit\_scheduled  
          → visited  
              → interested → closed\_won  
              → not\_interested → closed\_lost  
      → not\_interested → closed\_lost

## TASK 5.3 — My Leads Page — Frontend 🆕 NEW

**Estimated Time:** 1h 30m

**File:** client/src/modules/promoter/pages/leads/MyLeads.jsx

**Layout:**

Filter: \[All Projects ▼\] \[All Status ▼\] \[Date Range\]  
   
Lead Card:  
┌──────────────────────────────────────────────┐  
│ Ramesh Kumar              Today, 2:14 PM     │  
│ 📍 Villianur  💰 ₹25L–35L  🏠 Plot          │  
│ 📞 \+91 98765 43210  📧 ramesh@gmail.com      │  
│ "Looking for 30x40 corner plot near school"  │  
│                                              │  
│ Status: \[Pending ▼\]          \[Add Notes\]     │  
└──────────────────────────────────────────────┘  
   
Status Dropdown Options:  
\- Pending  
\- Contacted  
\- Site Visit Scheduled  
\- Visited  
\- Interested  
\- Not Interested  
\- Closed (Won)  
\- Closed (Lost)

## TASK 5.4 — Lead Count Display Per Project 🆕 NEW

**Estimated Time:** 30m

**File:** client/src/modules/promoter/pages/properties/MyProjects.jsx

**Per project:**

Leads: 23 / 50   ████████░░░░  46%  
   
When 50/50 reached:  
Leads: 50 / 50   ██████████  100% — Limit Reached

# MODULE 6 — NOTIFICATIONS

**Module Estimated Time: 1h 50m (5 tasks)**

## TASK 6.1 — New Lead Portal Notification (Promoter) 🆕 NEW

**Estimated Time:** 30m

**File:** server/utils/notificationService.js

**Trigger:** When admin confirms CSV import → leads assigned to project

// Send portal notification to promoter  
await sendPortalNotification({  
  userId: promoter.\_id,  
  title: 'New Lead Received',  
  message: \`You have a new lead for ${project.title}\`,  
  type: 'new\_lead',  
  link: '/promoter/my-leads',  
  leadId: lead.\_id  
});

**Frontend:** Bell icon in promoter portal header with unread count badge

## TASK 6.2 — Lead Limit Reached Notification (Promoter) 🆕 NEW

**Estimated Time:** 20m

**Trigger:** When deliveredCount \>= committedMinimum after CSV import

// Notify promoter  
await sendPortalNotification({  
  userId: promoter.\_id,  
  title: 'Lead Limit Reached',  
  message: \`Your ${plan.name} plan for ${project.title} has reached  
            its limit of ${committedMinimum} leads.  
            Contact admin to extend your plan.\`,  
  type: 'lead\_limit\_reached',  
  link: '/promoter/plans'  
});

## TASK 6.3 — Lead Limit Reached Notification (Admin) 🆕 NEW

**Estimated Time:** 20m

**Trigger:** Same — when limit is reached

// Notify admin  
await sendPortalNotification({  
  userId: adminUser.\_id,  
  title: 'Promoter Lead Limit Reached',  
  message: \`${promoter.name} — ${project.title} has reached  
            ${deliveredCount}/${committedMinimum} leads.\`,  
  type: 'admin\_lead\_limit',  
  link: \`/admin/campaigns/${campaign.\_id}\`  
});

## TASK 6.4 — New Payment Notification (Admin) 🆕 NEW

**Estimated Time:** 20m

**Trigger:** After Razorpay payment verified for a campaign

// Notify admin to activate campaign  
await sendPortalNotification({  
  userId: adminUser.\_id,  
  title: 'New Campaign Payment — Action Required',  
  message: \`${promoter.name} paid ₹${amount} for  
            ${plan.name} plan on ${project.title}.  
            Please activate the campaign.\`,  
  type: 'campaign\_activation\_required',  
  link: \`/admin/campaigns/pending\`  
});

## TASK 6.5 — Notification Bell Component ✅ EXISTS (minor update)

**Estimated Time:** 20m

Push notification infrastructure exists. Add portal/in-app notification type alongside existing push notifications.

# MODULE 7 — ADMIN: CAMPAIGN MANAGEMENT

**Module Estimated Time: 5h 40m (5 tasks)**

## TASK 7.1 — Campaign Management Page 🆕 NEW

**Estimated Time:** 1h 30m

**File:** client/src/modules/admin/pages/CampaignManagement.jsx

**Admin sees:**

Campaigns Overview:  
   
Filter: \[All Status ▼\] \[Promoter ▼\] \[Plan ▼\]  
   
┌──────────────────────────────────────────────────────────────┐  
│ Promoter       │ Project          │ Plan    │ Leads  │ Status │  
├──────────────────────────────────────────────────────────────┤  
│ Ravi Builder   │ Villianur Layout │ Growth  │ 23/50  │ Active │  
│ Kumar Dev      │ Bahour Layout    │ Starter │ 20/22  │ Active │  
│ Priya Builders │ ECR Layout       │ Pro     │ 0/85   │ Draft  │  
└──────────────────────────────────────────────────────────────┘

## TASK 7.2 — Activate Campaign (Admin) 🆕 NEW

**Estimated Time:** 1h 00m

**File:** server/controllers/campaignController.js

**Route:** PUT /api/admin/campaigns/:id/activate

Logic:  
1\. Find campaign with status: 'payment\_received'  
2\. Set campaign.status \= 'active'  
3\. Set campaign.goLiveAt \= now  
4\. Set campaign.expiresAt \= now \+ plan.duration days  
5\. Set campaign.activatedBy \= req.user.\_id  
6\. Update Property.isCampaignActive \= true  
7\. Update Property.activeCampaign \= campaign.\_id  
8\. Write to AuditLog: CAMPAIGN\_ACTIVATED  
9\. Notify promoter: "Your plan is active\! Leads for \[Project\] will start arriving."

## TASK 7.3 — Campaign Detail View (Admin) 🆕 NEW

**Estimated Time:** 1h 15m

**Route:** GET /api/admin/campaigns/:id

**Admin sees (full mechanics visible to admin only):**

Campaign: Villianur Layout — Growth Plan  
Promoter: Ravi Builder | \+91 98765 43210  
Status: Active | GoLive: 01 Aug 2026 | Expires: 31 Aug 2026  
   
DELIVERY:  
Leads Delivered    23 / 50     Days Remaining: 18  
Tier 1 (General)   18  
Tier 2 (Ready)      5  
   
CSV IMPORTS:  
Batch 1 — 10 leads — 15 Aug 2026 — by Admin Arshad  
Batch 2 — 13 leads — 22 Aug 2026 — by Admin Arshad  
   
ACTIONS:  
\[Upload Leads CSV\]  \[Pause Campaign\]  \[Extend Campaign\]  \[Mark Complete\]

## TASK 7.4 — Pause / Extend / Complete Campaign (Admin) 🆕 NEW

**Estimated Time:** 1h 15m

**Routes:**

PUT /api/admin/campaigns/:id/pause  
PUT /api/admin/campaigns/:id/extend     Body: { extraDays: 7 }  
PUT /api/admin/campaigns/:id/complete

Each action:

* Updates campaign status

* Writes to AuditLog

* Notifies promoter

## TASK 7.5 — Pending Campaigns Queue (Admin) 🆕 NEW

**Estimated Time:** 40m

**Route:** GET /api/admin/campaigns/pending

**Shows all campaigns with status: 'payment\_received' waiting for activation**

Pending Activation (2):  
   
┌─────────────────────────────────────────────────────┐  
│ Priya Builders — ECR Layout — Pro — ₹39,999 paid   │  
│ Paid: 28 Aug 2026   Plan: Pro   Leads: 85           │  
│ \[Activate Campaign\]                                  │  
└─────────────────────────────────────────────────────┘

# MODULE 8 — ADMIN: CSV LEAD IMPORT

**Module Estimated Time: 5h 10m (3 tasks)**

## TASK 8.1 — CSV Import API 🆕 NEW

**Estimated Time:** 2h 30m

**File:** server/controllers/csvImportController.js

**Route:** POST /api/admin/campaigns/:id/import-leads

**Process:**

Step 1: Receive CSV file (multer)  
Step 2: Parse CSV rows  
Step 3: Map columns to system fields:  
        CSV Column          → System Field  
        "full\_name"         → fullName (required)  
        "phone\_number"      → phoneNumber (required)  
        "email"             → email  
        "preferred\_area"    → preferredLocation  
        "min\_budget"        → minBudget  
        "max\_budget"        → maxBudget  
        "property\_type"     → propertyType  
        "usage\_type"        → usageType  
        "message"           → message  
   
Step 4: Validate each row:  
        \- phoneNumber must be 10 digits (required)  
        \- fullName must exist (required)  
   
Step 5: Deduplication check:  
        \- Check if phoneNumber already exists in this campaign  
        \- Check if phoneNumber exists in system (same project)  
        \- Mark duplicates, don't create  
   
Step 6: Create CsvImportBatch record  
   
Step 7: Create Requirement records for valid rows:  
        \- Set campaignId \= campaign.\_id (IMMUTABLE)  
        \- Set matchedProject \= campaign.project  
        \- Set promoterStatus \= 'pending'  
        \- Set deliveredAt \= now  
        \- Set source \= 'meta\_ad'  
   
Step 8: Update Campaign.deliveredCount \+= importedCount  
        Update Property.deliveredLeads \+= importedCount  
   
Step 9: Check if deliveredCount \>= committedMinimum  
        → If yes: trigger lead limit notifications (Task 6.2 \+ 6.3)  
   
Step 10: Send portal notification to promoter for each new lead (Task 6.1)  
   
Step 11: Write to AuditLog: LEADS\_IMPORTED  
   
Step 12: Return summary:  
        { imported: 17, duplicates: 2, failed: 1, total: 20 }

## TASK 8.2 — CSV Column Mapping UI (Admin) 🆕 NEW

**Estimated Time:** 2h 00m

**File:** client/src/modules/admin/pages/campaigns/ImportLeads.jsx

**Step 1 — Upload:**

Campaign: Villianur Layout — Growth (23/50 leads delivered)  
Remaining: 27 leads  
   
\[Choose CSV File\]  or  Drag & Drop  
   
Supported: Meta Lead Center export format

**Step 2 — Map Columns:**

CSV Column          →    System Field  
full\_name           →    \[Full Name ▼\]  
phone\_number        →    \[Phone Number ▼\]  
email\_address       →    \[Email ▼\]  
city                →    \[Preferred Location ▼\]  
budget              →    \[Budget ▼\]  
message             →    \[Message ▼\]

**Step 3 — Preview:**

✅ 17 new leads ready to import  
⚠️  2 duplicates (already in system — will be skipped)  
❌  1 invalid (missing phone number — will be skipped)  
   
\[Confirm Import\]   \[Cancel\]

**Step 4 — Success:**

✅ Import Complete  
17 leads added to Villianur Layout  
Promoter has been notified  
Leads delivered: 40/50

## TASK 8.3 — Deduplication Logic 🆕 NEW

**Estimated Time:** 40m

**File:** server/utils/deduplication.js

const checkDuplicate \= async (phoneNumber, campaignId) \=\> {  
  // Check 1: Same phone in same campaign  
  const inCampaign \= await Requirement.findOne({  
    phoneNumber,  
    campaignId  
  });  
   
  // Check 2: Same phone in same project (any campaign)  
  const inProject \= await Requirement.findOne({  
    phoneNumber,  
    matchedProject: campaign.project  
  });  
   
  return inCampaign || inProject ? true : false;  
};

# MODULE 9 — ADMIN: PROMOTER MANAGEMENT

**Module Estimated Time: 1h 40m (2 tasks)**

## TASK 9.1 — Promoter Detail View 🔧 MODIFY

**Estimated Time:** 1h 00m

**File:** client/src/modules/admin/pages/SellerList.jsx

**Add to existing promoter/seller detail:**

Promoter: Ravi Builder  
   
PROJECTS:  
┌────────────────────────────────────────────────────┐  
│ Project          │ Plan    │ Leads   │ Status       │  
├────────────────────────────────────────────────────┤  
│ Villianur Layout │ Growth  │ 23/50   │ Active       │  
│ Bahour Layout    │ Starter │ 22/22   │ Limit Reached│  
│ ECR Layout       │ —       │ —       │ No Plan      │  
└────────────────────────────────────────────────────┘  
   
PAYMENT HISTORY:  
\[Table of payments linked to projects\]

## TASK 9.2 — Campaign Status in Admin Dashboard 🔧 MODIFY

**Estimated Time:** 40m

**File:** client/src/modules/admin/pages/Dashboard.jsx

**Add to existing admin stats:**

Active Campaigns    : 12  
Pending Activation  : 2   ← Action required  
Leads Uploaded Today: 34  
Campaigns at Limit  : 1

# MODULE 10 — PROMOTER PORTAL LAYOUT

**Module Estimated Time: 2h 05m (3 tasks)**

## TASK 10.1 — Promoter Portal Layout 🆕 NEW

**Estimated Time:** 45m

**File:** client/src/modules/promoter/layout/PromoterLayout.jsx

**Sidebar navigation:**

THE PLOT ONE  
──────────────  
📁 My Projects  
📋 My Leads  
💳 Plans & Billing  
👤 Profile  
──────────────  
🔔 Notifications (badge count)  
🚪 Logout

**No campaign section visible anywhere.**

## TASK 10.2 — Promoter Home Dashboard 🆕 NEW

**Estimated Time:** 1h 00m

**File:** client/src/modules/promoter/pages/Dashboard.jsx

Welcome back, Ravi\!  
   
YOUR PROJECTS:  
   
┌─────────────────────────────────────────┐  
│ Villianur Layout         Growth Plan    │  
│ Leads: 23/50   ████████░░  46%         │  
│ New today: 3                            │  
│ \[View Leads\]                            │  
└─────────────────────────────────────────┘  
   
┌─────────────────────────────────────────┐  
│ Bahour Layout                           │  
│ No active plan                          │  
│ \[Buy a Plan\]                            │  
└─────────────────────────────────────────┘

## TASK 10.3 — Promoter Routes Setup 🆕 NEW

**Estimated Time:** 20m

**File:** client/src/modules/promoter/PromoterRoutes.jsx

Routes:  
/promoter/dashboard  
/promoter/my-projects  
/promoter/my-projects/add  
/promoter/my-projects/:id/edit  
/promoter/my-leads  
/promoter/my-leads/:projectId  
/promoter/plans  
/promoter/plans/select/:projectId  
/promoter/billing  
/promoter/profile

# MODULE 11 — AUTOMATION / CRON JOBS

**Module Estimated Time: 2h 45m (3 tasks)**

## TASK 11.1 — Campaign Pacing Check 🆕 NEW

**Estimated Time:** 1h 00m

**File:** server/utils/cronJobs.js

**Frequency:** Daily at 7:00 AM

// Per active campaign:  
const dailyTarget \= (committedMinimum \- deliveredCount) / daysRemaining;  
const actualDailyAvg \= deliveredCount / daysElapsed;  
   
if (actualDailyAvg \< dailyTarget \* 0.85) {  
  // Behind by 15% — alert admin  
  campaign.paceStatus \= 'behind';  
  notifyAdmin(\`${project.title} is behind pace.   
               Target: ${dailyTarget}/day | Actual: ${actualDailyAvg}/day\`);  
}  
   
if (actualDailyAvg \> dailyTarget \* 1.30) {  
  // Ahead by 30%  
  campaign.paceStatus \= 'ahead';  
  notifyAdmin(\`${project.title} is ahead of pace.\`);  
}

## TASK 11.2 — Campaign Expiry Check 🆕 NEW

**Estimated Time:** 1h 00m

**File:** server/utils/cronJobs.js

**Frequency:** Daily at midnight

// Find campaigns expiring today  
const expiring \= await Campaign.find({  
  expiresAt: { $lte: new Date() },  
  status: 'active'  
});  
   
for (const campaign of expiring) {  
  if (campaign.deliveredCount \< campaign.committedMinimum) {  
    // Minimum not met — extend by 7 days  
    campaign.expiresAt \= addDays(campaign.expiresAt, 7);  
    campaign.paceStatus \= 'behind';  
    notifyPromoter('Your plan has been extended. We will complete your leads.');  
    notifyAdmin(\`${project.title} extended — ${deliveredCount}/${committedMinimum} leads\`);  
  } else {  
    // Minimum met — mark expired  
    campaign.status \= 'expired';  
    notifyPromoter('Your plan is complete. Contact admin to renew.');  
    notifyAdmin(\`${project.title} campaign completed.\`);  
  }  
  await campaign.save();  
  writeAuditLog('CAMPAIGN\_EXPIRY\_PROCESSED', campaign);  
}

## TASK 11.3 — 7AM Self-Audit Job 🆕 NEW

**Estimated Time:** 45m

**File:** server/utils/cronJobs.js

**Frequency:** Daily at 7:00 AM

// Check all cron jobs ran successfully  
// Check no orphaned leads (campaignId set but not delivered)  
// Check no campaign over-delivered  
// Send summary to admin portal notification  
   
"Daily Audit ✅  
 Active Campaigns   : 12  
 Leads imported today: 34  
 Pending activation : 2  
 Behind pace        : 1  
 Orphaned leads     : 0"

# MODULE 12 — AUDIT LOG INTEGRATION

**Module Estimated Time: 30m (1 task)**

## TASK 12.1 — Audit Log Writer Utility 🆕 NEW

**Estimated Time:** 30m

**File:** server/utils/auditLogger.js

const writeAudit \= async ({ actor, actorRole, action, entity, entityId, before, after, reason }) \=\> {  
  await AuditLog.create({  
    actor, actorRole, action, entity, entityId, before, after, reason,  
    timestamp: new Date()  
  });  
};

**Events to log:**

CAMPAIGN\_CREATED          → when admin creates campaign  
PAYMENT\_RECEIVED          → when Razorpay payment verified  
CAMPAIGN\_ACTIVATED        → when admin activates campaign  
LEADS\_IMPORTED            → when CSV import completes  
LEAD\_STATUS\_UPDATED       → when promoter updates lead status  
LEAD\_LIMIT\_REACHED        → when deliveredCount hits committedMinimum  
CAMPAIGN\_PAUSED           → admin pauses campaign  
CAMPAIGN\_EXTENDED         → admin extends campaign  
CAMPAIGN\_COMPLETED        → campaign marked complete  
CAMPAIGN\_EXPIRED          → auto-expiry by cron

# PHASE PLAN

## PHASE 1 — Core (Build First)

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Database Models | 1.1 to 1.6 | 🔴 P0 |
| Auth Guard | 2.1 | 🔴 P0 |
| Remove Subscription Gate | 3.1, 3.2 | 🔴 P0 |
| Plan & Payment (project-specific) | 4.1 to 4.4 | 🔴 P0 |
| Admin Campaign Activation | 7.2, 7.5 | 🔴 P0 |
| CSV Lead Import (API) | 8.1, 8.3 | 🔴 P0 |
| My Leads (promoter) | 5.1, 5.2 | 🔴 P0 |
| Lead Status Update | 5.2 | 🔴 P0 |
| Notifications (basic) | 6.1, 6.2, 6.3, 6.4 | 🔴 P0 |
| Audit Log | 12.1 | 🔴 P0 |

## PHASE 2 — UI Complete

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Promoter Portal Layout | 10.1, 10.2, 10.3 | 🟡 P1 |
| My Projects Page | 3.4, 3.5 | 🟡 P1 |
| My Leads Page (frontend) | 5.3, 5.4 | 🟡 P1 |
| Select Plan Flow (frontend) | 4.1 | 🟡 P1 |
| Billing Page | 4.5 | 🟡 P1 |
| CSV Import UI (admin) | 8.2 | 🟡 P1 |
| Campaign Management UI | 7.1, 7.3, 7.4 | 🟡 P1 |
| Admin Promoter View | 9.1, 9.2 | 🟡 P1 |
| My Projects API update | 3.3 | 🟡 P1 |

## PHASE 3 — Automation & Polish

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Campaign Pacing Cron | 11.1 | 🟢 P2 |
| Campaign Expiry Cron | 11.2 | 🟢 P2 |
| 7AM Self-Audit | 11.3 | 🟢 P2 |
| Volume Discount Logic | 4.4 | 🟢 P2 |
| WhatsApp Lead Delivery | Later phase | 🟢 P3 |

# COMPLETE TASK COUNT

| Status | Count |
| :---- | :---- |
| ✅ EXISTS — no change | 2 |
| 🔧 MODIFY — existing code changes | 11 |
| 🆕 NEW — build from scratch | 31 |
| **Total** | **44 tasks** |

# COMPLETE TIME ESTIMATE

| Module | Est. Time |
| :---- | :---- |
| M1 — Database / Models | 5h 00m |
| M2 — Authentication & Roles | 30m |
| M3 — Project Listing | 3h 20m |
| M4 — Plan & Payment | 6h 35m |
| M5 — Lead Management (Promoter) | 3h 30m |
| M6 — Notifications | 1h 50m |
| M7 — Admin — Campaign Management | 5h 40m |
| M8 — Admin — CSV Lead Import | 5h 10m |
| M9 — Admin — Promoter Management | 1h 40m |
| M10 — Promoter Portal Layout | 2h 05m |
| M11 — Automation / Cron Jobs | 2h 45m |
| M12 — Audit Log Integration | 30m |
| **GRAND TOTAL** | **38h 35m** |

**Reminder:** this is raw implementation time only — no testing, review, or integration buffer. Use it as a floor when building your own delivery estimate, not as the delivery date itself.

# STILL NEEDS CONFIRMATION

| Question | Blocks Task |
| :---- | :---- |
| Which fields does promoter see per lead (exact CSV column mapping) | 5.1, 8.1, 8.2 |
| How does promoter select project when buying plan — from My Projects page or plan page? | 4.1 |
| WhatsApp API provider (Twilio / Wati / Meta Cloud) | Phase 3 |
| Trial plan (Lead Proof / Full Proof) — is this in scope for Phase 1? | 4.1 |

*Development Plan prepared: 28 Aug 2026*

*Flow confirmed through discussion — ready for schema review*
