const Testimonial = require("../models/Testimonial");

exports.createTestimonial = async (req, res) => {
  try {
    const testimonial = new Testimonial(req.body);
    await testimonial.save();
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().populate(
      "user_id",
      "name avatar",
    );
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({
      status: "approved",
    }).populate("user_id", "name avatar");
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTestimonialStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!testimonial)
      return res.status(404).json({ error: "Testimonial not found" });
    res.json(testimonial);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial)
      return res.status(404).json({ error: "Testimonial not found" });
    res.json({ message: "Testimonial deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get testimonials by user
exports.getUserTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ user_id: req.params.userId })
      .populate("user_id", "name avatar")
      .sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update testimonial (for user editing their own testimonial)
exports.updateTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!testimonial)
      return res.status(404).json({ error: "Testimonial not found" });
    res.json(testimonial);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
