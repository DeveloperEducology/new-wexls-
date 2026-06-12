import { MongoClient } from 'mongodb';

const globalForMongo = globalThis;

export function hasMongoConfig() {
  return Boolean(process.env.MONGODB_URI);
}

export async function getMongoDb() {
  if (!hasMongoConfig()) return null;

  const uri = process.env.MONGODB_URI;
  const dbName = (process.env.MONGODB_DB || process.env.MONGODB_DATABASE || 'new-wexls').trim();

  if (!globalForMongo.__wexlsMongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 3000,
    });
    globalForMongo.__wexlsMongoClientPromise = client.connect();
  }

  const client = await globalForMongo.__wexlsMongoClientPromise;
  return client.db(dbName);
}
