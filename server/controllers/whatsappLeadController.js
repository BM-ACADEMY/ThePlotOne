const WhatsappLead = require("../models/WhatsappLead");
const Subscription = require("../models/Subscription");

exports.createWhatsappLead = async (req, res) => {
  try {
    const { seller_id } = req.body;
    
    // If user_id is not provided,ensure we have enquirer details
    if (
      !req.body.user_id &&
      (!req.body.enquirer_name || !req.body.enquirer_phone)
    ) {
      // Ideally validation
    }
    const property = await require("../models/Property").findById(req.body.property_id);
    const propertyTitle = property?.basicInfo?.title || property?.title || "Untitled Property";
    
    const whatsappLead = new WhatsappLead({
        ...req.body,
        property_title: propertyTitle
    });
    await whatsappLead.save();

    // Increment lead usage for the seller if they have an active plan
    if (seller_id) {
        const activeSubscription = await Subscription.findOne({
            user: seller_id,
            status: "active",
            endDate: { $gt: new Date() },
        });

        if (activeSubscription) {
            await Subscription.findByIdAndUpdate(activeSubscription._id, { $inc: { leadsUsed: 1 } });
        }
    }

    // Emit socket event for real-time notification
    const io = req.app.get("socketio");
    if (io) {
      io.to("admin-room").emit("new-whatsapp-lead", {
        message: `New WhatsApp lead from ${req.body.enquirer_name || "a user"}`,
        lead: whatsappLead,
      });
    }

    res.status(201).json(whatsappLead);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getWhatsappLeads = async (req, res) => {
  try {
    const whatsappLeads = await WhatsappLead.find().populate(
      "property_id user_id seller_id",
    );
    res.json(whatsappLeads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWhatsappLeadById = async (req, res) => {
  try {
    const whatsappLead = await WhatsappLead.findById(req.params.id).populate(
      "property_id user_id seller_id",
    );
    if (!whatsappLead)
      return res.status(404).json({ error: "WhatsappLead not found" });
    res.json(whatsappLead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateWhatsappLead = async (req, res) => {
  try {
    const whatsappLead = await WhatsappLead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!whatsappLead)
      return res.status(404).json({ error: "WhatsappLead not found" });
    res.json(whatsappLead);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteWhatsappLead = async (req, res) => {
  try {
    const whatsappLead = await WhatsappLead.findByIdAndDelete(req.params.id);
    if (!whatsappLead)
      return res.status(404).json({ error: "WhatsappLead not found" });
    res.json({ message: "WhatsappLead deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
