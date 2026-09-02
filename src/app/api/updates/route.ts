import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import DailyUpdate from "@/models/DailyUpdate";
import WorkItem, { DeploymentStatus } from "@/models/WorkItem";
import Attendance, { AttendanceStatus } from "@/models/Attendance";
import Module from "@/models/Module";
import AuditLog from "@/models/AuditLog";
import { getOrCreateDefaultUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getOrCreateDefaultUser();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const moduleName = searchParams.get("module");
    const deploymentStatus = searchParams.get("deploymentStatus");
    const search = searchParams.get("search")?.trim();

    // Build update filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { userId: user._id };

    if (from && to) {
      filter.date = { $gte: from, $lte: to };
    } else if (from) {
      filter.date = { $gte: from };
    } else if (to) {
      filter.date = { $lte: to };
    }

    // If filtering by module, deployment status, or search query across work items
    let matchedUpdateIds: string[] | null = null;

    if (moduleName || deploymentStatus || search) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemFilter: any = {};
      if (moduleName) {
        itemFilter.moduleName = { $regex: new RegExp(`^${moduleName}$`, "i") };
      }
      if (deploymentStatus) {
        itemFilter.deploymentStatus = deploymentStatus;
      }
      if (search) {
        itemFilter.$or = [
          { description: { $regex: search, $options: "i" } },
          { moduleName: { $regex: search, $options: "i" } },
        ];
      }

      const matchingItems = await WorkItem.find(itemFilter).select("dailyUpdateId");
      const matchedFromItems = matchingItems.map((i) => i.dailyUpdateId.toString());

      // If there's also a raw search on formattedOutput or rawInput
      if (search) {
        const matchingUpdates = await DailyUpdate.find({
          userId: user._id,
          $or: [
            { formattedOutput: { $regex: search, $options: "i" } },
            { rawInput: { $regex: search, $options: "i" } },
          ],
        }).select("_id");
        const matchedFromUpdates = matchingUpdates.map((u) => u._id.toString());
        matchedUpdateIds = Array.from(new Set([...matchedFromItems, ...matchedFromUpdates]));
      } else {
        matchedUpdateIds = matchedFromItems;
      }

      filter._id = { $in: matchedUpdateIds };
    }

    const total = await DailyUpdate.countDocuments(filter);
    const updates = await DailyUpdate.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Fetch work items for each update
    const updateIds = updates.map((u) => u._id);
    const workItems = await WorkItem.find({ dailyUpdateId: { $in: updateIds } })
      .sort({ sortOrder: 1 })
      .lean();

    const itemsByUpdateId = new Map<string, typeof workItems>();
    for (const item of workItems) {
      const idStr = item.dailyUpdateId.toString();
      if (!itemsByUpdateId.has(idStr)) {
        itemsByUpdateId.set(idStr, []);
      }
      itemsByUpdateId.get(idStr)!.push(item);
    }

    const updatesWithItems = updates.map((u) => ({
      ...u,
      workItems: itemsByUpdateId.get(u._id.toString()) || [],
    }));

    return NextResponse.json({
      success: true,
      data: updatesWithItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error fetching updates:", err);
    return NextResponse.json({ error: "Failed to fetch updates", details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getOrCreateDefaultUser();
    const body = await req.json();

    const {
      date,
      rawInput,
      formattedOutput,
      attendanceStatus = "UNMARKED",
      markPresent = false,
      workItems = [],
    } = body;

    if (!date || !rawInput || !formattedOutput) {
      return NextResponse.json(
        { error: "Date, rawInput, and formattedOutput are required." },
        { status: 400 }
      );
    }

    const finalAttendanceStatus: AttendanceStatus = markPresent ? "PRESENT" : attendanceStatus;

    // Check if update for this user + date already exists
    let dailyUpdate = await DailyUpdate.findOne({ userId: user._id, date });
    const isNew = !dailyUpdate;

    if (dailyUpdate) {
      // Update existing
      dailyUpdate.rawInput = rawInput;
      dailyUpdate.formattedOutput = formattedOutput;
      dailyUpdate.attendanceStatus = finalAttendanceStatus;
      await dailyUpdate.save();

      // Remove existing work items to recreate
      await WorkItem.deleteMany({ dailyUpdateId: dailyUpdate._id });
    } else {
      dailyUpdate = await DailyUpdate.create({
        userId: user._id,
        date,
        rawInput,
        formattedOutput,
        attendanceStatus: finalAttendanceStatus,
      });
    }

    // Save Work Items
    let sortOrder = 0;
    const workItemDocs = [];

    // Ensure modules exist in Module collection
    for (const group of workItems) {
      const moduleName = group.module?.trim() || "General";
      let moduleDoc = await Module.findOne({ name: { $regex: new RegExp(`^${moduleName}$`, "i") } });
      if (!moduleDoc) {
        moduleDoc = await Module.create({ name: moduleName, isActive: true });
      }

      const tasks = group.tasks || [];
      const deploymentStatus: DeploymentStatus = group.deployment_status || "NOT_APPLICABLE";

      for (const t of tasks) {
        workItemDocs.push({
          dailyUpdateId: dailyUpdate._id,
          moduleId: moduleDoc._id,
          moduleName: moduleDoc.name,
          deploymentStatus,
          description: typeof t === "string" ? t : t.description,
          sortOrder: sortOrder++,
          date,
        });
      }
    }

    if (workItemDocs.length > 0) {
      await WorkItem.insertMany(workItemDocs);
    }

    // Upsert Attendance record
    if (finalAttendanceStatus !== "UNMARKED") {
      await Attendance.findOneAndUpdate(
        { userId: user._id, date },
        { status: finalAttendanceStatus },
        { upsert: true, new: true }
      );
    }

    // Audit Log
    await AuditLog.create({
      userId: user._id,
      entity: "DailyUpdate",
      entityId: dailyUpdate._id.toString(),
      action: isNew ? "CREATE" : "UPDATE",
      newValue: { date, tasksCount: workItemDocs.length, attendanceStatus: finalAttendanceStatus },
    });

    return NextResponse.json({
      success: true,
      data: dailyUpdate,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error creating/updating daily update:", err);
    return NextResponse.json(
      { error: "Failed to save daily update", details: err.message },
      { status: 500 }
    );
  }
}
