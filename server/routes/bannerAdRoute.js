const express = require("express");
const router = express.Router();
const {
    createBannerAd,
    getBannerAds,
    getActiveBannerAd,
    updateBannerAd,
    deleteBannerAd,
} = require("../controllers/bannerAdController");
const { protect, admin } = require("../middleware/authMiddleware");
const bannerUpload = require("../middleware/bannerUploadMiddleware");

// Public route to get active advertisements
router.get("/active", getActiveBannerAd);

// Admin-only routes
router.use(protect);
router.use(admin);

router.post("/", bannerUpload.single("bannerImage"), createBannerAd);
router.get("/", getBannerAds);
router.put("/:id", bannerUpload.single("bannerImage"), updateBannerAd);
router.delete("/:id", deleteBannerAd);

module.exports = router;
