import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getPersistedMonth(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("worktracker_selected_month");
    if (saved !== null && saved !== undefined) {
      return saved;
    }
  }
  return getCurrentMonthString();
}

export function setPersistedMonth(month: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("worktracker_selected_month", month);
    window.dispatchEvent(new Event("monthFilterChanged"));
  }
}

export function formatMonthLabel(monthStr: string): string {
  if (!monthStr) return "All Time";
  try {
    const [yStr, mStr] = monthStr.split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10) - 1;
    const d = new Date(y, m, 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return monthStr;
  }
}

export function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const current = getCurrentMonthString();
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const added = new Set<string>();

  // Include 1 month ahead, current month, and past 12 months
  for (let i = 1; i >= -12; i--) {
    const d = new Date(curYear, curMonth + i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!added.has(val)) {
      added.add(val);
      const isCur = val === current;
      const monthName = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      options.push({
        value: val,
        label: isCur ? `${monthName} (Current Month)` : monthName,
      });
    }
  }

  // Ensure August 2026 is present if someone loaded demo data
  if (!added.has("2026-08")) {
    options.push({ value: "2026-08", label: "August 2026" });
  }

  return options;
}
