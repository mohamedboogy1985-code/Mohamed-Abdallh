import {
  AgentType,
  OrchestrationAction,
  VirtualFile,
  VirtualProcess,
  BrowserTab,
  NexusLog,
} from '../types/nexus';

export interface ExecutionContext {
  files: VirtualFile[];
  processes: VirtualProcess[];
  browserTabs: BrowserTab[];
  activeBrowserTabId: string;
  cwd: string;
  onUpdateFiles: (files: VirtualFile[]) => void;
  onUpdateProcesses: (processes: VirtualProcess[]) => void;
  onUpdateBrowserTabs: (tabs: BrowserTab[], activeId?: string) => void;
  onAddLog: (log: NexusLog) => void;
  onTerminalOutput: (output: string, type?: 'output' | 'error' | 'system') => void;
}

/**
 * Execute a single action delegated by Nexus-OS
 */
export async function executeAction(
  action: OrchestrationAction,
  context: ExecutionContext
): Promise<{ success: boolean; result: string; error?: string }> {
  const startTime = Date.now();
  const { type, params, agent } = action;

  try {
    context.onAddLog({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      source: agent,
      level: 'info',
      message: `Executing: ${action.description}`,
    });

    switch (type) {
      // OS-Agent Actions
      case 'RUN_COMMAND': {
        const cmd = params.command || '';
        const output = executeTerminalCommand(cmd, context);
        context.onTerminalOutput(output.text, output.isError ? 'error' : 'output');
        return { success: !output.isError, result: output.text, error: output.isError ? output.text : undefined };
      }

      case 'CREATE_FILE': {
        const filePath = params.path || 'C:\\Users\\User\\Desktop\\new_file.txt';
        const parts = filePath.split('\\');
        const fileName = parts[parts.length - 1];
        const ext = fileName.split('.').pop() || 'txt';
        const content = params.content || '';

        const existingIdx = context.files.findIndex((f) => f.path.toLowerCase() === filePath.toLowerCase());
        const updatedFiles = [...context.files];

        if (existingIdx >= 0) {
          updatedFiles[existingIdx] = {
            ...updatedFiles[existingIdx],
            content,
            modifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
            size: `${(content.length / 1024).toFixed(1)} KB`,
          };
        } else {
          updatedFiles.push({
            id: `f-${Date.now()}`,
            path: filePath,
            name: fileName,
            extension: ext,
            content,
            size: `${Math.max(0.2, (content.length / 1024)).toFixed(1)} KB`,
            modifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          });
        }

        context.onUpdateFiles(updatedFiles);
        const resultMsg = `File successfully created: ${filePath} (${content.length} bytes)`;
        context.onTerminalOutput(resultMsg, 'system');
        return { success: true, result: resultMsg };
      }

      case 'DELETE_FILE': {
        const filePath = params.path || '';
        const target = context.files.find((f) => f.path.toLowerCase() === filePath.toLowerCase());

        if (!target) {
          return { success: false, result: '', error: `File not found: ${filePath}` };
        }

        const filtered = context.files.filter((f) => f.id !== target.id);
        context.onUpdateFiles(filtered);
        const resultMsg = `Deleted file: ${filePath}`;
        context.onTerminalOutput(resultMsg, 'system');
        return { success: true, result: resultMsg };
      }

      case 'LAUNCH_APP': {
        const appName = params.appName || 'Notepad';
        const newProc: VirtualProcess = {
          pid: Math.floor(2000 + Math.random() * 7000),
          name: appName.endsWith('.exe') ? appName : `${appName.toLowerCase()}.exe`,
          cpu: 0.8,
          memory: '45 MB',
          status: 'running',
        };
        context.onUpdateProcesses([...context.processes, newProc]);
        const resultMsg = `Process started: ${newProc.name} (PID: ${newProc.pid})`;
        context.onTerminalOutput(resultMsg, 'output');
        return { success: true, result: resultMsg };
      }

      case 'KILL_PROCESS': {
        const pid = params.pid;
        const proc = context.processes.find((p) => p.pid === pid);
        if (!proc) {
          return { success: false, result: '', error: `PID ${pid} not found in task table.` };
        }
        if (proc.isSystem) {
          return { success: false, result: '', error: `Access Denied: Cannot terminate critical system process ${proc.name}` };
        }
        const updated = context.processes.filter((p) => p.pid !== pid);
        context.onUpdateProcesses(updated);
        const resultMsg = `Terminated process ${proc.name} (PID ${pid}). Freed ${proc.memory}.`;
        context.onTerminalOutput(resultMsg, 'system');
        return { success: true, result: resultMsg };
      }

      // Web-Agent Actions
      case 'SEARCH_WEB': {
        const query = params.query || 'Windows AI Agent';
        // Simulate web search results
        const newTab: BrowserTab = {
          id: `tab-${Date.now()}`,
          title: `Search: ${query}`,
          url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
          snippet: `Found 3,420,000 results for "${query}". Top insights indexed into memory.`,
          extractedData: `Query Analysis for "${query}": High relevance verified. 3 reference papers and 2 data tables retrieved.`,
        };
        context.onUpdateBrowserTabs([...context.browserTabs, newTab], newTab.id);
        return {
          success: true,
          result: `Web search completed for: "${query}". Retrieved 3 relevant references.`,
        };
      }

      case 'NAVIGATE_URL': {
        const url = params.url || 'https://learn.microsoft.com';
        const newTab: BrowserTab = {
          id: `tab-${Date.now()}`,
          title: new URL(url).hostname || 'Web Portal',
          url,
          snippet: `Navigated to ${url}. DOM content parsed and rendered.`,
        };
        context.onUpdateBrowserTabs([...context.browserTabs, newTab], newTab.id);
        return { success: true, result: `Navigated to ${url}` };
      }

      case 'DOWNLOAD_FILE': {
        const filename = params.filename || 'downloaded_asset.csv';
        const targetPath = params.targetPath || `C:\\Users\\User\\Downloads\\${filename}`;
        const ext = filename.split('.').pop() || 'csv';

        const sampleContent =
          ext === 'csv'
            ? 'Timestamp,Metric,Value\n2026-10-11,NetworkLatency,14ms\n2026-10-11,AgentThroughput,94.2%\n2026-10-11,SafetyIndex,100%'
            : 'Autonomous web download payload completed.';

        const newFile: VirtualFile = {
          id: `f-${Date.now()}`,
          path: targetPath,
          name: filename,
          extension: ext,
          size: '18.4 KB',
          modifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          content: sampleContent,
          parsedData:
            ext === 'csv'
              ? {
                  columns: ['Timestamp', 'Metric', 'Value'],
                  rows: [
                    { Timestamp: '2026-10-11', Metric: 'NetworkLatency', Value: '14ms' },
                    { Timestamp: '2026-10-11', Metric: 'AgentThroughput', Value: '94.2%' },
                    { Timestamp: '2026-10-11', Metric: 'SafetyIndex', Value: '100%' },
                  ],
                }
              : undefined,
        };

        context.onUpdateFiles([...context.files, newFile]);
        return {
          success: true,
          result: `Downloaded ${filename} directly into ${targetPath}`,
        };
      }

      case 'SCRAPE_PAGE': {
        const url = params.url || 'https://news.ycombinator.com';
        return {
          success: true,
          result: `Scraped DOM nodes from ${url}. Extracted 14 headline elements and 2 tabular data points.`,
        };
      }

      // File-Processor-Agent Actions
      case 'PARSE_DOCUMENT': {
        const targetPath = params.path || '';
        const file = context.files.find((f) => f.path.toLowerCase() === targetPath.toLowerCase());

        if (!file) {
          return { success: false, result: '', error: `File not found for parsing: ${targetPath}` };
        }

        const summary = file.parsedData?.summary || `Parsed ${file.name}: Extracted content structure and metadata.`;
        return {
          success: true,
          result: summary,
        };
      }

      case 'CONVERT_FORMAT': {
        const sourcePath = params.path || '';
        const targetPath = params.targetPath || sourcePath.replace(/\.[^.]+$/, '.pdf');
        const targetExt = params.format || 'pdf';

        const sourceFile = context.files.find((f) => f.path.toLowerCase() === sourcePath.toLowerCase());
        const targetFileName = targetPath.split('\\').pop() || `converted.${targetExt}`;

        const convertedFile: VirtualFile = {
          id: `f-${Date.now()}`,
          path: targetPath,
          name: targetFileName,
          extension: targetExt,
          size: '34.2 KB',
          modifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          content: `CONVERTED DOCUMENT [FORMAT: ${targetExt.toUpperCase()}]\nSource: ${sourcePath}\nGenerated by File-Processor-Agent.`,
          parsedData: {
            summary: `Successfully transformed ${sourceFile?.name || 'document'} into formatted ${targetExt.toUpperCase()} document.`,
          },
        };

        context.onUpdateFiles([...context.files, convertedFile]);
        return {
          success: true,
          result: `Converted ${sourceFile?.name || sourcePath} -> ${targetFileName}`,
        };
      }

      default:
        return { success: true, result: `Action ${type} completed.` };
    }
  } catch (err: any) {
    return { success: false, result: '', error: err.message || 'Execution failed' };
  }
}

