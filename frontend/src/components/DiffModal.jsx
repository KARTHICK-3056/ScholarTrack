import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  History, 
  Copy, 
  Check, 
  ExternalLink, 
  Hash
} from 'lucide-react';
import { formatToTimezone } from '../utils/timezones';
import LiquidButton from './LiquidButton';

export default function DiffModal({ notice, onClose, selectedTimezone }) {
  const [copied, setCopied] = useState(false);
  if (!notice) return null;

  const handleCopyHash = () => {
    if (notice.content_hash) {
      navigator.clipboard.writeText(notice.content_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-md" 
        onClick={onClose}
      />

      {/* Floating iPadOS/macOS Style Glass Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -10 }}
        transition={{ type: "spring", stiffness: 420, damping: 27 }}
        className="liquidglass glassContainer floating-glass-window relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[32px] shadow-2xl z-10 overflow-hidden"
      >
        
        {/* Sticky Header */}
        <div className="p-6 pb-4 border-b border-slate-200/80 dark:border-white/10 flex items-start justify-between flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-bold block">
                Program Date History & Verification
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                {notice.title}
              </h2>
            </div>
          </div>

          <LiquidButton
            size="icon-sm"
            onClick={onClose}
            title="Close Dialog"
          >
            <X className="w-4 h-4" />
          </LiquidButton>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 pt-4 overflow-y-auto flex-1 space-y-4 no-scrollbar">
          
          {/* Deadline Comparison Diff */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white/80 uppercase tracking-wider mb-2">
              Deadline Timeline ({selectedTimezone})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Previous Deadline */}
              <div className="glass-well p-4">
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 block mb-1 font-semibold">
                  Initially Announced Deadline
                </span>
                <div className={`font-mono text-sm ${notice.previous_deadline ? "line-through text-slate-500 dark:text-slate-400 font-medium" : "text-slate-800 dark:text-slate-200 font-semibold"}`}>
                  {notice.previous_deadline 
                    ? formatToTimezone(notice.previous_deadline, selectedTimezone)
                    : "Initial Notification Date"}
                </div>
              </div>

              {/* Current / Verified Deadline */}
              <div className="glass-well p-4 border-indigo-500/30">
                <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 block mb-1 font-bold">
                  Active Verified Deadline
                </span>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {notice.due_at 
                    ? formatToTimezone(notice.due_at, selectedTimezone)
                    : "Dates To Be Announced by Official Source"}
                </div>
              </div>

            </div>
          </div>

          {/* Audit Verification Timestamps */}
          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] space-y-2 text-xs font-mono shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Provider / Organization:</span>
              <span className="text-slate-900 dark:text-white font-bold">{notice.provider}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Initial Ingestion Date:</span>
              <span className="text-slate-900 dark:text-white font-semibold">{formatToTimezone(notice.captured_at, selectedTimezone)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Last Source Verification:</span>
              <span className="text-slate-900 dark:text-white font-semibold">{formatToTimezone(notice.verified_at, selectedTimezone)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Status:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                notice.notice_status === "CONFIRMED" 
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                  : notice.notice_status === "REVISED"
                  ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                  : "bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30"
              }`}>
                {notice.notice_status === "REVISED" ? "DEADLINE EXTENDED" : notice.notice_status}
              </span>
            </div>
          </div>

          {/* SHA-256 Hash Card */}
          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-bold">
                <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Verification Checksum (SHA-256)</span>
              </span>
              <LiquidButton
                onClick={handleCopyHash}
                size="xs"
                variant={copied ? "emerald" : "default"}
                icon={copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                iconPosition="left"
                className="font-mono text-[11px]"
              >
                {copied ? "Copied" : "Copy"}
              </LiquidButton>
            </div>
            <code className="text-[11px] font-mono text-indigo-900 dark:text-indigo-200 font-semibold break-all select-all block bg-white/80 dark:bg-black/50 p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1]">
              {notice.content_hash}
            </code>
          </div>

          {/* Source Citation */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/[0.1]">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Official Portal Link:
            </span>
            <LiquidButton
              as="a"
              href={notice.url}
              target="_blank"
              rel="noreferrer"
              size="xs"
              variant="primary"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              className="text-xs font-semibold truncate max-w-xs"
            >
              <span className="truncate">{notice.url}</span>
            </LiquidButton>
          </div>

        </div>

        {/* Sticky Footer */}
        <div className="p-4 px-6 border-t border-slate-200/80 dark:border-white/10 flex justify-end flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <LiquidButton
            onClick={onClose}
            size="sm"
            variant="primary"
            className="px-5"
          >
            Close
          </LiquidButton>
        </div>

      </motion.div>
    </div>
  );
}
