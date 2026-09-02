import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Module from "@/models/Module";
import DailyUpdate from "@/models/DailyUpdate";
import WorkItem from "@/models/WorkItem";
import Attendance from "@/models/Attendance";
import { getOrCreateDefaultUser } from "@/lib/auth";

const INITIAL_MODULES = [
  "Filenote",
  "Indent",
  "Filenote & Indent",
  "Helpdesk",
  "MOM",
  "Masters",
  "Incident",
  "Leadership Dashboard",
  "Site Dashboard",
  "Base Login",
];

export async function POST() {
  try {
    await connectToDatabase();
    const user = await getOrCreateDefaultUser();

    // 1. Seed Modules
    for (const name of INITIAL_MODULES) {
      await Module.findOneAndUpdate(
        { name },
        { name, isActive: true },
        { upsert: true }
      );
    }

    // 2. Clear old demo data for clean state
    await DailyUpdate.deleteMany({ userId: user._id });
    await WorkItem.deleteMany({});
    await Attendance.deleteMany({ userId: user._id });

    // 3. Seed Realistic Work Updates & Attendance for August 2026 & recent days
    const demoUpdates = [
      {
        date: "2026-08-03",
        attendance: "PRESENT",
        raw: `03-08-26
Helpdesk (Deployed On dev)
• Setup ticket categorization taxonomy and priority levels.
Base Login (Deployed On uat)
• Implemented MFA authentication via TOTP and backup codes.`,
        formatted: `03-08-26

Helpdesk (Deployed on Dev)
• Configured ticket categorization taxonomy and priority levels.

Base Login (Deployed on UAT)
• Implemented MFA authentication via TOTP and backup codes.`,
        items: [
          { module: "Helpdesk", status: "DEV", tasks: ["Configured ticket categorization taxonomy and priority levels."] },
          { module: "Base Login", status: "UAT", tasks: ["Implemented MFA authentication via TOTP and backup codes."] },
        ],
      },
      {
        date: "2026-08-04",
        attendance: "WFH",
        raw: `04-08-26
Incident (Deployed on dev)
• Root cause analysis logging and severity matrices.
Masters (Pending to deploy)
• User role matrix permissions configuration.`,
        formatted: `04-08-26

Incident (Deployed on Dev)
• Implemented root cause analysis logging and severity matrices.

Masters (Pending to Deploy)
• Configured user role matrix permissions.`,
        items: [
          { module: "Incident", status: "DEV", tasks: ["Implemented root cause analysis logging and severity matrices."] },
          { module: "Masters", status: "PENDING", tasks: ["Configured user role matrix permissions."] },
        ],
      },
      {
        date: "2026-08-05",
        attendance: "PRESENT",
        raw: `05-08-26
Leadership Dashboard (Deployed on dev)
• KPI aggregation widgets and trend delta indicators.
Filenote (Deployed on uat)
• PDF attachment preview and digital signing flow.`,
        formatted: `05-08-26

Leadership Dashboard (Deployed on Dev)
• Built KPI aggregation widgets and trend delta indicators.

Filenote (Deployed on UAT)
• Added PDF attachment preview and digital signing flow.`,
        items: [
          { module: "Leadership Dashboard", status: "DEV", tasks: ["Built KPI aggregation widgets and trend delta indicators."] },
          { module: "Filenote", status: "UAT", tasks: ["Added PDF attachment preview and digital signing flow."] },
        ],
      },
      {
        date: "2026-08-06",
        attendance: "PRESENT",
        raw: `06-08-26
Site Dashboard (Deployed on prod)
• Real-time worker headcount sync and geo-fence alerts.
MOM (Pending to deploy)
• Agenda item checklist and action-item assignees.`,
        formatted: `06-08-26

Site Dashboard (Deployed on Production)
• Deployed real-time worker headcount sync and geo-fence alerts.

MOM (Pending to Deploy)
• Created agenda item checklist and action-item assignees.`,
        items: [
          { module: "Site Dashboard", status: "PRODUCTION", tasks: ["Deployed real-time worker headcount sync and geo-fence alerts."] },
          { module: "MOM", status: "PENDING", tasks: ["Created agenda item checklist and action-item assignees."] },
        ],
      },
      {
        // Exact Example from Spec Section 14
        date: "2026-08-07",
        attendance: "PRESENT",
        raw: `07-08-26
Filenote & Indent (Deployed On dev)
• Validation for same file upload when error comes from backend.
Helpdesk (Deployed On dev)
• Implemented dynamic theme configuration and updated code accordingly.
Mom (Pending to deploy)
• Added Email search for users in create meeting.
Masters (Pending to deploy)
• Added search for edit sites modal for all stackholder type.`,
        formatted: `07-08-26

Filenote & Indent (Deployed on Dev)
• Added validation to prevent uploading the same file when a backend validation error occurs.

Helpdesk (Deployed on Dev)
• Implemented dynamic theme configuration and updated the code accordingly.

MOM (Pending to Deploy)
• Added email-based user search in the Create Meeting flow.

Masters (Pending to Deploy)
• Added search functionality in the Edit Sites modal for all stakeholder types.`,
        items: [
          {
            module: "Filenote & Indent",
            status: "DEV",
            tasks: ["Added validation to prevent uploading the same file when a backend validation error occurs."],
          },
          {
            module: "Helpdesk",
            status: "DEV",
            tasks: ["Implemented dynamic theme configuration and updated the code accordingly."],
          },
          {
            module: "MOM",
            status: "PENDING",
            tasks: ["Added email-based user search in the Create Meeting flow."],
          },
          {
            module: "Masters",
            status: "PENDING",
            tasks: ["Added search functionality in the Edit Sites modal for all stakeholder types."],
          },
        ],
      },
      {
        date: "2026-08-10",
        attendance: "PRESENT",
        raw: `10-08-26
Helpdesk (Deployed on dev)
• Real-time agent status heartbeat and web-socket escalation.
Indent (Deployed on dev)
• Multi-currency purchase requisition approval tiers.`,
        formatted: `10-08-26

Helpdesk (Deployed on Dev)
• Created real-time agent status heartbeat and web-socket escalation.

Indent (Deployed on Dev)
• Added multi-currency purchase requisition approval tiers.`,
        items: [
          { module: "Helpdesk", status: "DEV", tasks: ["Created real-time agent status heartbeat and web-socket escalation."] },
          { module: "Indent", status: "DEV", tasks: ["Added multi-currency purchase requisition approval tiers."] },
        ],
      },
      {
        date: "2026-08-11",
        attendance: "WFH",
        raw: `11-08-26
Leadership Dashboard (Deployed on uat)
• Export weekly executive summary report to PDF.
Incident (Deployed on dev)
• SMS dispatch webhook for P1 incident escalation.`,
        formatted: `11-08-26

Leadership Dashboard (Deployed on UAT)
• Added export weekly executive summary report to PDF.

Incident (Deployed on Dev)
• Implemented SMS dispatch webhook for P1 incident escalation.`,
        items: [
          { module: "Leadership Dashboard", status: "UAT", tasks: ["Added export weekly executive summary report to PDF."] },
          { module: "Incident", status: "DEV", tasks: ["Implemented SMS dispatch webhook for P1 incident escalation."] },
        ],
      },
      {
        date: "2026-08-12",
        attendance: "LEAVE",
        raw: `12-08-26 - Sick leave`,
        formatted: `12-08-26\nOn Medical Leave`,
        items: [],
      },
      {
        date: "2026-08-13",
        attendance: "PRESENT",
        raw: `13-08-26
Helpdesk (Deployed on prod)
• Deployed SLA timer rules and customer satisfaction survey trigger.
MOM (Deployed on dev)
• Transcription speech-to-text integration prototype.`,
        formatted: `13-08-26

Helpdesk (Deployed on Production)
• Deployed SLA timer rules and customer satisfaction survey trigger.

MOM (Deployed on Dev)
• Integrated transcription speech-to-text prototype.`,
        items: [
          { module: "Helpdesk", status: "PRODUCTION", tasks: ["Deployed SLA timer rules and customer satisfaction survey trigger."] },
          { module: "MOM", status: "DEV", tasks: ["Integrated transcription speech-to-text prototype."] },
        ],
      },
      {
        date: "2026-08-14",
        attendance: "HALF_DAY",
        raw: `14-08-26
Masters (Deployed on uat)
• Completed vendor master audit log and change validation.`,
        formatted: `14-08-26

Masters (Deployed on UAT)
• Completed vendor master audit log and change validation.`,
        items: [
          { module: "Masters", status: "UAT", tasks: ["Completed vendor master audit log and change validation."] },
        ],
      },
      {
        date: "2026-08-15",
        attendance: "HOLIDAY",
        raw: `Independence Day Holiday`,
        formatted: `15-08-26\nIndependence Day Public Holiday`,
        items: [],
      },
    ];

    for (const update of demoUpdates) {
      const dailyUpdate = await DailyUpdate.create({
        userId: user._id,
        date: update.date,
        rawInput: update.raw,
        formattedOutput: update.formatted,
        attendanceStatus: update.attendance,
      });

      await Attendance.create({
        userId: user._id,
        date: update.date,
        status: update.attendance,
        remarks: update.items.length === 0 ? update.formatted : "",
      });

      let sortOrder = 0;
      for (const group of update.items) {
        const moduleDoc = await Module.findOne({ name: group.module });
        for (const taskText of group.tasks) {
          await WorkItem.create({
            dailyUpdateId: dailyUpdate._id,
            moduleId: moduleDoc ? moduleDoc._id : undefined,
            moduleName: group.module,
            deploymentStatus: group.status,
            description: taskText,
            sortOrder: sortOrder++,
            date: update.date,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${INITIAL_MODULES.length} modules and ${demoUpdates.length} realistic work updates with attendance!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Seed error:", err);
    return NextResponse.json({ error: "Failed to seed database", details: err.message }, { status: 500 });
  }
}
