exports.getPropertyTypes = (req, res) => {
  try {
    const types = Property.PROPERTY_TYPES;
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
