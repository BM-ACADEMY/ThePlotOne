const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "closed", "resolved"],
      default: "open",
    },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        isAdmin: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        read: {
          type: Boolean,
          default: false,
        },
      },
    ],
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    isAdminRead: {
      type: Boolean,
      default: false,
    },
    isSellerRead: {
      type: Boolean,
      default: true,
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// TTL Index to auto-delete tickets 30 days after they are resolved or closed
supportTicketSchema.index({ resolvedAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);

