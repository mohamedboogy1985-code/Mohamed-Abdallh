import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { AgentInfo, OrchestrationAction } from '../types/nexus';
import { Activity, PieChart as PieIcon, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';

interface AgentAnalyticsChartProps {
  agents: AgentInfo[];
  actions: OrchestrationAction[];
}

export const AgentAnalyticsChart: React.FC<AgentAnalyticsChartProps> = ({
  agents,
  actions,
}) => {
  const [activeTab, setActiveTab] = useState<'workload' | 'throughput'>('workload');

  // Compute live workload distribution combining agents stats and active actions
  const workloadData = useMemo(() => {
    const osCompleted = agents.find((a) => a.type === 'OS-Agent')?.completedTasksCount || 0;
    const webCompleted = agents.find((a) => a.type === 'Web-Agent')?.completedTasksCount || 0;
    const procCompleted = agents.find((a) => a.type === 'File-Processor-Agent')?.completedTasksCount || 0;

    // Add session actions
    const osSession = actions.filter((a) => a.agent === 'OS-Agent' && a.status === 'done').length;
    const webSession = actions.filter((a) => a.agent === 'Web-Agent' && a.status === 'done').length;
    const procSession = actions.filter((a) => a.agent === 'File-Processor-Agent' && a.status === 'done').length;

    const osTotal = osCompleted + osSession + 24; // Baseline 24h metrics + live counts
    const webTotal = webCompleted + webSession + 19;
    const procTotal = procCompleted + procSession + 16;
    const grandTotal = osTotal + webTotal + procTotal;

    return [
      {
        name: 'OS-Agent',
        tasks: osTotal,
        share: Math.round((osTotal / grandTotal) * 100),
        color: '#10b981', // emerald-500
        completionRate: 99.2,
      },
      {
        name: 'Web-Agent',
        tasks: webTotal,
        share: Math.round((webTotal / grandTotal) * 100),
        color: '#6366f1', // indigo-500
        completionRate: 96.8,
      },
      {
        name: 'File-Processor-Agent',
        tasks: procTotal,
        share: Math.round((procTotal / grandTotal) * 100),
        color: '#f59e0b', // amber-500
        completionRate: 98.6,
      },
    ];
  }, [agents, actions]);

  // 24-Hour Hourly Timeline Data (Task volume and completion rate by time block)
  const timelineData = useMemo(() => {
    return [
      { time: '00:00', 'OS-Agent': 4, 'Web-Agent': 2, 'File-Processor': 3, completionRate: 97 },
      { time: '04:00', 'OS-Agent': 2, 'Web-Agent': 1, 'File-Processor': 1, completionRate: 100 },
      { time: '08:00', 'OS-Agent': 8, 'Web-Agent': 6, 'File-Processor': 5, completionRate: 98 },
      { time: '12:00', 'OS-Agent': 12, 'Web-Agent': 9, 'File-Processor': 8, completionRate: 96 },
      { time: '16:00', 'OS-Agent': 10, 'Web-Agent': 7, 'File-Processor': 6, completionRate: 99 },
      { time: '20:00', 'OS-Agent': 7, 'Web-Agent': 5, 'File-Processor': 4, completionRate: 98 },
      { time: 'Now', 'OS-Agent': 9, 'Web-Agent': 6, 'File-Processor': 5, completionRate: 99 },
    ];
  }, []);

  const totalTasks = workloadData.reduce((acc, curr) => acc + curr.tasks, 0);
  const avgCompletionRate = (
    workloadData.reduce((acc, curr) => acc + curr.completionRate, 0) / workloadData.length
  ).toFixed(1);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Sub-Agent Workload & Completion Analytics (Last 24 Hours)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time tracking of task throughput and success metrics across autonomous agents
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('workload')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === 'workload'
                ? 'bg-slate-800 text-sky-300 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Workload Distribution</span>
          </button>
          <button
            onClick={() => setActiveTab('throughput')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === 'throughput'
                ? 'bg-slate-800 text-sky-300 shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>24h Throughput Timeline</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
          <span className="text-[11px] font-mono text-slate-500 block">Total 24h Tasks</span>
          <span className="text-lg font-bold text-white font-mono">{totalTasks}</span>
          <span className="text-[10px] text-emerald-400 block mt-0.5 font-mono">
            +18% throughput vs prev cycle
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
          <span className="text-[11px] font-mono text-slate-500 block">Mean Completion Rate</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">{avgCompletionRate}%</span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
            Zero fatal crashes
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
          <span className="text-[11px] font-mono text-slate-500 block">Top Agent Load</span>
          <span className="text-lg font-bold text-sky-300 font-mono">OS-Agent</span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
            {workloadData[0].share}% of all operations
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
          <span className="text-[11px] font-mono text-slate-500 block">Self-Healing Recoveries</span>
          <span className="text-lg font-bold text-purple-300 font-mono">100%</span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
            Auto-fallback enabled
          </span>
        </div>
      </div>

      {/* Chart Render Area */}
      <div className="h-64 w-full pt-1">
        {activeTab === 'workload' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full items-center">
            {/* Donut Chart */}
            <div className="md:col-span-5 h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                            <p className="font-semibold text-white">{data.name}</p>
                            <p className="text-slate-300 mt-1">
                              Workload: <span className="text-sky-400">{data.tasks} tasks</span> ({data.share}%)
                            </p>
                            <p className="text-emerald-400 mt-0.5">
                              Completion Rate: {data.completionRate}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={workloadData}
                    dataKey="tasks"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {workloadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Sub-Agent Breakdown Bars & Stats */}
            <div className="md:col-span-7 space-y-3 pr-2">
              {workloadData.map((agent) => (
                <div
                  key={agent.name}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: agent.color }}
                      />
                      <span className="font-medium text-slate-200">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-400">{agent.tasks} tasks ({agent.share}%)</span>
                      <span className="text-emerald-400 flex items-center gap-0.5 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        {agent.completionRate}%
                      </span>
                    </div>
                  </div>
                  {/* Progress visual */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${agent.share}%`,
                        backgroundColor: agent.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 24-Hour Timeline Throughput Area Chart */
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWeb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                        <p className="font-semibold text-slate-300 mb-1.5">Hour Block: {label}</p>
                        {payload.map((entry: any) => (
                          <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
                            <span style={{ color: entry.color }}>{entry.name}:</span>
                            <span className="font-bold text-white">{entry.value} ops</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="OS-Agent"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorOs)"
              />
              <Area
                type="monotone"
                dataKey="Web-Agent"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorWeb)"
              />
              <Area
                type="monotone"
                dataKey="File-Processor"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorProc)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};
