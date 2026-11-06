import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  memoryServer?: any;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000,
    };

    let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uniconnectdb';

    cached.promise = (async () => {
      try {
        const m = await mongoose.connect(uri, opts);
        console.log(`[MongoDB] Connected to database: ${uri.replace(/\/\/.*@/, '//***@')}`);
        return m;
      } catch (err: any) {
        console.warn(`[MongoDB] Could not connect to ${uri}: ${err.message}. Initializing development in-memory MongoDB...`);
        try {
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          if (!cached.memoryServer) {
            cached.memoryServer = await MongoMemoryServer.create();
          }
          const memoryUri = cached.memoryServer.getUri() + 'uniconnect';
          console.log(`[MongoDB] In-memory MongoDB ready at ${memoryUri}`);
          const m = await mongoose.connect(memoryUri, opts);
          return m;
        } catch (memErr: any) {
          console.error('[MongoDB] Failed to start in-memory MongoDB:', memErr);
          throw memErr;
        }
      }
    })();
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
