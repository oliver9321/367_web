// models/case.model.ts
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export enum CaseStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  OVERDUE = "overdue",
}

export interface ICase extends mongoose.Document {
  id: string;
  case_number: string;
  title: string;
  description: string;
  license_plate: string;
  location: string;
  coordinates?: string;
  images?: { url: string; description?: string }[];
  status: CaseStatus;
  submitted_at: Date;
  submitted_by?: string; // ✅ Agregar referencia al usuario
  reviewed_at?: Date;
  reviewed_by?: string;
  review_comments?: string;
  due_date: Date;
}

const caseSchema = new mongoose.Schema<ICase>({
  id: { type: String, default: uuidv4 },
  case_number: String,
  title: String,
  description: String,
  license_plate: String,
  location: String,
  coordinates: String,
  images: [{ url: String, description: String }],
  status: { type: String, enum: Object.values(CaseStatus), default: CaseStatus.PENDING },
  submitted_at: { type: Date, default: Date.now },
  submitted_by: String, // ✅ Agregar campo
  reviewed_at: Date,
  reviewed_by: String,
  review_comments: String,
  due_date: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
});

export const Case = mongoose.model<ICase>("Case", caseSchema);