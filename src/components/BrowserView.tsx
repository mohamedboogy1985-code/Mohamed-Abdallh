import React, { useState } from 'react';
import { BrowserTab } from '../types/nexus';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Search,
  Download,
  ExternalLink,
  ShieldCheck,
  FileDown,
} from 'lucide-react';

interface BrowserViewProps {
  tabs: BrowserTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onNavigate: (url: string) => void;
  onSearch: (query: string) => void;
  onDownloadFile: (filename: string, content: string) => void;
}

export const BrowserView: React.FC<BrowserViewProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onNavigate,
  onSearch,
  onDownloadFile,
}) => {
  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const [urlInput, setUrlInput] = useState(currentTab ? currentTab.url : 'https://www.bing.com');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    if (urlInput.startsWith('http://') || urlInput.startsWith('https://')) {
      onNavigate(urlInput.trim());
    } else {
      onSearch(urlInput.trim());
    }
  };

  const handleTriggerDownload = () => {
    onDownloadFile('web_intelligence_dump.csv', 'Timestamp,Source,Sentiment\n2026-10-11,TechCrunch,Positive\n2026-10-11,Bloomberg,Bullish');
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-xl overflow-hidden flex flex-col h-[560px]">
      {/* Browser Tab Bar */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-3 pt-2 flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onSelectTab(tab.id);
                setUrlInput(tab.url);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium max-w-[200px] truncate border-t border-x transition-colors ${
                isActive
                  ? 'bg-slate-950 border-slate-800 text-sky-400'
                  : 'bg-slate-900/60 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Globe className="w-3 h-3 shrink-0" />
              <span className="truncate">{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* Navigation Toolbar */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 py-2 flex items-center gap-2">
        <div className="flex items-center gap-1 text-slate-400">
          <button className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Address Bar */}
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center">
          <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus-within:border-sky-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search web or enter URL..."
              className="flex-1 bg-transparent focus:outline-none text-xs text-white placeholder-slate-500 font-mono"
            />
            <button type="submit" className="text-slate-400 hover:text-sky-400">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Action: Scrape / Download into local directory */}
        <button
          onClick={handleTriggerDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-medium transition-colors shrink-0"
          title="Web-Agent: Download data directly to C:\Users\User\Downloads"
        >
          <FileDown className="w-3.5 h-3.5 text-indigo-400" />
          <span>Download to Local (C:)</span>
        </button>
      </div>

      {/* Web Content Render Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-950 text-slate-300 text-xs flex flex-col">
        {currentTab ? (
          <div className="max-w-3xl mx-auto w-full space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-sky-400">{currentTab.url}</span>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  DOM Parsed by Web-Agent
                </span>
              </div>
              <h2 className="text-base font-semibold text-white mb-2">{currentTab.title}</h2>
              <p className="text-slate-300 leading-relaxed text-xs">
                {currentTab.snippet || 'Real-time web browsing session running within Web-Agent sandbox.'}
              </p>
            </div>

            {currentTab.extractedData && (
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-800/30 text-xs">
                <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wide block mb-1">
                  Scraped Intelligence Payload:
                </span>
                <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
                  {currentTab.extractedData}
                </p>
              </div>
            )}

            {/* Simulated Live Web Content Cards */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Indexed Insights & Whitepapers
              </h3>

              <div className="p-3.5 rounded-lg bg-slate-900/30 border border-slate-800/80 hover:border-slate-700 transition-colors">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sky-400 hover:underline font-medium text-xs block mb-1"
                >
                  Windows Multi-Agent Automation Protocols (2026 Reference)
                </a>
                <p className="text-slate-400 text-[11px]">
                  A detailed framework for autonomous task delegation between operating system kernels,
                  browser drivers, and file transformation engines.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/30 border border-slate-800/80 hover:border-slate-700 transition-colors">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sky-400 hover:underline font-medium text-xs block mb-1"
                >
                  Market Intelligence: Enterprise Agent Adoption Q3-Q4
                </a>
                <p className="text-slate-400 text-[11px]">
                  Survey of 450 engineering organizations implementing speech-to-speech agents with
                  strict safety bounds on local file execution.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            No active browser tab open.
          </div>
        )}
      </div>
    </div>
  );
};
