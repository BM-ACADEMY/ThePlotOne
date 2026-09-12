// T-102 fix — this is a frontend-only change (SelectPlan.jsx/Billing.jsx/
// MyLeads.jsx now skip calling these endpoints entirely for non-promoters,
// instead of reacting to their 403). The backend guarantee the fix relies on
// — isPromoter middleware genuinely rejects non-promoters — is already
// thoroughly covered by test-promoter-middleware.js (the isPromoter function
// itself, in isolation). What that doesn't cover, and this does: whether
// each specific route the three fixed pages call actually has isPromoter
// wired into its registration — inspecting the real Express router.stack,
// not a reimplementation of it.
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const campaignRoutes = require("../routes/campaignRoutes");
const promoterLeadsRoutes = require("../routes/promoterLeadsRoute");

const middlewareNames = (router, routePath, method) => {
  const layer = router.stack.find(
    (l) => l.route && l.route.path === routePath && l.route.methods[method],
  );
  return layer ? layer.route.stack.map((s) => s.name) : null;
};

const checks = [
  { label: "GET /campaigns/my-campaign-status (SelectPlan.jsx)", router: campaignRoutes, path: "/my-campaign-status", method: "get" },
  { label: "GET /campaigns/my-billing (Billing.jsx)", router: campaignRoutes, path: "/my-billing", method: "get" },
  { label: "GET /leads/my-leads (MyLeads.jsx)", router: promoterLeadsRoutes, path: "/my-leads", method: "get" },
];

let allPass = true;
checks.forEach(({ label, router, path, method }) => {
  const names = middlewareNames(router, path, method);
  const ok = names && names.includes("isPromoter");
  if (!ok) allPass = false;
  console.log(
    ok
      ? `PASS: ${label} has isPromoter wired into its real route registration`
      : `FAIL: ${label} missing isPromoter — found middleware: ${JSON.stringify(names)}`,
  );
});

console.log(
  allPass
    ? "\nAll three promoter-only routes the T-102 fix depends on are genuinely guarded server-side."
    : "\nAt least one route is missing its guard — the frontend fix alone would not be sufficient.",
);

process.exit(allPass ? 0 : 1);
