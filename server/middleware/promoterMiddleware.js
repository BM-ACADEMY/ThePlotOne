const User = require("../models/User");

// Verify user is a promoter (businessType = "Builders / Promoter")
const isPromoter = async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("businessType");
  if (
    !user ||
    !user.businessType ||
    user.businessType.name !== "Builders / Promoter"
  ) {
    return res.status(403).json({ message: "Promoter access only" });
  }
  next();
};

module.exports = { isPromoter };
