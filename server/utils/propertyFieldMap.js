const propertyFieldMap = {
    // =====================================================
    // 🏠 RESIDENTIAL TYPES
    // =====================================================
    "Flat / Apartment": {
        rooms: true,
        floor: true,
        plot: false,
        commercial: false
    },
    "Independent House / Villa": {
        rooms: true,
        floor: true, // optional 
        plot: true,  // optional land bounds
        commercial: false
    },
    "Builder Floor": {
        rooms: true,
        floor: true,
        plot: false,
        commercial: false
    },
    "Plot / Land": {
        rooms: false,
        floor: false,
        plot: true,
        commercial: false
    },
    "1 RK / Studio Apartment": {
        rooms: true,
        floor: true,
        plot: false,
        commercial: false
    },
    "Serviced Apartment": {
        rooms: true,
        floor: true,
        plot: false,
        commercial: false
    },
    "Farmhouse": {
        rooms: true,
        floor: false,
        plot: true,
        commercial: false
    },
    "Other": {
        rooms: true, // optional
        floor: true, // optional
        plot: false,
        commercial: false
    },

    // =====================================================
    // 🏢 COMMERCIAL TYPES
    // =====================================================
    "Office": {
        rooms: false,
        floor: true,
        plot: false,
        commercial: true
    },
    "Retail": {
        rooms: false,
        floor: true, // optional
        plot: false,
        commercial: true
    },
    "Commercial Plot / Land": {
        rooms: false,
        floor: false,
        plot: true,
        commercial: true
    },
    "Storage": {
        rooms: false,
        floor: true, // optional
        plot: false,
        commercial: true
    },
    "Industry": {
        rooms: false,
        floor: true,
        plot: false,
        commercial: true
    },
    "Hospitality": {
        rooms: true,
        floor: false,
        plot: false,
        commercial: true
    },
    "Commercial Other": {
        rooms: false,
        floor: true,
        plot: false,
        commercial: true
    }
};

module.exports = propertyFieldMap;
