import mongoose, { Document, Schema } from "mongoose";

// READ-ONLY User schema for populate() refs. Auth and the source of truth
// for users live in backend-core; this service must never write to this
// collection.
export interface IUserDocument extends Document {
  name: string;
  email: string;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  { collection: "users" },
);

export const UserModel = mongoose.model<IUserDocument>("User", userSchema);
