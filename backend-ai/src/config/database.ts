import mongoose from "mongoose";
import "../models/User.model";
import { ContractModel } from "../models/Contract.model";

let isConnected = false;

// One-time migration: an older Contract schema used a NON-sparse unique index
// on contractNumber, which fails for any contract created before that field
// existed. This drops the bad index so Mongoose can recreate it sparse, and
// backfills a placeholder contractNumber on legacy documents so the unique
// constraint never collides going forward.
async function syncContractIndexes(): Promise<void> {
  try {
    const coll = mongoose.connection.collection("contracts");
    const indexes = await coll.indexes();
    const legacy = indexes.find((i) => i.name === "contractNumber_1");

    if (legacy && !legacy.sparse) {
      await coll.dropIndex("contractNumber_1");
      console.log("[db:ai] Dropped legacy contractNumber_1 index (non-sparse)");
    }

    // Recreates indexes per the current schema definition
    await ContractModel.syncIndexes();

    // Backfill — every legacy contract without a contractNumber gets a
    // deterministic placeholder so the unique-sparse constraint is safe.
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
    // Index sync is best-effort — log and continue if it fails (the app can
    // still serve requests with the existing indexes).
    console.warn("[db:ai] Contract index sync skipped:", (err as Error).message);
  }
}

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

// Reset the flag on disconnect so the next connectDatabase() call actually reconnects
mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("[db:ai] MongoDB disconnected — will reconnect on next call.");
});
