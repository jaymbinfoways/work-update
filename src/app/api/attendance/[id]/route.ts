import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import DailyUpdate from "@/models/DailyUpdate";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const body = await req.json();
    const { status, remarks } = body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    if (status) attendance.status = status;
    if (remarks !== undefined) attendance.remarks = remarks;
    await attendance.save();

    // Sync with DailyUpdate
    if (status) {
      await DailyUpdate.findOneAndUpdate(
        { userId: attendance.userId, date: attendance.date },
        { attendanceStatus: status }
      );
    }

    return NextResponse.json({ success: true, data: attendance });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Failed to update attendance", details: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const attendance = await Attendance.findByIdAndDelete(id);
    if (!attendance) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Attendance deleted" });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Failed to delete attendance", details: err.message }, { status: 500 });
  }
}
