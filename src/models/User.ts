import mongoose, { Model, Schema } from "mongoose";

export type UserRole = "admin" | "buyer" | "seller";
export type VerificationStatus = "unsubmitted" | "pending" | "verified" | "rejected";

export type SellerProfileDocument = {
  name: string;
  fileUrl: string;
  uploadedAt: Date;
};

export type SellerProfile = {
  businessName?: string;
  cnicNumber?: string;
  registeredMobileNumber?: string;
  address?: string;
  city?: string;
  notes?: string;
  documents: SellerProfileDocument[];
  submittedAt?: Date;
};

export type UserDocument = {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  passwordHash: string;
  assignedCategories: mongoose.Types.ObjectId[];
  sellerProfile?: SellerProfile;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
};

const sellerProfileDocumentSchema = new Schema<SellerProfileDocument>(
  {
    name: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const sellerProfileSchema = new Schema<SellerProfile>(
  {
    businessName: { type: String, trim: true },
    cnicNumber: { type: String, trim: true },
    registeredMobileNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    notes: { type: String, trim: true },
    documents: { type: [sellerProfileDocumentSchema], default: [] },
    submittedAt: { type: Date },
  },
  { _id: false }
);

const userSchema = new Schema<UserDocument>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "buyer", "seller"], required: true },
    passwordHash: { type: String, required: true, select: false },
    assignedCategories: [{ type: Schema.Types.ObjectId, ref: "Category", default: [] }],
    sellerProfile: { type: sellerProfileSchema, default: undefined },
    verificationStatus: {
      type: String,
      enum: ["unsubmitted", "pending", "verified", "rejected"],
      default: "unsubmitted",
    },
  },
  { timestamps: true }
);

const User = (mongoose.models.User as Model<UserDocument>) || mongoose.model<UserDocument>("User", userSchema);

export default User;
