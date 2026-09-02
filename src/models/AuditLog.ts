import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  entity: string;
  entityId?: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "AI_PROCESS" | "EXPORT";
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: String },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE", "AI_PROCESS", "EXPORT"],
      required: true,
    },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
export default AuditLog;
