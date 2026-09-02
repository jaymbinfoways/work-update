import { NextRequest, NextResponse } from "next/server";
import { processWorkUpdateWithAI } from "@/lib/ai/processor";
import connectToDatabase from "@/lib/mongodb";
import AuditLog from "@/models/AuditLog";
import { getOrCreateDefaultUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "Work update text is required." }, { status: 400 });
    }

    const processed = await processWorkUpdateWithAI(text);

    // Optional audit log
    try {
      await connectToDatabase();
      const user = await getOrCreateDefaultUser();
      await AuditLog.create({
        userId: user._id,
        entity: "DailyUpdate",
        action: "AI_PROCESS",
        newValue: { rawSnippet: text.slice(0, 100), detectedDate: processed.date },
      });
    } catch {
      // Non-blocking if audit fails
    }

    return NextResponse.json({
      success: true,
      data: processed,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error processing update with AI:", err);
    return NextResponse.json(
      { error: "Failed to process update with AI", details: err.message },
      { status: 500 }
    );
  }
}
