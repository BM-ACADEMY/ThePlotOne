const ApprovalType = require("../models/ApprovalType");

exports.createApprovalType = async (req, res) => {
  try {
    const { name, status, visible_to_seller } = req.body;

    // Case-insensitive uniqueness check
    const existingType = await ApprovalType.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingType) {
      return res.status(400).json({ error: "Approval Type with this name already exists" });
    }

    const approvalType = new ApprovalType({ name, status, visible_to_seller });
    await approvalType.save();
    res.status(201).json(approvalType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getApprovalTypes = async (req, res) => {
  try {
    const { status, visible_to_seller } = req.query;
    const query = {};
    if (status) query.status = status;
    if (visible_to_seller !== undefined)
      query.visible_to_seller = visible_to_seller === "true";

    const approvalTypes = await ApprovalType.find(query);
    res.json(approvalTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getApprovalTypeById = async (req, res) => {
  try {
    const approvalType = await ApprovalType.findById(req.params.id);
    if (!approvalType)
      return res.status(404).json({ error: "Approval Type not found" });
    res.json(approvalType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateApprovalType = async (req, res) => {
  try {
    const approvalType = await ApprovalType.findById(req.params.id);
    if (!approvalType)
      return res.status(404).json({ error: "Approval Type not found" });

    const { name } = req.body;
    if (name && name !== approvalType.name) {
      // Case-insensitive uniqueness check
      const existingType = await ApprovalType.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        _id: { $ne: req.params.id },
      });

      if (existingType) {
        return res.status(400).json({ error: "Approval Type with this name already exists" });
      }
    }

    Object.assign(approvalType, req.body);
    await approvalType.save();
    res.json(approvalType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteApprovalType = async (req, res) => {
  try {
    const approvalType = await ApprovalType.findByIdAndDelete(req.params.id);
    if (!approvalType)
      return res.status(404).json({ error: "Approval Type not found" });
    res.json({ message: "Approval Type deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
