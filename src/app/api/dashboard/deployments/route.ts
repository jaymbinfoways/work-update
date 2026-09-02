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

    const counts = await WorkItem.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$deploymentStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const result: Record<string, number> = {
      DEV: 0,
      UAT: 0,
      PRODUCTION: 0,
      PENDING: 0,
      NOT_APPLICABLE: 0,
    };

    for (const c of counts) {
      if (c._id in result) {
        result[c._id] = c.count;
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Failed to fetch deployment stats", details: err.message }, { status: 500 });
  }
}
