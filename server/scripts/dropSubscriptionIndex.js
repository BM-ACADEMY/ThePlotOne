const mongoose = require('mongoose');
require('dotenv').config();

const dropIndex = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is not defined in .env');
      return;
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const collection = mongoose.connection.collection('subscriptionplans');
    
    // Check if index exists and drop it
    const indexes = await collection.indexes();
    const hasNameIndex = indexes.some(idx => idx.name === 'name_1');
    
    if (hasNameIndex) {
      await collection.dropIndex('name_1');
      console.log('Successfully dropped index: name_1');
    } else {
      console.log('Index name_1 does not exist.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error dropping index:', error);
    process.exit(1);
  }
};

dropIndex();
