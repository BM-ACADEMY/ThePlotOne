const mongoose = require('mongoose');

const SOURCE_URI = 'mongodb+srv://anbunaturalproducts:ejeqR6QpmmZ536lI@cluster0.tm7m9js.mongodb.net/nammapondyproperties?retryWrites=true&w=majority&appName=Cluster0';
const TARGET_URI = 'mongodb://127.0.0.1:27017/theplotone';

async function cloneDatabase() {
  console.log('🔄 Starting Database Clone Process...');
  console.log(`📡 Source: ${SOURCE_URI.replace(/:([^:@]+)@/, ':****@')}`);
  console.log(`🎯 Target: ${TARGET_URI}`);

  let sourceConn, targetConn;
  try {
    console.log('\nConnecting to Source Database...');
    sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
    console.log(' Connected to Source Database successfully.');

    console.log('\nConnecting to Target Database...');
    targetConn = await mongoose.createConnection(TARGET_URI).asPromise();
    console.log(' Connected to Target Database successfully.\n');

    const sourceDb = sourceConn.db;
    const targetDb = targetConn.db;

    const collections = await sourceDb.listCollections().toArray();
    console.log(` Found ${collections.length} collection(s) in source database.\n`);

    for (const collInfo of collections) {
      const collName = collInfo.name;

      if (collName.startsWith('system.')) {
        console.log(`⏩ Skipping system collection: ${collName}`);
        continue;
      }

      console.log(`========================================`);
      console.log(`📦 Processing Collection: "${collName}"`);

      const sourceColl = sourceDb.collection(collName);
      const targetColl = targetDb.collection(collName);

      // Get count
      const totalDocs = await sourceColl.countDocuments();
      console.log(`   Source document count: ${totalDocs}`);

      // Drop target collection if exists to avoid conflicts
      try {
        await targetColl.drop();
        console.log(`   Cleared existing target collection.`);
      } catch (err) {
        // Drop error (e.g. "ns not found") can be ignored
      }

      if (totalDocs > 0) {
        // Read documents in batches to handle any size
        const batchSize = 1000;
        let processed = 0;
        const cursor = sourceColl.find({});

        let batch = [];
        while (await cursor.hasNext()) {
          const doc = await cursor.next();
          batch.push(doc);

          if (batch.length >= batchSize) {
            await targetColl.insertMany(batch, { ordered: false });
            processed += batch.length;
            console.log(`   Inserted ${processed}/${totalDocs} documents...`);
            batch = [];
          }
        }

        if (batch.length > 0) {
          await targetColl.insertMany(batch, { ordered: false });
          processed += batch.length;
          console.log(`   Inserted ${processed}/${totalDocs} documents.`);
        }
      } else {
        // Create empty collection on target
        await targetDb.createCollection(collName);
        console.log(`   Created empty collection on target.`);
      }

      // Copy Indexes
      try {
        const indexes = await sourceColl.indexes();
        const customIndexes = indexes.filter(idx => idx.name !== '_id_');

        if (customIndexes.length > 0) {
          console.log(`   Copying ${customIndexes.length} index(es)...`);
          for (const idx of customIndexes) {
            const indexSpec = idx.key;
            const indexOptions = {
              name: idx.name,
              unique: idx.unique || false,
              sparse: idx.sparse || false,
              background: true,
            };
            if (idx.expireAfterSeconds !== undefined) {
              indexOptions.expireAfterSeconds = idx.expireAfterSeconds;
            }
            if (idx.weights) {
              indexOptions.weights = idx.weights;
            }
            if (idx.default_language) {
              indexOptions.default_language = idx.default_language;
            }
            try {
              await targetColl.createIndex(indexSpec, indexOptions);
            } catch (idxErr) {
              console.warn(`   ⚠️ Warning copying index "${idx.name}":`, idxErr.message);
            }
          }
        }
      } catch (indexErr) {
        console.warn(`   ⚠️ Could not fetch/create indexes for "${collName}":`, indexErr.message);
      }

      console.log(`   Migration completed for "${collName}".`);
    }

    console.log(`\n🎉 All collections and data successfully imported into ${TARGET_URI}!\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (sourceConn) await sourceConn.close();
    if (targetConn) await targetConn.close();
    console.log('🔌 Database connections closed.');
    process.exit(0);
  }
}

cloneDatabase();