/**
 * Executes a simulated Windows Command Prompt / PowerShell command
 */
export function executeTerminalCommand(
  rawCmd: string,
  context: {
    files: VirtualFile[];
    processes: VirtualProcess[];
    cwd: string;
    onUpdateFiles: (files: VirtualFile[]) => void;
    onUpdateProcesses: (processes: VirtualProcess[]) => void;
  }
): { text: string; isError: boolean } {
  const trimmed = rawCmd.trim();
  if (!trimmed) return { text: '', isError: false };

  const parts = trimmed.split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ').trim();

  switch (cmd) {
    case 'help':
      return {
        text: `Nexus-OS Command Shell (Windows 11):
  dir / ls                 List files in current working directory
  type / cat <file>        Display file contents
  echo <text> > <file>     Write text into a file
  del / rm <file>          Delete file
  tasklist / ps            List running system processes
  taskkill /PID <pid>      Terminate process by PID
  ipconfig                 Display Windows IP configuration
  systeminfo               Display system metrics and hardware stats
  agent-status             Display live status of OS, Web, and File-Processor agents
  cls / clear              Clear terminal display`,
        isError: false,
      };

    case 'dir':
    case 'ls':
    case 'get-childitem': {
      const cwd = context.cwd.toLowerCase();
      const currentFolderFiles = context.files.filter((f) => {
        const p = f.path.toLowerCase();
        return p.startsWith(cwd);
      });

      const header = ` Directory of ${context.cwd}\n\n`;
      const rows = currentFolderFiles.map((f) => {
        return `${f.modifiedAt}    ${f.size.padStart(10)}    ${f.name}`;
      });

      return {
        text: `${header}${rows.length > 0 ? rows.join('\n') : '  (No files found)'}\n               ${rows.length} File(s)`,
        isError: false,
      };
    }

    case 'type':
    case 'cat':
    case 'get-content': {
      if (!args) return { text: 'Error: The syntax of the command is incorrect.', isError: true };
      const file = context.files.find((f) => f.name.toLowerCase() === args.toLowerCase() || f.path.toLowerCase() === args.toLowerCase());
      if (!file) return { text: `File Not Found: ${args}`, isError: true };
      return { text: file.content || `[Binary data: ${file.name}]`, isError: false };
    }

    case 'tasklist':
    case 'ps':
    case 'get-process': {
      const header = `Image Name                     PID Session Name        Session#    Mem Usage\n========================= ======== ================ =========== ============`;
      const rows = context.processes.map((p) => {
        return `${p.name.padEnd(25)} ${p.pid.toString().padStart(8)} Services                   0   ${p.memory.padStart(12)}`;
      });
      return { text: `${header}\n${rows.join('\n')}`, isError: false };
    }

    case 'taskkill':
    case 'kill': {
      const pidMatch = args.match(/\/?pid\s+(\d+)/i) || args.match(/^(\d+)$/);
      if (!pidMatch) return { text: 'ERROR: Value for PID required. Usage: taskkill /PID <number>', isError: true };
      const pid = parseInt(pidMatch[1], 10);
      const proc = context.processes.find((p) => p.pid === pid);
      if (!proc) return { text: `ERROR: The process with PID ${pid} could not be found.`, isError: true };
      if (proc.isSystem) return { text: `ERROR: Access Denied. Process ${proc.name} is a protected Windows core service.`, isError: true };

      context.onUpdateProcesses(context.processes.filter((p) => p.pid !== pid));
      return { text: `SUCCESS: Sent termination signal to process with PID ${pid} (${proc.name}).`, isError: false };
    }

    case 'ipconfig':
      return {
        text: `Windows IP Configuration

Ethernet adapter vEthernet (WSL/Nexus):
   Connection-specific DNS Suffix  . : localdomain
   Link-local IPv6 Address . . . . . : fe80::d920:349f:1801:4ab2%12
   IPv4 Address. . . . . . . . . . . : 192.168.1.140
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1`,
        isError: false,
      };

    case 'systeminfo':
      return {
        text: `Host Name:                 NEXUS-WORKSTATION
OS Name:                   Microsoft Windows 11 Enterprise
OS Version:                10.0.26100 N/A Build 26100
System Manufacturer:       Nexus Systems Architecture
System Type:               x64-based PC
Processor(s):              16 Cores Intel Core i9 / Neural NPU Co-processor
Total Physical Memory:     65,536 MB
Available Physical Memory: 48,120 MB
Virtual Memory: Max Size:  74,752 MB
Hotfix(s):                 4 Security Patches Installed
Network Card(s):           10 GbE High-Bandwidth Interface`,
        isError: false,
      };

    case 'agent-status':
      return {
        text: `[Nexus-OS Swarm Status]
• Master Orchestrator: ACTIVE (Voice Pipeline Online)
• OS-Agent: READY (System privileges granted)
• Web-Agent: READY (Browser sandboxing active)
• File-Processor-Agent: READY (Parsers for xlsx, pdf, csv loaded)`,
        isError: false,
      };

    case 'echo': {
      if (args.includes('>')) {
        const [content, target] = args.split('>').map((s) => s.trim());
        const targetPath = target.startsWith('C:') ? target : `C:\\Users\\User\\Desktop\\${target}`;
        const parts = targetPath.split('\\');
        const fileName = parts[parts.length - 1];

        const existingIdx = context.files.findIndex((f) => f.path.toLowerCase() === targetPath.toLowerCase());
        const updated = [...context.files];
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            content,
            modifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
        } else {
          updated.push({
            id: `f-${Date.now()}`,
            path: targetPath,
            name: fileName,
            extension: fileName.split('.').pop() || 'txt',
            content,
            size: '0.4 KB',
            modifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          });
        }
        context.onUpdateFiles(updated);
        return { text: `Wrote text to ${targetPath}`, isError: false };
      }
      return { text: args.replace(/^["']|["']$/g, ''), isError: false };
    }

    default:
      return {
        text: `'${cmd}' is not recognized as an internal or external command, operable program or batch file. Type 'help' for command list.`,
        isError: true,
      };
  }
}
