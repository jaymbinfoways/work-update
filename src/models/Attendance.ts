import mongoose, { Schema, Document, Model } from "mongoose";

export type AttendanceStatus =
  | "PRESENT"
  | "WFH"
  | "LEAVE"
  | "HOLIDAY"
  | "WEEKEND"
  | "HALF_DAY"
  | "UNMARKED";

export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    status: {
      type: String,
      enum: ["PRESENT", "WFH", "LEAVE", "HOLIDAY", "WEEKEND", "HALF_DAY", "UNMARKED"],
      default: "UNMARKED",
      required: true,
    },
    remarks: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema);
export default Attendance;
