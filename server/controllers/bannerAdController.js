const BannerAd = require("../models/BannerAd");
const fs = require("fs");
const path = require("path");

// @desc    Create a new banner ad
// @route   POST /api/banner-ads
// @access  Private/Admin
exports.createBannerAd = async (req, res) => {
    try {
        const { title, linkUrl, expiryDate } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an image",
            });
        }

        const bannerAd = await BannerAd.create({
            title,
            linkUrl,
            expiryDate,
            imageUrl: `/uploads/banners/${req.file.filename}`,
            createdBy: req.user._id,
        });

        res.status(201).json({
            success: true,
            data: bannerAd,
        });
    } catch (error) {
        console.error("Error creating banner ad:", error);
        res.status(500).json({
            success: false,
            message: "Error creating banner ad",
            error: error.message,
        });
    }
};

// @desc    Get all banner ads (for admin list)
// @route   GET /api/banner-ads
// @access  Private/Admin
exports.getBannerAds = async (req, res) => {
    try {
        const bannerAds = await BannerAd.find()
            .populate("createdBy", "name phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bannerAds.length,
            data: bannerAds,
        });
    } catch (error) {
        console.error("Error fetching banner ads:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching banner ads",
            error: error.message,
        });
    }
};

// @desc    Get active banner ads for public
// @route   GET /api/banner-ads/active
// @access  Public
exports.getActiveBannerAd = async (req, res) => {
    try {
        const today = new Date();
        // Find active ads where expiryDate is in the future
        const activeAds = await BannerAd.find({
            isActive: true,
            expiryDate: { $gte: today },
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: activeAds,
        });
    } catch (error) {
        console.error("Error fetching active banner ads:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching active banner ads",
            error: error.message,
        });
    }
};

// @desc    Update a banner ad
// @route   PUT /api/banner-ads/:id
// @access  Private/Admin
exports.updateBannerAd = async (req, res) => {
    try {
        let bannerAd = await BannerAd.findById(req.params.id);

        if (!bannerAd) {
            return res.status(404).json({
                success: false,
                message: "Banner ad not found",
            });
        }

        const updateData = { ...req.body };

        if (req.file) {
            // Delete old image if it exists
            const oldImagePath = path.join(__dirname, "..", bannerAd.imageUrl);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            updateData.imageUrl = `/uploads/banners/${req.file.filename}`;
        }

        bannerAd = await BannerAd.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: bannerAd,
        });
    } catch (error) {
        console.error("Error updating banner ad:", error);
        res.status(500).json({
            success: false,
            message: "Error updating banner ad",
            error: error.message,
        });
    }
};

// @desc    Delete a banner ad
// @route   DELETE /api/banner-ads/:id
// @access  Private/Admin
exports.deleteBannerAd = async (req, res) => {
    try {
        const bannerAd = await BannerAd.findById(req.params.id);

        if (!bannerAd) {
            return res.status(404).json({
                success: false,
                message: "Banner ad not found",
            });
        }

        // Delete image file
        const imagePath = path.join(__dirname, "..", bannerAd.imageUrl);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await bannerAd.deleteOne();

        res.status(200).json({
            success: true,
            message: "Banner ad removed",
        });
    } catch (error) {
        console.error("Error deleting banner ad:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting banner ad",
            error: error.message,
        });
    }
};
