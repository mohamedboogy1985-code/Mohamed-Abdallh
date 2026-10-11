import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ShieldAlert,
  Terminal,
  Globe,
  FileSpreadsheet,
  Zap,
  Search,
} from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { TaskPriority } from '../types/nexus';

interface HeaderVoiceBarProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  onToggleListening: () => void;
  onSubmitPrompt: (text: string, priority?: TaskPriority) => void;
  onStopSpeaking: () => void;
  onOpenCommandPalette: () => void;
}

export const HeaderVoiceBar: React.FC<HeaderVoiceBarProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  transcript,
  onToggleListening,
  onSubmitPrompt,
  onStopSpeaking,
  onOpenCommandPalette,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'AUTO'>('AUTO');

  // Keyboard shortcut: hold or press spacebar when not typing in an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        onToggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleListening]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      const priority = selectedPriority === 'AUTO' ? undefined : selectedPriority;
      onSubmitPrompt(inputText.trim(), priority);
      setInputText('');
    }
  };

  const sampleVoicePrompts = [
    {
      label: 'Critical (High): Clean Temp Files & Audit High-CPU',
      prompt: 'Clean Windows temporary cache files and audit high-CPU processes in the system.',
      priority: 'HIGH' as TaskPriority,
      icon: Terminal,
      color: 'text-rose-400 border-rose-500/20 hover:border-rose-500/50 bg-rose-950/20',
    },
    {
      label: 'Standard (Medium): Parse Financials & Convert PDF',
      prompt: 'Parse quarterly_financials.xlsx in Documents and convert it into an executive PDF briefing.',
      priority: 'MEDIUM' as TaskPriority,
      icon: FileSpreadsheet,
      color: 'text-amber-400 border-amber-500/20 hover:border-amber-500/50 bg-amber-950/20',
    },
    {
      label: 'Inter-Agent Pipeline: Web Scrape → Parse CSV → Deploy Desktop',
      prompt: 'Scrape market intelligence from the web, download the CSV report, pass dataset to File-Processor-Agent to parse, and pass final briefing to OS-Agent to save to Desktop.',
      priority: 'MEDIUM' as TaskPriority,
      icon: Globe,
      color: 'text-cyan-400 border-cyan-500/20 hover:border-cyan-500/50 bg-cyan-950/20',
    },
    {
      label: 'Security Check: Delete System32 File (High Risk)',
      prompt: 'Delete protected backup_config.dll inside C:\\Windows\\System32.',
      priority: 'HIGH' as TaskPriority,
      icon: ShieldAlert,
      color: 'text-rose-400 border-rose-500/20 hover:border-rose-500/50 bg-rose-950/20',
    },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Top line: Master Identity + Voice Visualizer + Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Agent Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-indigo-600 shadow-lg shadow-sky-500/20">
              <span className="font-bold text-white text-base tracking-wider">NX</span>
              {isListening && (
                <span className="absolute -inset-1 rounded-xl bg-emerald-500/30 animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-wide text-white">Nexus-OS</h1>
                <span className="text-[11px] text-slate-400">·</span>
                <span className="text-xs text-sky-400 font-medium">Windows Master AI</span>
                <span className="text-[11px] text-slate-400">·</span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Priority Engine Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Speech-to-Speech Orchestrator with Priority Task Scheduling
              </p>
            </div>
          </div>

          {/* Real-Time Waveform & Voice State */}
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-1.5 px-3">
            <div className="hidden sm:block">
              <AudioWaveform
                isListening={isListening}
                isSpeaking={isSpeaking}
                isProcessing={isProcessing}
              />
            </div>

            {/* Mic Toggle Button */}
            <button
              onClick={onToggleListening}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isListening
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-semibold'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700/60'
              }`}
              title="Click or press Spacebar to toggle voice input"
            >
              {isListening ? (
                <>
                  <Mic className="w-3.5 h-3.5 animate-pulse" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mic: Push to Talk</span>
                </>
              )}
            </button>

            {/* TTS Status / Interrupt */}
            {isSpeaking && (
              <button
                onClick={onStopSpeaking}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-950/70 border border-sky-600/40 text-sky-300 text-xs hover:bg-sky-900/60 transition-colors"
                title="Interrupt audio playback"
              >
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                <span>Speaking</span>
                <VolumeX className="w-3 h-3 ml-1 text-sky-400 hover:text-white" />
              </button>
            )}

            {isProcessing && (
              <div className="flex items-center gap-1.5 text-xs text-purple-300 px-2 py-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Scheduling...</span>
              </div>
            )}

            {/* Command Palette Trigger */}
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-mono transition-colors"
              title="Search terminal history, files, and tabs (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Palette</span>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-400">
                Ctrl+K
              </kbd>
            </button>
          </div>
        </div>

        {/* Live Voice Transcript or Text Prompt Bar with Priority Level Selector */}
        <div className="flex flex-col gap-2">
          {/* Active transcript display if voice is active */}
          {transcript && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="font-mono text-slate-400 shrink-0">Live Voice:</span>
              <span className="truncate">{transcript}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Priority Selector Segmented Controls */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 shrink-0">
              <span className="px-2 text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Priority:
              </span>
              <button
                type="button"
                onClick={() => setSelectedPriority('AUTO')}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                  selectedPriority === 'AUTO'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Auto: Prioritize critical system tasks ahead of background tasks automatically"
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => setSelectedPriority('HIGH')}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                  selectedPriority === 'HIGH'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 shadow-sm'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
                title="High: Critical system tasks run ahead of all other operations"
              >
                High
              </button>
              <button
                type="button"
                onClick={() => setSelectedPriority('MEDIUM')}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                  selectedPriority === 'MEDIUM'
                    ? 'bg-sky-950/80 text-sky-300 border border-sky-800/60 shadow-sm'
                    : 'text-slate-400 hover:text-sky-300'
                }`}
                title="Medium: Standard processing priority"
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setSelectedPriority('LOW')}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                  selectedPriority === 'LOW'
                    ? 'bg-slate-800 text-slate-300 border border-slate-700/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Low: Background processes (scraping, downloads)"
              >
                Low
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Speak via mic or enter instruction (e.g. 'Clean temp files and check top processes')..."
                className="flex-1 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all font-sans"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
              >
                <span>Dispatch</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

        {/* Quick Voice Command Presets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 shrink-0 text-[11px] font-medium">Test Presets:</span>
          {sampleVoicePrompts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onSubmitPrompt(item.prompt, item.priority)}
                disabled={isProcessing}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors shrink-0 disabled:opacity-50 ${item.color}`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
