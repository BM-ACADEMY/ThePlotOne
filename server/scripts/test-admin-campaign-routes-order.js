// Verifies the actual Express router configuration, not just controller logic —
// specifically that GET /pending is registered before GET /:id, since Express
// matches routes in registration order and /:id would otherwise swallow /pending.
const router = require("../routes/adminCampaignRoutes");

const getRoutes = router.stack
  .filter((layer) => layer.route && layer.route.methods.get)
  .map((layer) => layer.route.path);

console.log("Registered GET routes, in order:", getRoutes);

const pendingIndex = getRoutes.indexOf("/pending");
const idIndex = getRoutes.indexOf("/:id");
const statsIndex = getRoutes.indexOf("/stats");
const byPromoterIndex = getRoutes.indexOf("/by-promoter/:id");

console.log(
  pendingIndex !== -1 && idIndex !== -1 && pendingIndex < idIndex
    ? "PASS: GET /pending is registered before GET /:id — a request to /pending will reach getPendingCampaigns, not getCampaignDetail"
    : `FAIL: route order wrong — /pending at index ${pendingIndex}, /:id at index ${idIndex}`
);

console.log(
  statsIndex !== -1 && idIndex !== -1 && statsIndex < idIndex
    ? "PASS: GET /stats (Task 9.2) is registered before GET /:id — a request to /stats will reach getCampaignStats, not getCampaignDetail"
    : `FAIL: route order wrong — /stats at index ${statsIndex}, /:id at index ${idIndex}`
);

console.log(
  byPromoterIndex !== -1
    ? "PASS: GET /by-promoter/:id (Task 9.1) is registered — a distinct 2-segment path, no ordering conflict with /:id"
    : "FAIL: /by-promoter/:id route not found"
);
