# THE PLOT ONE — ADMIN: ADD SELLER DEVELOPMENT PLAN

## Complete Task-by-Task Plan (6–8 Hour Sprint)

**Based on the Add Seller request + existing codebase review**

**Legend:** ✅ EXISTS | 🔧 MODIFY | 🆕 NEW

**Timeline note:** every estimate below is raw hands-on-keyboard implementation time for that task alone. Module 4 is the only testing time included. This is a planning document — nothing in it has been implemented.

## OBJECTIVE

Let an Admin create a new Seller from the Admin Panel, on the existing Seller Management page (`/admin/sellers`). The new seller then logs in with the normal phone OTP flow and lands in the seller panel. No password is involved — the platform has none.

## SCOPE BOUNDARY — READ FIRST

- **This feature is not described in any existing `dev_doc` plan.** The requirement comes from the request "the Admin Panel should allow an Admin to add/create a new Seller" and from the codebase review done before this plan. The existing plans were used for format, terminology and related tasks only (see REFERENCE DOCUMENTS).
- **Seller = Promoter, Agent or Owner.** The `dev_doc` plans speak of Promoters and Agents. In the codebase both are a Seller (`role_id` = `seller`) distinguished by `businessType`. The admin picks the business type in the form, so one feature covers all three.
- **Self-registration stays as it is.** The Promoter plan's Task 2.2 says the current OTP onboarding "works fine". This plan adds a second way in; it does not replace the first.
- **Not covered here:** notifying the new seller, email on the account, company details at creation, editing a seller, bulk import. See OUT OF SCOPE.

## WHAT ALREADY EXISTS IN THE CODEBASE

| Item | Where |
| :---- | :---- |
| ✅ Seller role, `createdBy`, `assignedAdmin`, auto `userId` / `referralCode` / `slug` | server/models/User.js |
| ✅ Generic admin-creates-user endpoint (used today only by "Add New Admin") | server/controllers/userController.js (`createUserByAdmin`) |
| ✅ Seller Management page — list, business type filter, assign, verify, delete | client/src/modules/admin/pages/SellerList.jsx |
| ✅ Admin guard middleware (`protect`, `admin`) | server/middleware/authMiddleware.js |
| ✅ Audit log writer (`writeAudit`) | server/utils/auditLogger.js (Promoter Task 12.1) |
| ✅ Form pattern to follow (Add New Admin modal, 10-digit phone rule) | client/src/modules/admin/pages/AdminList.jsx |

## INDEX

| # | Module | Tasks | Phase | Status Breakdown | Est. Time |
| :---- | :---- | :---- | :---- | :---- | :---- |
| M1 | Authentication & Roles | 3 tasks | P0/P1 | 0 EXISTS · 3 MODIFY · 0 NEW | 1 hr 45 mins |
| M2 | Add Seller Backend | 3 tasks | P0/P1 | 0 EXISTS · 0 MODIFY · 3 NEW | 2 hr 30 mins |
| M3 | Add Seller UI | 2 tasks | P0 | 0 EXISTS · 1 MODIFY · 1 NEW | 2 hr |
| M4 | Verification | 2 tasks | P0/P1 | 0 EXISTS · 0 MODIFY · 2 NEW | 1 hr 15 mins |

### Summary

|  | Count |
| :---- | :---- |
| **Total Modules** | **4** |
| **Total Tasks** | **10** |
| ✅ EXISTS — no change | 0 |
| 🔧 MODIFY — change existing code | 4 |
| 🆕 NEW — build from scratch | 6 |
| **Total Estimated Time** | **7 hr 30 mins** |

### Phase Overview

| Phase | Focus | Modules Involved | Task Count |
| :---- | :---- | :---- | :---- |
| **Phase 1 (P0)** | Feature working end to end, admin-only | M1 (1.1, 1.2), M2 (2.1, 2.2), M3, M4 (4.2) | 7 tasks |
| **Phase 2 (P1)** | Hardening, audit trail, test script | M1 (1.3), M2 (2.3), M4 (4.1) | 3 tasks |

## ADD SELLER FLOW (Reference — proposed, pending confirmation)

1\. Admin opens Seller Management → clicks **Add Seller**
2\. Admin enters name, phone, business type → optionally marks as verified → Super Admin may pick an assigned admin
3\. Server checks the caller is an Admin → validates the input → finds the seller role itself
4\. Phone is new → seller account created, pre-verified, "Created By" = that admin
5\. Phone belongs to an existing plain user → that user is promoted to seller
6\. Phone belongs to an existing seller or admin → rejected with a clear message
7\. Audit log entry written → Seller List refreshes
8\. Seller logs in with phone OTP as usual → lands in the seller panel

**Admin never sets:** a password (none exists), the role (always seller), or Super Admin / permission flags.

