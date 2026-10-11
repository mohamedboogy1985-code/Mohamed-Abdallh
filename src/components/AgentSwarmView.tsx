import React, { useState } from 'react';
import {
  AgentInfo,
  OrchestrationAction,
  InternalReasoning,
  NexusLog,
  TaskPriority,
  AgentDataHandoff,
} from '../types/nexus';
import {
  Terminal,
  Globe,
  FileSpreadsheet,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Radio,
  RotateCw,
  ShieldCheck,
  ShieldAlert,
  Zap,
  ArrowUpCircle,
  ArrowDownCircle,
  Share2,
  Volume2,
  Sliders,
} from 'lucide-react';
import { AgentAnalyticsChart } from './AgentAnalyticsChart';
import { DataHandoffVisualizer } from './DataHandoffVisualizer';
import { AgentVoiceCustomizer } from './AgentVoiceCustomizer';
import { AgentType, AgentVoiceConfig } from '../types/nexus';

interface AgentSwarmViewProps {
  agents: AgentInfo[];
  actions: OrchestrationAction[];
  internalReasoning: InternalReasoning | null;
  spokenResponse: string | null;
  logs: NexusLog[];
  handoffs: AgentDataHandoff[];
  onUpdateActionPriority?: (actionId: string, newPriority: TaskPriority) => void;
  onUpdateVoiceConfig?: (agentType: AgentType, updatedConfig: AgentVoiceConfig) => void;
  subAgentAnnounceEnabled?: boolean;
  onToggleSubAgentAnnounce?: (enabled: boolean) => void;
}

