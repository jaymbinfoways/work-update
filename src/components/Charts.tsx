"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface DailyActivityItem {
  date: string;
  tasks: number;
  attendance: string;
}

interface ModuleItem {
  module: string;
  taskCount: number;
  daysWorked: number;
}

interface ChartsProps {
  dailyActivity: DailyActivityItem[];
  moduleStats: ModuleItem[];
  deployments: Record<string, number>;
}

const DEPLOYMENT_COLORS: Record<string, string> = {
  DEV: "#22d3ee", // cyan-400
  UAT: "#c084fc", // purple-400
  PRODUCTION: "#34d399", // emerald-400
  PENDING: "#fbbf24", // amber-400
  NOT_APPLICABLE: "#94a3b8", // slate-400
};

// Custom Tooltip for Area Chart
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3.5 py-2.5 rounded-xl shadow-2xl text-xs space-y-1">
        <div className="text-slate-400 font-medium">Date: {label}</div>
        <div className="text-blue-400 font-mono font-bold text-sm">
          {payload[0].value} {payload[0].value === 1 ? "task" : "tasks"} completed
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Deployment Donut Chart
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const color = data.payload?.color || data.color || "#22d3ee";
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3.5 py-2.5 rounded-xl shadow-2xl text-xs space-y-1 min-w-[120px]">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20" style={{ backgroundColor: color }} />
          <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">{data.name}</span>
        </div>
        <div className="text-white font-mono font-bold text-sm pl-4">
          {data.value} {data.value === 1 ? "task" : "tasks"}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Module Bar Chart
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3.5 py-2.5 rounded-xl shadow-2xl text-xs space-y-1">
        <div className="text-slate-200 font-bold">{label}</div>
        <div className="text-indigo-400 font-mono font-bold text-sm">
          {payload[0].value} {payload[0].value === 1 ? "task" : "tasks"} completed
        </div>
      </div>
    );
  }
  return null;
};

export default function Charts({ dailyActivity, moduleStats, deployments }: ChartsProps) {
  // Prepare deployment pie data
  const deploymentData = Object.entries(deployments)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: status,
      value: count,
      color: DEPLOYMENT_COLORS[status] || "#64748b",
    }));

  const totalDeployments = deploymentData.reduce((acc, curr) => acc + curr.value, 0);

  // Format daily dates for axis (DD/MM)
  const activityData = dailyActivity.map((item) => {
    const parts = item.date.split("-");
    const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;
    return {
      ...item,
      shortDate,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Daily Work Activity Trend */}
      <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Daily Work &amp; Task Trend</h3>
            <p className="text-xs text-slate-400">Total tasks completed across dates</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
            30-Day Activity
          </span>
        </div>

        <div className="h-64 w-full">
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="shortDate"
                  stroke="#475569"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#taskGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No daily activity recorded yet
            </div>
          )}
        </div>
      </div>

      {/* 2. Deployment Status Distribution Donut */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-100">Deployment Distribution</h3>
          <p className="text-xs text-slate-400">Dev, UAT, Production &amp; Pending</p>
        </div>

        <div className="relative h-52 w-full flex items-center justify-center">
          {deploymentData.length > 0 ? (
            <>
              {/* Donut center metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                <span className="text-2xl font-extrabold text-white font-mono">{totalDeployments}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tasks</span>
              </div>

              <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={deploymentData}
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#090d16"
                    strokeWidth={2}
                  >
                    {deploymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="text-slate-500 text-sm">No deployment records</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
          {deploymentData.map((d) => (
            <div key={d.name} className="flex items-center space-x-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-slate-300 font-medium">{d.name}:</span>
              <span className="text-white font-mono font-bold">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Tasks by Module Bar Chart */}
      <div className="lg:col-span-3 glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Tasks by Module</h3>
            <p className="text-xs text-slate-400">Distribution of work items across system modules</p>
          </div>
        </div>

        <div className="h-60 w-full">
          {moduleStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleStats.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="module"
                  stroke="#475569"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="taskCount" fill="#6366f1" radius={[6, 6, 0, 0]}>
                  {moduleStats.map((_, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={
                        index % 4 === 0
                          ? "#3b82f6"
                          : index % 4 === 1
                          ? "#6366f1"
                          : index % 4 === 2
                          ? "#06b6d4"
                          : "#10b981"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No module statistics yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
