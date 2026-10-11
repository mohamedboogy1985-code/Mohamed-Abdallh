import React, { useState, useMemo } from 'react';
import { VirtualFile } from '../types/nexus';
import {
  X,
  FileCode,
  ArrowRight,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  FileText,
  FileSpreadsheet,
  File,
  Filter,
  CheckSquare,
  Square,
  Search,
} from 'lucide-react';

interface BulkRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFiles: VirtualFile[];
  allFiles: VirtualFile[];
  onApplyRename: (renames: { id: string; oldPath: string; newPath: string; newName: string }[]) => void;
}

type RenameScope = 'full' | 'name-only' | 'ext-only';

interface PresetPattern {
  id: string;
  label: string;
  description: string;
  pattern: string;
  replacement: string;
  scope: RenameScope;
  flags: { i: boolean; g: boolean };
}

const PRESET_PATTERNS: PresetPattern[] = [
  {
    id: 'prefix-date',
    label: 'Date Prefix',
    description: 'Add current date prefix (YYYY-MM-DD_)',
    pattern: '^',
    replacement: `${new Date().toISOString().slice(0, 10)}_`,
    scope: 'name-only',
    flags: { i: false, g: false },
  },
  {
    id: 'prefix-backup',
    label: 'Backup Prefix',
    description: 'Add backup_ prefix to filename',
    pattern: '^',
    replacement: 'backup_',
    scope: 'name-only',
    flags: { i: false, g: false },
  },
  {
    id: 'suffix-processed',
    label: 'Processed Suffix',
    description: 'Add _processed suffix before extension',
    pattern: '$',
    replacement: '_processed',
    scope: 'name-only',
    flags: { i: false, g: false },
  },
  {
    id: 'spaces-to-underscores',
    label: 'Spaces to _',
    description: 'Replace whitespace with underscores',
    pattern: '\\s+',
    replacement: '_',
    scope: 'name-only',
    flags: { i: false, g: true },
  },
  {
    id: 'underscores-to-dashes',
    label: 'Underscores to -',
    description: 'Replace underscores with hyphens',
    pattern: '_',
    replacement: '-',
    scope: 'name-only',
    flags: { i: false, g: true },
  },
  {
    id: 'strip-numbers',
    label: 'Strip Numbers',
    description: 'Remove all digits from filenames',
    pattern: '\\d+',
    replacement: '',
    scope: 'name-only',
    flags: { i: false, g: true },
  },
  {
    id: 'sequential-numbering',
    label: 'Seq Numbering',
    description: 'Number files sequentially ($INDEX)',
    pattern: '^.*$',
    replacement: 'file_$INDEX',
    scope: 'name-only',
    flags: { i: false, g: false },
  },
  {
    id: 'change-ext-bak',
    label: 'Convert to .bak',
    description: 'Change extension to .bak',
    pattern: '^.*$',
    replacement: 'bak',
    scope: 'ext-only',
    flags: { i: false, g: false },
  },
];

