const mongoose = require("mongoose");

const csvImportBatchSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: { type: String },
    totalRows: { type: Number },
    imported: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
    errorLog: [{ type: String }],
  },
  { timestamps: true }
);

csvImportBatchSchema.index({ campaign: 1 });

module.exports = mongoose.model("CsvImportBatch", csvImportBatchSchema);
