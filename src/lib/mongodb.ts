import mongoose from "mongoose";
import dns from "dns";

// Node.js uses c-ares for SRV resolution which often fails (querySrv ECONNREFUSED) with local router / ISP DNS
// On Vercel / cloud serverless, native DNS resolution is used directly
if (!process.env.VERCEL) {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  } catch {
    // Ignore if not permitted
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  currentUri: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null, currentUri: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
  }

  const targetDb = process.env.MONGODB_DB_NAME || "work_update";

  // If connected to wrong database (e.g. 'test'), disconnect and reconnect to targetDb
  if (cached.conn && mongoose.connection.db && mongoose.connection.db.databaseName !== targetDb) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      dbName: targetDb,
    };

    cached.currentUri = uri;
    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
