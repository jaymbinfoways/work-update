import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import WorkItem from "@/models/WorkItem";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchStage: any = {};
    if (month) {
      matchStage.date = { $regex: `^${month}` };
    }

    const moduleStats = await WorkItem.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$moduleName",
          taskCount: { $sum: 1 },
          deployments: {
            $push: "$deploymentStatus",
          },
          dates: {
            $addToSet: "$date",
          },
        },
      },
      { $sort: { taskCount: -1 } },
    ]);

    const formatted = moduleStats.map((m) => {
      const dev = m.deployments.filter((d: string) => d === "DEV").length;
      const uat = m.deployments.filter((d: string) => d === "UAT").length;
      const prod = m.deployments.filter((d: string) => d === "PRODUCTION").length;
      const pending = m.deployments.filter((d: string) => d === "PENDING").length;

      return {
        module: m._id,
        taskCount: m.taskCount,
        daysWorked: m.dates.length,
        breakdown: { dev, uat, prod, pending },
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Failed to fetch module statistics", details: err.message }, { status: 500 });
  }
}
