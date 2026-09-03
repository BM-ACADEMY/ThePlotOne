const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id)
        .populate(["role_id", "businessType"]);

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ error: "Not authorized, no token" });
  }
};

const admin = (req, res, next) => {
  if (
    req.user &&
    (req.user.isSuperAdmin || 
     (req.user.role_id && req.user.role_id.role_name.toLowerCase() === "admin"))
  ) {
    next();
  } else {
    res.status(403).json({ error: "Not authorized as an admin" });
  }
};

const optionalProtect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id)
        .populate("role_id");
    } catch (error) {
      console.error("Optional Auth Error:", error);
      // Do nothing, just continue as guest
    }
  }
  next();
};

module.exports = { protect, admin, optionalProtect };
