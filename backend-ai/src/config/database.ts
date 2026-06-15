/**
 * MongoDB connection manager.
 * Opens the Mongoose connection once and applies contract index maintenance after connect.
 */
import mongoose from "mongoose";
import "../models/User.model";
import { ContractModel } from "../models/Contract.model";

let isConnected = false;

// Legacy contractNumber index maintenance
async function syncContractIndexes(): Promise<void> {
  try {
    const coll = mongoose.connection.collection("contracts");
    const indexes = await coll.indexes();
    const legacy = indexes.find((i) => i.name === "contractNumber_1");

    if (legacy && !legacy.sparse) {
      await coll.dropIndex("contractNumber_1");
      console.log("[db:ai] Dropped legacy contractNumber_1 index (non-sparse)");
    }

    await ContractModel.syncIndexes();

    const missing = await ContractModel.find({
      $or: [{ contractNumber: null }, { contractNumber: { $exists: false } }],
    }).select("_id");

    for (const doc of missing) {
      await ContractModel.updateOne(
        { _id: doc._id },
        { contractNumber: `CPMS-LEGACY-${doc._id}` },
      );
    }

    if (missing.length > 0) {
      console.log(
        `[db:ai] Backfilled contractNumber on ${missing.length} legacy contract(s)`,
      );
    }
  } catch (err) {
    console.warn("[db:ai] Contract index sync skipped:", (err as Error).message);
  }
}

// Database connection
export async function connectDatabase(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set.");
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  });

  isConnected = true;
  console.log("[db:ai] MongoDB connected:", mongoose.connection.host);

  await syncContractIndexes();
}

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("[db:ai] MongoDB disconnected — will reconnect on next call.");
});