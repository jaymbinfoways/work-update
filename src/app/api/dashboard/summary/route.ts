import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import DailyUpdate from "@/models/DailyUpdate";
import WorkItem from "@/models/WorkItem";
import Attendance from "@/models/Attendance";
import { getOrCreateDefaultUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getOrCreateDefaultUser();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || ""; // e.g. "2026-08"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateFilter: any = { userId: user._id };
    if (month) {
      dateFilter.date = { $regex: `^${month}` };
    }

    // 1. Attendance breakdown
    const attendanceRecords = await Attendance.find(dateFilter).lean();
    let presentCount = 0;
    let wfhCount = 0;
    let leaveCount = 0;
    let holidayCount = 0;
    let halfDayCount = 0;

    for (const rec of attendanceRecords) {
      if (rec.status === "PRESENT") presentCount++;
      else if (rec.status === "WFH") wfhCount++;
      else if (rec.status === "LEAVE") leaveCount++;
      else if (rec.status === "HOLIDAY") holidayCount++;
      else if (rec.status === "HALF_DAY") halfDayCount++;
    }

    const workingDays = presentCount + wfhCount + halfDayCount * 0.5;

    // 2. Work updates & tasks breakdown
    const updates = await DailyUpdate.find(dateFilter).lean();
    const updateIds = updates.map((u) => u._id);

    const workItems = await WorkItem.find({ dailyUpdateId: { $in: updateIds } }).lean();
    const totalTasks = workItems.length;

    const uniqueModules = new Set(workItems.map((w) => w.moduleName.trim()));
    const modulesWorked = uniqueModules.size;

    // 3. Activity by Day (for charts)
    const dayMap = new Map<string, { date: string; tasks: number; attendance: string }>();

    for (const rec of attendanceRecords) {
      dayMap.set(rec.date, { date: rec.date, tasks: 0, attendance: rec.status });
    }

    for (const item of workItems) {
      const existing = dayMap.get(item.date) || { date: item.date, tasks: 0, attendance: "UNMARKED" };
      existing.tasks += 1;
      dayMap.set(item.date, existing);
    }

    const activityByDay = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      data: {
        month: month || "All Time",
        attendanceCards: {
          present: presentCount,
          wfh: wfhCount,
          leave: leaveCount,
          holiday: holidayCount,
          halfDay: halfDayCount,
          workingDays,
        },
        workCards: {
          totalUpdates: updates.length,
          totalTasks,
          modulesWorked,
        },
        activityByDay,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error generating dashboard summary:", err);
    return NextResponse.json({ error: "Failed to load dashboard summary", details: err.message }, { status: 500 });
  }
}
