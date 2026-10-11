import React, { useState, useMemo } from 'react';
import { VirtualFile } from '../types/nexus';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  HardDrive,
  Trash2,
  Eye,
  FileCheck,
  Download,
  Plus,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { BulkRenameModal } from './BulkRenameModal';

interface FileExplorerViewProps {
  files: VirtualFile[];
  onDeleteFile: (path: string) => void;
  onCreateFile: (path: string, content: string) => void;
  onParseFile: (path: string) => void;
  onBulkRenameFiles?: (renames: { id: string; oldPath: string; newPath: string; newName: string }[]) => void;
}

export const FileExplorerView: React.FC<FileExplorerViewProps> = ({
  files,
  onDeleteFile,
  onCreateFile,
  onParseFile,
  onBulkRenameFiles,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [activeFile, setActiveFile] = useState<VirtualFile | null>(files[0] || null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isBulkRenameOpen, setIsBulkRenameOpen] = useState(false);

  const folders = [
    { name: 'All Files', filter: 'All' },
    { name: 'Desktop', filter: 'Desktop' },
    { name: 'Documents', filter: 'Documents' },
    { name: 'Downloads', filter: 'Downloads' },
    { name: 'System32', filter: 'System32' },
  ];

  const filteredFiles = files.filter((f) => {
    if (selectedFolder === 'All') return true;
    return f.path.includes(`\\${selectedFolder}\\`);
  });

  const allFilteredSelected =
    filteredFiles.length > 0 &&
    filteredFiles.every((f) => selectedFileIds.has(f.id));

  const toggleSelectFile = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedFileIds((prev) => {
        const next = new Set(prev);
        filteredFiles.forEach((f) => next.delete(f.id));
        return next;
      });
    } else {
      setSelectedFileIds((prev) => {
        const next = new Set(prev);
        filteredFiles.forEach((f) => next.add(f.id));
        return next;
      });
    }
  };

  const handleOpenBulkRename = () => {
    if (selectedFileIds.size === 0) {
      // If nothing selected, select all in current filtered view
      const allIds = new Set(filteredFiles.map((f) => f.id));
      setSelectedFileIds(allIds);
    }
    setIsBulkRenameOpen(true);
  };

  const filesForBulkRename = useMemo(() => {
    if (selectedFileIds.size === 0) {
      return filteredFiles;
    }
    return files.filter((f) => selectedFileIds.has(f.id));
  }, [files, selectedFileIds, filteredFiles]);

  const getFileIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-400" />;
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-sky-400" />;
      case 'dll':
      case 'sys':
      case 'exe':
        return <FileCode className="w-4 h-4 text-amber-400" />;
      default:
        return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const folder = selectedFolder === 'All' ? 'Desktop' : selectedFolder;
    const fullPath = `C:\\Users\\User\\${folder}\\${newFileName.trim()}`;
    onCreateFile(fullPath, newFileContent);
    setNewFileName('');
    setNewFileContent('');
    setIsCreating(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[560px]">
      {/* Sidebar: Virtual Drives & Folders */}
      <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 flex flex-col">
        <div className="flex items-center gap-2 px-2 py-2 mb-2 text-xs font-semibold text-slate-300">
          <HardDrive className="w-4 h-4 text-sky-400" />
          <span>Local Disk (C:)</span>
        </div>

        <div className="space-y-1">
          {folders.map((f) => {
            const count =
              f.filter === 'All'
                ? files.length
                : files.filter((file) => file.path.includes(`\\${f.filter}\\`)).length;
            const isSelected = selectedFolder === f.filter;

            return (
              <button
                key={f.filter}
                onClick={() => setSelectedFolder(f.filter)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-sky-400' : 'text-slate-500'
                    }`}
                  />
                  <span>{f.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-3 border-t border-slate-800/80 space-y-2">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>New File</span>
          </button>

          <button
            onClick={handleOpenBulkRename}
            className="w-full py-2 px-3 rounded-lg bg-sky-950/50 hover:bg-sky-900/50 border border-sky-500/30 text-sky-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            title="Bulk rename files using regular expressions"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Regex Bulk Renamer</span>
          </button>
        </div>
      </div>

      {/* Main File Table */}
      <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/40 p-3 flex flex-col overflow-hidden">
        {/* Table Toolbar & Selection Controls */}
        <div className="pb-2.5 mb-2 border-b border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 font-mono truncate max-w-[200px]">
              Location: C:\Users\User\{selectedFolder}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {filteredFiles.length} item(s)
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 font-medium transition-colors"
                title={allFilteredSelected ? 'Deselect all filtered' : 'Select all filtered'}
              >
                {allFilteredSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>Select All</span>
              </button>

              {selectedFileIds.size > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {selectedFileIds.size} selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {selectedFileIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFileIds(new Set())}
                  className="text-[10px] text-slate-400 hover:text-slate-200 underline transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenBulkRename}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border shadow-sm ${
                  selectedFileIds.size > 0
                    ? 'bg-sky-600 text-white hover:bg-sky-500 border-sky-400 shadow-sky-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>
                  Bulk Rename {selectedFileIds.size > 0 ? `(${selectedFileIds.size})` : ''}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {filteredFiles.map((f) => {
            const isActive = activeFile?.id === f.id;
            const isChecked = selectedFileIds.has(f.id);

            return (
              <div
                key={f.id}
                onClick={() => setActiveFile(f)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-slate-800/90 border-sky-500/40 text-white shadow-sm'
                    : isChecked
                    ? 'bg-slate-800/50 border-slate-700 text-slate-200'
                    : 'border-transparent hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => toggleSelectFile(f.id, e as any)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-900 cursor-pointer w-3.5 h-3.5 shrink-0"
                    title={isChecked ? 'Deselect file' : 'Select file for bulk operations'}
                  />
                  <div className="shrink-0">{getFileIcon(f.extension)}</div>
                  <span className="font-medium truncate font-mono text-[11.5px]">{f.name}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono shrink-0">
                  <span>{f.size}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(f.path);
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    title="Delete file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal/Inline form for file creation */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-200">Create New File</span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              placeholder="Filename (e.g. notes.txt or data.csv)"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white placeholder-slate-500"
              autoFocus
            />
            <textarea
              placeholder="Initial content..."
              value={newFileContent}
              onChange={(e) => setNewFileContent(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white placeholder-slate-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2.5 py-1 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Document Inspector & Parser View [File-Processor-Agent] */}
      <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col overflow-hidden">
        {activeFile ? (
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  {getFileIcon(activeFile.extension)}
                  <h3 className="text-sm font-semibold text-white truncate max-w-[200px]">
                    {activeFile.name}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                  {activeFile.path}
                </p>
              </div>

              <button
                onClick={() => onParseFile(activeFile.path)}
                className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium hover:bg-amber-500/30 transition-colors flex items-center gap-1 shrink-0"
                title="Delegate to File-Processor-Agent"
              >
                <FileCheck className="w-3 h-3" />
                <span>Parse</span>
              </button>
            </div>

            {/* Parsed spreadsheet / table view */}
            {activeFile.parsedData?.rows && activeFile.parsedData?.columns ? (
              <div className="flex-1 overflow-y-auto space-y-3">
                <span className="text-[10px] uppercase font-mono text-emerald-400 block font-semibold">
                  Structured Tabular Ingestion (Excel / CSV)
                </span>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                      <tr>
                        {activeFile.parsedData.columns.map((c) => (
                          <th key={c} className="p-2 font-medium">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {activeFile.parsedData.rows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-800/40">
                          {activeFile.parsedData!.columns!.map((c) => (
                            <td key={c} className="p-2 text-slate-200">
                              {r[c]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {activeFile.parsedData.summary && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-[10px] text-amber-400 font-mono uppercase block mb-1">
                      Computed Insights:
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {activeFile.parsedData.summary}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Raw text or binary content preview */
              <div className="flex-1 flex flex-col overflow-hidden">
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
                  File Preview:
                </span>
                <div className="flex-1 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {activeFile.content}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Select a file to inspect its content and structured metadata.
          </div>
        )}
      </div>

      {/* Bulk Regex Renaming Modal */}
      <BulkRenameModal
        isOpen={isBulkRenameOpen}
        onClose={() => setIsBulkRenameOpen(false)}
        selectedFiles={filesForBulkRename}
        allFiles={files}
        onApplyRename={(renames) => {
          onBulkRenameFiles?.(renames);
          setSelectedFileIds(new Set());
        }}
      />
    </div>
  );
};
