const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  actorRole: { type: String }, // promoter/admin/system
  action: { type: String, required: true }, // CAMPAIGN_CREATED, LEAD_DELIVERED etc.
  entity: { type: String, required: true }, // Campaign/Lead/Subscription/Property
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed },
  reason: { type: String },
  timestamp: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

const APPEND_ONLY_ERROR = new Error(
  "AuditLog is append-only — update and delete are not allowed on this collection"
);

// Block re-saving an existing log entry (only fresh inserts are allowed)
auditLogSchema.pre("save", function () {
  if (!this.isNew) {
    throw APPEND_ONLY_ERROR;
  }
});

// Block every update/delete entry point, document- and query-style alike
const blockedMiddleware = [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "findOneAndReplace",
  "replaceOne",
  "deleteOne",
  "deleteMany",
  "findOneAndDelete",
];

blockedMiddleware.forEach((method) => {
  auditLogSchema.pre(method, { document: true, query: true }, function () {
    throw APPEND_ONLY_ERROR;
  });
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
