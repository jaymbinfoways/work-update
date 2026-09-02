import OpenAI from "openai";
import { AIProcessedOutput, AIProcessedOutputSchema } from "./schema";
import { AI_SYSTEM_PROMPT } from "./prompts";
import { getTodayDateString } from "../utils";

const KNOWN_MODULES = [
  "Filenote & Indent",
  "Filenote",
  "Indent",
  "Helpdesk",
  "MOM",
  "Masters",
  "Incident",
  "Leadership Dashboard",
  "Site Dashboard",
  "Base Login",
];

export async function processWorkUpdateWithAI(rawText: string): Promise<AIProcessedOutput> {
  const today = getTodayDateString();

  // Determine API Key and Base URL (Supports OpenAI, Groq Free Tier, Google Gemini, Ollama)
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const customBaseUrl = process.env.OPENAI_BASE_URL?.trim();
  const customModel = process.env.AI_MODEL?.trim();

  let apiKey = "";
  let baseURL: string | undefined = customBaseUrl || undefined;
  let model = customModel || "gpt-4o-mini";

  if (groqKey) {
    apiKey = groqKey;
    baseURL = baseURL || "https://api.groq.com/openai/v1";
    model = customModel || "llama-3.3-70b-versatile";
  } else if (openAiKey) {
    apiKey = openAiKey;
    if (apiKey.startsWith("AIzaSy")) {
      // Google Gemini API Key used via OpenAI compatible endpoint
      baseURL = baseURL || "https://generativelanguage.googleapis.com/v1beta/openai/";
      model = customModel || "gemini-1.5-flash";
    }
  }

  // If a valid key is provided for OpenAI, Groq, or Gemini
  if (apiKey) {
    try {
      const client = new OpenAI({
        apiKey,
        baseURL,
      });

      const prompt = AI_SYSTEM_PROMPT.replace("CURRENT_DATE_PLACEHOLDER", today);

      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: `Please process the following raw work update into the required strict JSON format:\n\n${rawText}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (responseContent) {
        const parsed = JSON.parse(responseContent);
        const validated = AIProcessedOutputSchema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        }
      }
    } catch (err) {
      console.warn("AI API request failed or timed out, falling back to smart heuristic parser:", err);
    }
  }

  // Smart Heuristic Fallback Parser (100% Free, Instant, Offline)
  return parseWithHeuristic(rawText, today);
}

function parseWithHeuristic(rawText: string, defaultDate: string): AIProcessedOutput {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let detectedDate = defaultDate;
  let attendance: "PRESENT" | "WFH" | "LEAVE" | "HOLIDAY" | "WEEKEND" | "HALF_DAY" | "UNMARKED" = "UNMARKED";

  // Check for attendance keywords
  const lowerAll = rawText.toLowerCase();
  if (lowerAll.includes("wfh") || lowerAll.includes("work from home")) {
    attendance = "WFH";
  } else if (lowerAll.includes("half day") || lowerAll.includes("half-day")) {
    attendance = "HALF_DAY";
  } else if (lowerAll.includes("on leave") || lowerAll.includes("leave")) {
    attendance = "LEAVE";
  } else if (lowerAll.includes("holiday")) {
    attendance = "HOLIDAY";
  } else if (lowerAll.includes("in office") || lowerAll.includes("present")) {
    attendance = "PRESENT";
  }

  interface TempGroup {
    module: string;
    deployment_status: "DEV" | "UAT" | "PRODUCTION" | "PENDING" | "NOT_APPLICABLE";
    tasks: { description: string }[];
  }

  const groups: TempGroup[] = [];
  let currentGroup: TempGroup | null = null;

  for (const line of lines) {
    // Check if line looks like a date
    const dateMatch = line.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, "0");
      const month = dateMatch[2].padStart(2, "0");
      let year = dateMatch[3];
      if (year.length === 2) {
        year = `20${year}`;
      }
      detectedDate = `${year}-${month}-${day}`;
      continue;
    }

    // Check for Module header, e.g. "Helpdesk (Deployed On dev)" or "Mom (Pending to deploy)"
    const moduleMatch = line.match(/^(.*?)(?:\s*\((.*?)\))?$/);
    const candidateName = moduleMatch ? moduleMatch[1].trim() : line;
    const statusNote = moduleMatch && moduleMatch[2] ? moduleMatch[2].trim().toLowerCase() : "";

    const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || line.startsWith("–");

    if (!isBullet && candidateName.length > 0 && candidateName.length < 60 && !candidateName.toLowerCase().includes("attendance")) {
      let standardizedName = candidateName;
      for (const km of KNOWN_MODULES) {
        if (candidateName.toLowerCase() === km.toLowerCase()) {
          standardizedName = km;
          break;
        }
      }
      if (standardizedName.toLowerCase() === "mom") {
        standardizedName = "MOM";
      }

      let deploymentStatus: "DEV" | "UAT" | "PRODUCTION" | "PENDING" | "NOT_APPLICABLE" = "NOT_APPLICABLE";
      if (statusNote.includes("dev")) {
        deploymentStatus = "DEV";
      } else if (statusNote.includes("uat")) {
        deploymentStatus = "UAT";
      } else if (statusNote.includes("prod")) {
        deploymentStatus = "PRODUCTION";
      } else if (statusNote.includes("pending")) {
        deploymentStatus = "PENDING";
      }

      currentGroup = {
        module: standardizedName,
        deployment_status: deploymentStatus,
        tasks: [],
      };
      groups.push(currentGroup);
      continue;
    }

    const cleanTask = line.replace(/^[•\-*–\d.)\s]+/, "").trim();
    if (cleanTask.length > 0) {
      let polished = cleanTask.charAt(0).toUpperCase() + cleanTask.slice(1);
      if (!polished.endsWith(".") && !polished.endsWith("!") && !polished.endsWith("?")) {
        polished += ".";
      }

      if (!currentGroup) {
        currentGroup = {
          module: "General",
          deployment_status: "NOT_APPLICABLE",
          tasks: [],
        };
        groups.push(currentGroup);
      }

      currentGroup.tasks.push({ description: polished });
    }
  }

  const finalGroups = groups.filter((g) => g.tasks.length > 0);

  const dateFormatted = detectedDate
    .split("-")
    .reverse()
    .map((p, idx) => (idx === 2 ? p.slice(-2) : p))
    .join("-");

  const formattedLines: string[] = [dateFormatted];

  for (const group of finalGroups) {
    let statusLabel = "";
    if (group.deployment_status === "DEV") statusLabel = " (Deployed on Dev)";
    else if (group.deployment_status === "UAT") statusLabel = " (Deployed on UAT)";
    else if (group.deployment_status === "PRODUCTION") statusLabel = " (Deployed on Production)";
    else if (group.deployment_status === "PENDING") statusLabel = " (Pending to Deploy)";

    formattedLines.push("");
    formattedLines.push(`${group.module}${statusLabel}`);
    for (const t of group.tasks) {
      formattedLines.push(`• ${t.description}`);
    }
  }

  return {
    date: detectedDate,
    attendance,
    formatted_output: formattedLines.join("\n"),
    work_items: finalGroups,
  };
}
