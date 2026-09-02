import { z } from "zod";

export const DeploymentStatusEnum = z.enum([
  "DEV",
  "UAT",
  "PRODUCTION",
  "PENDING",
  "NOT_APPLICABLE",
]);

export const AttendanceStatusEnum = z.enum([
  "PRESENT",
  "WFH",
  "LEAVE",
  "HOLIDAY",
  "WEEKEND",
  "HALF_DAY",
  "UNMARKED",
]);

export const TaskItemSchema = z.object({
  description: z.string().describe("A clean, grammatically polished, concise description of the task completed."),
});

export const ModuleWorkGroupSchema = z.object({
  module: z.string().describe("The standardized or identified module name (e.g. Helpdesk, MOM, Masters, Indent, Filenote & Indent)."),
  deployment_status: DeploymentStatusEnum.describe("Deployment status: DEV, UAT, PRODUCTION, PENDING, or NOT_APPLICABLE if not mentioned."),
  tasks: z.array(TaskItemSchema).min(1).describe("List of distinct tasks completed for this module."),
});

export const AIProcessedOutputSchema = z.object({
  date: z.string().describe("The date mentioned in the update normalized to YYYY-MM-DD. If none mentioned, today's date."),
  attendance: AttendanceStatusEnum.describe("Attendance status only if explicitly indicated; otherwise UNMARKED."),
  formatted_output: z.string().describe("A clean, human-readable paragraph/bulleted representation matching professional standards."),
  work_items: z.array(ModuleWorkGroupSchema).describe("Structured work items grouped by module and deployment status."),
});

export type AIProcessedOutput = z.infer<typeof AIProcessedOutputSchema>;
export type ModuleWorkGroup = z.infer<typeof ModuleWorkGroupSchema>;
export type TaskItem = z.infer<typeof TaskItemSchema>;
