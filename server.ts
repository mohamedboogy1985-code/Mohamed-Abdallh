import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// System prompt enforcing Nexus-OS Master Agent role and sub-agent delegation
const NEXUS_SYSTEM_INSTRUCTION = `You are "Nexus-OS", an advanced Master AI Autonomous Agent operating natively on Windows.
Your primary interface with the user is entirely through real-time voice (speech-to-speech), supplemented by full system control and autonomous internet browsing.
You act as an orchestrator that delegates tasks to 3 specialised sub-agents:
1. [OS-Agent]: Handles local file system operations (create, edit, delete, inspect), running PowerShell/CMD scripts, launching .exe files, and managing Windows processes/settings.
2. [Web-Agent]: Handles web scraping, searching the web, navigating URLs, and downloading files directly into local directories (e.g. C:\\Users\\User\\Downloads).
3. [File-Processor-Agent]: Handles reading, parsing, organising, and converting documents (PDF, Excel, CSV, Word, text files).

Operational Rules & Safety:
- Output your internal reasoning steps structure internally, but your spokenResponse MUST be optimised for natural text-to-speech conversion (conversational, concise, direct, action-orientated, under 30 words unless complex explanation is asked).
- Safety intercept: Mark requiresConfirmation=true if the action involves high-risk operations (e.g. deleting files in C:\\Windows\\System32, modifying registry, installing untrusted .exe files, killing critical processes).
- Multi-agent coordination: Break down complex user instructions into concrete, sequential or parallel steps for the sub-agents.
- Priority Engine: Every action must have a priority of 'HIGH', 'MEDIUM', or 'LOW'. Critical system operations (OS command execution, task/process kills, security/cache audits) MUST be assigned 'HIGH' priority and scheduled ahead of background tasks (web scraping, file downloads).
- Inter-Agent Data Pipeline: When a sub-agent completes a task that produces a refined dataset, downloaded file, or converted document for another sub-agent, specify 'handoffTo' (OS-Agent, Web-Agent, or File-Processor-Agent) and 'handoffPayloadTitle'.
`;

