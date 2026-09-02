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

export default function Charts({ dailyActivity, moduleStats, deployments }: ChartsProps) {
  // Prepare deployment pie data
  const deploymentData = Object.entries(deployments)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: status,
      value: count,
      color: DEPLOYMENT_COLORS[status] || "#64748b",
    }));

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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`${value} tasks`, "Volume"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
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

      {/* 2. Deployment Status Distribution */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-100">Deployment Distribution</h3>
          <p className="text-xs text-slate-400">Dev, UAT, Production &amp; Pending</p>
        </div>

        <div className="h-52 w-full flex items-center justify-center">
          {deploymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                  formatter={(val: number) => [`${val} tasks`, "Deployments"]}
                />
                <Pie
                  data={deploymentData}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deploymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-500 text-sm">No deployment records</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
          {deploymentData.map((d) => (
            <div key={d.name} className="flex items-center space-x-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-slate-300 font-medium">{d.name}:</span>
              <span className="text-slate-400 font-mono">{d.value}</span>
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                  formatter={(val: number) => [`${val} tasks`, "Total"]}
                />
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