export const AgentSwarmView: React.FC<AgentSwarmViewProps> = ({
  agents,
  actions,
  internalReasoning,
  spokenResponse,
  logs,
  handoffs,
  onUpdateActionPriority,
  onUpdateVoiceConfig,
  subAgentAnnounceEnabled = true,
  onToggleSubAgentAnnounce,
}) => {
  const [showReasoning, setShowReasoning] = useState(true);
  const [subMenuView, setSubMenuView] = useState<'swarm' | 'voice-config'>('swarm');
  const [customizingAgent, setCustomizingAgent] = useState<AgentType>('OS-Agent');

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'OS-Agent':
        return Terminal;
      case 'Web-Agent':
        return Globe;
      case 'File-Processor-Agent':
        return FileSpreadsheet;
      default:
        return Radio;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'executing':
        return (
          <span className="flex items-center gap-1.5 text-xs text-sky-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            Executing
          </span>
        );
      case 'analyzing':
        return (
          <span className="flex items-center gap-1.5 text-xs text-purple-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            Analyzing
          </span>
        );
      case 'recovering':
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <RotateCw className="w-3 h-3 animate-spin" />
            Self-Healing
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Task Done
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
            <AlertTriangle className="w-3 h-3" />
            Faulted
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs text-slate-400 font-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Standby
          </span>
        );
    }
  };

  const highPriorityCount = actions.filter((a) => a.priority === 'HIGH').length;
  const medPriorityCount = actions.filter((a) => a.priority === 'MEDIUM').length;
  const lowPriorityCount = actions.filter((a) => a.priority === 'LOW').length;

  return (
    <div className="flex flex-col gap-5">
      {/* Nexus-OS Master Internal Reasoning & Voice Response Drawer */}
      {(internalReasoning || spokenResponse) && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Nexus-OS Master Synthesis & Internal Reasoning
              </h2>
              {internalReasoning?.riskLevel && (
                <div className="flex items-center gap-1.5 text-xs ml-2">
                  <span className="text-slate-500">·</span>
                  {internalReasoning.riskLevel === 'HIGH' ? (
                    <span className="text-rose-400 flex items-center gap-1 font-medium">
                      <ShieldAlert className="w-3.5 h-3.5" /> High Risk Guard
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" /> Safe Operational State
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <span>{showReasoning ? 'Hide Reasoning' : 'Show Reasoning'}</span>
              {showReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Voice Response Output Callout */}
          {spokenResponse && (
            <div className="mb-3 p-3 rounded-lg bg-sky-950/30 border border-sky-800/40 text-slate-200 text-xs">
              <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wide block mb-1">
                Transmitted Voice Response:
              </span>
              <p className="text-sm font-medium leading-relaxed text-sky-100">
                "{spokenResponse}"
              </p>
            </div>
          )}

          {/* Detailed Internal Reasoning Breakdown */}
          {showReasoning && internalReasoning && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-800/80">
              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
                <span className="text-slate-500 text-[11px] block mb-1 font-medium">01. Objective</span>
                <p className="text-slate-200 leading-normal">{internalReasoning.objective}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
                <span className="text-slate-500 text-[11px] block mb-1 font-medium">02. Safety & Risk</span>
                <p className="text-slate-200 leading-normal">{internalReasoning.riskAssessment}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
                <span className="text-slate-500 text-[11px] block mb-1 font-medium">03. Sub-Agent Strategy</span>
                <p className="text-slate-200 leading-normal">{internalReasoning.strategy}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Sub-Menu Navigation: Swarm Overview & Pipeline vs Voice & Auditory Customizer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950/80 border border-slate-800/80">
          <button
            onClick={() => setSubMenuView('swarm')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              subMenuView === 'swarm'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Swarm Workload & Pipeline</span>
          </button>

          <button
            onClick={() => setSubMenuView('voice-config')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              subMenuView === 'voice-config'
                ? 'bg-sky-950 text-sky-200 border border-sky-800/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sub-Agent Voice & Acoustic Profiles</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-900/50 text-sky-300 font-semibold">
              Sub-Menu
            </span>
          </button>
        </div>

        {subMenuView === 'voice-config' ? (
          <button
            onClick={() => setSubMenuView('swarm')}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 self-start sm:self-auto px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 transition-colors cursor-pointer"
          >
            <span>&larr; Return to Swarm Pipeline</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400 self-start sm:self-auto px-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-300">
              3 Sub-Agents Configured with Unique Auditory IDs
            </span>
          </div>
        )}
      </div>

      {subMenuView === 'voice-config' ? (
        <AgentVoiceCustomizer
          agents={agents}
          selectedAgentType={customizingAgent}
          onUpdateVoiceConfig={onUpdateVoiceConfig || (() => {})}
          subAgentAnnounceEnabled={subAgentAnnounceEnabled}
          onToggleSubAgentAnnounce={onToggleSubAgentAnnounce || (() => {})}
          onClose={() => setSubMenuView('swarm')}
        />
      ) : (
        <>
          {/* Specialised Sub-Agents Swarm Grid */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-semibold text-slate-200">Active Sub-Agents Swarm</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSubMenuView('voice-config')}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono transition-colors"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Customize Voice Sub-Menu &rarr;</span>
                </button>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  3 Specialised Agents Supervised
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {agents
                .filter((a) => a.type !== 'Nexus-Master')
                .map((agent) => {
                  const Icon = getAgentIcon(agent.type);
                  const isActive = agent.status === 'executing' || agent.status === 'analyzing';

                  return (
                    <div
                      key={agent.id}
                      className={`rounded-xl border p-4 transition-all ${
                        isActive
                          ? 'border-sky-500/50 bg-slate-900/90 shadow-md shadow-sky-950/40'
                          : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                      }`}
                    >
                      {/* Agent Header */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: `${agent.accentColor}18`,
                              color: agent.accentColor,
                            }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-100">{agent.name}</h3>
                            <p className="text-[11px] text-slate-400">{agent.role}</p>
                          </div>
                        </div>
                        {getStatusBadge(agent.status)}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                        {agent.description}
                      </p>

                      {/* Current Task or Idle Status */}
                      <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/60 text-xs">
                        <span className="text-[10px] uppercase font-mono text-slate-500 block mb-0.5">
                          Current Task
                        </span>
                        <p
                          className={`truncate font-mono text-xs ${
                            agent.currentTask ? 'text-sky-300 font-medium' : 'text-slate-500'
                          }`}
                        >
                          {agent.currentTask || 'Idle · Awaiting master delegation'}
                        </p>
                      </div>

                      {/* Auditory Signature Profile Badge */}
                      <div className="mt-2.5 flex items-center justify-between bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-mono font-medium text-slate-200 truncate">
                            {agent.voiceConfig?.voiceName || 'Auto'}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400 font-mono text-[10px] shrink-0">
                            {agent.voiceConfig?.pitch ? `${agent.voiceConfig.pitch.toFixed(2)}x` : '1.00x'}p
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400 font-mono text-[10px] shrink-0">
                            {agent.voiceConfig?.speed ? `${agent.voiceConfig.speed.toFixed(2)}x` : '1.00x'}s
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setCustomizingAgent(agent.type);
                            setSubMenuView('voice-config');
                          }}
                          className="text-[10px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline cursor-pointer shrink-0 ml-1.5"
                          title="Customize voice, pitch, and speed for this agent"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Tune</span>
                        </button>
                      </div>

                      {/* Footer Stats */}
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                        <span>Tasks Completed</span>
                        <span className="font-mono text-slate-300">{agent.completedTasksCount}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>

      {/* 24-Hour Analytics & Workload Distribution (Recharts) */}
      <AgentAnalyticsChart agents={agents} actions={actions} />

      {/* Inter-Agent Data Pipeline & Handoffs */}
      <DataHandoffVisualizer handoffs={handoffs} />

      {/* Autonomous Action Pipeline / Stepper with Priority Scheduling */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Priority-Scheduled Execution Pipeline
            </h2>
          </div>

          {/* Priority Distribution Stats */}
          <div className="flex items-center gap-3 text-xs font-mono">
            {highPriorityCount > 0 && (
              <span className="text-rose-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                {highPriorityCount} Critical (High)
              </span>
            )}
            {medPriorityCount > 0 && (
              <span className="text-sky-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                {medPriorityCount} Standard (Med)
              </span>
            )}
            {lowPriorityCount > 0 && (
              <span className="text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                {lowPriorityCount} Background (Low)
              </span>
            )}
          </div>
        </div>

        {/* Priority Engine Info Bar */}
        <div className="mb-3 px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Priority Order: <strong>Critical System Operations (High)</strong> run before standard tasks, followed by background web processes (Low).
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 hidden md:block">
            Auto-sorted queue
          </span>
        </div>

        {actions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <Cpu className="w-6 h-6 mx-auto mb-2 text-slate-600" />
            <p>No actions in the pipeline.</p>
            <p className="text-slate-600 mt-1">
              Speak a voice request or choose a priority preset above to dispatch tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {actions.map((act, index) => {
              const Icon = getAgentIcon(act.agent);
              const isHigh = act.priority === 'HIGH';
              const isMed = act.priority === 'MEDIUM';
              const isLow = act.priority === 'LOW';

              return (
                <div
                  key={act.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border text-xs transition-colors ${
                    act.status === 'done'
                      ? 'border-emerald-950 bg-emerald-950/20 text-slate-300'
                      : act.status === 'in_progress'
                      ? 'border-sky-800/60 bg-sky-950/30 text-white shadow-sm'
                      : act.status === 'failed'
                      ? 'border-rose-900/60 bg-rose-950/30 text-rose-200'
                      : isHigh
                      ? 'border-rose-900/40 bg-slate-950/80 text-slate-300'
                      : 'border-slate-800/60 bg-slate-950/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="font-mono text-slate-500 text-[11px] w-5">
                      {(index + 1).toString().padStart(2, '0')}.
                    </span>

                    {/* Priority Selector / Tag */}
                    {act.status === 'pending' && onUpdateActionPriority ? (
                      <div className="relative group shrink-0">
                        <select
                          value={act.priority}
                          onChange={(e) =>
                            onUpdateActionPriority(act.id, e.target.value as TaskPriority)
                          }
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded cursor-pointer border transition-colors ${
                            isHigh
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                              : isMed
                              ? 'bg-sky-950/80 text-sky-300 border-sky-800/60'
                              : 'bg-slate-800 text-slate-400 border-slate-700/60'
                          }`}
                          title="Click to re-prioritize task and reorder execution queue"
                        >
                          <option value="HIGH">HIGH (Critical)</option>
                          <option value="MEDIUM">MEDIUM (Standard)</option>
                          <option value="LOW">LOW (Background)</option>
                        </select>
                      </div>
                    ) : (
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border shrink-0 ${
                          isHigh
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                            : isMed
                            ? 'bg-sky-950/80 text-sky-300 border-sky-800/60'
                            : 'bg-slate-800 text-slate-400 border-slate-700/60'
                        }`}
                      >
                        {act.priority}
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 shrink-0 flex items-center gap-1">
                      <Icon className="w-3 h-3 text-sky-400" />
                      {act.agent}
                    </span>

                    <span className="font-medium truncate text-slate-200">
                      {act.description}
                    </span>

                    {act.handoffTo && (
                      <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-1.5 py-0.5 rounded shrink-0">
                        <Share2 className="w-2.5 h-2.5 text-indigo-400" />
                        <span>Hands off to {act.handoffTo}</span>
                      </span>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {act.status === 'done' && (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                    {act.status === 'in_progress' && (
                      <span className="text-sky-400 flex items-center gap-1.5 text-[11px] font-mono">
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" /> Running...
                      </span>
                    )}
                    {act.status === 'failed' && (
                      <span className="text-rose-400 flex items-center gap-1 text-[11px] font-mono">
                        <AlertTriangle className="w-3.5 h-3.5" /> Failed
                      </span>
                    )}
                    {act.status === 'pending' && (
                      <span className="text-slate-500 text-[11px] font-mono">
                        {isHigh ? 'Scheduled Next' : 'Queued'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
        </>
      )}

      {/* Live System Log Feed */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
          Agent Event Stream
        </h3>
        <div className="max-h-36 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-2">
          {logs.slice(-8).map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-slate-400">
              <span className="text-slate-600 shrink-0">{log.timestamp}</span>
              <span
                className={`font-semibold shrink-0 ${
                  log.source === 'OS-Agent'
                    ? 'text-emerald-400'
                    : log.source === 'Web-Agent'
                    ? 'text-indigo-400'
                    : log.source === 'File-Processor-Agent'
                    ? 'text-amber-400'
                    : 'text-sky-400'
                }`}
              >
                [{log.source}]
              </span>
              <span
                className={
                  log.level === 'error'
                    ? 'text-rose-400'
                    : log.level === 'warn'
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }
              >
                {log.message}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-slate-600">No events logged yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};