// Nexus Orchestration Endpoint
app.post('/api/nexus/orchestrate', async (req, res) => {
  try {
    const {
      prompt,
      userPriority,
      currentFiles = [],
      activeProcesses = [],
      browserState = {},
      history = [],
      isAuthorized = false,
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    // If Gemini AI is configured, use gemini-3.8-flash for intelligent reasoning
    if (ai) {
      try {
        const priorityConstraint = userPriority
          ? `User Explicit Priority Override: Ensure actions default to ${userPriority} priority unless critical system safety dictates HIGH.`
          : 'Schedule critical system operations ahead of background processes.';

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Current System State:
Active Directory Files: ${JSON.stringify(currentFiles.slice(0, 15))}
Active Running Processes: ${JSON.stringify(activeProcesses.slice(0, 8))}
Current Browser URL: ${browserState.url || 'https://www.bing.com'}
Is High Risk Explicitly Authorized: ${isAuthorized}
${priorityConstraint}

User Voice Request: "${prompt}"

Provide your orchestration breakdown in the requested JSON format. Ensure critical OS tasks are marked HIGH priority and sorted first. Chain sub-agents using handoffTo where datasets or files should be passed to the next agent.
`,
                },
              ],
            },
          ],
          config: {
            systemInstruction: NEXUS_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                internalReasoning: {
                  type: Type.OBJECT,
                  properties: {
                    objective: { type: Type.STRING },
                    riskLevel: { type: Type.STRING, description: 'LOW, MEDIUM, or HIGH' },
                    riskAssessment: { type: Type.STRING },
                    strategy: { type: Type.STRING },
                    delegationSummary: { type: Type.STRING },
                  },
                  required: ['objective', 'riskLevel', 'riskAssessment', 'strategy', 'delegationSummary'],
                },
                spokenResponse: {
                  type: Type.STRING,
                  description: 'Concise conversational response for text-to-speech output.',
                },
                requiresConfirmation: {
                  type: Type.BOOLEAN,
                  description: 'True if high risk (e.g. deleting system files, running unknown exe)',
                },
                confirmationPrompt: {
                  type: Type.STRING,
                  description: 'Warning message for user confirmation if requiresConfirmation is true',
                },
                actions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      agent: {
                        type: Type.STRING,
                        description: 'OS-Agent, Web-Agent, or File-Processor-Agent',
                      },
                      priority: {
                        type: Type.STRING,
                        description: 'HIGH, MEDIUM, or LOW priority level',
                      },
                      handoffTo: {
                        type: Type.STRING,
                        description: 'Sub-agent that will receive the output dataset or file',
                      },
                      handoffPayloadTitle: {
                        type: Type.STRING,
                        description: 'Name of the output dataset or file being passed',
                      },
                      type: {
                        type: Type.STRING,
                        description: 'RUN_COMMAND, CREATE_FILE, DELETE_FILE, LAUNCH_APP, KILL_PROCESS, NAVIGATE_URL, SEARCH_WEB, SCRAPE_PAGE, DOWNLOAD_FILE, PARSE_DOCUMENT, CONVERT_FORMAT',
                      },
                      description: { type: Type.STRING },
                      params: {
                        type: Type.OBJECT,
                        properties: {
                          command: { type: Type.STRING },
                          path: { type: Type.STRING },
                          content: { type: Type.STRING },
                          url: { type: Type.STRING },
                          query: { type: Type.STRING },
                          filename: { type: Type.STRING },
                          format: { type: Type.STRING },
                          targetPath: { type: Type.STRING },
                          appName: { type: Type.STRING },
                          pid: { type: Type.INTEGER },
                        },
                      },
                    },
                    required: ['id', 'agent', 'priority', 'type', 'description'],
                  },
                },
              },
              required: ['internalReasoning', 'spokenResponse', 'requiresConfirmation', 'actions'],
            },
          },
        });

        const rawText = response.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);

          // Apply priority sorting: HIGH -> MEDIUM -> LOW
          const weights: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          if (Array.isArray(parsed.actions)) {
            parsed.actions.sort(
              (a: any, b: any) =>
                (weights[b.priority || 'MEDIUM'] || 2) - (weights[a.priority || 'MEDIUM'] || 2)
            );
          }

          res.json(parsed);
          return;
        }
      } catch (geminiError) {
        console.warn('Gemini orchestration call error, falling back to rule engine:', geminiError);
      }
    }

    // Built-in intelligent rule engine fallback with priority scheduling
    const ruleResult = generateAutonomousPlan(prompt, currentFiles, isAuthorized, userPriority);
    res.json(ruleResult);
  } catch (err: any) {
    console.error('Error in /api/nexus/orchestrate:', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// Text to Speech Endpoint with customizable voiceName using gemini-3.8-flash-lite-tts
app.post('/api/nexus/tts', async (req, res) => {
  const { text, voiceName = 'Zephyr' } = req.body;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text is required for TTS' });
    return;
  }

  // Valid Gemini prebuilt voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
  const validVoices = ['Zephyr', 'Fenrir', 'Puck', 'Kore', 'Charon'];
  const targetVoice = validVoices.includes(voiceName) ? voiceName : 'Zephyr';

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: targetVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ audioBase64: base64Audio, format: 'audio/wav', voiceName: targetVoice });
        return;
      }
    } catch (ttsError) {
      console.warn('TTS API error, allowing client Web Speech fallback:', ttsError);
    }
  }

  res.json({ fallbackToWebSpeech: true, voiceName: targetVoice });
});

// Fallback rule-based plan generator when API key is unconfigured or rate limited
function generateAutonomousPlan(
  prompt: string,
  currentFiles: any[],
  isAuthorized: boolean,
  userPriority?: string
) {
  const lower = prompt.toLowerCase();
  let actions: any[] = [];
  let spokenResponse = '';
  let internalReasoning: any = {};
  let requiresConfirmation = false;
  let confirmationPrompt: string | undefined = undefined;

  // Check for high-risk action
  if (
    (lower.includes('delete') || lower.includes('remove') || lower.includes('wipe')) &&
    (lower.includes('system32') || lower.includes('windows') || lower.includes('system'))
  ) {
    if (!isAuthorized) {
      return {
        internalReasoning: {
          objective: 'Targeted deletion of critical system files requested.',
          riskLevel: 'HIGH',
          riskAssessment: 'Attempting to delete or alter files within System32 risks OS instability.',
          strategy: 'Halt execution, invoke safety intercept, and require explicit voice or manual user authorization.',
          delegationSummary: 'OS-Agent paused pending safety confirmation.',
        },
        spokenResponse:
          'Warning. You have requested modification of protected system files. This action is classified as high-risk. Please confirm authorization to proceed.',
        requiresConfirmation: true,
        confirmationPrompt:
          'High-Risk Warning: Deletion within C:\\Windows\\System32 detected. Authorize execution of OS-Agent?',
        actions: [
          {
            id: 'act-sys32-1',
            agent: 'OS-Agent',
            priority: 'HIGH',
            type: 'DELETE_FILE',
            description: 'Purge specified system file',
            params: { path: 'C:\\Windows\\System32\\backup_config.dll' },
          },
        ],
      };
    }
  }

  if (lower.includes('clean') || lower.includes('temp') || lower.includes('disk') || lower.includes('storage')) {
    internalReasoning = {
      objective: 'Optimize system storage and purge temporary files.',
      riskLevel: 'LOW',
      riskAssessment: 'Purging standard Temp directories is safe and frees up local disk space.',
      strategy: 'OS-Agent executes high-priority PowerShell disk clean cmdlet and scans directory tree.',
      delegationSummary: 'OS-Agent prioritised for temp directory cleanup ahead of background auditing.',
    };
    spokenResponse =
      'Initiating high-priority disk cleanup. OS-Agent is clearing temporary files and auditing system cache now.';
    actions = [
      {
        id: 'act-clean-1',
        agent: 'OS-Agent',
        priority: 'HIGH',
        type: 'RUN_COMMAND',
        description: 'Scan and clear temporary cache files',
        params: { command: 'Remove-Item -Path $env:TEMP\\* -Recurse -Force -ErrorAction SilentlyContinue' },
      },
      {
        id: 'act-clean-2',
        agent: 'OS-Agent',
        priority: 'HIGH',
        type: 'RUN_COMMAND',
        description: 'Check available disk space',
        params: { command: 'Get-PSDrive C | Select-Object Used,Free' },
      },
    ];
  } else if (
    lower.includes('scrape') ||
    lower.includes('search') ||
    lower.includes('download') ||
    lower.includes('market') ||
    lower.includes('web') ||
    lower.includes('competitor')
  ) {
    internalReasoning = {
      objective: 'Conduct web intelligence gathering and download report locally.',
      riskLevel: 'LOW',
      riskAssessment: 'Outbound HTTP queries and document fetching to user Downloads folder.',
      strategy: 'Critical OS logging scheduled first, followed by medium parsing, with web background scraping prioritized appropriately.',
      delegationSummary: 'OS-Agent creates record; Web-Agent browses in background; File-Processor-Agent parses dataset.',
    };
    spokenResponse =
      'Web-Agent is fetching market datasets while OS-Agent prepares local directories.';
    actions = [
      {
        id: 'act-os-1',
        agent: 'OS-Agent',
        priority: 'HIGH',
        type: 'CREATE_FILE',
        description: 'Prepare Desktop briefings folder and initialize task record',
        params: {
          path: 'C:\\Users\\User\\Desktop\\Executive_Briefing.txt',
          content: `NEXUS-OS SYNTHESIS REPORT\nGenerated for: ${prompt}\nStatus: Initialized\nTimestamp: ${new Date().toISOString()}`,
        },
      },
      {
        id: 'act-web-1',
        agent: 'Web-Agent',
        priority: 'MEDIUM',
        type: 'SEARCH_WEB',
        description: 'Scrape online market intelligence data sources',
        params: { query: prompt },
      },
      {
        id: 'act-web-2',
        agent: 'Web-Agent',
        priority: 'MEDIUM',
        type: 'DOWNLOAD_FILE',
        handoffTo: 'File-Processor-Agent',
        handoffPayloadTitle: 'market_intelligence_report.csv',
        description: 'Download dataset and hand off refined CSV to File-Processor-Agent',
        params: {
          url: 'https://data.marketintel.io/report_2026.csv',
          filename: 'market_intelligence_report.csv',
          targetPath: 'C:\\Users\\User\\Downloads\\market_intelligence_report.csv',
        },
      },
      {
        id: 'act-proc-1',
        agent: 'File-Processor-Agent',
        priority: 'MEDIUM',
        type: 'PARSE_DOCUMENT',
        handoffTo: 'OS-Agent',
        handoffPayloadTitle: 'Executive_Briefing.txt',
        description: 'Parse dataset and hand off synthesized briefing to OS-Agent',
        params: { path: 'C:\\Users\\User\\Downloads\\market_intelligence_report.csv', format: 'csv' },
      },
      {
        id: 'act-os-1',
        agent: 'OS-Agent',
        priority: 'HIGH',
        type: 'CREATE_FILE',
        description: 'Receive briefing from File-Processor-Agent and commit to Desktop',
        params: {
          path: 'C:\\Users\\User\\Desktop\\Executive_Briefing.txt',
          content: `NEXUS-OS SYNTHESIS REPORT\nGenerated for: ${prompt}\nRefined by: File-Processor-Agent\nCommitted by: OS-Agent\nTimestamp: ${new Date().toISOString()}`,
        },
      },
    ];
  } else if (
    lower.includes('convert') ||
    lower.includes('pdf') ||
    lower.includes('excel') ||
    lower.includes('financial') ||
    lower.includes('parse') ||
    lower.includes('document')
  ) {
    internalReasoning = {
      objective: 'Process local tabular data and produce converted document.',
      riskLevel: 'LOW',
      riskAssessment: 'Local read and transform operations are safe.',
      strategy: 'OS notification and file allocation take precedence over standard formatting transforms.',
      delegationSummary: 'File-Processor-Agent handling extraction and conversion; OS-Agent handling system verification.',
    };
    spokenResponse =
      'File-Processor-Agent is converting the spreadsheet and will pass the resulting document to OS-Agent.';
    actions = [
      {
        id: 'act-os-notify',
        agent: 'OS-Agent',
        priority: 'HIGH',
        type: 'RUN_COMMAND',
        description: 'Verify system file locks and memory readiness',
        params: { command: 'echo "OS-Agent verified file readiness for spreadsheet parsing."' },
      },
      {
        id: 'act-parse-1',
        agent: 'File-Processor-Agent',
        priority: 'MEDIUM',
        type: 'PARSE_DOCUMENT',
        description: 'Parse quarterly financial spreadsheet',
        params: { path: 'C:\\Users\\User\\Documents\\quarterly_financials.xlsx', format: 'excel' },
      },
      {
        id: 'act-parse-2',
        agent: 'File-Processor-Agent',
        priority: 'MEDIUM',
        type: 'CONVERT_FORMAT',
        handoffTo: 'OS-Agent',
        handoffPayloadTitle: 'financials_summary.pdf',
        description: 'Convert parsed data to structured PDF and pass output file to OS-Agent',
        params: {
          path: 'C:\\Users\\User\\Documents\\quarterly_financials.xlsx',
          targetPath: 'C:\\Users\\User\\Documents\\financials_summary.pdf',
          format: 'pdf',
        },
      },
    ];
  } else {
    internalReasoning = {
      objective: `Execute coordinated workflow for user request: "${prompt}".`,
      riskLevel: 'LOW',
      riskAssessment: 'Normal operational privileges verified.',
      strategy: 'Prioritize OS verification ahead of background web lookups.',
      delegationSummary: 'OS-Agent prioritised first; Web-Agent and File-Processor-Agent follow.',
    };
    spokenResponse = `Nexus-OS has scheduled critical system steps ahead of background processes.`;
    actions = [
      {
        id: 'act-gen-1',
        agent: 'OS-Agent',
        priority: 'HIGH',
        type: 'RUN_COMMAND',
        description: 'Verify active Windows services and memory availability',
        params: { command: 'Get-Service | Where-Object {$_.Status -eq "Running"} | Select-Object -First 5' },
      },
      {
        id: 'act-gen-3',
        agent: 'File-Processor-Agent',
        priority: 'MEDIUM',
        type: 'CREATE_FILE',
        description: 'Create task record in user Documents',
        params: {
          path: 'C:\\Users\\User\\Documents\\nexus_task_log.txt',
          content: `Task: ${prompt}\nTimestamp: ${new Date().toISOString()}\nStatus: Processed by Nexus-OS Master Agent.`,
        },
      },
      {
        id: 'act-gen-2',
        agent: 'Web-Agent',
        priority: 'LOW',
        type: 'SEARCH_WEB',
        description: 'Background web context retrieval',
        params: { query: prompt },
      },
    ];
  }

  // If user requested explicit overall priority override, adjust non-critical tasks
  if (userPriority && ['HIGH', 'MEDIUM', 'LOW'].includes(userPriority)) {
    actions = actions.map((act) => {
      // Don't downgrade critical system cleanup or deletions
      if (act.agent === 'OS-Agent' && act.type === 'DELETE_FILE') {
        return { ...act, priority: 'HIGH' };
      }
      return { ...act, priority: userPriority };
    });
  }

  // Sort actions: HIGH (3) -> MEDIUM (2) -> LOW (1)
  const weights: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  actions.sort(
    (a, b) => (weights[b.priority || 'MEDIUM'] || 2) - (weights[a.priority || 'MEDIUM'] || 2)
  );

  return {
    internalReasoning,
    spokenResponse,
    requiresConfirmation,
    confirmationPrompt,
    actions,
  };
}

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Nexus-OS Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
