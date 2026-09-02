"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  RefreshCw,
  Tag,
  CheckCircle,
} from "lucide-react";
import AddUpdateModal from "@/components/AddUpdateModal";
import { formatDate } from "@/lib/utils";

interface WorkItemDoc {
  _id: string;
  moduleName: string;
  deploymentStatus: "DEV" | "UAT" | "PRODUCTION" | "PENDING" | "NOT_APPLICABLE";
  description: string;
  sortOrder: number;
}

interface DailyUpdateDoc {
  _id: string;
  date: string;
  rawInput: string;
  formattedOutput: string;
  attendanceStatus: string;
  workItems: WorkItemDoc[];
  createdAt: string;
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<DailyUpdateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedDeployment, setSelectedDeployment] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedRaws, setExpandedRaws] = useState<Record<string, boolean>>({});

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (selectedModule) params.append("module", selectedModule);
      if (selectedDeployment) params.append("deploymentStatus", selectedDeployment);
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const res = await fetch(`/api/updates?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setUpdates(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch updates:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await fetch("/api/modules");
      const json = await res.json();
      if (json.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setModules(json.data.map((m: any) => m.name));
      }
    } catch (err) {
      console.error("Failed to fetch modules:", err);
    }
  };

  useEffect(() => {
    fetchUpdates();
    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModule, selectedDeployment, fromDate, toDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUpdates();
  };

  const toggleRaw = (id: string) => {
    setExpandedRaws((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this daily update?")) return;
    try {
      const res = await fetch(`/api/updates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUpdates((prev) => prev.filter((u) => u._id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Daily Updates Log</h1>
          <p className="text-xs text-slate-400">
            Search, filter, and audit processed daily work updates and preserved raw inputs
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Today&apos;s Update</span>
        </button>
      </div>

      {/* Filter Bar (Section 10 & 18) */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keyword, module, task description..."
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          {/* Module Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Module</label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full glass-input rounded-lg p-2 text-xs text-slate-200"
            >
              <option value="">All Modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Deployment Status Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Deployment Status</label>
            <select
              value={selectedDeployment}
              onChange={(e) => setSelectedDeployment(e.target.value)}
              className="w-full glass-input rounded-lg p-2 text-xs text-slate-200"
            >
              <option value="">All Deployments</option>
              <option value="DEV">DEV</option>
              <option value="UAT">UAT</option>
              <option value="PRODUCTION">PRODUCTION</option>
              <option value="PENDING">PENDING</option>
              <option value="NOT_APPLICABLE">NOT_APPLICABLE</option>
            </select>
          </div>

          {/* Date Range: From */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full glass-input rounded-lg p-2 text-xs text-slate-200"
            />
          </div>

          {/* Date Range: To */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full glass-input rounded-lg p-2 text-xs text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Updates Cards Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
            <span>Loading daily updates...</span>
          </div>
        ) : updates.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm space-y-3">
            <Layers className="w-8 h-8 mx-auto text-slate-600" />
            <p>No daily updates match the selected filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedModule("");
                setSelectedDeployment("");
                setFromDate("");
                setToDate("");
                fetchUpdates();
              }}
              className="text-xs text-blue-400 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          updates.map((update) => {
            const isRawExpanded = expandedRaws[update._id];

            let attendanceBadgeClass = "attendance-unmarked";
            if (update.attendanceStatus === "PRESENT") attendanceBadgeClass = "attendance-present";
            else if (update.attendanceStatus === "WFH") attendanceBadgeClass = "attendance-wfh";
            else if (update.attendanceStatus === "LEAVE") attendanceBadgeClass = "attendance-leave";
            else if (update.attendanceStatus === "HOLIDAY") attendanceBadgeClass = "attendance-holiday";
            else if (update.attendanceStatus === "HALF_DAY") attendanceBadgeClass = "attendance-half_day";

            return (
              <div
                key={update._id}
                className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-800/80 transition hover:border-slate-700/80"
              >
                {/* Header: Date + Attendance Badge + Actions */}
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1.5 text-sm font-bold text-white">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span>{formatDate(update.date)}</span>
                    </div>

                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${attendanceBadgeClass}`}>
                      {update.attendanceStatus}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleRaw(update._id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-1"
                    >
                      <span>Raw Input</span>
                      {isRawExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleDelete(update._id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete this update"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expandable Raw Input view (Core Principle) */}
                {isRawExpanded && (
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Original Raw User Input (Preserved):
                    </span>
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                      {update.rawInput}
                    </pre>
                  </div>
                )}

                {/* Formatted Output Display */}
                <div className="space-y-2">
                  <pre className="text-xs sm:text-sm text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                    {update.formattedOutput}
                  </pre>
                </div>

                {/* Work items module tags */}
                {update.workItems && update.workItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60 flex items-center flex-wrap gap-2">
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Tag className="w-3 h-3" />
                      <span>Modules:</span>
                    </span>
                    {Array.from(new Set(update.workItems.map((w) => w.moduleName))).map((modName) => {
                      const sampleItem = update.workItems.find((w) => w.moduleName === modName);
                      const st = sampleItem?.deploymentStatus;
                      let badge = "badge-na";
                      if (st === "DEV") badge = "badge-dev";
                      else if (st === "UAT") badge = "badge-uat";
                      else if (st === "PRODUCTION") badge = "badge-prod";
                      else if (st === "PENDING") badge = "badge-pending";

                      return (
                        <span key={modName} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${badge}`}>
                          {modName} {st && st !== "NOT_APPLICABLE" ? `(${st})` : ""}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isAddModalOpen && (
        <AddUpdateModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchUpdates();
          }}
        />
      )}
    </div>
  );
}
