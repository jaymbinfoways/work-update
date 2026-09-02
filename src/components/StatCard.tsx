import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorClass: "blue" | "emerald" | "amber" | "rose" | "purple" | "cyan";
}

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    iconBg: "bg-blue-600/20 text-blue-400 border-blue-500/30",
    value: "text-blue-400",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
    value: "text-emerald-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    iconBg: "bg-amber-600/20 text-amber-400 border-amber-500/30",
    value: "text-amber-400",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    iconBg: "bg-rose-600/20 text-rose-400 border-rose-500/30",
    value: "text-rose-400",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    iconBg: "bg-purple-600/20 text-purple-400 border-purple-500/30",
    value: "text-purple-400",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    iconBg: "bg-cyan-600/20 text-cyan-400 border-cyan-500/30",
    value: "text-cyan-400",
  },
};

export default function StatCard({ title, value, subtitle, icon: Icon, colorClass }: StatCardProps) {
  const styles = COLOR_MAP[colorClass] || COLOR_MAP.blue;

  return (
    <div className={`glass-panel glass-panel-hover rounded-2xl p-5 border ${styles.border} flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${styles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{value}</span>
        {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
      </div>
    </div>
  );
}
