import mongoose from 'mongoose';
import { MongoMemoryReplSet, MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './environment.js';

let memReplSet: MongoMemoryReplSet | null = null;
let memServer: MongoMemoryServer | null = null;

export const connectDatabase = async (): Promise<string> => {
  if (process.env.NODE_ENV === 'test') {
    // Tests use MongoMemoryReplSet to support MongoDB transactions
    memReplSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    const uri = memReplSet.getUri();
    await mongoose.connect(uri);
    return uri;
  }

  try {
    // Try connecting to primary MONGODB_URI with a 4-second timeout
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`Connected to MongoDB at ${env.MONGODB_URI}`);
    return env.MONGODB_URI;
  } catch (err: unknown) {
    console.warn(`Could not connect to external MongoDB at ${env.MONGODB_URI}. Initializing embedded in-memory MongoDB replica set for local development...`);
    try {
      memReplSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: 'wiredTiger' },
      });
      const memoryUri = memReplSet.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Connected to embedded MongoDB Replica Set at ${memoryUri}`);
      return memoryUri;
    } catch (memErr) {
      // Fallback to standalone in-memory server if replSet fails
      memServer = await MongoMemoryServer.create();
      const fallbackUri = memServer.getUri();
      await mongoose.connect(fallbackUri);
      console.log(`Connected to embedded standalone MongoDB at ${fallbackUri}`);
      return fallbackUri;
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  if (memReplSet) {
    await memReplSet.stop();
  }
  if (memServer) {
    await memServer.stop();
  }
};
