import mongoose from 'mongoose';
import { MongoMemoryServer, MongoMemoryReplSet } from 'mongodb-memory-server';

let mongoServer: MongoMemoryReplSet | MongoMemoryServer | null = null;

export const setupTestDB = () => {
  beforeAll(async () => {
    // Increase timeout for binary download if needed
    try {
      const replSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: 'wiredTiger' },
      });
      mongoServer = replSet;
      const uri = replSet.getUri();
      await mongoose.connect(uri);
    } catch (e) {
      const standalone = await MongoMemoryServer.create();
      mongoServer = standalone;
      const uri = standalone.getUri();
      await mongoose.connect(uri);
    }
  }, 60000);

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });
};
