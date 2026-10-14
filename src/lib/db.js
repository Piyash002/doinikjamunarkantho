import mongoose from 'mongoose';

const globalForMongoose = globalThis;

const cached = globalForMongoose.__newsDbCache || {
  connection: null,
  promise: null,
};

if (!globalForMongoose.__newsDbCache) {
  globalForMongoose.__newsDbCache = cached;
}

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing from environment variables.');
  }

  if (cached.connection) {
    return cached.connection;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
  }

  try {
    cached.connection = await cached.promise;
    return cached.connection;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
