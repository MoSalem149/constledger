import mongoose from 'mongoose';

// Connects to MongoDB using MONGODB_URI. Exits the process on failure so
// the orchestrator can restart the container instead of running with no DB.
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set.');
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
    });

    console.log(`[db:core] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[db:core] Connection error:', err.message);
    process.exit(1);
  }
};

export default connectDB;
