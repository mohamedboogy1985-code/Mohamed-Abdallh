import React, { useState } from 'react';
import { AgentDataHandoff } from '../types/nexus';
import {
  ArrowRight,
  Database,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Share2,
  Terminal,
  Globe,
  Radio,
  FileCode,
  Eye,
  FileCheck,
} from 'lucide-react';

interface DataHandoffVisualizerProps {
  handoffs: AgentDataHandoff[];
}

export const DataHandoffVisualizer: React.FC<DataHandoffVisualizerProps> = ({
  handoffs,
}) => {
  const [selectedHandoff, setSelectedHandoff] = useState<AgentDataHandoff | null>(null);

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'OS-Agent':
        return '#10b981'; // emerald
      case 'Web-Agent':
        return '#6366f1'; // indigo
      case 'File-Processor-Agent':
        return '#f59e0b'; // amber
      default:
        return '#38bdf8'; // sky
    }
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
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

  const getPayloadIcon = (type: string) => {
    switch (type) {
      case 'dataset':
        return Database;
      case 'file':
        return FileCode;
      case 'summary':
        return FileText;
      default:
        return FileText;
    }
  };

  if (handoffs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-center">
        <Share2 className="w-5 h-5 mx-auto mb-1.5 text-slate-600" />
        <p className="text-xs text-slate-400 font-medium">Inter-Agent Data Pipeline</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Sub-agents automatically pass refined datasets and generated output files upon task completion.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Inter-Agent Data Pipeline & Handoffs
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {handoffs.length} Active Transfer(s)
        </span>
      </div>

      <div className="space-y-2.5">
        {handoffs.map((handoff) => {
          const FromIcon = getAgentIcon(handoff.fromAgent);
          const ToIcon = getAgentIcon(handoff.toAgent);
          const PayloadIcon = getPayloadIcon(handoff.payloadType);

          return (
            <div
              key={handoff.id}
              className="p-3 rounded-lg border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              {/* Transfer Flow Route */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Source Agent */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-[11px]">
                  <FromIcon
                    className="w-3.5 h-3.5"
                    style={{ color: getAgentColor(handoff.fromAgent) }}
                  />
                  <span className="font-semibold text-slate-200">{handoff.fromAgent}</span>
                </div>

                <div className="flex items-center gap-1 text-sky-400">
                  <span className="text-[10px] font-mono text-slate-500">passed</span>
                  <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                </div>

                {/* Destination Agent */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-[11px]">
                  <ToIcon
                    className="w-3.5 h-3.5"
                    style={{ color: getAgentColor(handoff.toAgent) }}
                  />
                  <span className="font-semibold text-slate-200">{handoff.toAgent}</span>
                </div>
              </div>

              {/* Payload Description & Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-slate-800 text-sky-400">
                    <PayloadIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-mono font-medium text-white block text-xs">
                      {handoff.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[220px]">
                      {handoff.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Transferred</span>
                  </span>

                  {handoff.payloadPath && (
                    <button
                      onClick={() => setSelectedHandoff(handoff)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Inspect passed dataset / file"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payload Inspection Modal */}
      {selectedHandoff && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-4 space-y-3 text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-white">Inter-Agent Data Payload</h3>
              </div>
              <button
                onClick={() => setSelectedHandoff(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 font-mono text-[11px] text-slate-300">
              <p>
                <strong className="text-slate-500">From:</strong> {selectedHandoff.fromAgent}
              </p>
              <p>
                <strong className="text-slate-500">To:</strong> {selectedHandoff.toAgent}
              </p>
              <p>
                <strong className="text-slate-500">Output Artifact:</strong> {selectedHandoff.title}
              </p>
              {selectedHandoff.payloadPath && (
                <p>
                  <strong className="text-slate-500">Destination Path:</strong>{' '}
                  <span className="text-sky-400">{selectedHandoff.payloadPath}</span>
                </p>
              )}
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {selectedHandoff.payloadData
                ? JSON.stringify(selectedHandoff.payloadData, null, 2)
                : `// Refined dataset payload successfully passed to ${selectedHandoff.toAgent}.\nPayload path: ${selectedHandoff.payloadPath || 'In-Memory Stream'}\nStatus: Verified and consumed.`}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedHandoff(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
