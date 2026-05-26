import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`[db] AI service connected: ${conn.connection.host}`);
  } catch (err: unknown) {
    console.error('[db] Connection error:', (err as Error).message);
    process.exit(1);
  }
};