export const BulkRenameModal: React.FC<BulkRenameModalProps> = ({
  isOpen,
  onClose,
  selectedFiles,
  allFiles,
  onApplyRename,
}) => {
  const [pattern, setPattern] = useState<string>('(\\w+)');
  const [replacement, setReplacement] = useState<string>('$1_renamed');
  const [caseInsensitive, setCaseInsensitive] = useState<boolean>(true);
  const [globalMatch, setGlobalMatch] = useState<boolean>(true);
  const [scope, setScope] = useState<RenameScope>('name-only');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [includedIds, setIncludedIds] = useState<Set<string>>(() => new Set(selectedFiles.map((f) => f.id)));
  const [showRegexGuide, setShowRegexGuide] = useState<boolean>(false);

  // Sync includedIds if selectedFiles changes
  React.useEffect(() => {
    setIncludedIds(new Set(selectedFiles.map((f) => f.id)));
  }, [selectedFiles]);

  // Compute regex compilation
  const regexResult = useMemo(() => {
    if (!pattern) {
      return { regex: null, error: null };
    }
    try {
      let flags = '';
      if (globalMatch) flags += 'g';
      if (caseInsensitive) flags += 'i';
      const reg = new RegExp(pattern, flags);
      return { regex: reg, error: null };
    } catch (err: any) {
      return { regex: null, error: err.message || 'Invalid regular expression' };
    }
  }, [pattern, caseInsensitive, globalMatch]);

  // Compute live preview for each file
  const previewItems = useMemo(() => {
    const { regex, error } = regexResult;
    let sequenceIndex = 1;

    return selectedFiles.map((file) => {
      const isIncluded = includedIds.has(file.id);

      // Split filename and extension
      const lastDotIndex = file.name.lastIndexOf('.');
      const hasExt = lastDotIndex > 0;
      const baseName = hasExt ? file.name.substring(0, lastDotIndex) : file.name;
      const ext = hasExt ? file.name.substring(lastDotIndex + 1) : '';

      let targetText = '';
      if (scope === 'full') {
        targetText = file.name;
      } else if (scope === 'name-only') {
        targetText = baseName;
      } else {
        targetText = ext;
      }

      let newTargetText = targetText;
      let isChanged = false;
      let status: 'valid' | 'unchanged' | 'error' | 'collision' | 'invalid_chars' = 'unchanged';
      let message = '';

      if (error) {
        status = 'error';
        message = 'Regex Syntax Error';
      } else if (regex && isIncluded) {
        try {
          // Check for custom helper variables like $INDEX or ${index}
          let resolvedReplacement = replacement;
          if (resolvedReplacement.includes('$INDEX')) {
            resolvedReplacement = resolvedReplacement.replace(/\$INDEX/g, String(sequenceIndex));
          }
          if (resolvedReplacement.includes('${index}')) {
            resolvedReplacement = resolvedReplacement.replace(/\$\{index\}/g, String(sequenceIndex));
          }
          if (resolvedReplacement.includes('{{index}}')) {
            resolvedReplacement = resolvedReplacement.replace(/\{\{index\}\}/g, String(sequenceIndex));
          }

          newTargetText = targetText.replace(regex, resolvedReplacement);
          sequenceIndex++;
        } catch (repErr: any) {
          status = 'error';
          message = repErr.message || 'Replacement failed';
        }
      }

      // Reassemble complete new filename
      let newName = file.name;
      if (!error && isIncluded) {
        if (scope === 'full') {
          newName = newTargetText;
        } else if (scope === 'name-only') {
          newName = hasExt ? `${newTargetText}.${ext}` : newTargetText;
        } else {
          newName = newTargetText ? `${baseName}.${newTargetText}` : baseName;
        }
      }

      isChanged = newName !== file.name && isIncluded;

      // Validate Windows filename characters: \ / : * ? " < > |
      const illegalCharsMatch = newName.match(/[\\/:*?"<>|]/);
      if (isChanged && illegalCharsMatch) {
        status = 'invalid_chars';
        message = `Illegal character: ${illegalCharsMatch[0]}`;
      } else if (isChanged && newName.trim().length === 0) {
        status = 'invalid_chars';
        message = 'Filename cannot be blank';
      } else if (isChanged) {
        status = 'valid';
      }

      // Compute new path in directory
      const pathSeparator = file.path.includes('/') ? '/' : '\\';
      const pathParts = file.path.split(pathSeparator);
      pathParts.pop(); // Remove old filename
      const newPath = [...pathParts, newName].join(pathSeparator);

      return {
        file,
        isIncluded,
        newName,
        newPath,
        isChanged,
        status,
        message,
      };
    });
  }, [selectedFiles, includedIds, regexResult, replacement, scope]);

  // Check for collisions across previewItems and allFiles in target folders
  const processedItems = useMemo(() => {
    // Map of target paths to count
    const pathCounts: Record<string, number> = {};
    previewItems.forEach((item) => {
      if (item.isIncluded && item.status === 'valid') {
        const lowerPath = item.newPath.toLowerCase();
        pathCounts[lowerPath] = (pathCounts[lowerPath] || 0) + 1;
      }
    });

    return previewItems.map((item) => {
      if (!item.isIncluded || item.status !== 'valid') {
        return item;
      }

      const lowerPath = item.newPath.toLowerCase();

      // Check collision within bulk rename batch
      if (pathCounts[lowerPath] > 1) {
        return {
          ...item,
          status: 'collision' as const,
          message: 'Naming collision: multiple files share this new name',
        };
      }

      // Check collision with other existing files not in current rename set
      const collidingExternal = allFiles.find(
        (f) =>
          f.path.toLowerCase() === lowerPath &&
          f.id !== item.file.id &&
          !selectedFiles.some((sf) => sf.id === f.id)
      );

      if (collidingExternal) {
        return {
          ...item,
          status: 'collision' as const,
          message: 'Conflicts with existing file in folder',
        };
      }

      return item;
    });
  }, [previewItems, allFiles, selectedFiles]);

  // Summary counts
  const summary = useMemo(() => {
    const includedCount = processedItems.filter((i) => i.isIncluded).length;
    const changedCount = processedItems.filter((i) => i.isIncluded && i.isChanged && i.status === 'valid').length;
    const unchangedCount = processedItems.filter((i) => i.isIncluded && !i.isChanged).length;
    const conflictCount = processedItems.filter(
      (i) => i.isIncluded && (i.status === 'collision' || i.status === 'invalid_chars' || i.status === 'error')
    ).length;

    return {
      total: selectedFiles.length,
      included: includedCount,
      changed: changedCount,
      unchanged: unchangedCount,
      conflicts: conflictCount,
      canApply: changedCount > 0 && conflictCount === 0 && !regexResult.error,
    };
  }, [processedItems, selectedFiles, regexResult]);

  // Apply handler
  const handleApply = () => {
    if (!summary.canApply) return;

    const renamesToApply = processedItems
      .filter((i) => i.isIncluded && i.isChanged && i.status === 'valid')
      .map((i) => ({
        id: i.file.id,
        oldPath: i.file.path,
        newPath: i.newPath,
        newName: i.newName,
      }));

    onApplyRename(renamesToApply);
    onClose();
  };

  const handleApplyPreset = (preset: PresetPattern) => {
    setActivePreset(preset.id);
    setPattern(preset.pattern);
    setReplacement(preset.replacement);
    setScope(preset.scope);
    setCaseInsensitive(preset.flags.i);
    setGlobalMatch(preset.flags.g);
  };

  const toggleInclude = (id: string) => {
    setIncludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (includedIds.size === selectedFiles.length) {
      setIncludedIds(new Set());
    } else {
      setIncludedIds(new Set(selectedFiles.map((f) => f.id)));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Bulk Regex Renaming Utility
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                  {selectedFiles.length} File{selectedFiles.length === 1 ? '' : 's'} Selected
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Apply regular expressions with live preview, token replacement, and collision safeguards.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Presets Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick Renaming Presets
              </span>
              <button
                type="button"
                onClick={() => setShowRegexGuide(!showRegexGuide)}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
              >
                <HelpCircle className="w-3 h-3" />
                <span>{showRegexGuide ? 'Hide Regex Tokens' : 'Regex Cheatsheet'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_PATTERNS.map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30 border border-sky-400'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
                    }`}
                    title={preset.description}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Optional Regex Guide Accordion */}
            {showRegexGuide && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 font-mono">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400">
                  <div>
                    <span className="text-sky-400 font-semibold">Match Patterns:</span>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[10px]">
                      <li><code className="text-slate-200">^</code> : Start of name</li>
                      <li><code className="text-slate-200">$</code> : End of name</li>
                      <li><code className="text-slate-200">(\w+)</code> : Capture alphanumeric word ($1)</li>
                      <li><code className="text-slate-200">\d+</code> : Match numeric sequence</li>
                      <li><code className="text-slate-200">\s+</code> : Match whitespace</li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-emerald-400 font-semibold">Replacements & Tokens:</span>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[10px]">
                      <li><code className="text-slate-200">$1, $2</code> : Captured regex group</li>
                      <li><code className="text-slate-200">$&amp;</code> : Entire matched string</li>
                      <li><code className="text-slate-200">$INDEX</code> : 1-based sequential counter</li>
                      <li><code className="text-slate-200">_processed</code> : Custom prefix / suffix</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Regex Pattern & Replacement Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            {/* Search Pattern */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Search Regex Pattern</span>
                {regexResult.error ? (
                  <span className="text-[10px] text-rose-400 font-mono">Syntax Error</span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-mono">Valid Regex</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => {
                    setPattern(e.target.value);
                    setActivePreset(null);
                  }}
                  placeholder="e.g. ^(\d+)_(.*)$"
                  className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                    regexResult.error
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500'
                  }`}
                />
              </div>
              {regexResult.error && (
                <p className="text-[10px] text-rose-400 font-mono">{regexResult.error}</p>
              )}
            </div>

            {/* Replacement */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Replace With (Variables: $1, $2, $INDEX)
              </label>
              <input
                type="text"
                value={replacement}
                onChange={(e) => {
                  setReplacement(e.target.value);
                  setActivePreset(null);
                }}
                placeholder="e.g. item_$INDEX_$2"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Scope Selector */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Apply To</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as RenameScope)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
              >
                <option value="name-only">Name Only</option>
                <option value="full">Full (Name + Ext)</option>
                <option value="ext-only">Extension Only</option>
              </select>
            </div>

            {/* Options Flags */}
            <div className="md:col-span-12 flex flex-wrap items-center gap-4 pt-1 border-t border-slate-800/80 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={globalMatch}
                  onChange={(e) => setGlobalMatch(e.target.checked)}
                  className="rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-900"
                />
                <span>Global match (<code className="font-mono text-sky-400">g</code>)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={caseInsensitive}
                  onChange={(e) => setCaseInsensitive(e.target.checked)}
                  className="rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-900"
                />
                <span>Case insensitive (<code className="font-mono text-sky-400">i</code>)</span>
              </label>

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPattern('');
                    setReplacement('');
                    setActivePreset(null);
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Inputs</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview Section Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Live Preview & Diff
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  ({summary.changed} of {summary.included} will be modified)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
                >
                  {includedIds.size === selectedFiles.length ? (
                    <>
                      <Square className="w-3 h-3" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3 h-3" />
                      <span>Select All ({selectedFiles.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Table */}
            <div className="border border-slate-800 rounded-xl bg-slate-950/60 overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 w-10 text-center">
                      <span className="sr-only">Include</span>
                    </th>
                    <th className="p-2.5 font-medium">Original Filename</th>
                    <th className="p-2.5 w-8 text-center text-slate-600">→</th>
                    <th className="p-2.5 font-medium">Proposed New Filename</th>
                    <th className="p-2.5 font-medium text-right w-36">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {processedItems.map((item) => {
                    const isChecked = item.isIncluded;
                    return (
                      <tr
                        key={item.file.id}
                        className={`hover:bg-slate-850/60 transition-colors ${
                          !isChecked ? 'opacity-40 bg-slate-950/20' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleInclude(item.file.id)}
                            className="rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-900 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 text-slate-300 font-medium truncate max-w-[220px]">
                          <span title={item.file.name}>{item.file.name}</span>
                        </td>
                        <td className="p-2.5 text-center text-slate-600">
                          <ArrowRight className="w-3 h-3 mx-auto" />
                        </td>
                        <td className="p-2.5 truncate max-w-[240px]">
                          {item.isChanged ? (
                            <span
                              className="text-emerald-300 font-semibold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20"
                              title={item.newName}
                            >
                              {item.newName}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Unchanged</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap">
                          {item.status === 'valid' && item.isChanged && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <Check className="w-2.5 h-2.5" />
                              Renaming
                            </span>
                          )}
                          {item.status === 'unchanged' && (
                            <span className="inline-flex items-center text-[10px] text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded-full">
                              No match
                            </span>
                          )}
                          {(item.status === 'collision' ||
                            item.status === 'invalid_chars' ||
                            item.status === 'error') && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20"
                              title={item.message}
                            >
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate max-w-[90px]">{item.message}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>
              Ready to rename: <strong className="text-emerald-400">{summary.changed}</strong>
            </span>
            {summary.conflicts > 0 && (
              <span className="text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {summary.conflicts} Conflict(s) must be resolved
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!summary.canApply}
              onClick={handleApply}
              className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
                summary.canApply
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Rename ({summary.changed})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
