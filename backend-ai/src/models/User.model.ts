import mongoose, { Document, Schema } from 'mongoose';

/** Read-only User schema for population refs (auth lives in backend-core). */
export interface IUserDocument extends Document {
  name: string;
  email: string;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  { collection: 'users' },
);

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
