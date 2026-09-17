const { MongoClient } = require('mongodb');

const sourceUri = 'mongodb://admin:Bmtechx%402025@82.25.85.114:27017/theplotone?authSource=admin';
const targetUri = 'mongodb://127.0.0.1:27017/theplotone';

async function migrate() {
    const sourceClient = new MongoClient(sourceUri);
    const targetClient = new MongoClient(targetUri);

    try {
        await sourceClient.connect();
        await targetClient.connect();
        console.log('Connected to both databases.');

        const sourceDb = sourceClient.db('theplotone');
        const targetDb = targetClient.db('theplotone');

        // Get all collections from source
        const collections = await sourceDb.listCollections().toArray();

        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            console.log(`Processing collection: ${collectionName}`);

            const sourceCollection = sourceDb.collection(collectionName);
            const targetCollection = targetDb.collection(collectionName);

            // Fetch all documents
            const docs = await sourceCollection.find({}).toArray();

            if (docs.length > 0) {
                // Clear target collection first
                await targetCollection.deleteMany({});
                // Insert all documents
                await targetCollection.insertMany(docs);
                console.log(`Successfully copied ${docs.length} documents for ${collectionName}.`);
            } else {
                console.log(`Collection ${collectionName} is empty, skipping.`);
            }
        }
        
        console.log('Migration completed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sourceClient.close();
        await targetClient.close();
    }
}

migrate();
