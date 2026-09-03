const SellerRequest = require("../models/SellerRequest");

exports.createRequest = async (req, res) => {
  try {
    const { name, email, phone, business_type, message } = req.body;
    const seller_id = req.user._id;

    const newRequest = new SellerRequest({
      seller_id,
      name,
      email,
      phone,
      business_type,
      message,
    });

    await newRequest.save();
    res
      .status(201)
      .json({ message: "Request submitted successfully", request: newRequest });
  } catch (error) {
    console.error("Create Seller Request Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await SellerRequest.find()
      .populate({
        path: "seller_id",
        select: "name phone profile_image",
      });
    res.json(requests);
  } catch (error) {
    console.error("Get All Seller Requests Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await SellerRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    if (!request) return res.status(404).json({ error: "Request not found" });

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
