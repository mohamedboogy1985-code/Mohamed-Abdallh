export type AgentType = 'Nexus-Master' | 'OS-Agent' | 'Web-Agent' | 'File-Processor-Agent';

export type AgentStatus = 'idle' | 'analyzing' | 'executing' | 'completed' | 'error' | 'recovering';

export type PrebuiltVoiceName = 'Zephyr' | 'Fenrir' | 'Puck' | 'Kore' | 'Charon';

export interface AgentVoiceConfig {
  agentType: AgentType;
  voiceName: PrebuiltVoiceName;
  pitch: number;
  speed: number;
  sampleGreeting: string;
  personaLabel: string;
  beaconFreq?: number;
  enableChime?: boolean;
  announcePrefix?: boolean;
  timbreDescription?: string;
}

export interface AgentInfo {
  id: string;
  type: AgentType;
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  currentTask?: string;
  completedTasksCount: number;
  icon: string;
  accentColor: string;
  voiceConfig?: AgentVoiceConfig;
}

export type ActionType =
  | 'RUN_COMMAND'
  | 'CREATE_FILE'
  | 'DELETE_FILE'
  | 'LAUNCH_APP'
  | 'KILL_PROCESS'
  | 'NAVIGATE_URL'
  | 'SEARCH_WEB'
  | 'SCRAPE_PAGE'
  | 'DOWNLOAD_FILE'
  | 'PARSE_DOCUMENT'
  | 'CONVERT_FORMAT'
  | 'NOTIFY';

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AgentDataHandoff {
  id: string;
  fromAgent: AgentType;
  toAgent: AgentType;
  timestamp: string;
  payloadType: 'dataset' | 'file' | 'structured_json' | 'summary';
  title: string;
  description: string;
  payloadPath?: string;
  payloadData?: any;
  status: 'transferred' | 'consumed';
}

export interface OrchestrationAction {
  id: string;
  agent: AgentType;
  type: ActionType;
  description: string;
  priority: TaskPriority;
  params: Record<string, any>;
  status: 'pending' | 'in_progress' | 'done' | 'failed';
  result?: string;
  error?: string;
  durationMs?: number;
  handoffTo?: AgentType;
  handoffPayloadTitle?: string;
  consumedHandoffId?: string;
}

export interface InternalReasoning {
  objective: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskAssessment: string;
  strategy: string;
  delegationSummary: string;
}

export interface OrchestrationResult {
  internalReasoning: InternalReasoning;
  spokenResponse: string;
  requiresConfirmation: boolean;
  confirmationPrompt?: string;
  actions: OrchestrationAction[];
}

export interface VirtualFile {
  id: string;
  path: string;
  name: string;
  extension: string;
  size: string;
  modifiedAt: string;
  content: string;
  isDirectory?: boolean;
  parsedData?: {
    columns?: string[];
    rows?: Record<string, any>[];
    summary?: string;
  };
}

export interface VirtualProcess {
  pid: number;
  name: string;
  cpu: number;
  memory: string;
  status: 'running' | 'suspended';
  isSystem?: boolean;
}

export interface TerminalEntry {
  id: string;
  command?: string;
  output?: string;
  type: 'command' | 'output' | 'error' | 'system';
  timestamp: string;
  cwd?: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  extractedData?: string;
}

export interface NexusLog {
  id: string;
  timestamp: string;
  source: AgentType;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}
