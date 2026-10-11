import React, { useState, useEffect, useMemo, useRef } from 'react';
import { VirtualFile, BrowserTab } from '../types/nexus';
import {
  Search,
  Terminal,
  Folder,
  Globe,
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  CornerDownLeft,
  X,
  History,
  Activity,
  Layers,
  Sparkles,
  Command,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: VirtualFile[];
  browserTabs: BrowserTab[];
  onSelectFile: (file: VirtualFile) => void;
  onSelectBrowserTab: (tabId: string) => void;
  onExecuteCommand: (command: string) => void;
  onNavigateView: (view: 'swarm' | 'terminal' | 'explorer' | 'browser' | 'tasks') => void;
}

type PaletteCategory = 'all' | 'terminal' | 'files' | 'browser';

interface PaletteItem {
  id: string;
  category: 'terminal' | 'files' | 'browser' | 'actions';
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  onSelect: () => void;
}

const STORAGE_KEY = 'nexus_os_terminal_persistent_history_v2';
const DEFAULT_TERMINAL_COMMANDS = [
  'systeminfo',
  'agent-status',
  'tasklist',
  'dir',
  'ipconfig',
  'type README_NEXUS.txt',
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  files,
  browserTabs,
  onSelectFile,
  onSelectBrowserTab,
  onExecuteCommand,
  onNavigateView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PaletteCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Load persistent terminal commands
  const terminalCommands = useMemo(() => {
    if (typeof window === 'undefined') return DEFAULT_TERMINAL_COMMANDS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_TERMINAL_COMMANDS;
  }, [isOpen]);

  // Build searchable items
  const allItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];

    // 1. Terminal History
    terminalCommands.forEach((cmd, idx) => {
      items.push({
        id: `term-${idx}-${cmd}`,
        category: 'terminal',
        title: cmd,
        subtitle: 'Terminal History · Press Enter to execute in PowerShell',
        badge: 'OS Command',
        icon: Terminal,
        iconColor: '#10b981', // emerald
        onSelect: () => {
          onNavigateView('terminal');
          onExecuteCommand(cmd);
          onClose();
        },
      });
    });

    // 2. File Paths & Virtual Files
    files.forEach((file) => {
      let FileIcon = File;
      let color = '#38bdf8';
      const ext = file.extension.toLowerCase();
      if (ext === 'xlsx' || ext === 'csv') {
        FileIcon = FileSpreadsheet;
        color = '#10b981';
      } else if (ext === 'pdf' || ext === 'txt' || ext === 'md') {
        FileIcon = FileText;
        color = '#f59e0b';
      } else if (ext === 'dll' || ext === 'exe') {
        FileIcon = FileCode;
        color = '#f43f5e';
      }

      items.push({
        id: `file-${file.id}`,
        category: 'files',
        title: file.name,
        subtitle: file.path,
        badge: file.size,
        icon: FileIcon,
        iconColor: color,
        onSelect: () => {
          onNavigateView('explorer');
          onSelectFile(file);
          onClose();
        },
      });
    });

    // 3. Active Browser Tabs
    browserTabs.forEach((tab) => {
      items.push({
        id: `tab-${tab.id}`,
        category: 'browser',
        title: tab.title,
        subtitle: tab.url,
        badge: 'Active Tab',
        icon: Globe,
        iconColor: '#6366f1', // indigo
        onSelect: () => {
          onNavigateView('browser');
          onSelectBrowserTab(tab.id);
          onClose();
        },
      });
    });

    // 4. Quick Views Navigation Actions
    items.push(
      {
        id: 'view-swarm',
        category: 'actions',
        title: 'Open Agent Swarm & Analytics View',
        subtitle: 'Inspect sub-agent topology, 24h charts, and action queue',
        badge: 'Navigation',
        icon: Layers,
        iconColor: '#38bdf8',
        onSelect: () => {
          onNavigateView('swarm');
          onClose();
        },
      },
      {
        id: 'view-tasks',
        category: 'actions',
        title: 'Open Task Manager',
        subtitle: 'Monitor active system processes and resource utilization',
        badge: 'Navigation',
        icon: Activity,
        iconColor: '#ec4899',
        onSelect: () => {
          onNavigateView('tasks');
          onClose();
        },
      }
    );

    return items;
  }, [terminalCommands, files, browserTabs, onNavigateView, onExecuteCommand, onSelectFile, onSelectBrowserTab, onClose]);

  // Filter items by category and search query
  const filteredItems = useMemo(() => {
    let result = allItems;

    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          (item.badge && item.badge.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allItems, selectedCategory, searchQuery]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, selectedCategory]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length === 0 ? 0 : (prev + 1) % filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length === 0 ? 0 : (prev - 1 + filteredItems.length) % filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[580px] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-4 h-4 text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search terminal history, files, active tabs, or actions..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-500 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Filter Categories Bar */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800/80 bg-slate-900/50 overflow-x-auto text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setSelectedCategory('terminal')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              selectedCategory === 'terminal'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span>Terminal History ({terminalCommands.length})</span>
          </button>
          <button
            onClick={() => setSelectedCategory('files')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              selectedCategory === 'files'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Folder className="w-3 h-3 text-amber-400" />
            <span>File Paths ({files.length})</span>
          </button>
          <button
            onClick={() => setSelectedCategory('browser')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              selectedCategory === 'browser'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3 h-3 text-indigo-400" />
            <span>Browser Tabs ({browserTabs.length})</span>
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.map((item, index) => {
            const isSelected = index === selectedIndex;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                onClick={item.onSelect}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors border ${
                  isSelected
                    ? 'bg-slate-800/90 border-sky-500/50 text-white shadow-sm'
                    : 'border-transparent hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${item.iconColor}18`, color: item.iconColor }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 truncate">{item.title}</span>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-1 text-[11px] font-mono text-sky-400 shrink-0 pl-2">
                    <span>Execute</span>
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Search className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <p>No matches found for "{searchQuery}".</p>
              <p className="text-slate-600 mt-1">
                Try searching for commands like <code>dir</code>, files like <code>quarterly</code>, or browser tabs.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/70 flex items-center justify-between text-[11px] font-mono text-slate-500 select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span>Nexus-OS Command Palette</span>
        </div>
      </div>
    </div>
  );
};
