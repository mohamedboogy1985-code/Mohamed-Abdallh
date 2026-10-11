import React, { useState } from 'react';
import { VirtualProcess } from '../types/nexus';
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  XCircle,
  Plus,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';

interface TaskManagerViewProps {
  processes: VirtualProcess[];
  onKillProcess: (pid: number) => void;
  onLaunchApp: (appName: string) => void;
}

export const TaskManagerView: React.FC<TaskManagerViewProps> = ({
  processes,
  onKillProcess,
  onLaunchApp,
}) => {
  const [newAppName, setNewAppName] = useState('');
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  // Compute total CPU
  const totalCpu = Math.min(99, processes.reduce((acc, p) => acc + p.cpu, 0)).toFixed(1);

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;
    onLaunchApp(newAppName.trim());
    setNewAppName('');
    setShowLaunchModal(false);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-xl overflow-hidden flex flex-col h-[560px]">
      {/* Title Bar */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">
            Task Manager · Windows System Processes (Supervised by OS-Agent)
          </span>
        </div>

        <button
          onClick={() => setShowLaunchModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-sky-400" />
          <span>Run New Task</span>
        </button>
      </div>

      {/* System Resource Overview */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-slate-800/80 bg-slate-900/40">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" /> CPU Utilization
            </span>
            <span className="font-mono text-sky-400 font-semibold">{totalCpu}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                Number(totalCpu) > 70 ? 'bg-rose-500' : 'bg-sky-400'
              }`}
              style={{ width: `${Math.min(100, Number(totalCpu))}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <MemoryStick className="w-3.5 h-3.5 text-purple-400" /> Memory Usage
            </span>
            <span className="font-mono text-purple-400 font-semibold">16.4 / 64 GB</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-purple-400" style={{ width: '25.6%' }} />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Disk C: Active
            </span>
            <span className="font-mono text-emerald-400 font-semibold">1.8 MB/s</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: '12%' }} />
          </div>
        </div>
      </div>

      {/* Process Table */}
      <div className="flex-1 overflow-y-auto p-4">
        <table className="w-full text-left text-xs">
          <thead className="text-[11px] font-mono text-slate-400 border-b border-slate-800 pb-2 select-none">
            <tr>
              <th className="pb-2 font-medium">Image Name</th>
              <th className="pb-2 font-medium">PID</th>
              <th className="pb-2 font-medium">CPU %</th>
              <th className="pb-2 font-medium">Memory</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 font-mono">
            {processes.map((proc) => {
              const isHighCpu = proc.cpu > 10;
              return (
                <tr key={proc.pid} className="hover:bg-slate-900/40">
                  <td className="py-2.5 font-medium text-slate-200 flex items-center gap-2">
                    {proc.isSystem ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    ) : isHighCpu ? (
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span>{proc.name}</span>
                  </td>
                  <td className="py-2.5 text-slate-400">{proc.pid}</td>
                  <td className="py-2.5">
                    <span
                      className={`font-semibold ${
                        isHighCpu ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    >
                      {proc.cpu.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-400">{proc.memory}</td>
                  <td className="py-2.5">
                    <span className="text-emerald-400 text-[11px]">Running</span>
                  </td>
                  <td className="py-2.5 text-right">
                    {!proc.isSystem ? (
                      <button
                        onClick={() => onKillProcess(proc.pid)}
                        className="px-2 py-1 rounded bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:text-white border border-rose-800/40 text-[11px] transition-colors"
                        title="OS-Agent: Terminate Process"
                      >
                        End Task
                      </button>
                    ) : (
                      <span className="text-slate-600 text-[10px]">Protected</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Launch app modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Create New Task</h3>
            <p className="text-xs text-slate-400">
              Type the name of a program, folder, document, or script for OS-Agent to execute.
            </p>
            <form onSubmit={handleLaunch} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. notepad.exe, calc.exe, code.exe"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLaunchModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium"
                >
                  Launch App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
