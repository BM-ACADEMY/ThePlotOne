# THE PLOT ONE — ADMIN MODULE DEVELOPMENT PLAN

## Complete Task-by-Task Plan

**Based on confirmed flow discussions \+ existing codebase review**

**Legend:** ✅ EXISTS | 🔧 MODIFY | 🆕 NEW

## INDEX

| \# | Module | Tasks | Phase | Status Breakdown |
| :---- | :---- | :---- | :---- | :---- |
| M1 | Dashboard Enhancements | 2 tasks | P1 | 0 EXISTS · 2 MODIFY · 0 NEW |
| M2 | Campaign Management — Backend | 3 tasks | P0 | 0 EXISTS · 1 MODIFY · 2 NEW |
| M3 | Campaign Management — UI | 5 tasks | P1 | 0 EXISTS · 0 MODIFY · 5 NEW |
| M4 | CSV Lead Import | 3 tasks | P0/P1 | 0 EXISTS · 0 MODIFY · 3 NEW |
| M5 | Admin Lead Management | 2 tasks | P1 | 0 EXISTS · 0 MODIFY · 2 NEW |
| M6 | Promoter Management | 2 tasks | P1 | 0 EXISTS · 2 MODIFY · 0 NEW |
| M7 | Subscription Plan Manager | 2 tasks | P0/P1 | 0 EXISTS · 1 MODIFY · 1 NEW |
| M8 | Audit Log Viewer | 2 tasks | P2 | 0 EXISTS · 0 MODIFY · 2 NEW |
| M9 | Admin Notifications | 2 tasks | P0 | 0 EXISTS · 1 MODIFY · 1 NEW |
| M10 | Sidebar Navigation | 1 task | P1 | 0 EXISTS · 1 MODIFY · 0 NEW |

### Summary

|  | Count |
| :---- | :---- |
| **Total Modules** | **10** |
| **Total Tasks** | **24** |
| ✅ EXISTS — no change | 0 |
| 🔧 MODIFY — change existing code | 8 |
| 🆕 NEW — build from scratch | 16 |

### Phase Overview

| Phase | Focus | Modules | Tasks |
| :---- | :---- | :---- | :---- |
| **Phase 1 (P0)** | Core backend APIs — campaign CRUD, CSV import API, notification model, plan updates | M2, M4, M7, M9 | 8 tasks |
| **Phase 2 (P1)** | All admin UI pages | M1, M3, M5, M6, M10 \+ M4 UI | 14 tasks |
| **Phase 3 (P2)** | Audit log viewer \+ export | M8 | 2 tasks |

## CONFIRMED ADMIN FLOW (Reference)

1\. Promoter pays online               → Campaign created with status: payment\_received  
2\. Admin sees pending queue           → Notification \+ badge in admin panel  
3\. Admin reviews \+ activates          → Campaign goes active, promoter notified  
4\. Admin uploads CSV leads            → Matched to project, leads assigned to campaign  
5\. Admin imports & confirms           → Promoter portal gets leads \+ notification  
6\. Admin monitors delivery            → Campaign list shows progress per campaign  
7\. Campaign pacing alert              → Admin notified if behind/ahead of pace  
8\. Lead limit reached                 → Both admin and promoter notified  
9\. Campaign expires                   → Auto-checked by cron; admin notified

**Campaign \= Admin's primary tool. Admin sees ALL mechanics. Promoter sees outcomes only.**

# MODULE 1 — DASHBOARD ENHANCEMENTS

**Module Estimated Time: 2 hr 30 mins (2 tasks)**

## TASK 1.1 — Dashboard Stats API 🔧 MODIFY

**Estimated Time:** 1 hr 15 mins

**File:** server/controllers/userController.js (or dashboard API)

**Current fetch-notification-counts returns:**

badgeRequests, sellerProperties, enquiries, requirements,  
callRequests, contactMessages, marketingRequests, supportTickets

**Add to response:**

