import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export enum UserRole {
  ADMIN = "admin",
  REVIEWER = "reviewer",
}

export interface IUser extends mongoose.Document {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  badge_id?: string;
  rating: number;
  created_at: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  id: { type: String, default: uuidv4 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.REVIEWER },
  badge_id: String,
  rating: { type: Number, default: 4.0 },
  created_at: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>("User", userSchema);