# MODULE 1 — AUTHENTICATION & ROLES

**Module Estimated Time: 1 hr 45 mins (3 tasks)**

## TASK 1.1 — Admin Guard on Create-User Route 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** server/routes/userRoute.js, server/controllers/userController.js

**Route:** POST /api/users/create-user-by-admin

**Current:** the route only checks that the caller is logged in, so any logged-in user can call it and choose the role of the account created.

**Change:**
- Add the existing `admin` guard to the route.
- Creating an `admin`-role account is allowed for Super Admin only — matches the existing UI, where only Super Admin sees "Add New Admin".

## TASK 1.2 — Admin Guard on User List and Delete Routes 🔧 MODIFY

**Estimated Time:** 30 mins

**File:** server/routes/userRoute.js

**Routes:** GET /api/users/get-all-users, GET /api/users/fetch-all-user (legacy alias), DELETE /api/users/delete-user-by-id/:id

Add the `admin` guard to all three. Before changing, confirm no non-admin screen calls them.

**Needs confirmation** that this belongs in this sprint — see STILL NEEDS CONFIRMATION.

## TASK 1.3 — Lock Privileged Fields on Update-User Route 🔧 MODIFY

**Estimated Time:** 45 mins

**File:** server/controllers/userController.js (`updateUser`)

**Route:** PUT /api/users/update-user-by-id/:id

**Current:** any logged-in user can update any user record, including `role_id`.

**Change:**
- A non-admin may update only their own record.
- A non-admin may not change `role_id`, `isVerified`, `badgeVerified`, `status` or `createdBy`.
- Admin behaviour is unchanged.

**Risk:** sellers use this same route for their own profile — the seller profile page must be re-checked afterwards (Task 4.2).

# MODULE 2 — ADD SELLER BACKEND

**Module Estimated Time: 2 hr 30 mins (3 tasks)**

## TASK 2.1 — Create Seller API 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** server/controllers/userController.js, server/routes/userRoute.js

**Route:** POST /api/users/create-seller-by-admin (guards: `protect`, `admin`)

**Request fields:**
- name            (required)
- phone           (required, exactly 10 digits)
- businessType    (required, must exist and be active)
- badgeVerified   (optional, default false)
- assignedAdmin   (optional, honoured for Super Admin only)

**Set by the server, never taken from the request:**
- role_id         → the `seller` role, looked up on the server
- isVerified      → true (admin-created accounts are pre-verified, as in the existing endpoint)
- createdBy       → the acting admin
- customId        → same `USER-XXXXXX` pattern the OTP flow uses
- assignedAdmin   → the acting admin, when that admin is a sub-admin (same rule as the existing endpoint)
- isSuperAdmin, permissions → ignored

**Responses:** 201 with the created seller · 400 for validation errors · 403 for non-admins.

**Why a dedicated route** rather than reusing `create-user-by-admin`: the generic route trusts a role sent by the client.

## TASK 2.2 — Existing Phone Number Handling 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/controllers/userController.js (part of the Create Seller API, Task 2.1)

**Why this is needed:** the OTP login creates a `user` record for every number that ever requested an OTP, so "already exists" will be common — the admin will often be adding someone who already tried to log in.

```
Phone not found                    → create new seller (Task 2.1)
Phone belongs to a plain user      → promote to seller, set business type,
                                     record the acting admin, return "promoted"
Phone belongs to a seller          → reject: "A seller already exists with this phone number"
Phone belongs to an admin          → reject
```

**Needs confirmation** — promote vs. reject. See STILL NEEDS CONFIRMATION.

## TASK 2.3 — Audit Events (Add Seller) 🆕 NEW

**Estimated Time:** 30 mins

**File:** uses the existing ✅ `writeAudit` utility (server/utils/auditLogger.js)

Events to log:

```
SELLER_CREATED_BY_ADMIN     → new seller account created
USER_PROMOTED_TO_SELLER     → existing user promoted (Task 2.2)
```

Each records the acting admin and the seller. Confirm the Audit Log viewer (Admin Task 8.1) displays the new entity type.

# MODULE 3 — ADD SELLER UI

**Module Estimated Time: 2 hr (2 tasks)**

## TASK 3.1 — Add Seller Modal 🆕 NEW

**Estimated Time:** 1 hr 15 mins

**File:** client/src/modules/admin/components/AddSellerModal.jsx

Follows the Add New Admin form in `AdminList.jsx`.

```
┌──────────────── Add New Seller ────────────────┐
│ Full Name *          [                       ] │
│ Phone Number *   +91 [ 10-digit number       ] │
│ Business Type *      [ Owner / Agent / ... ▼ ] │
│ Mark as verified     ( off )                   │
│ Assigned Admin       [ ... ▼ ]  (Super Admin)  │
│                                                │
│                     [ Cancel ] [ Create Seller]│
└────────────────────────────────────────────────┘
```

