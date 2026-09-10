# THE PLOT ONE — PROJECT OVERVIEW

## About The Portal

*A unit of ABM Groups · Pondicherry, expanding across Tamil Nadu*

---

## WHAT THE PLOT ONE IS

The Plot One is a real estate demand-generation platform — **not a listing portal**. Builders and layout promoters pay us to advertise their projects and generate buyers; those buyers are then routed either to the promoter directly, to our own in-house brokerage, or to subscribed property agents. The same lead can generate revenue at multiple points without ever being resold or shared between two people at once.

**The one-line model:** *Promoters pay us to create buyers. Agents pay us to access those buyers. The same lead earns four times.*

**The governing rule of the whole platform:** whoever paid for a lead owns it — permanently, exclusively, and enforced in the database, not just in policy. A lead tied to a promoter's paid campaign can never be shown to anyone else's project. A lead accepted by one agent can never be seen by a second agent. These two rules are treated as non-negotiable everywhere in the system.

---

## WHO USES THE PORTAL

| Role | What they are | What they do on the portal |
| :---- | :---- | :---- |
| **Promoter** | Builders / layout owners who pay for campaigns | Post projects (free, unlimited), buy a campaign plan for one project at a time, receive leads on WhatsApp, track delivery vs. committed minimum |
| **Agent** | Subscribed property brokers | Receive exclusive buyer offers, accept/decline within a timed window, manage their own free listings, post/respond to buyer requirements, track wallet and performance |
| **Telecaller** | Internal staff | Qualify every inbound lead (Tier 1/Tier 2), pitch in-house inventory during the hold window, verify site visits and closures, manage callbacks |
| **Admin** | Internal staff, campaign operations | Activate paid campaigns, import CSV lead batches, monitor delivery and pacing, manage promoters and subscription plans |
| **Super Admin** | Senior internal role | Everything Admin has, plus the six things only this role can touch: pricing, config, export, payouts, staff, and city gates |
| **Buyer** | The actual property seeker | Never logs into a portal — reached entirely through WhatsApp, the public website, ads, and calls |

---

## THE CORE STRUCTURAL DECISION

**One plan = one campaign = one project.** This replaced an earlier "subscription with project slots" model. A promoter can list every project they own for free, forever — but only pays to actively advertise the ones they choose, one committed-lead-count contract per project. Nothing pools between two campaigns on the same account; each has its own budget, minimum, go-live date, and expiry.

This exists specifically so a delivery dispute is structurally impossible: each project has one number, and it either hit that number or it didn't.

---

## HOW A LEAD MOVES THROUGH THE PLATFORM

```
Lead arrives (ad / reel / website / call / walk-in)
        │
        ▼
Has a campaignId already? ──YES──► that promoter, WhatsApp, under 60s. Done.
        │
        NO (organic lead)
        ▼
Telecaller qualifies it → Tier 1 (general) or Tier 2 (ready buyer)
        │
        ▼
Matches our own in-house inventory? ──YES──► HOLD (24h / 6h) → telecaller pitches
        │                                          │ interested → closed, our brokerage
        NO                                         │ not interested → released immediately
        ▼                                          ▼
Matches an active paying campaign? ──YES──► that promoter (best-fit rules apply)
        │
        NO
        ▼
Agent ladder: Tier 2 offered to one agent at a time (15 min each, by plan tier)
              Tier 1 offered to 3–5 agents at once (4h, first accept wins, phone masked)
        │
        ▼
Nobody accepts → falls back to our own telecaller (in-house brokerage, highest priority)
```

---

## THE FIVE REVENUE LINES

1. **Promoter campaign subscriptions** — the largest line (~70% of revenue)
2. **Agent subscriptions** — zero commission taken, agents keep 100% of brokerage
3. **Wallet top-ups** — agents buying extra leads/boosts on demand; uncapped growth potential
4. **Content & add-ons** — shoots, reels, featured listings, Boost My Listing
5. **Our own brokerage (2–3%)** — from in-house inventory and brokerage-only listings

---

## WHAT'S BEEN PLANNED SO FAR (in `dev_doc/`)

| Document | Covers | Modules | Tasks | Est. Time |
| :---- | :---- | :---- | :---- | :---- |
| **Promoter Module Development Plan** | Campaign posting, plan & payment, CSV-delivered leads, promoter portal | 12 | 44 | 38h 35m |
| **Admin Module Development Plan** | Campaign activation, CSV import (admin side), promoter oversight, audit log viewer | 10 | 24 | 23h 45m |
| **Agent Module Development Plan** | Exclusive lead-offer engine, wallet, KYC, requirement board, co-brokerage, performance score | 14 | 56 | 56h 00m |
| **Telecaller Module Development Plan** | Qualification, in-house hold/pitch, verification, callbacks, invalid-lead claims | 12 | 38 | 39h 15m |

**Combined so far: 48 modules, 162 tasks, ~157h 35m of raw implementation time** (excludes testing, review, and integration — see the timeline note in each document).

## WHAT'S STILL PENDING (not yet planned)

- **Super Admin Command Centre** — revenue dashboard, cost-per-lead by city, alert queue, live event feed, plus the modules named in the source spec that nothing currently plans for: Distribution Control, In-house Inventory, Partners, Requirement Board admin view, Content & Slots, Finance, Staff, Automation Monitor, Config, Cities.
- **Sales Executive panel** — the field-sales tool (route, promoter DB, visit logging, quotations, incentives). Thin source material — only one bullet list exists in the spec, no full SOP document.
- **Lead Routing Engine** — the organic-lead waterfall connecting Telecaller's output to the Agent ladder and to active-campaign matching. Both the Agent and Telecaller plans currently depend on this as a documented gap.
- **WhatsApp delivery infrastructure** — the actual provider integration (Twilio / Wati / Meta Cloud) is an open decision across every plan that needs it.

---

## KNOWN ARCHITECTURAL DECISIONS MADE ALONG THE WAY

- The codebase's existing `SharedLead` system (which broadcasts a lead to every agent on a plan tier, and lets multiple sellers accept the same buyer) is being **replaced**, not extended — it directly contradicts the one-buyer-one-agent rule. See the Agent plan's "SharedLead Decision" section.
- A new `RequirementPost` model was created for the agent-facing "requirement board" feature, kept deliberately separate from the existing `Requirement` model (which serves as the Lead entity) to avoid collisions between developers working in parallel.
- Contact masking (hiding a buyer's phone until an agent accepts) reuses the existing field-level masking pattern already in the codebase — no telephony/call-masking vendor involved.

---

## WHERE TO GO FOR MORE DETAIL

- **Business model, pricing, and the rules behind every decision** → `document/` folder (start with `0. DEVELOPER HANDOVER BRIEF` and `4. Document Index and Launch Checklist`)
- **Task-by-task build plans, one per role** → this `dev_doc/` folder

*Prepared: 05 Sep 2026*
