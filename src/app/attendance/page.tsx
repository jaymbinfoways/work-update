"use client";

import { useEffect, useState } from "react";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import { CalendarCheck, Home, UserX, Briefcase } from "lucide-react";
import StatCard from "@/components/StatCard";

import { getPersistedMonth, formatMonthLabel } from "@/lib/utils";

interface AttendanceRecord {
  _id?: string;
  date: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  status: any;
  remarks?: string;
  hasWorkUpdate?: boolean;
  dailyUpdate?: {
    formattedOutput: string;
    attendanceStatus: string;
  } | null;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState("");

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance");
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load attendance records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveMonth(getPersistedMonth());
    fetchAttendance();

    const handleSync = () => {
      setActiveMonth(getPersistedMonth());
    };
    window.addEventListener("monthFilterChanged", handleSync);
    return () => window.removeEventListener("monthFilterChanged", handleSync);
  }, []);

  const monthRecords = activeMonth ? records.filter((r) => r.date.startsWith(activeMonth)) : records;
  const presentCount = monthRecords.filter((r) => r.status === "PRESENT").length;
  const wfhCount = monthRecords.filter((r) => r.status === "WFH").length;
  const leaveCount = monthRecords.filter((r) => r.status === "LEAVE").length;
  const workingDays = presentCount + wfhCount;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Attendance Calendar</h1>
        <p className="text-xs text-slate-400">
          Showing stats for <strong className="text-slate-200">{formatMonthLabel(activeMonth)}</strong> &bull; Track in-office, remote (WFH), and leave days
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Present"
          value={presentCount}
          subtitle="In office days"
          icon={CalendarCheck}
          colorClass="emerald"
        />
        <StatCard
          title="WFH"
          value={wfhCount}
          subtitle="Remote days"
          icon={Home}
          colorClass="blue"
        />
        <StatCard
          title="Leave Days"
          value={leaveCount}
          subtitle="Absences logged"
          icon={UserX}
          colorClass="rose"
        />
        <StatCard
          title="Working Days"
          value={workingDays}
          subtitle="Total attended"
          icon={Briefcase}
          colorClass="purple"
        />
      </div>

      {/* Monthly Interactive Calendar */}
      <AttendanceCalendar
        initialRecords={records}
        onAttendanceChanged={fetchAttendance}
      />
    </div>
  );
}
