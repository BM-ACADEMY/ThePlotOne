THE PLOT ONE — CAMPAIGN VISIBILITY RULES 

Who sees what, and why | For development and for the team 

THE PRINCIPLE 

The lead is the product. The campaign is the factory. Everyone buys the product. Nobody gets a tour of the factory. 

Two separate things are often confused: 

|  | Definition |
| :---- | :---- |
| Campaign  OUTCOMES | Leads delivered, days remaining,  enquiries vs committed |
| Campaign  MECHANICS | Ad spend, cost per lead, targeting, creatives, ad account, platform |

Outcomes are visible to whoever paid for that campaign. Mechanics are visible to admin only — for every role, always, without exception. 

PROMOTER  
He paid for the campaign. He must be able to verify delivery, or he won't trust the count. 

| ✅ SEES  | ❌ NEVER SEES |
| ----- | :---- |
| Leads delivered vs  committed minimum | Ad spend amount |
| Days remaining in the  campaign | Cost per lead |
| Leads by day  | Our margin |
| Leads by source (organic vs paid, at a high level) | Targeting settings — radius, age, interests |
| Tier 1 vs Tier 2 split | Ad account, campaign IDs, platform internals |
| Reel and post views  | Creative test results |
| Full contact details of every lead | Any other promoter's data |
| Site visits scheduled at his project | What agents are paid or  charged |
| Weekly and monthly reports  | Lead cost benchmarks |

Why cost per lead stays hidden: the moment he knows a lead costs us ₹225, the conversation becomes "why am I paying ₹500 each?" instead of "did I get 50 buyers?" He'd negotiate against our cost base rather than our result. Sell the outcome, never the input.  
One campaign \= one dashboard. A promoter with three campaigns sees three separate delivery views, each naming its project. Never aggregate — he needs to know which layout is performing. 

AGENT 

He is not buying advertising. He is buying access to buyers.

| ✅ SEES  | ❌ NEVER SEES |
| ----- | :---- |
| The lead itself — area, budget, type, timeline | Which campaign  produced the lead |
| Full contact, after he accepts | Ad spend or cost per  lead |
| Leads received, used and  remaining | Targeting settings |
| Wallet balance and transactions | Creative specs or ad  copy |
| His own listings — views and enquiries | Ad account or platform details |
| Boost results — enquiries vs the 10–15 committed | Any promoter's  campaign dashboard |
| Requirement board and network inventory | Other agents' leads or  performance |
| His performance score and what drives it | The unassigned lead  pool |

Why the campaign is hidden: if an agent can see a lead came from a ₹250 Meta ad targeting Villianur, 25–45, plot-interested — he can run that ad himself. The subscription becomes optional and the platform becomes a tutorial. 

Important correction to the original table: it is not true that agents see no campaign at all. An agent who buys Boost My Listing (₹2,999) has purchased a campaign for his own property. He sees its outcomes — enquiries delivered against the 10–15 committed, days remaining, listing views. He still sees none of the mechanics. 

SIDE BY SIDE

|  | Promoter  | Agent | Agent with  a Boost |
| :---- | ----- | ----- | ----- |
| Campaign delivery  vs committed | ✅ his  own  | ❌ | ✅ his  boost only |
| Days remaining  | ✅  | ❌  | ✅ |
| Leads by day  | ✅  | ❌  | ✅ |
| The leads  themselves  | ✅  | ✅  | ✅ |
| Ad spend  | ❌  | ❌  | ❌ |
| Cost per lead  | ❌  | ❌  | ❌ |
| Targeting settings  | ❌  | ❌  | ❌ |

|  | Promoter  | Agent | Agent with  a Boost |
| :---- | ----- | ----- | ----- |
| Creatives and ad  copy | ❌  | ❌  | ❌ |
| Source campaign of a received lead | n/a  | ❌  | n/a |

FOR THE DEVELOPER 

leads.campaignId 

→ stored on every lead for attribution and reporting 

→ NEVER exposed on any agent-facing endpoint or response 

Campaign MECHANICS fields 

(adSpend, costPerLead, targeting, creativeIds, adAccountId, platform)   
→ admin roles only, enforced server-side 

→ excluded from promoter and agent serialisers by default,   
not filtered at the UI layer 

Campaign OUTCOME fields 

(delivered, committedMinimum, daysRemaining, leadsByDay, tierSplit) 

→ visible to the account that owns that 

campaign, and nobody else 

Build the serialisers so mechanics are opt-in for admin, rather than opt-out for everyone else. A field added later then defaults to hidden instead of leaking.  
THE ONE-LINE SUMMARY FOR THE TEAM 

Show people what they received. Never show them how it was made, or what it cost us.