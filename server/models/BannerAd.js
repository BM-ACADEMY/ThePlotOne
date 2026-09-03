const mongoose = require("mongoose");

const bannerAdSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Please provide a title for the advertisement"],
            trim: true,
        },
        imageUrl: {
            type: String,
            required: [true, "Please provide an image for the advertisement"],
        },
        linkUrl: {
            type: String,
            trim: true,
        },
        expiryDate: {
            type: Date,
            required: [true, "Please provide an expiry date"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("BannerAd", bannerAdSchema);
