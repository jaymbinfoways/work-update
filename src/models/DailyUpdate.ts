import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDailyUpdate extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  rawInput: string;
  formattedOutput: string;
  attendanceStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyUpdateSchema = new Schema<IDailyUpdate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    rawInput: { type: String, required: true },
    formattedOutput: { type: String, required: true },
    attendanceStatus: {
      type: String,
      enum: ["PRESENT", "WFH", "LEAVE", "HOLIDAY", "WEEKEND", "HALF_DAY", "UNMARKED"],
      default: "UNMARKED",
    },
  },
  {
    timestamps: true,
  }
);

DailyUpdateSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyUpdate: Model<IDailyUpdate> =
  mongoose.models.DailyUpdate || mongoose.model<IDailyUpdate>("DailyUpdate", DailyUpdateSchema);
export default DailyUpdate;
