"use client";

import { useState } from "react";
import {
  Settings,
  Database,
  Bot,
  Key,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Zap,
  Cpu,
  FileCode,
} from "lucide-react";

export default function SettingsPage() {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);

  const curlCommand = `curl -X POST http://localhost:3000/api/external/daily-update \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: tracker-api-key-default-2026" \\
  -d '{"text": "07-08-26\\nHelpdesk (Deployed On dev)\\n• Implemented dynamic theme configuration and updated code accordingly."}'`;

  const gptCustomInstructions = `You are my personal Work Update Assistant.
Whenever I paste my raw daily engineering notes (or tell you what I worked on today):
1. Clean the grammar and preserve my exact meaning (never invent tasks).
2. Standardize module names (e.g., Helpdesk, MOM, Masters, Indent, Filenote & Indent, Incident, Leadership Dashboard, Site Dashboard, Base Login).
3. Standardize deployment statuses: DEV, UAT, PRODUCTION, PENDING, or NOT_APPLICABLE.
4. Format the update clearly with bullet points.
5. Automatically call the submitDailyWorkUpdate action to save it directly to my Work Tracker!`;

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(gptCustomInstructions);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const copySchemaUrl = () => {
    const url = `${window.location.origin}/api/openapi`;
    navigator.clipboard.writeText(url);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleSeedData = async () => {
    setSeedLoading(true);
    setSeedSuccess(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSeedSuccess(data.message || "Database seeded successfully!");
      } else {
        throw new Error(data.error || "Failed to seed database");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setSeedSuccess(`Error: ${error.message}`);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white">System Settings &amp; AI Integrations</h1>
        <p className="text-xs text-slate-400">
          Configure ChatGPT Custom GPT Actions, free AI providers (Groq / Gemini), and database connections
        </p>
      </div>

      {seedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{seedSuccess}</span>
        </div>
      )}

      {/* 1. ChatGPT Custom GPT Integration (Zero-Cost Daily Workflow) */}
      <div className="glass-panel rounded-2xl p-6 space-y-5 border border-purple-500/30 bg-purple-950/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">ChatGPT Custom GPT &bull; Zero Subscription Daily Workflow</h3>
              <p className="text-xs text-slate-400">
                Paste your daily updates directly into ChatGPT on web/mobile &bull; it auto-polishes and posts here
              </p>
            </div>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
            Section 22 Ready
          </span>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block">
              Step 1: Create a Custom GPT in ChatGPT
            </span>
            <p className="text-slate-300">
              Go to <strong>ChatGPT &rarr; Explore GPTs &rarr; Create</strong>. Name it <em>&quot;Work Update Assistant&quot;</em>.
            </p>
            <p className="text-slate-300">
              Paste these <strong>Instructions</strong> into the GPT:
            </p>
            <div className="relative">
              <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap">
                {gptCustomInstructions}
              </pre>
              <button
                onClick={copyPrompt}
                className="absolute right-2 top-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center space-x-1"
              >
                {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPrompt ? "Copied" : "Copy Prompt"}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block">
              Step 2: Add GPT Action
            </span>
            <p className="text-slate-300">
              Under <strong>Actions &rarr; Create new action</strong>, select <strong>Import from URL</strong> and paste your OpenAPI endpoint:
            </p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 font-mono text-xs">
                {typeof window !== "undefined" ? `${window.location.origin}/api/openapi` : "http://localhost:3000/api/openapi"}
              </code>
              <button
                onClick={copySchemaUrl}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center space-x-1"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? "Copied" : "Copy URL"}</span>
              </button>
            </div>
            <p className="text-slate-400 text-[11px]">
              Authentication: Choose <strong>API Key &rarr; Custom Header &rarr; Header Name: <span className="text-white font-mono">x-api-key</span></strong> and value: <span className="text-white font-mono">tracker-api-key-default-2026</span>.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Free AI Options for In-App "Process with AI" */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Free AI Providers (No Subscription Required)</h3>
              <p className="text-xs text-slate-400">Power the in-app &quot;Process with AI&quot; button completely free</p>
            </div>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
            Multi-Provider Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="font-bold text-cyan-400 block">1. Groq (Free &amp; Fastest)</span>
            <p className="text-slate-400">
              Uses Llama 3.3 70B. Free API key with zero card required at <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">console.groq.com</a>.
            </p>
            <code className="text-[10px] text-slate-300 block font-mono bg-slate-900 p-1.5 rounded">
              GROQ_API_KEY=gsk_...
            </code>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="font-bold text-emerald-400 block">2. Google Gemini (Free)</span>
            <p className="text-slate-400">
              Free Gemini 1.5/2.0 Flash at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">aistudio.google.com</a>.
            </p>
            <code className="text-[10px] text-slate-300 block font-mono bg-slate-900 p-1.5 rounded">
              OPENAI_API_KEY=AIzaSy...
            </code>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="font-bold text-purple-400 block">3. Built-in Offline Parser</span>
            <p className="text-slate-400">
              Requires <strong>no keys at all</strong>. Automatically parses dates, modules, deployments, and tasks locally.
            </p>
            <span className="text-[10px] text-emerald-400 font-semibold">&bull; Active right now</span>
          </div>
        </div>
      </div>

      {/* 3. Database Connection Status */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">MongoDB Atlas Connection</h3>
              <p className="text-xs text-slate-400">Primary source of truth for daily updates, work items &amp; attendance</p>
            </div>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active &bull; Mongoose</span>
          </span>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">Seed sample demo data (10 modules + August 2026 realistic updates)</span>
          <button
            onClick={handleSeedData}
            disabled={seedLoading}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${seedLoading ? "animate-spin" : ""}`} />
            <span>{seedLoading ? "Seeding..." : "Seed Realistic Demo Data"}</span>
          </button>
        </div>
      </div>

      {/* 4. Direct cURL Command */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Direct Terminal / Mobile Shortcut cURL</h3>
              <p className="text-xs text-slate-400">Post updates directly via iOS Shortcuts, Android Automate, or scripts</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto">
            {curlCommand}
          </pre>
          <button
            onClick={copyCurl}
            className="absolute right-3 top-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center space-x-1"
          >
            {copiedCurl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
