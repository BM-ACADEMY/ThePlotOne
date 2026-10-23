const User = require("../models/User");

// Verify user is a telecaller. Unlike promoterMiddleware.js (which checks
// businessType), Telecaller is internal staff — checked via role_id.
const isTelecaller = async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("role_id");
  if (!user || !user.role_id || user.role_id.role_name !== "telecaller") {
    return res.status(403).json({ message: "Telecaller access only" });
  }
  next();
};

module.exports = { isTelecaller };
