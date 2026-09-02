"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Calendar,
  Plus,
  ArrowRight,
  Sparkles,
  Tag,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ModuleSummary {
  _id: string;
  name: string;
  isActive: boolean;
  taskCount: number;
  lastActive: string | null;
}

interface ModuleHistoryResponse {
  module: string;
  totalTasks: number;
  daysActive: number;
  history: {
    date: string;
    tasks: {
      _id: string;
      description: string;
      deploymentStatus: string;
    }[];
  }[];
}

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModuleHistory, setSelectedModuleHistory] = useState<ModuleHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/modules");
      const json = await res.json();
      if (json.success) {
        setModules(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load modules:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModule = async (name: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/modules?name=${encodeURIComponent(name)}`);
      const json = await res.json();
      if (json.success) {
        setSelectedModuleHistory(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch module history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;

    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newModuleName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setNewModuleName("");
        setIsAddOpen(false);
        fetchModules();
      }
    } catch (err) {
      console.error("Failed to create module:", err);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Modules &amp; Project History</h1>
          <p className="text-xs text-slate-400">
            Click any module to inspect its full historical engineering work items grouped by date
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Module</span>
        </button>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <div
            key={mod._id}
            onClick={() => handleSelectModule(mod.name)}
            className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800/80 cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-105 transition">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">
                    {mod.name}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {mod.lastActive ? `Active ${formatDate(mod.lastActive)}` : "No recent tasks"}
                  </span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">Total Work Items</span>
              <span className="font-bold text-white font-mono bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                {mod.taskCount} tasks
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Module History Timeline Drawer/Modal (Section 19) */}
      {selectedModuleHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedModuleHistory.module} &bull; History
                  </h2>
                  <p className="text-xs text-slate-400">
                    {selectedModuleHistory.totalTasks} tasks logged across {selectedModuleHistory.daysActive} working days
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedModuleHistory(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {selectedModuleHistory.history.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No work items logged yet for this module.
                </div>
              ) : (
                selectedModuleHistory.history.map((dayGroup) => (
                  <div
                    key={dayGroup.date}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-bold text-blue-400 flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(dayGroup.date)}</span>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {dayGroup.tasks.length} item{dayGroup.tasks.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {dayGroup.tasks.map((task) => {
                        let badge = "badge-na";
                        if (task.deploymentStatus === "DEV") badge = "badge-dev";
                        else if (task.deploymentStatus === "UAT") badge = "badge-uat";
                        else if (task.deploymentStatus === "PRODUCTION") badge = "badge-prod";
                        else if (task.deploymentStatus === "PENDING") badge = "badge-pending";

                        return (
                          <div key={task._id} className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                            <span className="text-slate-200">&bull; {task.description}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${badge}`}>
                              {task.deploymentStatus}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setSelectedModuleHistory(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreateModule}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create New Module</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Module Name</label>
              <input
                type="text"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                placeholder="e.g. Analytics Engine"
                className="w-full glass-input rounded-xl p-2.5 text-xs text-white"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20"
              >
                Add Module
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