- Business types come from the existing business types list (active only).
- Shows server errors, including "already exists".
- Shows a distinct success message when an existing user was promoted.

**Note:** `client/src/modules/admin/components/CreateUserModal.jsx` exists but is unused and does not work against the current API (it sends email and password, which the system does not have). It is replaced by this modal, not extended.

## TASK 3.2 — SellerList — Add Seller Button 🔧 MODIFY

**Estimated Time:** 45 mins

**File:** client/src/modules/admin/pages/SellerList.jsx

**Current:** shows the seller list with filter, assign, verify and delete — no way to add.

**Add:**
- **Add Seller** button in the page header.
- Opens the modal (Task 3.1); refreshes the list on success.
- When a business type filter is active (for example the page was opened from the sidebar's per-type entry), pre-select that type in the modal.

# MODULE 4 — VERIFICATION

**Module Estimated Time: 1 hr 15 mins (2 tasks)**

## TASK 4.1 — Create Seller API Test Script 🆕 NEW

**Estimated Time:** 45 mins

**File:** server/scripts/test-admin-create-seller.js (same style as the existing `test-*.js` scripts)

Cases:

```
Admin creates a seller                       → 201, role = seller, createdBy set
Non-admin calls the route                    → 403
Phone of an existing seller                  → rejected
Phone of an existing plain user              → promoted
Sub-admin creates a seller                   → auto-assigned to that sub-admin
Role / Super Admin flag sent in the request  → ignored
Non-admin calls create-user-by-admin         → 403 (Task 1.1)
```

## TASK 4.2 — End-to-End Check 🆕 NEW

**Estimated Time:** 30 mins

In the running app:
- Create a seller as Super Admin and as a sub-admin; confirm "Created By" and assignment on the Seller List.
- Log in as the new seller with OTP and reach the seller panel.
- Confirm "Add New Admin" still works (Task 1.1).
- Confirm the seller profile page still saves (Task 1.3).

# PHASE PLAN

## PHASE 1 — Feature Working (Build First)

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Admin guard on create-user route | 1.1 | 🔴 P0 |
| Admin guard on user list and delete routes | 1.2 | 🔴 P0 |
| Create Seller API + existing phone handling | 2.1, 2.2 | 🔴 P0 |
| Add Seller modal + SellerList button | 3.1, 3.2 | 🔴 P0 |
| End-to-end check | 4.2 | 🔴 P0 |

## PHASE 2 — Hardening & Audit

| Module | Tasks | Priority |
| :---- | :---- | :---- |
| Lock privileged fields on update-user route | 1.3 | 🟡 P1 |
| Audit events | 2.3 | 🟡 P1 |
| API test script | 4.1 | 🟡 P1 |

# TASK EXECUTION ORDER

| Step | Task | Time | Running Total | Depends On |
| :---- | :---- | :---- | :---- | :---- |
| 1 | 1.1 — Admin Guard on Create-User Route | 30 mins | 0 hr 30 mins | — |
| 2 | 2.1 — Create Seller API | 1 hr 15 mins | 1 hr 45 mins | 1.1 |
| 3 | 2.2 — Existing Phone Number Handling | 45 mins | 2 hr 30 mins | 2.1 |
| 4 | 3.1 — Add Seller Modal | 1 hr 15 mins | 3 hr 45 mins | 2.1, 2.2 |
| 5 | 3.2 — SellerList — Add Seller Button | 45 mins | 4 hr 30 mins | 3.1 |
| 6 | 2.3 — Audit Events (Add Seller) | 30 mins | 5 hr 00 mins | 2.1, 2.2 |
| 7 | 1.2 — Admin Guard on User List and Delete Routes | 30 mins | 5 hr 30 mins | 1.1 |
| 8 | 1.3 — Lock Privileged Fields on Update-User Route | 45 mins | 6 hr 15 mins | 1.1 |
| 9 | 4.1 — Create Seller API Test Script | 45 mins | 7 hr 00 mins | M1, M2 |
| 10 | 4.2 — End-to-End Check | 30 mins | 7 hr 30 mins | M1, M2, M3 |

The feature is usable end to end after step 5. Task 1.3 is done late because it carries the most regression risk, and it is the first to drop if time runs out.

# COMPLETE TASK COUNT

| Status | Count |
| :---- | :---- |
| ✅ EXISTS — no change | 0 |
| 🔧 MODIFY — existing code changes | 4 |
| 🆕 NEW — build from scratch | 6 |
| **Total** | **10 tasks** |

# COMPLETE TIME ESTIMATE

| Module | Time |
| :---- | :---- |
| M1 — Authentication & Roles | 1 hr 45 mins |
| M2 — Add Seller Backend | 2 hr 30 mins |
| M3 — Add Seller UI | 2 hr |
| M4 — Verification | 1 hr 15 mins |
| **Total** | **7 hr 30 mins** |

|  | Time | What it means |
| :---- | :---- | :---- |
| **Minimum planned time** | 6 hr 45 mins | All tasks except Task 1.3, if it moves to a later sprint |
| **Target working time** | **7 hr 30 mins** | All 10 tasks |
| **Maximum planned time** | 8 hr 00 mins | Target plus 30 mins for fixes found in Task 4.2 |

# OUT OF SCOPE / NEXT SPRINT

## Related to Add Seller — left for later

| Item | Why it is left out |
| :---- | :---- |
| Welcome SMS / WhatsApp to the new seller | The only SMS integration is the OTP message; the WhatsApp provider is an open item in every `dev_doc` plan. The admin tells the seller to log in. |
| Email on the seller account | `User` has no email field; email lives on the builder profile. A model change with its own review. |
| Company details at creation (company name, GST, RERA) | These live on the builder profile, which the seller fills in from their own profile page. |
| Edit Seller modal | Activate/deactivate, verify and assign already exist on the Seller List. |
| Bulk seller import | Not requested. |
| Enforcing `status: inactive` at login and on API calls | Today "Deactivate Seller" changes a label only. Affects every role — needs its own task. |
| Server-side enforcement of sub-admin section permissions | Permissions currently filter the sidebar only. Platform-wide change. |
| Auth on the role and business-type management routes | These routes currently have no login check. Separate hardening task. |

## Existing `dev_doc` plans not touched by this sprint

- **Agent Module Development Plan** — all 14 modules, 56 tasks. Not started.
- **Telecaller Module Development Plan** — all 12 modules, 38 tasks. Not started. Its Task 2.2 (Admin: Create Telecaller Staff Account) can reuse the guard from Task 1.1 and the pattern from Task 2.1 here.
- **Still pending per the Project Overview** — Super Admin Command Centre, Sales Executive panel, Lead Routing Engine, WhatsApp delivery infrastructure.

# STILL NEEDS CONFIRMATION

This plan assumes the answer in the "Planned As" column.

| Question | Planned As | Blocks Task |
| :---- | :---- | :---- |
| Phone already belongs to a plain user — promote to seller, or reject? | Promote | 2.2, 3.1 (reject-only cuts 2.2 to about 15 mins) |
| Offer "Mark as verified" at creation? Without it a new seller is limited to one listing until verified. | Yes, default off | 2.1, 3.1 |
| Who may add sellers — any Admin with Seller Management access, or Super Admin only? | Any Admin; a sub-admin's sellers are auto-assigned to them | 2.1, 3.2 |
| Include the guard on the user list and delete routes in this sprint? | Yes | 1.2 |
| Include the update-route lock in this sprint? It touches the route sellers use for their own profile. | Yes, with a re-check of the seller profile page | 1.3 |

## Differences from the existing documents

| Item | Detail |
| :---- | :---- |
| Feature not documented | No `dev_doc` plan has an "admin creates seller" task. |
| Business type names | The Promoter plan refers to `"Builder"`, the Agent plan to `'Agent'`, and the existing promoter guard matches `"Builders / Promoter"`. This plan uses the business type list from the database instead of fixed names. |
| "Staff" is Super Admin-only in the Project Overview | A seller is an external account, not staff, so creation by any Admin is consistent. Admin-role creation stays Super Admin-only (Task 1.1). |

# REFERENCE DOCUMENTS

| File in `dev_doc/` | Used For |
| :---- | :---- |
| THE_PLOT_ONE_Project_Overview.docx.md | Role definitions (Admin vs Super Admin, Promoter, Agent); list of plans and pending work |
| THE_PLOT_ONE_Admin_Module_Development_Plan.docx.md | Document format; Task 6.1 (SellerList), Task 8.1 (Audit Log viewer) |
| THE_PLOT_ONE_Promoter_Module_Development_Plan.docx.md | Timeline note; Task 2.1 (role guard pattern), Task 2.2 (OTP onboarding), Task 12.1 (audit log writer) |
| THE_PLOT_ONE_Telecaller_Module_Development_Plan.docx.md | Task 2.2 (Admin: Create Telecaller Staff Account) — the nearest documented equivalent |
| THE_PLOT_ONE_Agent_Module_Development_Plan.docx.md | Task 2.1 (role guard pattern), Task 11.2 (admin Seller List reuse), Module 14 (audit event naming) |

*Development Plan prepared: 03 Oct 2026*

*Flow proposed from codebase review — pending confirmation of the open items above*
