import React, { useState } from 'react';
import {
  AgentInfo,
  AgentType,
  AgentVoiceConfig,
  PrebuiltVoiceName,
} from '../types/nexus';
import { speechService } from '../utils/speechService';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Radio,
  Terminal,
  Globe,
  FileSpreadsheet,
  CheckCircle2,
  Bell,
  Waves,
  Zap,
} from 'lucide-react';

interface AgentVoiceCustomizerProps {
  agents: AgentInfo[];
  selectedAgentType?: AgentType;
  onUpdateVoiceConfig: (agentType: AgentType, updatedConfig: AgentVoiceConfig) => void;
  subAgentAnnounceEnabled: boolean;
  onToggleSubAgentAnnounce: (enabled: boolean) => void;
  onClose?: () => void;
}

interface VoicePersonaOption {
  name: PrebuiltVoiceName;
  title: string;
  timbre: string;
  recommendedFor: AgentType;
  accentClass: string;
}

const VOICE_OPTIONS: VoicePersonaOption[] = [
  {
    name: 'Fenrir',
    title: 'Kernel Tactician',
    timbre: 'Deep, resonant, authoritative lower register',
    recommendedFor: 'OS-Agent',
    accentClass: 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300',
  },
  {
    name: 'Puck',
    title: 'Cyber Navigator',
    timbre: 'Agile, energetic, rapid scanning tempo',
    recommendedFor: 'Web-Agent',
    accentClass: 'border-indigo-500/60 bg-indigo-950/30 text-indigo-300',
  },
  {
    name: 'Kore',
    title: 'Data Analyst',
    timbre: 'Smooth, calm, clear, methodical cadence',
    recommendedFor: 'File-Processor-Agent',
    accentClass: 'border-amber-500/60 bg-amber-950/30 text-amber-300',
  },
  {
    name: 'Zephyr',
    title: 'Master Orchestrator',
    timbre: 'Crisp, articulate, balanced leadership tone',
    recommendedFor: 'Nexus-Master',
    accentClass: 'border-sky-500/60 bg-sky-950/30 text-sky-300',
  },
  {
    name: 'Charon',
    title: 'System Sentinel',
    timbre: 'Heavy, low-register, industrial system tone',
    recommendedFor: 'OS-Agent',
    accentClass: 'border-purple-500/60 bg-purple-950/30 text-purple-300',
  },
];

