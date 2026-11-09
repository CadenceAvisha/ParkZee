import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { env } from './environment.js';

let memReplSet: MongoMemoryReplSet | null = null;

export const connectDatabase = async (): Promise<string> => {
  if (process.env.NODE_ENV === 'test') {
    memReplSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    const uri = memReplSet.getUri();
    await mongoose.connect(uri);
    return uri;
  }

  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
  console.log(`Connected to MongoDB at ${mongoose.connection.host}/${mongoose.connection.name}`);
  return env.MONGODB_URI;
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  if (memReplSet) {
    await memReplSet.stop();
    memReplSet = null;
  }
};
