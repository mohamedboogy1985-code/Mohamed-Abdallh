import { VirtualFile, VirtualProcess, AgentInfo } from '../types/nexus';

export const INITIAL_FILES: VirtualFile[] = [
  {
    id: 'f-1',
    path: 'C:\\Users\\User\\Desktop\\README_NEXUS.txt',
    name: 'README_NEXUS.txt',
    extension: 'txt',
    size: '1.4 KB',
    modifiedAt: '2026-10-11 09:30',
    content: `Nexus-OS Master Autonomous Orchestrator
Operating System: Windows 11 Enterprise (x64)
Agents Online:
- OS-Agent (System commands, Terminal, Process supervisor)
- Web-Agent (Autonomous browser, Search engine, Web scraper)
- File-Processor-Agent (Spreadsheet parser, PDF converter, CSV extractor)

Primary Mode: Real-Time Voice (Speech-to-Speech).
Issue requests by speaking into your mic or typing queries.`,
  },
  {
    id: 'f-2',
    path: 'C:\\Users\\User\\Desktop\\Project_Roadmap.md',
    name: 'Project_Roadmap.md',
    extension: 'md',
    size: '3.2 KB',
    modifiedAt: '2026-10-10 14:15',
    content: `# Autonomous AI Operations - Q4 2026
1. Voice-first direct control loop with sub-agent concurrency.
2. Windows kernel sandboxing with safety-gate for System32 operations.
3. Web scraping and automated data conversion pipelines.
4. Auto-recovering error telemetry with self-healing strategies.`,
  },
  {
    id: 'f-3',
    path: 'C:\\Users\\User\\Documents\\quarterly_financials.xlsx',
    name: 'quarterly_financials.xlsx',
    extension: 'xlsx',
    size: '42.8 KB',
    modifiedAt: '2026-10-09 18:40',
    content: 'Binary Excel Worksheet data [Q3-Q4 Financials]',
    parsedData: {
      columns: ['Quarter', 'Revenue ($M)', 'Gross Margin (%)', 'EBITDA ($M)', 'R&D Spend ($M)'],
      rows: [
        { Quarter: 'Q1 2026', 'Revenue ($M)': 142.5, 'Gross Margin (%)': '68.4%', 'EBITDA ($M)': 42.1, 'R&D Spend ($M)': 28.5 },
        { Quarter: 'Q2 2026', 'Revenue ($M)': 164.2, 'Gross Margin (%)': '71.2%', 'EBITDA ($M)': 51.8, 'R&D Spend ($M)': 31.0 },
        { Quarter: 'Q3 2026', 'Revenue ($M)': 188.9, 'Gross Margin (%)': '73.0%', 'EBITDA ($M)': 64.3, 'R&D Spend ($M)': 34.2 },
        { Quarter: 'Q4 2026 (Est)', 'Revenue ($M)': 215.0, 'Gross Margin (%)': '74.5%', 'EBITDA ($M)': 77.2, 'R&D Spend ($M)': 38.0 },
      ],
      summary: 'Net revenue accelerated by 24.3% over consecutive quarters. Free cash flow margin expanded by 340 bps.',
    },
  },
  {
    id: 'f-4',
    path: 'C:\\Users\\User\\Documents\\research_brief_ai_agents.pdf',
    name: 'research_brief_ai_agents.pdf',
    extension: 'pdf',
    size: '1.8 MB',
    modifiedAt: '2026-10-08 11:20',
    content: `MULTI-AGENT AUTONOMOUS SYSTEMS: AN ARCHITECTURAL EVALUATION
Authors: Nexus Research Lab
Abstract: We present an evaluation of hierarchical master orchestrators supervising specialised sub-agents on Windows operating environments. Parallel execution demonstrates an 80% reduction in end-to-end task latency when decomposing system actions, web ingestion, and tabular file processing.`,
    parsedData: {
      summary: 'Summary: Hierarchical master-agent architecture yields 80% lower latency by decoupling local OS operations from web scraping and file conversions.',
    },
  },
  {
    id: 'f-5',
    path: 'C:\\Users\\User\\Downloads\\market_intel_sample.csv',
    name: 'market_intel_sample.csv',
    extension: 'csv',
    size: '14.2 KB',
    modifiedAt: '2026-10-11 10:05',
    content: `Product,MarketShare,AvgPrice,Rating\nNexus AI,38.4%,$120,4.9\nLegacyTool A,24.1%,$180,3.8\nGenericAgent B,18.5%,$95,4.1\nCloudRunner C,11.2%,$140,4.2`,
    parsedData: {
      columns: ['Product', 'MarketShare', 'AvgPrice', 'Rating'],
      rows: [
        { Product: 'Nexus AI', MarketShare: '38.4%', AvgPrice: '$120', Rating: '4.9' },
        { Product: 'LegacyTool A', MarketShare: '24.1%', AvgPrice: '$180', Rating: '3.8' },
        { Product: 'GenericAgent B', MarketShare: '18.5%', AvgPrice: '$95', Rating: '4.1' },
        { Product: 'CloudRunner C', MarketShare: '11.2%', AvgPrice: '$140', Rating: '4.2' },
      ],
    },
  },
  {
    id: 'f-6',
    path: 'C:\\Windows\\System32\\backup_config.dll',
    name: 'backup_config.dll',
    extension: 'dll',
    size: '256 KB',
    modifiedAt: '2026-08-14 02:00',
    content: '[Protected Windows System Component: Critical Core Configuration]',
  },
];

