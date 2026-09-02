"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  Home,
  UserX,
  Briefcase,
  Layers,
  CheckSquare,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import Charts from "@/components/Charts";
import AddUpdateModal from "@/components/AddUpdateModal";

interface DashboardData {
  month: string;
  attendanceCards: {
    present: number;
    wfh: number;
    leave: number;
    holiday: number;
    halfDay: number;
    workingDays: number;
  };
  workCards: {
    totalUpdates: number;
    totalTasks: number;
    modulesWorked: number;
  };
  activityByDay: {
    date: string;
    tasks: number;
    attendance: string;
  }[];
}

interface ModuleStat {
  module: string;
  taskCount: number;
  daysWorked: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [moduleStats, setModuleStats] = useState<ModuleStat[]>([]);
  const [deployments, setDeployments] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("2026-08"); // Default August 2026

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, modRes, depRes] = await Promise.all([
        fetch(`/api/dashboard/summary?month=${selectedMonth}`),
        fetch(`/api/dashboard/modules?month=${selectedMonth}`),
        fetch(`/api/dashboard/deployments?month=${selectedMonth}`),
      ]);

      const sumJson = await sumRes.json();
      const modJson = await modRes.json();
      const depJson = await depRes.json();

      if (sumJson.success) setData(sumJson.data);
      if (modJson.success) setModuleStats(modJson.data || []);
      if (depJson.success) setDeployments(depJson.data || {});
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const handleSeedDemo = async () => {
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Seed error:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-indigo-950/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold uppercase tracking-wider">
                Work &amp; Attendance Command Center
              </span>
              <span className="text-xs text-slate-400">August 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Daily Work Updates &amp; Attendance
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Clean, standardize, and track your daily engineering updates with OpenAI. View your deployment distribution, attendance calendar, and module trends.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Today&apos;s Update</span>
            </button>

            {(!data || data.workCards.totalUpdates === 0) && (
              <button
                onClick={handleSeedDemo}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span>Load Sample Data</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Month Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">Summary Period:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="glass-input text-xs px-3 py-1.5 rounded-lg text-white font-medium"
          >
            <option value="2026-08">August 2026 (Specification Demo)</option>
            <option value="2026-09">September 2026 (Current Month)</option>
            <option value="">All Time</option>
          </select>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <span>Working Days: <strong className="text-white font-mono">{data?.attendanceCards.workingDays || 0}</strong></span>
          <span>&bull;</span>
          <span>Tasks: <strong className="text-white font-mono">{data?.workCards.totalTasks || 0}</strong></span>
        </div>
      </div>

      {/* 1. Attendance Cards Grid (Section 12) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Attendance Breakdown
          </h2>
          <Link href="/attendance" className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1">
            <span>View Calendar</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            title="Present"
            value={data?.attendanceCards.present ?? "-"}
            subtitle="In office"
            icon={CalendarCheck}
            colorClass="emerald"
          />
          <StatCard
            title="WFH"
            value={data?.attendanceCards.wfh ?? "-"}
            subtitle="Remote"
            icon={Home}
            colorClass="blue"
          />
          <StatCard
            title="Leave / Half Day"
            value={(data ? data.attendanceCards.leave + data.attendanceCards.halfDay : "-")}
            subtitle={`${data?.attendanceCards.leave || 0} full, ${data?.attendanceCards.halfDay || 0} half`}
            icon={UserX}
            colorClass="rose"
          />
          <StatCard
            title="Working Days"
            value={data?.attendanceCards.workingDays ?? "-"}
            subtitle="Present + WFH"
            icon={Briefcase}
            colorClass="purple"
          />
        </div>
      </div>

      {/* 2. Work Metrics Cards Grid (Section 12) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Work Volume &amp; Coverage
          </h2>
          <Link href="/updates" className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1">
            <span>View Updates List</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Updates"
            value={data?.workCards.totalUpdates ?? "-"}
            subtitle="Logged daily entries"
            icon={Briefcase}
            colorClass="cyan"
          />
          <StatCard
            title="Total Tasks"
            value={data?.workCards.totalTasks ?? "-"}
            subtitle="Extracted individual items"
            icon={CheckSquare}
            colorClass="amber"
          />
          <StatCard
            title="Modules Worked"
            value={data?.workCards.modulesWorked ?? "-"}
            subtitle="Unique product domains"
            icon={Layers}
            colorClass="blue"
          />
        </div>
      </div>

      {/* 3. Recharts Visualizations (Section 12) */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Analytics &amp; Distribution
        </h2>
        <Charts
          dailyActivity={data?.activityByDay || []}
          moduleStats={moduleStats}
          deployments={deployments}
        />
      </div>

      {/* Quick Launch Modal */}
      {isAddModalOpen && (
        <AddUpdateModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