export const AgentVoiceCustomizer: React.FC<AgentVoiceCustomizerProps> = ({
  agents,
  selectedAgentType: initialSelected = 'OS-Agent',
  onUpdateVoiceConfig,
  subAgentAnnounceEnabled,
  onToggleSubAgentAnnounce,
}) => {
  const [activeAgentType, setActiveAgentType] = useState<AgentType>(initialSelected);
  const [isAuditioning, setIsAuditioning] = useState(false);
  const [auditionText, setAuditionText] = useState('');

  const activeAgent = agents.find((a) => a.type === activeAgentType) || agents[0];

  // Default voice configuration fallback if not set
  const currentConfig: AgentVoiceConfig = activeAgent?.voiceConfig || {
    agentType: activeAgent.type,
    voiceName:
      activeAgent.type === 'OS-Agent'
        ? 'Fenrir'
        : activeAgent.type === 'Web-Agent'
        ? 'Puck'
        : activeAgent.type === 'File-Processor-Agent'
        ? 'Kore'
        : 'Zephyr',
    pitch:
      activeAgent.type === 'OS-Agent'
        ? 0.85
        : activeAgent.type === 'Web-Agent'
        ? 1.15
        : activeAgent.type === 'File-Processor-Agent'
        ? 0.95
        : 1.0,
    speed:
      activeAgent.type === 'OS-Agent'
        ? 1.0
        : activeAgent.type === 'Web-Agent'
        ? 1.2
        : activeAgent.type === 'File-Processor-Agent'
        ? 0.95
        : 1.05,
    sampleGreeting:
      activeAgent.type === 'OS-Agent'
        ? 'OS-Agent standing by. Windows kernel and PowerShell execution ready.'
        : activeAgent.type === 'Web-Agent'
        ? 'Web-Agent online. Crawling web portals, downloading assets, and scraping tables.'
        : activeAgent.type === 'File-Processor-Agent'
        ? 'File-Processor-Agent online. Parsed structured document and verified financial metrics.'
        : 'Nexus-OS master synthesis active. Orchestrating system workflows.',
    personaLabel:
      activeAgent.type === 'OS-Agent'
        ? 'Kernel Tactician (Deep & Resonant)'
        : activeAgent.type === 'Web-Agent'
        ? 'Cyber Navigator (Fast & Agile)'
        : activeAgent.type === 'File-Processor-Agent'
        ? 'Data Analyst (Smooth & Methodical)'
        : 'Master Orchestrator (Balanced & Direct)',
    beaconFreq:
      activeAgent.type === 'OS-Agent'
        ? 330
        : activeAgent.type === 'Web-Agent'
        ? 680
        : activeAgent.type === 'File-Processor-Agent'
        ? 440
        : 520,
    enableChime: true,
    announcePrefix: true,
    timbreDescription: 'Customized auditory signature',
  };

  // Sync audition sample text when agent tab changes
  const effectiveAuditionText = auditionText || currentConfig.sampleGreeting;

  const handleUpdate = (partial: Partial<AgentVoiceConfig>) => {
    const updated: AgentVoiceConfig = {
      ...currentConfig,
      ...partial,
      agentType: activeAgent.type,
    };
    onUpdateVoiceConfig(activeAgent.type, updated);
  };

  const handleAudition = async () => {
    setIsAuditioning(true);
    const textToSpeak = effectiveAuditionText;
    const prefix = currentConfig.announcePrefix ? `[${activeAgent.name}]: ` : '';
    const fullText = prefix + textToSpeak;

    await speechService.speak(fullText, {
      voiceName: currentConfig.voiceName,
      pitch: currentConfig.pitch,
      speed: currentConfig.speed,
      enableChime: currentConfig.enableChime,
      beaconFreq: currentConfig.beaconFreq,
    });
    setIsAuditioning(false);
  };

  const handlePlayChimeOnly = () => {
    speechService.playChime(currentConfig.beaconFreq || 440, 120);
  };

  const handleResetToFactory = () => {
    const defaults: Record<AgentType, Partial<AgentVoiceConfig>> = {
      'OS-Agent': {
        voiceName: 'Fenrir',
        pitch: 0.85,
        speed: 1.0,
        beaconFreq: 330,
        enableChime: true,
        announcePrefix: true,
        sampleGreeting: 'OS-Agent standing by. Windows kernel and PowerShell execution ready.',
        personaLabel: 'Kernel Tactician (Deep & Resonant)',
      },
      'Web-Agent': {
        voiceName: 'Puck',
        pitch: 1.15,
        speed: 1.2,
        beaconFreq: 680,
        enableChime: true,
        announcePrefix: true,
        sampleGreeting: 'Web-Agent online. Crawling web portals, downloading assets, and scraping tables.',
        personaLabel: 'Cyber Navigator (Fast & Agile)',
      },
      'File-Processor-Agent': {
        voiceName: 'Kore',
        pitch: 0.95,
        speed: 0.95,
        beaconFreq: 440,
        enableChime: true,
        announcePrefix: true,
        sampleGreeting: 'File-Processor-Agent online. Parsed structured document and verified financial metrics.',
        personaLabel: 'Data Analyst (Smooth & Methodical)',
      },
      'Nexus-Master': {
        voiceName: 'Zephyr',
        pitch: 1.0,
        speed: 1.05,
        beaconFreq: 520,
        enableChime: true,
        announcePrefix: false,
        sampleGreeting: 'Nexus-OS master synthesis active. Orchestrating system workflows.',
        personaLabel: 'Master Orchestrator (Balanced & Direct)',
      },
    };

    handleUpdate(defaults[activeAgent.type]);
    setAuditionText('');
  };

  const getAgentIcon = (type: AgentType) => {
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

  const ActiveIcon = getAgentIcon(activeAgent.type);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 text-slate-200">
      {/* Header and Master Announcement Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
              Sub-Agent Voice & Acoustic Customizer
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure distinct voice personalities, pitch shifts, and speed multipliers for individual sub-agents.
          </p>
        </div>

        {/* Global Sub-Agent Voice Output Toggle */}
        <div className="flex items-center gap-2.5 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
          <Bell className={`w-3.5 h-3.5 ${subAgentAnnounceEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
          <div className="text-left">
            <span className="text-[11px] font-medium text-slate-300 block leading-tight">
              Sub-Agent Voice Outputs
            </span>
            <span className="text-[10px] text-slate-500 block leading-tight">
              {subAgentAnnounceEnabled ? 'Agents speak their task outputs' : 'Muted during execution'}
            </span>
          </div>
          <button
            onClick={() => onToggleSubAgentAnnounce(!subAgentAnnounceEnabled)}
            className={`ml-2 px-2.5 py-1 text-[10px] font-mono font-semibold rounded transition-colors ${
              subAgentAnnounceEnabled
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {subAgentAnnounceEnabled ? 'ACTIVE' : 'MUTED'}
          </button>
        </div>
      </div>

      {/* Agent Selector Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {agents.map((agent) => {
          const Icon = getAgentIcon(agent.type);
          const isSelected = agent.type === activeAgentType;
          const config = agent.voiceConfig;

          return (
            <button
              key={agent.id}
              onClick={() => {
                setActiveAgentType(agent.type);
                setAuditionText('');
              }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                isSelected
                  ? 'border-sky-500/80 bg-sky-950/40 text-white shadow-sm shadow-sky-950'
                  : 'border-slate-800/80 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-[10px]"
                style={{
                  backgroundColor: `${agent.accentColor}25`,
                  color: agent.accentColor,
                }}
              >
                <Icon className="w-3 h-3" />
              </div>
              <span className="font-medium">{agent.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300">
                {config?.voiceName || 'Auto'} · {config?.pitch || 1.0}x
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Customization Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Voice Personas & Characteristics (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Agent Identity Banner */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${activeAgent.accentColor}20`,
                  color: activeAgent.accentColor,
                }}
              >
                <ActiveIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{activeAgent.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {activeAgent.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{currentConfig.personaLabel}</p>
              </div>
            </div>

            <button
              onClick={handleResetToFactory}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-slate-900 border border-slate-800"
              title="Reset this agent's voice settings to default"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Defaults</span>
            </button>
          </div>

          {/* Voice Model Selection Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2 font-mono flex items-center justify-between">
              <span>Select Voice Persona (Gemini Prebuilt Voices)</span>
              <span className="text-[10px] text-sky-400 font-normal">
                Active: {currentConfig.voiceName}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VOICE_OPTIONS.map((v) => {
                const isSelected = currentConfig.voiceName === v.name;
                const isRecommended = v.recommendedFor === activeAgent.type;

                return (
                  <button
                    key={v.name}
                    onClick={() =>
                      handleUpdate({
                        voiceName: v.name,
                        personaLabel: `${v.title} (${v.name})`,
                      })
                    }
                    className={`text-left p-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? `${v.accentClass} ring-1 ring-sky-500/50 shadow-sm`
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-white">{v.name}</span>
                        {isRecommended && (
                          <span className="text-[9px] font-mono uppercase bg-sky-950 text-sky-300 px-1 rounded border border-sky-800/40">
                            Recommended
                          </span>
                        )}
                      </div>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <div className="text-[11px] font-medium text-slate-200">{v.title}</div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                      {v.timbre}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Acoustic Soundscapes */}
          <div className="pt-1">
            <span className="text-[11px] text-slate-400 font-mono block mb-2">
              Quick Acoustic Presets for {activeAgent.name}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() =>
                  handleUpdate({
                    voiceName: 'Fenrir',
                    pitch: 0.85,
                    speed: 1.05,
                    beaconFreq: 320,
                    personaLabel: 'Tactical Windows Operator (Low Baritone)',
                  })
                }
                className="px-2.5 py-1 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-300 hover:border-emerald-600/50 hover:text-emerald-300 transition-colors"
              >
                Deep Command (0.85x)
              </button>
              <button
                onClick={() =>
                  handleUpdate({
                    voiceName: 'Puck',
                    pitch: 1.2,
                    speed: 1.25,
                    beaconFreq: 680,
                    personaLabel: 'High-Speed Web Crawler (Rapid Agile)',
                  })
                }
                className="px-2.5 py-1 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-300 hover:border-indigo-600/50 hover:text-indigo-300 transition-colors"
              >
                High-Speed Crawler (1.25x)
              </button>
              <button
                onClick={() =>
                  handleUpdate({
                    voiceName: 'Kore',
                    pitch: 0.95,
                    speed: 0.95,
                    beaconFreq: 440,
                    personaLabel: 'Methodical Document Analyst',
                  })
                }
                className="px-2.5 py-1 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-300 hover:border-amber-600/50 hover:text-amber-300 transition-colors"
              >
                Precision Analyst (0.95x)
              </button>
              <button
                onClick={() =>
                  handleUpdate({
                    voiceName: 'Zephyr',
                    pitch: 1.0,
                    speed: 1.05,
                    beaconFreq: 520,
                    personaLabel: 'Balanced Master Orchestrator',
                  })
                }
                className="px-2.5 py-1 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-300 hover:border-sky-600/50 hover:text-sky-300 transition-colors"
              >
                Studio Balanced (1.0x)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sliders, Beacon Chime, and Audition Stage (5 cols) */}
        <div className="lg:col-span-5 space-y-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Waves className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase font-mono">
              Pitch, Speed & Identifier Beacon
            </h3>
          </div>

          {/* Pitch Modulation Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span>Pitch Modulation</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentConfig.pitch < 0.9
                    ? '(Deep Bass)'
                    : currentConfig.pitch > 1.1
                    ? '(High Treble)'
                    : '(Balanced)'}
                </span>
              </span>
              <span className="font-mono text-sky-400 font-semibold text-xs">
                {currentConfig.pitch.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={currentConfig.pitch}
              onChange={(e) => handleUpdate({ pitch: parseFloat(e.target.value) })}
              className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>0.5x (Bass)</span>
              <span>1.0x (Normal)</span>
              <span>1.5x (Treble)</span>
            </div>
          </div>

          {/* Speed / Cadence Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span>Speed / Tempo</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentConfig.speed < 0.9
                    ? '(Measured)'
                    : currentConfig.speed > 1.15
                    ? '(Rapid Telemetry)'
                    : '(Natural)'}
                </span>
              </span>
              <span className="font-mono text-emerald-400 font-semibold text-xs">
                {currentConfig.speed.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.7"
              step="0.05"
              value={currentConfig.speed}
              onChange={(e) => handleUpdate({ speed: parseFloat(e.target.value) })}
              className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>0.7x (Deliberate)</span>
              <span>1.0x (Standard)</span>
              <span>1.7x (Fast Ops)</span>
            </div>
          </div>

          {/* Auditory Identifier Beacon (Chime) */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium text-slate-200">
                  Acoustic Beacon Chime
                </span>
              </div>
              <button
                onClick={() => handleUpdate({ enableChime: !currentConfig.enableChime })}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  currentConfig.enableChime
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {currentConfig.enableChime ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>Frequency</span>
                  <span className="text-amber-300">{currentConfig.beaconFreq || 440} Hz</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="900"
                  step="20"
                  value={currentConfig.beaconFreq || 440}
                  onChange={(e) => handleUpdate({ beaconFreq: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>
              <button
                onClick={handlePlayChimeOnly}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-mono flex items-center gap-1 border border-slate-700 transition-colors shrink-0"
                title="Preview acoustic identifier chime"
              >
                <Volume2 className="w-3 h-3 text-amber-400" />
                <span>Test Tone</span>
              </button>
            </div>

            {/* Spoken prefix toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span className="text-[11px] text-slate-400">
                Spoken Identifier Prefix (e.g. &quot;[{activeAgent.name}]&quot;)
              </span>
              <button
                onClick={() => handleUpdate({ announcePrefix: !currentConfig.announcePrefix })}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  currentConfig.announcePrefix
                    ? 'bg-sky-950/60 text-sky-300 border-sky-800/60'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {currentConfig.announcePrefix ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Interactive Audition Stage */}
          <div className="pt-1 space-y-2">
            <label className="text-xs font-semibold text-slate-300 font-mono block">
              Audition Voice Output
            </label>
            <input
              type="text"
              value={effectiveAuditionText}
              onChange={(e) => setAuditionText(e.target.value)}
              placeholder="Type test utterance..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-sans"
            />

            <div className="flex gap-2">
              <button
                onClick={handleAudition}
                disabled={isAuditioning}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  isAuditioning
                    ? 'bg-sky-600 text-white animate-pulse'
                    : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-900/40 cursor-pointer'
                }`}
              >
                {isAuditioning ? (
                  <>
                    <Waves className="w-4 h-4 animate-spin text-white" />
                    <span>Transmitting Audio...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Audition {activeAgent.name}</span>
                  </>
                )}
              </button>

              {isAuditioning && (
                <button
                  onClick={() => speechService.stopSpeaking()}
                  className="px-3 py-2 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 text-xs flex items-center gap-1 hover:bg-rose-900 transition-colors"
                  title="Stop playback"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
