"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Home,
  UserX,
  Sparkles,
  Calendar as CalendarIcon,
  X,
  FileText,
  Save,
} from "lucide-react";
import { AttendanceStatus } from "@/models/Attendance";

interface AttendanceRecord {
  _id?: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  hasWorkUpdate?: boolean;
  dailyUpdate?: {
    formattedOutput: string;
    attendanceStatus: string;
  } | null;
}

interface AttendanceCalendarProps {
  initialRecords: AttendanceRecord[];
  onAttendanceChanged: () => void;
}

export default function AttendanceCalendar({
  initialRecords,
  onAttendanceChanged,
}: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 7, 1)); // Default August 2026
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>("PRESENT");
  const [selectedRemarks, setSelectedRemarks] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Index records by date
  const recordsMap = new Map<string, AttendanceRecord>();
  for (const r of initialRecords) {
    recordsMap.set(r.date, r);
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (dayNumber: number) => {
    const dayStr = String(dayNumber).padStart(2, "0");
    const monthStr = String(month + 1).padStart(2, "0");
    const fullDate = `${year}-${monthStr}-${dayStr}`;

    setSelectedDay(fullDate);
    const existing = recordsMap.get(fullDate);
    if (existing) {
      setSelectedStatus(existing.status);
      setSelectedRemarks(existing.remarks || "");
    } else {
      setSelectedStatus("UNMARKED");
      setSelectedRemarks("");
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedDay) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDay,
          status: selectedStatus,
          remarks: selectedRemarks,
        }),
      });
      if (res.ok) {
        onAttendanceChanged();
        setSelectedDay(null);
      }
    } catch (err) {
      console.error("Failed to save attendance:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Calendar cells
  const blanks = Array.from({ length: firstDayOfWeek });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectedRecord = selectedDay ? recordsMap.get(selectedDay) : null;

  return (
    <div className="space-y-6">
      {/* Month Header */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-400">Click any day to view work details or mark status</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-400">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="h-20 sm:h-24 rounded-xl bg-slate-950/20 border border-slate-900/50" />
          ))}

          {days.map((day) => {
            const dayStr = String(day).padStart(2, "0");
            const monthStr = String(month + 1).padStart(2, "0");
            const dateStr = `${year}-${monthStr}-${dayStr}`;
            const record = recordsMap.get(dateStr);

            let statusClass = "border-slate-800/80 bg-slate-900/40 hover:border-slate-700";
            let statusPill = null;

            if (record) {
              if (record.status === "PRESENT") {
                statusClass = "border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/50";
                statusPill = <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Present</span>;
              } else if (record.status === "WFH") {
                statusClass = "border-blue-500/30 bg-blue-950/20 hover:border-blue-500/50";
                statusPill = <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">WFH</span>;
              } else if (record.status === "LEAVE") {
                statusClass = "border-rose-500/30 bg-rose-950/20 hover:border-rose-500/50";
                statusPill = <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">Leave</span>;
              } else if (record.status === "HOLIDAY") {
                statusClass = "border-amber-500/30 bg-amber-950/20 hover:border-amber-500/50";
                statusPill = <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">Holiday</span>;
              } else if (record.status === "HALF_DAY") {
                statusClass = "border-purple-500/30 bg-purple-950/20 hover:border-purple-500/50";
                statusPill = <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">Half Day</span>;
              }
            }

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`h-20 sm:h-24 p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${statusClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{day}</span>
                  {record?.hasWorkUpdate && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" title="Has daily work update" />
                  )}
                </div>

                <div className="flex flex-col gap-1 items-start">
                  {statusPill}
                  {record?.hasWorkUpdate && (
                    <span className="text-[9px] text-cyan-400 flex items-center space-x-0.5">
                      <FileText className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">Update</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Detail / Attendance Marking Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Date Details &bull; {selectedDay}</h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Daily Work Update (if exists for this date) */}
              {selectedRecord?.dailyUpdate ? (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-cyan-400 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Associated Daily Work Update:</span>
                  </span>
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {selectedRecord.dailyUpdate.formattedOutput}
                  </pre>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/30 border border-slate-800 text-xs text-slate-400">
                  No work update saved yet for this date.
                </div>
              )}

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Attendance Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["PRESENT", "WFH", "LEAVE", "HOLIDAY", "HALF_DAY", "UNMARKED"] as AttendanceStatus[]).map(
                    (st) => {
                      const isSelected = selectedStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSelectedStatus(st)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                              : "bg-slate-950/50 text-slate-400 border-slate-800 hover:text-slate-200"
                          }`}
                        >
                          {st}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Remarks / Notes (optional)
                </label>
                <input
                  type="text"
                  value={selectedRemarks}
                  onChange={(e) => setSelectedRemarks(e.target.value)}
                  placeholder="e.g., Client meeting, Doctor appointment"
                  className="w-full glass-input rounded-xl p-2.5 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAttendance}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving..." : "Save Attendance"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
