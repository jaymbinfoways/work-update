import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Module from "@/models/Module";
import WorkItem from "@/models/WorkItem";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const moduleQuery = searchParams.get("name");

    // If querying specific module history (Section 19)
    if (moduleQuery) {
      const items = await WorkItem.find({
        moduleName: { $regex: new RegExp(`^${moduleQuery}$`, "i") },
      })
        .sort({ date: -1, sortOrder: 1 })
        .lean();

      // Group tasks by date
      const byDateMap = new Map<string, typeof items>();
      for (const item of items) {
        if (!byDateMap.has(item.date)) {
          byDateMap.set(item.date, []);
        }
        byDateMap.get(item.date)!.push(item);
      }

      const history = Array.from(byDateMap.entries()).map(([date, tasks]) => ({
        date,
        tasks,
      }));

      return NextResponse.json({
        success: true,
        data: {
          module: moduleQuery,
          totalTasks: items.length,
          daysActive: byDateMap.size,
          history,
        },
      });
    }

    // Default: Return list of all modules with total tasks count
    const modules = await Module.find().sort({ name: 1 }).lean();

    const taskCounts = await WorkItem.aggregate([
      {
        $group: {
          _id: "$moduleName",
          count: { $sum: 1 },
          lastActive: { $max: "$date" },
        },
      },
    ]);

    const countMap = new Map(taskCounts.map((t) => [t._id.toLowerCase(), { count: t.count, lastActive: t.lastActive }]));

    const enriched = modules.map((m) => {
      const stat = countMap.get(m.name.toLowerCase()) || { count: 0, lastActive: null };
      return {
        ...m,
        taskCount: stat.count,
        lastActive: stat.lastActive,
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Failed to fetch modules", details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Module name is required." }, { status: 400 });
    }

    const trimmed = name.trim();
    const existing = await Module.findOne({ name: { $regex: new RegExp(`^${trimmed}$`, "i") } });
    if (existing) {
      return NextResponse.json({ error: "Module already exists." }, { status: 400 });
    }

    const moduleDoc = await Module.create({ name: trimmed, isActive: true });
    return NextResponse.json({ success: true, data: moduleDoc });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Failed to create module", details: err.message }, { status: 500 });
  }
}
