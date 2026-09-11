import mongoose from "mongoose";
import dns from "dns";
import * as fs from "fs";
import * as path from "path";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
  // Ignore
}

// Load .env.local if present
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || "";
        val = val.trim().replace(/(^['"]|['"]$)/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // Ignore
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/daily_work_tracker";

async function main() {
  console.log("Connecting to MongoDB...", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  console.log("Seeding initial modules...");
  const modules = [
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

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("No database connection");
  }

  for (const m of modules) {
    await db.collection("modules").updateOne(
      { name: m },
      { $set: { name: m, isActive: true, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  }

  console.log("Modules seeded successfully!");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
