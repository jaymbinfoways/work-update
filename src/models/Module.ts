import mongoose, { Schema, Document, Model } from "mongoose";

export interface IModule extends Document {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema<IModule>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const Module: Model<IModule> =
  mongoose.models.Module || mongoose.model<IModule>("Module", ModuleSchema);
export default Module;
