import React, { useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Check, X, Mic } from 'lucide-react';

interface SafetyConfirmModalProps {
  isOpen: boolean;
  promptText: string;
  isListening: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SafetyConfirmModal: React.FC<SafetyConfirmModalProps> = ({
  isOpen,
  promptText,
  isListening,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-rose-950/50 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase text-rose-400">
                Nexus-OS Safety Gate Intercept
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-rose-300">Level 3 High Risk</span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              Explicit Authorization Required
            </h2>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/60 text-xs text-rose-200 leading-relaxed">
          <p className="font-medium">{promptText}</p>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Voice Operational Rule:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            By system policy, autonomous execution of critical system deletions or unknown binary executions
            is halted until verified. You can speak "Confirm" / "Authorize", or click below.
          </p>
        </div>

        {isListening && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono py-1">
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span>Listening for voice confirmation ("Authorize" / "Cancel")...</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Abort Action</span>
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950/50 transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Authorize Execution</span>
          </button>
        </div>
      </div>
    </div>
  );
};
