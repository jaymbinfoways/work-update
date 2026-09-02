"use client";

import { useState } from "react";
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  Calendar,
  Check,
  AlertCircle,
  Pencil,
  FileCode,
} from "lucide-react";
import { AIProcessedOutput, ModuleWorkGroup } from "@/lib/ai/schema";

interface AddUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_SPEC_INPUT = `07-08-26
Filenote & Indent (Deployed On dev)
• Validation for same file upload when error comes from backend.
Helpdesk (Deployed On dev)
• Implemented dynamic theme configuration and updated code accordingly.
Mom (Pending to deploy)
• Added Email search for users in create meeting.
Masters (Pending to deploy)
• Added search for edit sites modal for all stackholder type.`;

export default function AddUpdateModal({ isOpen, onClose, onSuccess }: AddUpdateModalProps) {
  const [rawText, setRawText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processedResult, setProcessedResult] = useState<AIProcessedOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [markPresent, setMarkPresent] = useState(true);

  if (!isOpen) return null;

  const handleProcessAI = async () => {
    if (!rawText.trim()) {
      setErrorMessage("Please paste or write your work update text first.");
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/updates/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process update with AI");
      }

      setProcessedResult(data.data);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveUpdate = async () => {
    if (!processedResult) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: processedResult.date,
          rawInput: rawText,
          formattedOutput: processedResult.formatted_output,
          attendanceStatus: processedResult.attendance,
          markPresent: markPresent,
          workItems: processedResult.work_items,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save update");
      }

      onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to save update");
    } finally {
      setIsSaving(false);
    }
  };

  const updateTaskDescription = (groupIndex: number, taskIndex: number, newDesc: string) => {
    if (!processedResult) return;
    const newItems = [...processedResult.work_items];
    newItems[groupIndex].tasks[taskIndex].description = newDesc;
    setProcessedResult({ ...processedResult, work_items: newItems });
  };

  const updateGroupDeployment = (groupIndex: number, status: ModuleWorkGroup["deployment_status"]) => {
    if (!processedResult) return;
    const newItems = [...processedResult.work_items];
    newItems[groupIndex].deployment_status = status;
    setProcessedResult({ ...processedResult, work_items: newItems });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add Daily Work Update</h2>
              <p className="text-xs text-slate-400">
                Paste natural language text &bull; AI structures &amp; standardizes &bull; Review &amp; Save
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMessage && (
            <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Raw Input Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <span>1. Paste your raw work update</span>
                <span className="text-xs text-slate-400 font-normal">
                  (e.g., module names, deployment notes, bullet points)
                </span>
              </label>
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_SPEC_INPUT)}
                className="text-xs flex items-center space-x-1.5 text-blue-400 hover:text-blue-300 bg-blue-950/50 border border-blue-800/60 px-2.5 py-1 rounded-md transition"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Load Sample Spec Update</span>
              </button>
            </div>

            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Example:\n07-08-26\nFilenote & Indent (Deployed On dev)\n• Validation for same file upload...\nHelpdesk (Deployed On dev)\n• Implemented dynamic theme configuration...`}
              className="w-full glass-input rounded-xl p-3.5 text-sm font-mono text-slate-200 placeholder:text-slate-500 resize-y"
            />

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleProcessAI}
                disabled={isProcessing || !rawText.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Process with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Structured AI Preview (Section 13) */}
          {processedResult && (
            <div className="border-t border-slate-800 pt-6 space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">2. AI Structured Preview</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Validated &amp; Cleaned
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Target Date:</span>
                  <input
                    type="date"
                    value={processedResult.date}
                    onChange={(e) =>
                      setProcessedResult({ ...processedResult, date: e.target.value })
                    }
                    className="glass-input px-2 py-1 rounded text-xs text-white"
                  />
                </div>
              </div>

              {/* Extracted Work Items list with interactive editing */}
              <div className="space-y-3.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Extracted Modules &amp; Tasks
                </span>

                {processedResult.work_items.map((group, gIdx) => (
                  <div
                    key={gIdx}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-100">{group.module}</span>
                        <span className="text-xs text-slate-400 font-mono">
                          ({group.tasks.length} task{group.tasks.length > 1 ? "s" : ""})
                        </span>
                      </div>

                      {/* Deployment Status Pill selector */}
                      <div className="flex items-center space-x-1.5">
                        {(["DEV", "UAT", "PRODUCTION", "PENDING", "NOT_APPLICABLE"] as const).map(
                          (st) => {
                            const isSelected = group.deployment_status === st;
                            let badgeClass = "badge-na";
                            if (st === "DEV") badgeClass = "badge-dev";
                            else if (st === "UAT") badgeClass = "badge-uat";
                            else if (st === "PRODUCTION") badgeClass = "badge-prod";
                            else if (st === "PENDING") badgeClass = "badge-pending";

                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => updateGroupDeployment(gIdx, st)}
                                className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition cursor-pointer ${
                                  isSelected
                                    ? `${badgeClass} ring-2 ring-blue-400/40 font-bold scale-105`
                                    : "opacity-40 hover:opacity-80 bg-slate-800 text-slate-400"
                                }`}
                              >
                                {st}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Task bullet points */}
                    <div className="space-y-2 pl-2">
                      {group.tasks.map((task, tIdx) => (
                        <div key={tIdx} className="flex items-start space-x-2 group">
                          <span className="text-blue-400 text-sm mt-1">&bull;</span>
                          <input
                            type="text"
                            value={task.description}
                            onChange={(e) => updateTaskDescription(gIdx, tIdx, e.target.value)}
                            className="flex-1 bg-transparent hover:bg-slate-800/40 focus:bg-slate-900 border border-transparent focus:border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none transition"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Formatted Output Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                    <span>Formatted Display Text</span>
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={processedResult.formatted_output}
                  onChange={(e) =>
                    setProcessedResult({ ...processedResult, formatted_output: e.target.value })
                  }
                  className="w-full glass-input rounded-xl p-3 text-xs font-mono text-slate-300 resize-y"
                />
              </div>

              {/* Attendance Toggle (Section 16: "Provide a convenient 'Mark today as Present' option") */}
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    onClick={() => setMarkPresent(!markPresent)}
                    className={`w-5 h-5 rounded flex items-center justify-center border transition cursor-pointer ${
                      markPresent
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "border-slate-600 bg-slate-800 text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <label
                      onClick={() => setMarkPresent(!markPresent)}
                      className="text-sm font-semibold text-slate-100 cursor-pointer"
                    >
                      Mark attendance as PRESENT for {processedResult.date}
                    </label>
                    <p className="text-xs text-slate-400">
                      Syncs attendance calendar automatically with this daily work record.
                    </p>
                  </div>
                </div>

                <div className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  Status: {markPresent ? "PRESENT" : processedResult.attendance}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveUpdate}
            disabled={!processedResult || isSaving}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to MongoDB...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Update</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
