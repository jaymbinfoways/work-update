import { NextRequest, NextResponse } from "next/server";
import { processWorkUpdateWithAI } from "@/lib/ai/processor";
import connectToDatabase from "@/lib/mongodb";
import DailyUpdate from "@/models/DailyUpdate";
import WorkItem, { DeploymentStatus } from "@/models/WorkItem";
import Attendance from "@/models/Attendance";
import Module from "@/models/Module";
import AuditLog from "@/models/AuditLog";
import { getOrCreateDefaultUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
    const configuredKey = process.env.EXTERNAL_API_KEY || "tracker-api-key-default-2026";

    if (!apiKey || apiKey !== configuredKey) {
      return NextResponse.json({ error: "Unauthorized: Invalid or missing API key." }, { status: 401 });
    }

    const body = await req.json();
    const { text, autoSave = true } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Field 'text' is required." }, { status: 400 });
    }

    const processed = await processWorkUpdateWithAI(text);

    if (autoSave) {
      await connectToDatabase();
      const user = await getOrCreateDefaultUser();

      // Upsert DailyUpdate
      let dailyUpdate = await DailyUpdate.findOne({ userId: user._id, date: processed.date });
      if (dailyUpdate) {
        dailyUpdate.rawInput = text;
        dailyUpdate.formattedOutput = processed.formatted_output;
        dailyUpdate.attendanceStatus = processed.attendance;
        await dailyUpdate.save();
        await WorkItem.deleteMany({ dailyUpdateId: dailyUpdate._id });
      } else {
        dailyUpdate = await DailyUpdate.create({
          userId: user._id,
          date: processed.date,
          rawInput: text,
          formattedOutput: processed.formatted_output,
          attendanceStatus: processed.attendance,
        });
      }

      // Save work items
      let sortOrder = 0;
      const workItemDocs = [];
      for (const group of processed.work_items) {
        const moduleName = group.module?.trim() || "General";
        let moduleDoc = await Module.findOne({ name: { $regex: new RegExp(`^${moduleName}$`, "i") } });
        if (!moduleDoc) {
          moduleDoc = await Module.create({ name: moduleName, isActive: true });
        }

        const deploymentStatus: DeploymentStatus = group.deployment_status || "NOT_APPLICABLE";
        for (const t of group.tasks) {
          workItemDocs.push({
            dailyUpdateId: dailyUpdate._id,
            moduleId: moduleDoc._id,
            moduleName: moduleDoc.name,
            deploymentStatus,
            description: t.description,
            sortOrder: sortOrder++,
            date: processed.date,
          });
        }
      }

      if (workItemDocs.length > 0) {
        await WorkItem.insertMany(workItemDocs);
      }

      if (processed.attendance !== "UNMARKED") {
        await Attendance.findOneAndUpdate(
          { userId: user._id, date: processed.date },
          { status: processed.attendance },
          { upsert: true, new: true }
        );
      }

      await AuditLog.create({
        userId: user._id,
        entity: "DailyUpdate",
        entityId: dailyUpdate._id.toString(),
        action: "CREATE",
        newValue: { source: "EXTERNAL_API", date: processed.date },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        date: processed.date,
        attendance: processed.attendance,
        formatted_output: processed.formatted_output,
        work_items: processed.work_items,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("External API error:", err);
    return NextResponse.json({ error: "External API execution failed", details: err.message }, { status: 500 });
  }
}
