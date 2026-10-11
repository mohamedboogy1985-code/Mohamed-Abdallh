import React, { useState, useRef, useEffect } from 'react';
import { TerminalEntry } from '../types/nexus';
import {
  Terminal as TerminalIcon,
  CornerDownLeft,
  Trash2,
  Play,
  History,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TerminalViewProps {
  entries: TerminalEntry[];
  cwd: string;
  onExecuteCommand: (command: string) => void;
  onClear: () => void;
}

const STORAGE_KEY = 'nexus_os_terminal_persistent_history_v2';
const DEFAULT_PERSISTENT_HISTORY = [
  'systeminfo',
  'agent-status',
  'tasklist',
  'dir',
  'ipconfig',
  'type README_NEXUS.txt',
];

export const TerminalView: React.FC<TerminalViewProps> = ({
  entries,
  cwd,
  onExecuteCommand,
  onClear,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const draftValRef = useRef<string>('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initialize command history from localStorage
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_PERSISTENT_HISTORY;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load persistent terminal history:', e);
    }
    return DEFAULT_PERSISTENT_HISTORY;
  });

  // Save command history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && commandHistory.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(commandHistory.slice(-100)));
      } catch (e) {
        console.warn('Failed to save terminal history:', e);
      }
    }
  }, [commandHistory]);

  // Scroll to bottom on new terminal entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    // Update persistent history: remove existing occurrence, push to end
    setCommandHistory((prev) => {
      const filtered = prev.filter((cmd) => cmd.toLowerCase() !== trimmed.toLowerCase());
      const updated = [...filtered, trimmed];
      return updated;
    });

    setHistoryIndex(null);
    draftValRef.current = '';
    onExecuteCommand(trimmed);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      if (historyIndex === null) {
        // Save user's current unfinished draft
        draftValRef.current = inputVal;
        const newIndex = commandHistory.length - 1;
        setHistoryIndex(newIndex);
        setInputVal(commandHistory[newIndex]);
      } else if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputVal(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;

      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInputVal(commandHistory[newIndex]);
      } else {
        // Returned past latest command, restore draft or blank
        setHistoryIndex(null);
        setInputVal(draftValRef.current);
      }
    }
  };

  const handleSelectHistoryCommand = (cmd: string) => {
    onExecuteCommand(cmd);
    // Also move to end of history
    setCommandHistory((prev) => {
      const filtered = prev.filter((c) => c !== cmd);
      return [...filtered, cmd];
    });
    setHistoryIndex(null);
    setInputVal('');
    setShowHistoryDrawer(false);
  };

  const handleClearHistory = () => {
    setCommandHistory([]);
    setHistoryIndex(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const quickCommands = [
    { label: 'dir', cmd: 'dir' },
    { label: 'tasklist', cmd: 'tasklist' },
    { label: 'ipconfig', cmd: 'ipconfig' },
    { label: 'systeminfo', cmd: 'systeminfo' },
    { label: 'agent-status', cmd: 'agent-status' },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-xl overflow-hidden flex flex-col h-[560px]">
      {/* Windows Terminal Titlebar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <TerminalIcon className="w-3 h-3" />
          </div>
          <span className="text-xs font-medium text-slate-200">
            Windows PowerShell · Administrator: Nexus OS-Agent
          </span>
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-[11px] font-mono text-emerald-400">Execution Mode: Active</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Persistent History indicator & toggle */}
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors border ${
              showHistoryDrawer
                ? 'bg-sky-950/80 text-sky-300 border-sky-800/60'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle persistent command history"
          >
            <History className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono text-[11px]">History ({commandHistory.length})</span>
            {showHistoryDrawer ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          <button
            onClick={onClear}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Clear Terminal Output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1.5 ml-1">
            <div className="w-3 h-3 rounded-full bg-slate-700" />
            <div className="w-3 h-3 rounded-full bg-slate-700" />
            <div className="w-3 h-3 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>

      {/* Quick command buttons & arrow-key history hint */}
      <div className="bg-slate-900/40 border-b border-slate-800/50 px-4 py-1.5 flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-500 font-mono">Quick Run:</span>
          {quickCommands.map((q) => (
            <button
              key={q.cmd}
              onClick={() => onExecuteCommand(q.cmd)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] flex items-center gap-1 transition-colors border border-slate-700/50"
            >
              <Play className="w-2.5 h-2.5 text-emerald-400" />
              <span>{q.label}</span>
            </button>
          ))}
        </div>

        <div className="text-[10px] font-mono text-slate-500 shrink-0 flex items-center gap-1 hidden sm:flex">
          <RotateCcw className="w-3 h-3 text-sky-400" />
          <span>Press <strong>↑ / ↓</strong> to cycle saved commands</span>
        </div>
      </div>

      {/* Collapsible Persistent History Drawer */}
      {showHistoryDrawer && (
        <div className="bg-slate-900/95 border-b border-slate-800 p-3 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-300 font-mono flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-sky-400" />
              Persistent Command History (Saved across sessions)
            </span>
            <button
              onClick={handleClearHistory}
              className="text-[10px] font-mono text-rose-400 hover:text-rose-300 transition-colors"
            >
              Clear Saved History
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {commandHistory.slice().reverse().map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectHistoryCommand(cmd)}
                className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-slate-200 font-mono text-[11px] transition-colors flex items-center gap-1"
                title="Click to execute this previously run command"
              >
                <Play className="w-2.5 h-2.5 text-sky-400" />
                <span>{cmd}</span>
              </button>
            ))}
            {commandHistory.length === 0 && (
              <p className="text-xs text-slate-500 font-mono">No command history saved yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Terminal Screen Body */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 text-slate-300 bg-slate-950"
      >
        <div className="text-slate-500 leading-relaxed border-b border-slate-900 pb-2 mb-2">
          Windows PowerShell [Version 10.0.26100.1742]<br />
          (c) Microsoft Corporation. All rights reserved.<br />
          Nexus-OS Sub-Agent [OS-Agent] initialized with Administrator privileges.<br />
          Persistent command history enabled (Cycle with <span className="text-sky-400 font-semibold">↑ / ↓</span> keys). Type 'help' for commands.
        </div>

        {entries.map((item) => (
          <div key={item.id} className="space-y-1">
            {item.command && (
              <div className="flex items-center gap-2 text-slate-200">
                <span className="text-sky-400 shrink-0 font-medium">{item.cwd || cwd}&gt;</span>
                <span className="text-white font-medium">{item.command}</span>
              </div>
            )}
            {item.output && (
              <pre
                className={`whitespace-pre-wrap leading-relaxed pl-3 font-mono text-xs ${
                  item.type === 'error'
                    ? 'text-rose-400'
                    : item.type === 'system'
                    ? 'text-emerald-400'
                    : 'text-slate-300'
                }`}
              >
                {item.output}
              </pre>
            )}
          </div>
        ))}

        {/* Active Command Prompt Line */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
          <span className="text-sky-400 font-medium shrink-0">{cwd}&gt;</span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              setHistoryIndex(null);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder-slate-600"
            placeholder={
              historyIndex !== null
                ? `History [${historyIndex + 1}/${commandHistory.length}] (Press Enter to execute, ↑/↓ to cycle)`
                : 'Enter command (↑/↓ for history, e.g. dir, tasklist, ipconfig)...'
            }
            autoFocus
          />
          <button
            type="submit"
            className="text-slate-500 hover:text-slate-300 p-1"
            title="Execute"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
