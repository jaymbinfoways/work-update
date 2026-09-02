import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const serverUrl = `${protocol}://${host}`;

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Daily Work & Attendance Tracker API",
      description: "API for ChatGPT Custom GPT to submit, polish, and store daily engineering updates.",
      version: "1.0.0",
    },
    servers: [
      {
        url: serverUrl,
        description: "Active server endpoint",
      },
    ],
    paths: {
      "/api/external/daily-update": {
        post: {
          operationId: "submitDailyWorkUpdate",
          summary: "Submit and save daily work update",
          description: "Submits a raw or polished daily work update. Extracts modules and deployment statuses, marks attendance, and stores the update in MongoDB.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DailyUpdateRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Update successfully processed and saved",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/DailyUpdateResponse",
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized - Invalid API key",
            },
          },
          security: [
            {
              ApiKeyAuth: [],
            },
          ],
        },
      },
    },
    components: {
      schemas: {
        DailyUpdateRequest: {
          type: "object",
          required: ["text"],
          properties: {
            text: {
              type: "string",
              description: "The raw or polished daily work update text with module names, deployment notes, and tasks.",
            },
            autoSave: {
              type: "boolean",
              default: true,
              description: "Whether to automatically save the processed update directly to MongoDB.",
            },
          },
        },
        DailyUpdateResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
            },
            data: {
              type: "object",
              properties: {
                date: {
                  type: "string",
                },
                attendance: {
                  type: "string",
                },
                formatted_output: {
                  type: "string",
                },
              },
            },
          },
        },
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
    },
  };

  return NextResponse.json(spec);
}
