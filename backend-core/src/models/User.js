import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8 },
    role: {
      type: String,
      enum: ["contract_manager", "pmo", "finance_team", "top_management"],
      default: "contract_manager",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Hash the password on create or whenever it changes. Bypassed by
// findOneAndUpdate / findByIdAndUpdate — callers updating the password
// must use doc.save() instead (see userController.updateUser).
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Constant-time password comparison
userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("User", userSchema);
