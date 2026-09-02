import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import DailyUpdate from "@/models/DailyUpdate";
import { getOrCreateDefaultUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getOrCreateDefaultUser();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2026-08"
    const date = searchParams.get("date"); // e.g. "2026-08-07"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { userId: user._id };

    if (date) {
      filter.date = date;
    } else if (month) {
      filter.date = { $regex: `^${month}` };
    }

    const attendanceRecords = await Attendance.find(filter).sort({ date: 1 }).lean();

    // Also get days that have daily updates for that month
    const updates = await DailyUpdate.find(filter).select("date formattedOutput attendanceStatus").lean();
    const updateMap = new Map(updates.map((u) => [u.date, u]));

    // Merge information
    const enriched = attendanceRecords.map((rec) => ({
      ...rec,
      hasWorkUpdate: updateMap.has(rec.date),
      dailyUpdate: updateMap.get(rec.date) || null,
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Failed to fetch attendance", details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getOrCreateDefaultUser();
    const body = await req.json();

    const { date, status, remarks = "" } = body;

    if (!date || !status) {
      return NextResponse.json({ error: "Date and status are required." }, { status: 400 });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { userId: user._id, date },
      { status, remarks },
      { upsert: true, new: true }
    );

    // Also sync with DailyUpdate if one exists for that date
    await DailyUpdate.findOneAndUpdate(
      { userId: user._id, date },
      { attendanceStatus: status }
    );

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Failed to update attendance", details: err.message }, { status: 500 });
  }
}