activeCampaigns:       await Campaign.countDocuments({ status: 'active' }),  
pendingActivation:     await Campaign.countDocuments({ status: 'payment\_received' }),  
leadsUploadedToday:    await Requirement.countDocuments({  
                         campaignId: { $exists: true },  
                         deliveredAt: { $gte: startOfToday }  
                       }),  
campaignsAtLimit:      await Campaign.countDocuments({  
                         $expr: { $gte: \['$deliveredCount', '$committedMinimum'\] },  
                         status: 'active'  
                       }),  
campaignsBehindPace:   await Campaign.countDocuments({ paceStatus: 'behind' }),

## TASK 1.2 — Dashboard UI — Campaign Stats Cards 🔧 MODIFY

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/admin/pages/dashboard/Dashboard.jsx

**Add campaign metric cards alongside existing stats:**

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  
│ Active          │  │ Pending         │  │ Leads Today     │  │ At Limit        │  
│ Campaigns       │  │ Activation      │  │                 │  │                 │  
│      12         │  │   2  ⚠️         │  │      34         │  │   1  🔴         │  
│                 │  │ Action required │  │                 │  │                 │  
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘

**Clicking "Pending Activation" card → navigates to \`/admin/campaigns/pending\`**

# MODULE 2 — CAMPAIGN MANAGEMENT BACKEND

**Module Estimated Time: 4 hr (3 tasks)**

## TASK 2.1 — Campaign Controller (Admin APIs) 🆕 NEW

**Estimated Time:** 2 hr

**File:** server/controllers/campaignController.js

Routes to implement:  
   
GET    /api/admin/campaigns               → getAllCampaigns (with filters)  
GET    /api/admin/campaigns/pending       → getPendingCampaigns (status: payment\_received)  
GET    /api/admin/campaigns/:id           → getCampaignDetail  
PUT    /api/admin/campaigns/:id/activate  → activateCampaign  
PUT    /api/admin/campaigns/:id/pause     → pauseCampaign  
PUT    /api/admin/campaigns/:id/extend    → extendCampaign  (body: { extraDays })  
PUT    /api/admin/campaigns/:id/complete  → completeCampaign

**activateCampaign logic:**

1\. Find campaign with status: 'payment\_received'  
2\. Set campaign.status \= 'active'  
3\. Set campaign.goLiveAt \= now  
4\. Set campaign.expiresAt \= now \+ plan.duration days  
5\. Set campaign.activatedBy \= req.user.\_id  
6\. Update Property.isCampaignActive \= true  
7\. Update Property.activeCampaign \= campaign.\_id  
8\. Write AuditLog: CAMPAIGN\_ACTIVATED  
9\. Notify promoter (portal): "Your plan is active\! Leads will start arriving."  
10\. Decrement pending count in admin notification

**extendCampaign logic:**

1\. campaign.expiresAt \+= extraDays  
2\. Write AuditLog: CAMPAIGN\_EXTENDED  
3\. Notify promoter: "Your plan has been extended by X days."

**completeCampaign logic:**

1\. campaign.status \= 'completed'  
2\. campaign.paceStatus \= 'completed'  
3\. Property.isCampaignActive \= false  
4\. Write AuditLog: CAMPAIGN\_COMPLETED  
5\. Notify promoter: "Your plan is complete. Contact admin to renew."

## TASK 2.2 — Campaign Routes 🆕 NEW

**Estimated Time:** 1 hr

**File:** server/routes/campaignRoutes.js

const router \= express.Router();  
const { protect, isAdmin } \= require('../middleware/authMiddleware');  
const ctrl \= require('../controllers/campaignController');  
   
// Admin routes — all protected \+ admin guard  
router.get('/', protect, isAdmin, ctrl.getAllCampaigns);  
router.get('/pending', protect, isAdmin, ctrl.getPendingCampaigns);  
router.get('/:id', protect, isAdmin, ctrl.getCampaignDetail);  
router.put('/:id/activate', protect, isAdmin, ctrl.activateCampaign);  
router.put('/:id/pause', protect, isAdmin, ctrl.pauseCampaign);  
router.put('/:id/extend', protect, isAdmin, ctrl.extendCampaign);  
router.put('/:id/complete', protect, isAdmin, ctrl.completeCampaign);  
   
module.exports \= router;

## TASK 2.3 — Register Routes in server/index.js 🔧 MODIFY

**Estimated Time:** 1 hr

**File:** server/index.js

**Add:**

const campaignRoutes \= require('./routes/campaignRoutes');  
app.use('/api/admin/campaigns', campaignRoutes);

# MODULE 3 — CAMPAIGN MANAGEMENT UI

**Module Estimated Time: 7 hr 15 mins (5 tasks)**

## TASK 3.1 — Pending Campaigns Page 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/admin/pages/campaigns/PendingCampaigns.jsx

**Route:** /admin/campaigns/pending

Pending Activation (2)  
   
┌─────────────────────────────────────────────────────────────────────┐  
│ Priya Builders                                    Paid: 28 Aug 2026 │  
│ ECR Layout                                        Plan: Pro         │  
│ ₹39,999 received via Razorpay                     85 leads committed│  
│                                                                     │  
│ \[View Campaign Details\]              \[Activate Campaign\]            │  
└─────────────────────────────────────────────────────────────────────┘  
   
┌─────────────────────────────────────────────────────────────────────┐  
│ Ravi Builders                                     Paid: 27 Aug 2026 │  
│ Villianur Layout                                  Plan: Growth      │  
│ ₹24,999 received via Razorpay                     50 leads committed│  
│                                                                     │  
│ \[View Campaign Details\]              \[Activate Campaign\]            │  
└─────────────────────────────────────────────────────────────────────┘

**Activate Campaign → confirmation modal → calls PUT /api/admin/campaigns/:id/activate**

## TASK 3.2 — Campaign List Page 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/admin/pages/campaigns/CampaignList.jsx

**Route:** /admin/campaigns

All Campaigns  
   
Filter: \[All Status ▼\] \[All Promoters ▼\] \[All Plans ▼\]  
   
┌────────────────────────────────────────────────────────────────────────────┐  
│ Promoter       │ Project          │ Plan    │ Leads  │ Pace     │ Status    │  
├────────────────────────────────────────────────────────────────────────────┤  
│ Ravi Builder   │ Villianur Layout │ Growth  │ 23/50  │ On Track │ Active    │  
│ Kumar Dev      │ Bahour Layout    │ Starter │ 20/22  │ Ahead    │ Active    │  
│ Priya Builders │ ECR Layout       │ Pro     │ 0/85   │ —        │ Pending   │  
│ Anand Const    │ Auro Layout      │ Growth  │ 50/50  │ Limit    │ Completed │  
└────────────────────────────────────────────────────────────────────────────┘  
   
Status badges:  
Active     → green  
Pending    → amber (payment received, not yet activated)  
Paused     → grey  
Completed  → blue  
Expired    → red

## TASK 3.3 — Campaign Detail Page 🆕 NEW

**Estimated Time:** 2 hr

**File:** client/src/modules/admin/pages/campaigns/CampaignDetail.jsx

**Route:** /admin/campaigns/:id

Campaign Detail — Admin View  
   
─── CAMPAIGN INFO ──────────────────────────────────────────────  
Promoter:   Ravi Builder     📞 98765 43210  
Project:    Villianur Layout  📍 Villianur, Pondicherry  
Plan:       Growth (₹24,999)  
Status:     Active  
Discount:   20% off — 2nd campaign (Tier 2\)  
GoLive:     01 Aug 2026  
Expires:    31 Aug 2026   (18 days remaining)  
Activated by: Admin Arshad  
   
─── DELIVERY PROGRESS ─────────────────────────────────────────  
Leads Delivered    23 / 50        ████████░░░  46%  
Tier 1 (General)   18  
Tier 2 (Ready)      5  
Pace Status:       On Track  
   
─── CSV IMPORT HISTORY ────────────────────────────────────────  
┌──────────────────────────────────────────────────────────────┐  
│ Batch  │ Date        │ Imported │ Duplicates │ Failed │ By   │  
├──────────────────────────────────────────────────────────────┤  
│ \#1     │ 15 Aug 2026 │ 10       │ 0          │ 0      │ Arsh │  
│ \#2     │ 22 Aug 2026 │ 13       │ 2          │ 1      │ Arsh │  
└──────────────────────────────────────────────────────────────┘  
   
─── ACTIONS ────────────────────────────────────────────────────  
\[Upload Leads CSV\]  \[Pause Campaign\]  \[Extend Campaign\]  \[Mark Complete\]

## TASK 3.4 — Campaign Action Modals 🆕 NEW

**Estimated Time:** 1 hr 30 mins

**File:** Inside CampaignDetail.jsx

**Activate Confirmation Modal:**

Are you sure you want to activate this campaign?  
Project: Villianur Layout  
Plan: Growth — 50 leads committed  
This will notify the promoter immediately.  
\[Cancel\]  \[Activate\]

**Extend Campaign Modal:**

Extend Campaign Duration  
Current expiry: 31 Aug 2026  
Extend by: \[7\] days  (input field)  
New expiry: 07 Sep 2026  
Reason (optional): \[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]  
\[Cancel\]  \[Confirm Extension\]

**Pause/Complete Modal:**

Pause Campaign?  
This will pause lead delivery. The promoter will be notified.  
\[Cancel\]  \[Pause\]

## TASK 3.5 — Admin Campaign Routes (Frontend) 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/admin/AdminRoute.jsx (or wherever routes are defined)

**Add routes:**

/admin/campaigns          → CampaignList  
/admin/campaigns/pending  → PendingCampaigns  
/admin/campaigns/:id      → CampaignDetail

# MODULE 4 — CSV LEAD IMPORT

**Module Estimated Time: 5 hr 30 mins (3 tasks)**

## TASK 4.1 — CSV Import Controller 🆕 NEW

**Estimated Time:** 2 hr

**File:** server/controllers/csvImportController.js

**Route:** POST /api/admin/campaigns/:id/import-leads

**Full import process:**

Step 1: Receive CSV file via multer (multipart/form-data)  
Step 2: Parse CSV rows (use 'csv-parse' or 'papaparse')  
Step 3: Map columns to system fields:  
   
        CSV Column          → System Field  
        "full\_name"         → fullName         (required)  
        "phone\_number"      → phoneNumber       (required — 10 digits)  
        "email"             → email  
        "preferred\_area"    → preferredLocation  
        "min\_budget"        → minBudget  
        "max\_budget"        → maxBudget  
        "property\_type"     → propertyType  
        "usage\_type"        → usageType  
        "message"           → message  
   
Step 4: Validate each row  
        \- phoneNumber must be exactly 10 digits  
        \- fullName must exist  
        \- Mark rows failing validation as 'failed' (skip, log error)  
   
Step 5: Deduplication (per row):  
        \- Check: same phone \+ same campaignId → duplicate, skip  
        \- Check: same phone \+ same project (any campaign) → duplicate, skip  
   
Step 6: Create CsvImportBatch record with status: 'processing'  
   
Step 7: Create Requirement records for valid, non-duplicate rows:  
        \- campaignId \= campaign.\_id     (IMMUTABLE — never changes)  
        \- matchedProject \= campaign.project  
        \- promoterStatus \= 'pending'  
        \- deliveredAt \= now  
        \- source \= 'meta\_ad'  
        \- tier \= 'tier1' (default — admin can override per row if field exists)  
   
Step 8: Update Campaign.deliveredCount \+= importedCount  
        Update Property.deliveredLeads \+= importedCount  
   
Step 9: Check if deliveredCount \>= committedMinimum  
        → YES: fire lead limit notifications to promoter \+ admin  
   
Step 10: Send portal notification to promoter for each new lead batch  
   
Step 11: Update CsvImportBatch: status \= 'completed', counts finalized  
   
Step 12: Write AuditLog: LEADS\_IMPORTED  
   
Step 13: Return summary:  
        {  
          imported: 17,  
          duplicates: 2,  
          failed: 1,  
          total: 20,  
          batchId: "...",  
          campaignDelivered: 40,  
          campaignCommitted: 50  
        }

**Add to server/routes/campaignRoutes.js:**

const { importLeads } \= require('../controllers/csvImportController');  
router.post('/:id/import-leads', protect, isAdmin, upload.single('file'), importLeads);

## TASK 4.2 — CSV Import UI — Upload \+ Column Mapping 🆕 NEW

**Estimated Time:** 2 hr

**File:** client/src/modules/admin/pages/campaigns/ImportLeads.jsx

**Route:** /admin/campaigns/:id/import

**Step 1 — Upload:**

Import Leads — Villianur Layout (Growth: 23/50 leads delivered)  
Remaining capacity: 27 leads  
   
Drag & drop your CSV file here  
or \[Browse File\]  
   
Supported format: Meta Lead Center export (.csv)  
Max file size: 5MB

**Step 2 — Column Mapping:**

Map CSV columns to system fields  
   
CSV Column          →    System Field  
─────────────────────────────────────────  
full\_name           →    \[Full Name ▼\]  
phone\_number        →    \[Phone Number ▼\]  
email\_address       →    \[Email ▼\]  
city                →    \[Preferred Location ▼\]  
budget              →    \[Budget ▼\]  (or Min/Max separately)  
lead\_source         →    \[Source ▼\]  
notes               →    \[Message ▼\]  
─────────────────────────────────────────  
                         \[Preview Import →\]

## TASK 4.3 — Import Preview \+ Confirm 🆕 NEW

**Estimated Time:** 1 hr 30 mins

**File:** Inside ImportLeads.jsx

**Step 3 — Preview:**

Import Preview  
   
✅  17  new leads ready to import  
⚠️   2  duplicates — already in system (will be skipped)  
❌   1  invalid — missing phone number (will be skipped)  
   
Preview (first 5 rows):  
┌──────────────┬───────────────┬───────────────┬────────────┐  
│ Name         │ Phone         │ Area          │ Budget     │  
├──────────────┼───────────────┼───────────────┼────────────┤  
│ Ramesh Kumar │ 98765 43210   │ Villianur     │ ₹25L–35L   │  
│ Priya S      │ 97654 32109   │ Lawspet       │ ₹20L–30L   │  
│ ...          │ ...           │ ...           │ ...        │  
└──────────────┴───────────────┴───────────────┴────────────┘  
   
\[← Back\]  \[Confirm Import\]

**Step 4 — Success:**

✅ Import Complete  
   
17 leads added to Villianur Layout  
Promoter has been notified  
Leads delivered: 40 / 50  
   
\[View Campaign\]  \[Import More Leads\]

# MODULE 5 — ADMIN LEAD MANAGEMENT

**Module Estimated Time: 2 hr (2 tasks)**

## TASK 5.1 — All Promoter Leads Page (Admin) 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/admin/pages/campaigns/AllLeads.jsx

**Route:** /admin/campaigns/leads

**Admin can see ALL leads across ALL campaigns — full details including phone, email:**

All Campaign Leads  
   
Filter: \[All Campaigns ▼\] \[All Projects ▼\] \[All Status ▼\] \[Date Range\]  
   
┌────────────────────────────────────────────────────────────────────────────┐  
│ Name          │ Phone       │ Project          │ Status    │ Delivered    │  
├────────────────────────────────────────────────────────────────────────────┤  
│ Ramesh Kumar  │ 98765 43210 │ Villianur Layout │ Contacted │ 28 Aug 2026  │  
│ Priya S       │ 97654 32109 │ Villianur Layout │ Pending   │ 28 Aug 2026  │  
│ Kumar Raj     │ 96543 21098 │ Bahour Layout    │ Visited   │ 25 Aug 2026  │  
└────────────────────────────────────────────────────────────────────────────┘

**Route:** GET /api/admin/leads — leads controller, admin-only

Query params: campaignId, projectId, promoterStatus, dateFrom, dateTo, page, limit

## TASK 5.2 — Lead Detail Modal (Admin) 🆕 NEW

**Estimated Time:** 45 mins

**File:** Inside AllLeads.jsx

**Clicking a lead opens a modal — admin sees full mechanics:**

Lead Detail  
   
Name:          Ramesh Kumar  
Phone:         \+91 98765 43210  
Email:         ramesh@gmail.com  
Area:          Villianur  
Budget:        ₹25L – ₹35L  
Property Type: Plot  
Usage:         Residential  
Message:       "Looking for corner plot near school"  
Source:        Meta Ad  
Tier:          Tier 1  
   
Matched To:    Villianur Layout (Ravi Builder)  
Campaign:      Growth Plan — Campaign \#001  
Delivered:     28 Aug 2026, 2:14 PM  
Batch:         Import \#2  
   
Promoter Status: Contacted  
Promoter Notes:  "Called — interested in 30x40"

# MODULE 6 — PROMOTER MANAGEMENT

**Module Estimated Time: 1 hr 30 mins (2 tasks)**

## TASK 6.1 — SellerList — Add Promoter Campaign View 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** client/src/modules/admin/pages/SellerList.jsx

**Current:** Shows seller list with badge request count

**Add per-promoter in the detail view:**

Promoter: Ravi Builder       📞 98765 43210  
   
PROJECTS AND CAMPAIGNS:  
┌────────────────────────────────────────────────────────────────┐  
│ Project          │ Plan    │ Leads   │ Status         │ Action │  
├────────────────────────────────────────────────────────────────┤  
│ Villianur Layout │ Growth  │ 23/50   │ Active         │ \[View\] │  
│ Bahour Layout    │ Starter │ 22/22   │ Limit Reached  │ \[View\] │  
│ ECR Layout       │ —       │ —       │ No Plan        │ —      │  
└────────────────────────────────────────────────────────────────┘  
   
PAYMENT HISTORY:  
┌────────────────────────────────────────────────────────────────┐  
│ Date        │ Project          │ Plan    │ Amount   │ Status    │  
├────────────────────────────────────────────────────────────────┤  
│ 01 Aug 2026 │ Villianur Layout │ Growth  │ ₹24,999  │ Paid      │  
│ 01 Jun 2026 │ Bahour Layout    │ Starter │ ₹19,999  │ Paid      │  
└────────────────────────────────────────────────────────────────┘

## TASK 6.2 — Promoter API — Campaign Summary 🔧 MODIFY

**Estimated Time:** 1 hr

**File:** server/controllers/userController.js (or seller detail API)

**Add to promoter detail response:**

campaigns: \[{  
  \_id, status, plan: { name, price },  
  project: { title, location.locality },  
  committedMinimum, deliveredCount,  
  goLiveAt, expiresAt, paceStatus  
}\],  
paymentHistory: \[{ transactionDate, planName, amountPaid, project }\]

# MODULE 7 — SUBSCRIPTION PLAN MANAGER

**Module Estimated Time: 1 hr 15 mins (2 tasks)**

## TASK 7.1 — Add Campaign Fields to Plan Manager 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** client/src/modules/admin/pages/SubscriptionPlanManager.jsx

**Current form fields:** name, price, propertyLimit, leadsLimit, propertyValidity, duration, features

**Add fields:**

Committed Minimum Leads:  \[22\]  ← what promoter is guaranteed  
Tier 2 Minimum Leads:      \[4\]  ← minimum ready-buyers  
Plan Type:    \[Promoter Campaign ▼\] / \[Agent ▼\]  ← to distinguish plan categories

**Note:** leadsLimit field already maps to committedMinimum — can reuse with label change, or add dedicated field.

**Add to SubscriptionPlan model** (server/models/SubscriptionPlan.js):

committedMinimum: { type: Number, default: 0 },  
tier2Minimum:     { type: Number, default: 0 },  
planCategory:     { type: String, enum: \['promoter', 'agent'\], default: 'agent' }

## TASK 7.2 — Volume Discount Display in Plan Overview 🆕 NEW

**Estimated Time:** 45 mins

**File:** client/src/modules/admin/pages/SubscriptionPlanManager.jsx

**Add info section below plan list:**

Volume Discount Rules (auto-applied at checkout):  
   
2nd campaign (same account) → 20% off  
3rd campaign (same account) → 25% off  
4th campaign (same account) → 30% off  
5th+ campaign               → Enterprise only (all plans blocked)  
   
Note: 2nd campaign onwards — Starter plan is disabled. Growth minimum required.

# MODULE 8 — AUDIT LOG VIEWER

**Module Estimated Time: 3 hr 15 mins (2 tasks)**

## TASK 8.1 — Audit Log Viewer Page 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/admin/pages/AuditLog.jsx

**Route:** /admin/audit-log

Audit Log  
   
Filter: \[All Events ▼\] \[All Promoters ▼\] \[Date Range\]   \[Export CSV\]  
   
┌────────────────────────────────────────────────────────────────────────┐  
│ Timestamp        │ Actor       │ Event                  │ Entity      │  
├────────────────────────────────────────────────────────────────────────┤  
│ 28 Aug 12:14 PM  │ Admin Arsh  │ LEADS\_IMPORTED         │ Campaign    │  
│ 28 Aug 10:02 AM  │ System      │ CAMPAIGN\_EXPIRY\_CHECK  │ Campaign    │  
│ 27 Aug 03:45 PM  │ Ravi Builder│ LEAD\_STATUS\_UPDATED    │ Lead        │  
│ 27 Aug 09:00 AM  │ Admin Arsh  │ CAMPAIGN\_ACTIVATED     │ Campaign    │  
│ 26 Aug 05:30 PM  │ Ravi Builder│ PAYMENT\_RECEIVED       │ Subscription│  
└────────────────────────────────────────────────────────────────────────┘  
   
Clicking a row → expand to show before/after state

**Backend:** GET /api/admin/audit-log

Query: entity, actorId, action, dateFrom, dateTo, page, limit

## TASK 8.2 — Audit Log API \+ Export 🆕 NEW

**Estimated Time:** 2 hr

**File:** server/controllers/auditLogController.js

GET /api/admin/audit-log      → paginated list with filters  
GET /api/admin/audit-log/export → return CSV download of filtered log  
   
// NO update, NO delete allowed on this endpoint — AuditLog is append-only

# MODULE 9 — ADMIN NOTIFICATIONS

**Module Estimated Time: 2 hr (2 tasks)**

## TASK 9.1 — Portal Notification Model 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/models/Notification.js

Fields:  
\- recipient     (ref: User, required)  
\- title         (String, required)  
\- message       (String, required)  
\- type          (enum: new\_lead / lead\_limit\_reached / campaign\_activation\_required /  
                        admin\_lead\_limit / campaign\_completed / campaign\_behind\_pace)  
\- link          (String)             // where to navigate on click  
\- isRead        (Boolean, default: false)  
\- relatedId     (ObjectId)           // campaign or lead ID  
\- relatedModel  (String)             // 'Campaign' / 'Lead'  
\- Timestamps

**Routes:**

GET  /api/notifications          → user's unread \+ recent  
PUT  /api/notifications/:id/read → mark one read  
PUT  /api/notifications/read-all → mark all read

## TASK 9.2 — Admin Sidebar — Pending Campaign Badge 🔧 MODIFY

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/admin/Sidebar.jsx

**Current:** Sidebar has badges for badgeRequests, sellerProperties, enquiries, etc.

**Add to \`notifications\` state:**

pendingCampaigns: 0,

**Add to \`fetchCounts\`:**

pendingCampaigns: counts.pendingCampaigns || 0,

**Add to sidebar menu — new section "Campaigns":**

{  
  key: "campaigns-sub",  
  icon: \<Megaphone size={18} /\>,  
  label: (  
    \<div className="flex justify-between items-center pr-4"\>  
      \<span\>Campaigns\</span\>  
      {notifications.pendingCampaigns \> 0 && (  
        \<Badge count={notifications.pendingCampaigns} size="small" color="\#f59e0b" /\>  
      )}  
    \</div\>  
  ),  
  children: \[  
    {  
      key: "/admin/campaigns/pending",  
      label: "Pending Activation",  // badge here too  
      onClick: () \=\> handleMenuClick("/admin/campaigns/pending")  
    },  
    { key: "/admin/campaigns", label: "All Campaigns", onClick: () \=\> handleMenuClick("/admin/campaigns") },  
    { key: "/admin/campaigns/leads", label: "All Leads", onClick: () \=\> handleMenuClick("/admin/campaigns/leads") },  
    { key: "/admin/audit-log", label: "Audit Log", onClick: () \=\> handleMenuClick("/admin/audit-log") },  
  \],  
},

# MODULE 10 — SIDEBAR NAVIGATION

**Module Estimated Time: 1 hr 15 mins (1 task)**

## TASK 10.1 — Sidebar Menu Update 🔧 MODIFY

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/admin/Sidebar.jsx

This task is the implementation of Task 9.2 above (sidebar changes are combined here for clarity).

**Where to place the new "Campaigns" section:**

* Insert after the existing "Marketing" section (marketing-sub)

* Before "Users" section (users-sub)

**Badge color:** amber \#f59e0b — to distinguish campaign pending from other alerts

**Admin route protection:** Already handled by AdminRoute.jsx — just add the new paths to the route config.

# PHASE PLAN

## PHASE 1 — Core Backend (Build First)

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Campaign Controller \+ Routes | 2.1, 2.2 | 🔴 P0 |
| Register Routes in server/index.js | 2.3 | 🔴 P0 |
| CSV Import Controller | 4.1 | 🔴 P0 |
| Portal Notification Model | 9.1 | 🔴 P0 |
| Subscription Plan — add campaign fields | 7.1 (model part) | 🔴 P0 |
| Dashboard Stats API — add campaign counts | 1.1 | 🔴 P0 |
| Admin Lead List API | 5.1 (backend route) | 🔴 P0 |
| Audit Log API | 8.2 | 🔴 P0 |

## PHASE 2 — UI Complete

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Dashboard Cards — campaign stats | 1.2 | 🟡 P1 |
| Pending Campaigns page | 3.1 | 🟡 P1 |
| Campaign List page | 3.2 | 🟡 P1 |
| Campaign Detail page | 3.3 | 🟡 P1 |
| Campaign Action Modals | 3.4 | 🟡 P1 |
| Admin Frontend Routes | 3.5 | 🟡 P1 |
| CSV Import UI | 4.2, 4.3 | 🟡 P1 |
| All Leads page | 5.1 (UI), 5.2 | 🟡 P1 |
| SellerList — promoter campaigns | 6.1, 6.2 | 🟡 P1 |
| Subscription Plan Manager update | 7.1 (UI), 7.2 | 🟡 P1 |
| Sidebar — campaigns section \+ badge | 9.2, 10.1 | 🟡 P1 |

## PHASE 3 — Audit Log \+ Polish

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Audit Log Viewer page | 8.1 | 🟢 P2 |
| Audit Log export | 8.2 | 🟢 P2 |
| Volume discount display | 7.2 | 🟢 P2 |

# COMPLETE TASK COUNT

| Status | Count |
| :---- | :---- |
| ✅ EXISTS — no change | 0 |
| 🔧 MODIFY — existing code changes | 8 |
| 🆕 NEW — build from scratch | 16 |
| **Total** | **24 tasks** |

# OPEN ITEMS (Same as Promoter Plan)

| Question | Blocks Admin Task |
| :---- | :---- |
| Which fields from CSV are shown to promoter | 4.1, 4.2, 5.2 |
| Meta CSV column names from Lead Center | 4.1, 4.2 |
| Do admins receive email alerts or portal-only | 9.1 |
| Audit log — is CSV export required at launch? | 8.2 |

*Development Plan prepared: 28 Aug 2026*