export const INITIAL_PROCESSES: VirtualProcess[] = [
  { pid: 1024, name: 'explorer.exe', cpu: 1.2, memory: '184 MB', status: 'running', isSystem: true },
  { pid: 3480, name: 'powershell.exe', cpu: 0.4, memory: '64 MB', status: 'running' },
  { pid: 4096, name: 'nexus_orchestrator.exe', cpu: 2.8, memory: '312 MB', status: 'running', isSystem: true },
  { pid: 7812, name: 'msedge.exe', cpu: 2.1, memory: '420 MB', status: 'running' },
  { pid: 8820, name: 'rogue_background_worker.exe', cpu: 46.5, memory: '890 MB', status: 'running' },
  { pid: 9104, name: 'code.exe', cpu: 1.9, memory: '520 MB', status: 'running' },
];

export const INITIAL_AGENTS: AgentInfo[] = [
  {
    id: 'agent-master',
    type: 'Nexus-Master',
    name: 'Nexus-OS (Master)',
    role: 'Central Orchestrator & Voice Interface',
    description: 'Understands voice input natively, performs safety analysis, breaks down user intents, delegates to sub-agents, and synthesizes voice answers.',
    status: 'idle',
    completedTasksCount: 14,
    icon: 'Radio',
    accentColor: '#38bdf8', // sky-400
    voiceConfig: {
      agentType: 'Nexus-Master',
      voiceName: 'Zephyr',
      pitch: 1.0,
      speed: 1.05,
      sampleGreeting: 'Nexus-OS master synthesis active. Orchestrating system workflows.',
      personaLabel: 'Master Orchestrator (Balanced & Direct)',
      beaconFreq: 520,
      enableChime: true,
      announcePrefix: false,
      timbreDescription: 'Crisp, authoritative, clear cadence',
    },
  },
  {
    id: 'agent-os',
    type: 'OS-Agent',
    name: 'OS-Agent',
    role: 'Windows System & Terminal Execution',
    description: 'Manages local file system, runs PowerShell/CMD commands, manages Windows settings, launches/terminates processes, and monitors hardware.',
    status: 'idle',
    completedTasksCount: 9,
    icon: 'Terminal',
    accentColor: '#10b981', // emerald-500
    voiceConfig: {
      agentType: 'OS-Agent',
      voiceName: 'Fenrir',
      pitch: 0.85,
      speed: 1.0,
      sampleGreeting: 'OS-Agent standing by. Windows kernel and PowerShell execution ready.',
      personaLabel: 'Kernel Tactician (Deep & Resonant)',
      beaconFreq: 330,
      enableChime: true,
      announcePrefix: true,
      timbreDescription: 'Deep, low-register, decisive execution',
    },
  },
  {
    id: 'agent-web',
    type: 'Web-Agent',
    name: 'Web-Agent',
    role: 'Autonomous Web Browsing & Scraping',
    description: 'Conducts autonomous web searches, scrapes online datasets, navigates portals, and downloads files directly into designated local directories.',
    status: 'idle',
    completedTasksCount: 12,
    icon: 'Globe',
    accentColor: '#6366f1', // indigo-500
    voiceConfig: {
      agentType: 'Web-Agent',
      voiceName: 'Puck',
      pitch: 1.15,
      speed: 1.2,
      sampleGreeting: 'Web-Agent online. Crawling web portals, downloading assets, and scraping tables.',
      personaLabel: 'Cyber Navigator (Fast & Agile)',
      beaconFreq: 680,
      enableChime: true,
      announcePrefix: true,
      timbreDescription: 'Higher pitch, energetic, fast scanning tempo',
    },
  },
  {
    id: 'agent-processor',
    type: 'File-Processor-Agent',
    name: 'File-Processor-Agent',
    role: 'Document Ingestion & Conversion',
    description: 'Parses complex Excel, PDF, CSV, and text files. Extracts summaries, recalculates tabular metrics, and converts document formats.',
    status: 'idle',
    completedTasksCount: 8,
    icon: 'FileSpreadsheet',
    accentColor: '#f59e0b', // amber-500
    voiceConfig: {
      agentType: 'File-Processor-Agent',
      voiceName: 'Kore',
      pitch: 0.95,
      speed: 0.95,
      sampleGreeting: 'File-Processor-Agent online. Parsed structured document and verified financial metrics.',
      personaLabel: 'Data Analyst (Smooth & Methodical)',
      beaconFreq: 440,
      enableChime: true,
      announcePrefix: true,
      timbreDescription: 'Smooth, calm, methodical cadence',
    },
  },
];
