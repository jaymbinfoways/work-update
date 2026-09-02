import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import DailyUpdate from "@/models/DailyUpdate";
import WorkItem from "@/models/WorkItem";
import AuditLog from "@/models/AuditLog";
import { getOrCreateDefaultUser } from "@/lib/auth";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const update = await DailyUpdate.findById(id).lean();
    if (!update) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    const workItems = await WorkItem.find({ dailyUpdateId: update._id }).sort({ sortOrder: 1 }).lean();

    return NextResponse.json({
      success: true,
      data: {
        ...update,
        workItems,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Failed to fetch update", details: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;
    const body = await req.json();

    const update = await DailyUpdate.findById(id);
    if (!update) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    const { rawInput, formattedOutput, attendanceStatus } = body;
    if (rawInput !== undefined) update.rawInput = rawInput;
    if (formattedOutput !== undefined) update.formattedOutput = formattedOutput;
    if (attendanceStatus !== undefined) update.attendanceStatus = attendanceStatus;

    await update.save();

    await AuditLog.create({
      userId: user._id,
      entity: "DailyUpdate",
      entityId: update._id.toString(),
      action: "UPDATE",
      newValue: { rawInput, formattedOutput, attendanceStatus },
    });

    return NextResponse.json({
      success: true,
      data: update,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Failed to update record", details: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const user = await getOrCreateDefaultUser();
    const { id } = await context.params;

    const update = await DailyUpdate.findById(id);
    if (!update) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    await DailyUpdate.findByIdAndDelete(id);
    await WorkItem.deleteMany({ dailyUpdateId: id });

    await AuditLog.create({
      userId: user._id,
      entity: "DailyUpdate",
      entityId: id,
      action: "DELETE",
    });

    return NextResponse.json({
      success: true,
      message: "Update deleted successfully",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Failed to delete update", details: err.message }, { status: 500 });
  }
}
