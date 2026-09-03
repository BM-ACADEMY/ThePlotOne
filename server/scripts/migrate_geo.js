
const mongoose = require('mongoose');
const Property = require('./server/models/Property');
require('dotenv').config();

const migrateCoordinates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pondy');
    console.log('Connected to MongoDB');

    const properties = await Property.find({
      'location.coordinates.lat': { $exists: true },
      'location.coordinates.lng': { $exists: true }
    });

    console.log(`Found ${properties.length} properties to migrate`);

    for (const property of properties) {
      const lat = parseFloat(property.location.coordinates.lat);
      const lng = parseFloat(property.location.coordinates.lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        property.location.locationPoint = {
          type: 'Point',
          coordinates: [lng, lat]
        };
        await property.save();
        console.log(`Updated property: ${property.basicInfo.title}`);
      }
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateCoordinates();
