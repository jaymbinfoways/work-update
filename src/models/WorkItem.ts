import mongoose, { Schema, Document, Model } from "mongoose";

export type DeploymentStatus = "DEV" | "UAT" | "PRODUCTION" | "PENDING" | "NOT_APPLICABLE";

export interface IWorkItem extends Document {
  dailyUpdateId: mongoose.Types.ObjectId;
  moduleId?: mongoose.Types.ObjectId;
  moduleName: string;
  deploymentStatus: DeploymentStatus;
  description: string;
  originalDescription?: string;
  sortOrder: number;
  date: string; // YYYY-MM-DD for fast module-wise time-series queries
  createdAt: Date;
  updatedAt: Date;
}

const WorkItemSchema = new Schema<IWorkItem>(
  {
    dailyUpdateId: { type: Schema.Types.ObjectId, ref: "DailyUpdate", required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", index: true },
    moduleName: { type: String, required: true, index: true, trim: true },
    deploymentStatus: {
      type: String,
      enum: ["DEV", "UAT", "PRODUCTION", "PENDING", "NOT_APPLICABLE"],
      default: "NOT_APPLICABLE",
      index: true,
    },
    description: { type: String, required: true },
    originalDescription: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
  },
  {
    timestamps: true,
  }
);

export const WorkItem: Model<IWorkItem> =
  mongoose.models.WorkItem || mongoose.model<IWorkItem>("WorkItem", WorkItemSchema);
export default WorkItem;
