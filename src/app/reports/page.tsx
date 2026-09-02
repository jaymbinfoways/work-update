"use client";

import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  CheckCircle,
  Briefcase,
  Layers,
  Sparkles,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";

import {
  getPersistedMonth,
  setPersistedMonth,
  getMonthOptions,
  formatMonthLabel,
} from "@/lib/utils";

interface ReportData {
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
}

interface ModuleItem {
  module: string;
  taskCount: number;
  daysWorked: number;
}

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [monthOptions, setMonthOptions] = useState<{ value: string; label: string }[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [deployments, setDeployments] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedMonth(getPersistedMonth());
    setMonthOptions(getMonthOptions());

    const handleSync = () => {
      setSelectedMonth(getPersistedMonth());
    };
    window.addEventListener("monthFilterChanged", handleSync);
    return () => window.removeEventListener("monthFilterChanged", handleSync);
  }, []);

  const fetchReport = async () => {
    if (selectedMonth === undefined) return;
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

      if (sumJson.success) setReport(sumJson.data);
      if (modJson.success) setModules(modJson.data || []);
      if (depJson.success) setDeployments(depJson.data || {});
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const handleExportExcel = () => {
    if (!report) return;

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["Executive Monthly Report", selectedMonth],
      [],
      ["ATTENDANCE SUMMARY", "COUNT"],
      ["Present (In Office)", report.attendanceCards.present],
      ["WFH (Remote)", report.attendanceCards.wfh],
      ["Leave Days", report.attendanceCards.leave],
      ["Holidays", report.attendanceCards.holiday],
      ["Half Days", report.attendanceCards.halfDay],
      ["Total Working Days", report.attendanceCards.workingDays],
      [],
      ["WORK METRICS", "COUNT"],
      ["Daily Updates Logged", report.workCards.totalUpdates],
      ["Individual Tasks Completed", report.workCards.totalTasks],
      ["Unique Modules Covered", report.workCards.modulesWorked],
      [],
      ["DEPLOYMENT BREAKDOWN", "TASKS"],
      ["Development (DEV)", deployments.DEV || 0],
      ["UAT Testing (UAT)", deployments.UAT || 0],
      ["Production (PRODUCTION)", deployments.PRODUCTION || 0],
      ["Pending Deployment", deployments.PENDING || 0],
      [],
      ["MODULE-WISE BREAKDOWN", "TASKS COMPLETED", "DAYS ACTIVE"],
      ...modules.map((m) => [m.module, m.taskCount, m.daysWorked]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Summary");

    // Write file
    XLSX.writeFile(wb, `Work_Report_${selectedMonth}.xlsx`);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:p-0">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Monthly Reports &amp; Exports</h1>
          <p className="text-xs text-slate-400">
            Generate formal monthly audits, export to Excel (.xlsx), or print executive PDF reports
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <select
            value={selectedMonth}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedMonth(val);
              setPersistedMonth(val);
            }}
            className="glass-input text-xs px-3 py-2 rounded-xl text-white font-medium"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            <option value="">All Time</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 space-y-8 border border-slate-800 bg-slate-900/90 print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b border-slate-800 print:border-slate-300 pb-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-blue-400 print:text-blue-600 font-bold">
              MONTHLY ENGINEERING BRIEF
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white print:text-black mt-1">
              Monthly Report &bull; {formatMonthLabel(selectedMonth)}
            </h2>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
              Daily Work &amp; Attendance Performance Summary
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-slate-500 print:text-slate-600">Generated on</span>
            <p className="text-xs font-bold text-slate-300 print:text-black">
              {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Section 20 Format: Attendance & Work metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendance Box */}
          <div className="p-5 rounded-2xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-slate-700 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 print:text-emerald-600" />
              <span>Attendance</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 print:border-slate-200 pb-1.5">
                <span className="text-slate-400 print:text-slate-600">Present (In Office):</span>
                <span className="font-bold text-emerald-400 print:text-emerald-700 font-mono">{report?.attendanceCards.present || 0}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 print:border-slate-200 pb-1.5">
                <span className="text-slate-400 print:text-slate-600">WFH (Remote):</span>
                <span className="font-bold text-blue-400 print:text-blue-700 font-mono">{report?.attendanceCards.wfh || 0}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 print:border-slate-200 pb-1.5">
                <span className="text-slate-400 print:text-slate-600">Leave Days:</span>
                <span className="font-bold text-rose-400 print:text-rose-700 font-mono">{report?.attendanceCards.leave || 0}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 print:border-slate-200 pb-1.5">
                <span className="text-slate-400 print:text-slate-600">Holidays:</span>
                <span className="font-bold text-amber-400 print:text-amber-700 font-mono">{report?.attendanceCards.holiday || 0}</span>
              </div>
              <div className="col-span-2 flex justify-between pt-1">
                <span className="font-semibold text-slate-300 print:text-slate-800">Total Working Days:</span>
                <span className="font-extrabold text-white print:text-black font-mono">{report?.attendanceCards.workingDays || 0} days</span>
              </div>
            </div>
          </div>

          {/* Work Summary Box */}
          <div className="p-5 rounded-2xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-slate-700 flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-cyan-400 print:text-cyan-600" />
              <span>Work Deliverables</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 print:border-slate-200 pb-1.5">
                <span className="text-slate-400 print:text-slate-600">Daily Updates Logged:</span>
                <span className="font-bold text-white print:text-black font-mono">{report?.workCards.totalUpdates || 0}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 print:border-slate-200 pb-1.5">
                <span className="text-slate-400 print:text-slate-600">Total Tasks:</span>
                <span className="font-bold text-cyan-400 print:text-cyan-700 font-mono">{report?.workCards.totalTasks || 0}</span>
              </div>
              <div className="col-span-2 flex justify-between pt-1">
                <span className="font-semibold text-slate-300 print:text-slate-800">Modules Covered:</span>
                <span className="font-extrabold text-white print:text-black font-mono">{report?.workCards.modulesWorked || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deployments Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-950/60 print:bg-slate-50 border border-slate-800 print:border-slate-200 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-slate-700">
            Deployment Breakdown
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
              <span className="text-slate-400 block mb-0.5">DEV</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">{deployments.DEV || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
              <span className="text-slate-400 block mb-0.5">UAT</span>
              <span className="text-lg font-bold text-purple-400 font-mono">{deployments.UAT || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-slate-400 block mb-0.5">PRODUCTION</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{deployments.PRODUCTION || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-slate-400 block mb-0.5">PENDING</span>
              <span className="text-lg font-bold text-amber-400 font-mono">{deployments.PENDING || 0}</span>
            </div>
          </div>
        </div>

        {/* Top Modules Ranking Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-slate-700 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400 print:text-indigo-600" />
            <span>Top Modules Performance</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 print:border-slate-300 text-slate-400 print:text-slate-600">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Module Name</th>
                  <th className="py-2.5 px-3 text-right">Tasks Completed</th>
                  <th className="py-2.5 px-3 text-right">Days Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                {modules.map((m, idx) => (
                  <tr key={m.module} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200 print:text-black">{m.module}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white print:text-black">{m.taskCount}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 print:text-slate-600">{m.daysWorked} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
