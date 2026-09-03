const PropertyType = require("../models/PropertyType");
const fs = require("fs");
const path = require("path");

const parseBool = (val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    if (val === "undefined" || val === "null") return false;
    return val; // Let Mongoose handle other types or actual booleans
};

exports.createPropertyType = async (req, res) => {
    try {
        const typeData = { ...req.body };
        
        if (req.file) {
            typeData.imageUrl = `/uploads/propertyTypes/${req.file.filename}`;
        }

        // Parse boolean strings from FormData
        ["hasRooms", "hasFloor", "hasPlot", "hasCommercial"].forEach(field => {
            if (typeData[field] !== undefined) {
                typeData[field] = parseBool(typeData[field]);
            }
        });

        const propertyType = new PropertyType(typeData);
        await propertyType.save();
        res.status(201).json(propertyType);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "A property type with this name already exists." });
        }
        res.status(400).json({ error: error.message });
    }
};

exports.getPropertyTypes = async (req, res) => {
    try {
        const { status, usageType } = req.query;
        const query = {};
        if (status) query.status = status;
        if (usageType) query.usageType = usageType;

        const propertyTypes = await PropertyType.find(query).sort({ name: 1 });
        res.json(propertyTypes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPropertyTypeById = async (req, res) => {
    try {
        const propertyType = await PropertyType.findById(req.params.id);
        if (!propertyType) return res.status(404).json({ error: "Property type not found" });
        res.json(propertyType);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updatePropertyType = async (req, res) => {
    try {
        let propertyType = await PropertyType.findById(req.params.id);
        if (!propertyType) return res.status(404).json({ error: "Property type not found" });

        const updateData = { ...req.body };

        if (req.file) {
            // Delete old image if it exists
            if (propertyType.imageUrl) {
                const oldImagePath = path.join(__dirname, "..", propertyType.imageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.imageUrl = `/uploads/propertyTypes/${req.file.filename}`;
        }

        // Parse boolean strings from FormData
        ["hasRooms", "hasFloor", "hasPlot", "hasCommercial"].forEach(field => {
            if (updateData[field] !== undefined) {
                updateData[field] = parseBool(updateData[field]);
            }
        });

        propertyType = await PropertyType.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.json(propertyType);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "A property type with this name already exists." });
        }
        res.status(400).json({ error: error.message });
    }
};

exports.deletePropertyType = async (req, res) => {
    try {
        const propertyType = await PropertyType.findById(req.params.id);
        if (!propertyType) return res.status(404).json({ error: "Property type not found" });

        // Delete image file if it exists
        if (propertyType.imageUrl) {
            const imagePath = path.join(__dirname, "..", propertyType.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await PropertyType.findByIdAndDelete(req.params.id);
        res.json({ message: "Property type deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
