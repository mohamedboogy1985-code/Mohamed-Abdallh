import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AgentInfo,
  OrchestrationAction,
  InternalReasoning,
  VirtualFile,
  VirtualProcess,
  BrowserTab,
  TerminalEntry,
  NexusLog,
  TaskPriority,
  AgentDataHandoff,
  AgentType,
  AgentVoiceConfig,
} from './types/nexus';
import {
  INITIAL_FILES,
  INITIAL_PROCESSES,
  INITIAL_AGENTS,
} from './utils/virtualOsState';
import { speechService } from './utils/speechService';
import { executeAction, executeTerminalCommand } from './utils/executionEngine';
import { HeaderVoiceBar } from './components/HeaderVoiceBar';
import { AgentSwarmView } from './components/AgentSwarmView';
import { TerminalView } from './components/TerminalView';
import { FileExplorerView } from './components/FileExplorerView';
import { BrowserView } from './components/BrowserView';
import { TaskManagerView } from './components/TaskManagerView';
import { SafetyConfirmModal } from './components/SafetyConfirmModal';
import { CommandPalette } from './components/CommandPalette';
import {
  Layers,
  Terminal,
  FolderOpen,
  Globe,
  Activity,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  // Agent & Orchestration State
  const [agents, setAgents] = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [actions, setActions] = useState<OrchestrationAction[]>([]);
  const [internalReasoning, setInternalReasoning] = useState<InternalReasoning | null>(null);
  const [spokenResponse, setSpokenResponse] = useState<string | null>(null);
  const [logs, setLogs] = useState<NexusLog[]>([]);

  // Inter-Agent Data Handoffs State
  const [handoffs, setHandoffs] = useState<AgentDataHandoff[]>([
    {
      id: 'handoff-init-1',
      fromAgent: 'Web-Agent',
      toAgent: 'File-Processor-Agent',
      timestamp: '10:05 AM',
      payloadType: 'dataset',
      title: 'market_intel_sample.csv',
      description: 'Scraped 4 competitor pricing records from web portal',
      payloadPath: 'C:\\Users\\User\\Downloads\\market_intel_sample.csv',
      status: 'transferred',
    },
  ]);

  // Virtual OS State
  const [files, setFiles] = useState<VirtualFile[]>(INITIAL_FILES);
  const [processes, setProcesses] = useState<VirtualProcess[]>(INITIAL_PROCESSES);
  const [cwd, setCwd] = useState<string>('C:\\Users\\User\\Desktop');

  // Terminal Entries
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([
    {
      id: 'init-1',
      output: 'Nexus-OS System Kernel v2.6.4 (Windows 11 x64 Architecture)\nType "help" for a list of available system commands.',
      type: 'system',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Browser State
  const [browserTabs, setBrowserTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      title: 'Bing: Microsoft & Autonomous Systems',
      url: 'https://www.bing.com',
      snippet: 'Bing Search Portal. Ready for autonomous queries and web scraping.',
    },
  ]);
  const [activeBrowserTabId, setActiveBrowserTabId] = useState<string>('tab-1');

  // UI Active Navigation Tab
  type ActiveTab = 'swarm' | 'terminal' | 'explorer' | 'browser' | 'tasks';
  const [activeNavTab, setActiveNavTab] = useState<ActiveTab>('swarm');

  // Voice Interaction State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Safety Confirmation State
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [pendingSafetyAction, setPendingSafetyAction] = useState<{
    prompt: string;
    warningText: string;
    plan: any;
  } | null>(null);

  // Command Palette State (Ctrl+K)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // References to keep state accessible in async callbacks
  const filesRef = useRef(files);
  filesRef.current = files;
  const processesRef = useRef(processes);
  processesRef.current = processes;
  const browserTabsRef = useRef(browserTabs);
  browserTabsRef.current = browserTabs;
  const activeBrowserTabIdRef = useRef(activeBrowserTabId);
  activeBrowserTabIdRef.current = activeBrowserTabId;
  const agentsRef = useRef(agents);
  agentsRef.current = agents;

  // Sub-Agent Voice Output Announcement Configuration
  const [subAgentAnnounceEnabled, setSubAgentAnnounceEnabled] = useState(true);
  const subAgentAnnounceEnabledRef = useRef(subAgentAnnounceEnabled);
  subAgentAnnounceEnabledRef.current = subAgentAnnounceEnabled;

  // Append to Event Log
  const addLog = useCallback((log: NexusLog) => {
    setLogs((prev) => [...prev, log]);
  }, []);

  // Update Voice Config for specialized sub-agent
  const handleUpdateVoiceConfig = useCallback(
    (agentType: AgentType, updatedConfig: AgentVoiceConfig) => {
      setAgents((prev) =>
        prev.map((ag) => (ag.type === agentType ? { ...ag, voiceConfig: updatedConfig } : ag))
      );
      addLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        source: agentType,
        level: 'info',
        message: `Auditory signature updated: ${updatedConfig.voiceName} (Pitch: ${updatedConfig.pitch}x, Speed: ${updatedConfig.speed}x, Beacon: ${updatedConfig.beaconFreq || 440}Hz).`,
      });
    },
    [addLog]
  );

  // Append to Terminal Output
  const appendTerminalOutput = useCallback(
    (output: string, type: 'output' | 'error' | 'system' | 'command' = 'output', command?: string) => {
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `term-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          command,
          output,
          type,
          timestamp: new Date().toLocaleTimeString(),
          cwd,
        },
      ]);
    },
    [cwd]
  );

  // Run a queue of actions autonomously, sorted by priority (HIGH -> MEDIUM -> LOW)
  const runActionPipeline = async (actionQueue: OrchestrationAction[]) => {
    // Priority Scheduler: schedule critical system tasks ahead of background processes
    const priorityWeights: Record<TaskPriority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const sortedQueue = [...actionQueue].sort(
      (a, b) =>
        (priorityWeights[b.priority || 'MEDIUM'] || 2) -
        (priorityWeights[a.priority || 'MEDIUM'] || 2)
    );

    setActions(sortedQueue);

    for (let i = 0; i < sortedQueue.length; i++) {
      const currentAction = sortedQueue[i];

      // Update action status to in_progress
      setActions((prev) =>
        prev.map((a, idx) => (idx === i ? { ...a, status: 'in_progress' } : a))
      );

      // Set corresponding sub-agent status to executing
      setAgents((prev) =>
        prev.map((ag) =>
          ag.type === currentAction.agent
            ? { ...ag, status: 'executing', currentTask: currentAction.description }
            : ag
        )
      );

      // Add delay to simulate realistic autonomous execution
      await new Promise((res) => setTimeout(res, 850));

      const execResult = await executeAction(currentAction, {
        files: filesRef.current,
        processes: processesRef.current,
        browserTabs: browserTabsRef.current,
        activeBrowserTabId: activeBrowserTabIdRef.current,
        cwd,
        onUpdateFiles: (newFiles) => setFiles(newFiles),
        onUpdateProcesses: (newProcs) => setProcesses(newProcs),
        onUpdateBrowserTabs: (newTabs, newActiveId) => {
          setBrowserTabs(newTabs);
          if (newActiveId) setActiveBrowserTabId(newActiveId);
        },
        onAddLog: addLog,
        onTerminalOutput: appendTerminalOutput,
      });

      // Update action status
      setActions((prev) =>
        prev.map((a, idx) =>
          idx === i
            ? {
                ...a,
                status: execResult.success ? 'done' : 'failed',
                result: execResult.result,
                error: execResult.error,
              }
            : a
        )
      );

      // Update agent completed count and set to idle
      setAgents((prev) =>
        prev.map((ag) =>
          ag.type === currentAction.agent
            ? {
                ...ag,
                status: 'idle',
                currentTask: undefined,
                completedTasksCount: execResult.success
                  ? ag.completedTasksCount + 1
                  : ag.completedTasksCount,
              }
            : ag
        )
      );

      // Unique Auditory Identification for Sub-Agent Outputs
      if (subAgentAnnounceEnabledRef.current && currentAction.agent !== 'Nexus-Master') {
        const agInfo = agentsRef.current.find((a) => a.type === currentAction.agent);
        const vc = agInfo?.voiceConfig;
        const prefix = vc?.announcePrefix ? `[${agInfo?.name || currentAction.agent}]: ` : '';
        const announceMsg = execResult.success
          ? `${prefix}Execution complete: ${currentAction.description}.`
          : `${prefix}Notice: Issue encountered on ${currentAction.description}.`;

        speechService.speak(announceMsg, {
          voiceName: vc?.voiceName || 'Zephyr',
          pitch: vc?.pitch || 1.0,
          speed: vc?.speed || 1.0,
          enableChime: vc?.enableChime ?? true,
          beaconFreq: vc?.beaconFreq || 440,
          agentType: currentAction.agent,
        });
      }

      // Inter-Agent Data Handoff Pipeline:
      // When a sub-agent completes a task with handoffTo, emit handoff and pass data to recipient sub-agent
      if (execResult.success && currentAction.handoffTo) {
        const payloadTitle =
          currentAction.handoffPayloadTitle ||
          currentAction.params?.filename ||
          (currentAction.params?.targetPath
            ? currentAction.params.targetPath.split('\\').pop()
            : currentAction.params?.path
            ? currentAction.params.path.split('\\').pop()
            : 'refined_dataset.csv');

        const newHandoff: AgentDataHandoff = {
          id: `handoff-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          fromAgent: currentAction.agent,
          toAgent: currentAction.handoffTo,
          timestamp: new Date().toLocaleTimeString(),
          payloadType:
            payloadTitle.endsWith('.csv') || payloadTitle.endsWith('.xlsx')
              ? 'dataset'
              : 'file',
          title: payloadTitle,
          description: `Passed refined artifact from ${currentAction.description} to ${currentAction.handoffTo}`,
          payloadPath: currentAction.params?.targetPath || currentAction.params?.path,
          status: 'transferred',
        };

        setHandoffs((prev) => [newHandoff, ...prev]);

        addLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          source: currentAction.agent,
          level: 'success',
          message: `[Inter-Agent Pipeline] Passed refined artifact '${newHandoff.title}' to ${currentAction.handoffTo}.`,
        });

        // Automatically pass output file/dataset path to downstream actions belonging to the recipient agent
        for (let j = i + 1; j < sortedQueue.length; j++) {
          if (sortedQueue[j].agent === currentAction.handoffTo) {
            if (newHandoff.payloadPath) {
              sortedQueue[j].params = {
                ...sortedQueue[j].params,
                path: newHandoff.payloadPath,
              };
            }
            break;
          }
        }
      }

      // Small pacing pause
      await new Promise((res) => setTimeout(res, 200));
    }

    addLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'Nexus-Master',
      level: 'success',
      message: 'Autonomous pipeline finished all priority-scheduled operations.',
    });
  };

  // Re-prioritize queued action dynamically and re-sort queue
  const handleUpdateActionPriority = (actionId: string, newPriority: TaskPriority) => {
    setActions((prev) => {
      const updated = prev.map((act) =>
        act.id === actionId ? { ...act, priority: newPriority } : act
      );
      // Keep running and finished actions in place, but reorder pending tasks by priority!
      const activeOrDone = updated.filter((a) => a.status !== 'pending');
      const pending = updated.filter((a) => a.status === 'pending');
      const priorityWeights: Record<TaskPriority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      pending.sort(
        (a, b) => (priorityWeights[b.priority] || 2) - (priorityWeights[a.priority] || 2)
      );
      return [...activeOrDone, ...pending];
    });

    addLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'Nexus-Master',
      level: 'info',
      message: `Priority adjustment: Task re-scheduled to ${newPriority}. Queue automatically re-sorted.`,
    });
  };

  // Main task orchestration handler with optional user priority
  const handleProcessRequest = async (
    userPrompt: string,
    isExplicitlyAuthorized = false,
    userPriority?: TaskPriority
  ) => {
    if (!userPrompt.trim()) return;

    // Detect priority from natural voice prompt if not explicitly set
    let effectivePriority = userPriority;
    const lowerPrompt = userPrompt.toLowerCase();
    if (!effectivePriority) {
      if (
        lowerPrompt.includes('urgent') ||
        lowerPrompt.includes('critical') ||
        lowerPrompt.includes('high priority')
      ) {
        effectivePriority = 'HIGH';
      } else if (
        lowerPrompt.includes('background') ||
        lowerPrompt.includes('low priority')
      ) {
        effectivePriority = 'LOW';
      }
    }

    setIsProcessing(true);
    setTranscript('');

    // Set Master agent status
    setAgents((prev) =>
      prev.map((a) => (a.type === 'Nexus-Master' ? { ...a, status: 'analyzing' } : a))
    );

    addLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'Nexus-Master',
      level: 'info',
      message: `Analyzing user intent: "${userPrompt}" [Priority: ${effectivePriority || 'Auto'}]`,
    });

    try {
      const response = await fetch('/api/nexus/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          userPriority: effectivePriority,
          currentFiles: filesRef.current,
          activeProcesses: processesRef.current,
          browserState: {
            url: browserTabsRef.current.find((t) => t.id === activeBrowserTabIdRef.current)?.url,
          },
          isAuthorized: isExplicitlyAuthorized,
        }),
      });

      if (!response.ok) {
        throw new Error(`Orchestrator error: ${response.statusText}`);
      }

      const plan = await response.json();

      setInternalReasoning(plan.internalReasoning || null);
      setSpokenResponse(plan.spokenResponse || null);

      // Speak response using voice engine
      if (plan.spokenResponse) {
        speechService.speak(plan.spokenResponse);
      }

      // Check for High-Risk Safety Gate Intercept
      if (plan.requiresConfirmation && !isExplicitlyAuthorized) {
        setPendingSafetyAction({
          prompt: userPrompt,
          warningText:
            plan.confirmationPrompt ||
            'High-risk operation detected. Authorization required before execution.',
          plan,
        });
        setSafetyModalOpen(true);
        setIsProcessing(false);
        setAgents((prev) =>
          prev.map((a) => (a.type === 'Nexus-Master' ? { ...a, status: 'idle' } : a))
        );
        return;
      }

      // Execute actions autonomously
      if (plan.actions && plan.actions.length > 0) {
        await runActionPipeline(
          plan.actions.map((act: any) => ({
            ...act,
            priority: act.priority || 'MEDIUM',
            status: 'pending',
          }))
        );
      }
    } catch (err: any) {
      console.error('Task orchestration error:', err);
      addLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        source: 'Nexus-Master',
        level: 'error',
        message: `Task orchestration error: ${err.message}`,
      });
      speechService.speak('An error occurred during task orchestration. Checking diagnostic logs.');
    } finally {
      setIsProcessing(false);
      setAgents((prev) =>
        prev.map((a) => (a.type === 'Nexus-Master' ? { ...a, status: 'idle' } : a))
      );
    }
  };

  // Wire Speech callbacks
  useEffect(() => {
    speechService.setCallbacks({
      onListeningChange: (listening) => setIsListening(listening),
      onSpeakingChange: (speaking) => setIsSpeaking(speaking),
      onTranscript: (text, isFinal) => {
        setTranscript(text);

        // Check if safety modal is waiting for voice confirmation
        if (safetyModalOpen && pendingSafetyAction) {
          const lower = text.toLowerCase();
          if (
            lower.includes('authorize') ||
            lower.includes('confirm') ||
            lower.includes('yes') ||
            lower.includes('proceed')
          ) {
            handleConfirmSafety();
            return;
          }
          if (
            lower.includes('cancel') ||
            lower.includes('abort') ||
            lower.includes('stop') ||
            lower.includes('no')
          ) {
            handleCancelSafety();
            return;
          }
        }

        if (isFinal && text.trim().length > 3) {
          speechService.stopListening();
          handleProcessRequest(text.trim());
        }
      },
    });

    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, [safetyModalOpen, pendingSafetyAction]);

  // Handle Safety Confirmation
  const handleConfirmSafety = () => {
    if (pendingSafetyAction) {
      setSafetyModalOpen(false);
      const originalPrompt = pendingSafetyAction.prompt;
      setPendingSafetyAction(null);
      handleProcessRequest(originalPrompt, true);
    }
  };

  const handleCancelSafety = () => {
    setSafetyModalOpen(false);
    setPendingSafetyAction(null);
    speechService.speak('Action aborted. Critical system files remain untouched.');
    addLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'Nexus-Master',
      level: 'warn',
      message: 'Safety intercept: High-risk action was declined by user.',
    });
  };

  // User Terminal Command Handler
  const handleTerminalCommand = (command: string) => {
    appendTerminalOutput('', 'command', command);
    const result = executeTerminalCommand(command, {
      files,
      processes,
      cwd,
      onUpdateFiles: (newFiles) => setFiles(newFiles),
      onUpdateProcesses: (newProcs) => setProcesses(newProcs),
    });
    appendTerminalOutput(result.text, result.isError ? 'error' : 'output');
  };

  // File explorer callbacks
  const handleDeleteFile = (path: string) => {
    // If system32, trigger prompt
    if (path.toLowerCase().includes('system32')) {
      handleProcessRequest(`Delete file ${path}`);
      return;
    }
    setFiles((prev) => prev.filter((f) => f.path.toLowerCase() !== path.toLowerCase()));
    addLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'OS-Agent',
      level: 'info',
      message: `Deleted file: ${path}`,
    });
  };

  const handleCreateFile = (path: string, content: string) => {
    const parts = path.split('\\');
    const name = parts[parts.length - 1];
    const newFile: VirtualFile = {
      id: `f-${Date.now()}`,
      path,
      name,
      extension: name.split('.').pop() || 'txt',
      size: `${Math.max(0.2, content.length / 1024).toFixed(1)} KB`,
      modifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      content,
    };
    setFiles((prev) => [...prev, newFile]);
    addLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'OS-Agent',
      level: 'success',
      message: `Created file: ${path}`,
    });
  };

  const handleParseFile = (path: string) => {
    handleProcessRequest(`Parse document at ${path} and extract key metrics.`);
  };

  const handleBulkRenameFiles = (
    renames: { id: string; oldPath: string; newPath: string; newName: string }[]
  ) => {
    if (!renames || renames.length === 0) return;

    setFiles((prev) =>
      prev.map((file) => {
        const renameItem = renames.find((r) => r.id === file.id);
        if (renameItem) {
          const lastDot = renameItem.newName.lastIndexOf('.');
          const ext = lastDot > 0 ? renameItem.newName.substring(lastDot + 1) : file.extension;
          return {
            ...file,
            name: renameItem.newName,
            path: renameItem.newPath,
            extension: ext,
            modifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
        }
        return file;
      })
    );

    const count = renames.length;
    addLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'OS-Agent',
      level: 'success',
      message: `Bulk renamed ${count} file${count > 1 ? 's' : ''} using regex pattern in File Explorer.`,
    });

    const osAgent = agentsRef.current.find((a) => a.type === 'OS-Agent');
    speechService.speak(
      `Bulk rename executed. Successfully updated ${count} file${count > 1 ? 's' : ''}.`,
      {
        voiceName: osAgent?.voiceConfig?.voiceName || 'Fenrir',
        pitch: osAgent?.voiceConfig?.pitch || 0.9,
        speed: osAgent?.voiceConfig?.speed || 1.05,
        enableChime: osAgent?.voiceConfig?.enableChime,
        beaconFreq: osAgent?.voiceConfig?.beaconFreq || 330,
      }
    );
  };

  // Browser navigation callbacks
  const handleBrowserNavigate = (url: string) => {
    const updated = browserTabs.map((t) =>
      t.id === activeBrowserTabId ? { ...t, url, title: new URL(url).hostname || url } : t
    );
    setBrowserTabs(updated);
    addLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'Web-Agent',
      level: 'info',
      message: `Navigated to ${url}`,
    });
  };

  const handleBrowserSearch = (query: string) => {
    handleProcessRequest(`Search web for "${query}"`);
  };

  const handleBrowserDownload = (filename: string, content: string) => {
    handleProcessRequest(`Download ${filename} to local Downloads folder.`);
  };

  // Task Manager callbacks
  const handleKillProcess = (pid: number) => {
    const proc = processes.find((p) => p.pid === pid);
    if (!proc) return;
    if (proc.isSystem) {
      speechService.speak('Cannot terminate protected Windows core system process.');
      return;
    }
    setProcesses((prev) => prev.filter((p) => p.pid !== pid));
    addLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'OS-Agent',
      level: 'info',
      message: `Terminated process ${proc.name} (PID ${pid})`,
    });
    speechService.speak(`Process ${proc.name} terminated.`);
  };

  const handleLaunchApp = (appName: string) => {
    handleProcessRequest(`Launch application ${appName}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white">
      {/* Voice-First Header & HUD Bar */}
      <HeaderVoiceBar
        isListening={isListening}
        isSpeaking={isSpeaking}
        isProcessing={isProcessing}
        transcript={transcript}
        onToggleListening={() => {
          if (isListening) {
            speechService.stopListening();
          } else {
            speechService.startListening();
          }
        }}
        onSubmitPrompt={(text, priority) => handleProcessRequest(text, false, priority)}
        onStopSpeaking={() => speechService.stopSpeaking()}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Workspace Navigation & Active Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Windows Workspace Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveNavTab('swarm')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeNavTab === 'swarm'
                  ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Agent Swarm & Orchestrator</span>
            </button>

            <button
              onClick={() => setActiveNavTab('terminal')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeNavTab === 'terminal'
                  ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Windows PowerShell</span>
            </button>

            <button
              onClick={() => setActiveNavTab('explorer')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeNavTab === 'explorer'
                  ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>File Explorer & Parser</span>
            </button>

            <button
              onClick={() => setActiveNavTab('browser')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeNavTab === 'browser'
                  ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Autonomous Browser</span>
            </button>

            <button
              onClick={() => setActiveNavTab('tasks')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeNavTab === 'tasks'
                  ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <span>Task Manager</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-[11px]">Windows 11 Native Sandbox</span>
          </div>
        </div>

        {/* Dynamic View Panels */}
        <div className="flex-1">
          {activeNavTab === 'swarm' && (
            <AgentSwarmView
              agents={agents}
              actions={actions}
              internalReasoning={internalReasoning}
              spokenResponse={spokenResponse}
              logs={logs}
              handoffs={handoffs}
              onUpdateActionPriority={handleUpdateActionPriority}
              onUpdateVoiceConfig={handleUpdateVoiceConfig}
              subAgentAnnounceEnabled={subAgentAnnounceEnabled}
              onToggleSubAgentAnnounce={setSubAgentAnnounceEnabled}
            />
          )}

          {activeNavTab === 'terminal' && (
            <TerminalView
              entries={terminalEntries}
              cwd={cwd}
              onExecuteCommand={handleTerminalCommand}
              onClear={() => setTerminalEntries([])}
            />
          )}

          {activeNavTab === 'explorer' && (
            <FileExplorerView
              files={files}
              onDeleteFile={handleDeleteFile}
              onCreateFile={handleCreateFile}
              onParseFile={handleParseFile}
              onBulkRenameFiles={handleBulkRenameFiles}
            />
          )}

          {activeNavTab === 'browser' && (
            <BrowserView
              tabs={browserTabs}
              activeTabId={activeBrowserTabId}
              onSelectTab={(id) => setActiveBrowserTabId(id)}
              onNavigate={handleBrowserNavigate}
              onSearch={handleBrowserSearch}
              onDownloadFile={handleBrowserDownload}
            />
          )}

          {activeNavTab === 'tasks' && (
            <TaskManagerView
              processes={processes}
              onKillProcess={handleKillProcess}
              onLaunchApp={handleLaunchApp}
            />
          )}
        </div>
      </main>

      {/* Safety Gate Confirmation Modal */}
      <SafetyConfirmModal
        isOpen={safetyModalOpen}
        promptText={pendingSafetyAction?.warningText || ''}
        isListening={isListening}
        onConfirm={handleConfirmSafety}
        onCancel={handleCancelSafety}
      />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        files={files}
        browserTabs={browserTabs}
        onSelectFile={(_file) => {
          setActiveNavTab('explorer');
        }}
        onSelectBrowserTab={(tabId) => {
          setActiveNavTab('browser');
          setActiveBrowserTabId(tabId);
        }}
        onExecuteCommand={(cmd) => {
          setActiveNavTab('terminal');
          handleTerminalCommand(cmd);
        }}
        onNavigateView={(view) => setActiveNavTab(view)}
      />
    </div>
  );
}
