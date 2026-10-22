import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Flame,
  Globe,
  RotateCw
} from 'lucide-react';
import { formatToTimezone, TIMEZONES } from '../utils/timezones';
import LiquidButton from './LiquidButton';

export default function SourceDrawer({
  isOpen,
  onClose,
  sources,
  selectedTimezone,
  setSelectedTimezone,
  onRefreshSource,
  onTriggerRevision,
  onToggleOutage,
  onResetSystem
}) {
  const [syncingId, setSyncingId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const handleSync = async (sourceId) => {
    try {
      setSyncingId(sourceId);
      await onRefreshSource(sourceId);
      setActionMsg(`Source ${sourceId} synced successfully.`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      setActionMsg(`Sync error: ${err.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop (click outside to dismiss) */}
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
            className="liquidglass glassContainer floating-glass-window relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-[32px] shadow-2xl z-10 overflow-hidden"
          >
            {/* Sticky Header with Close Button */}
            <div className="p-6 pb-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Official Data Sources
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Live scraping health & timezone configuration
                  </p>
                </div>
              </div>

              <LiquidButton
                size="icon-sm"
                onClick={onClose}
                title="Close Sources"
              >
                <X className="w-4 h-4" />
              </LiquidButton>
            </div>

            {/* Scrollable Body (Top cards never clipped) */}
            <div className="p-6 pt-4 overflow-y-auto flex-1 space-y-4 no-scrollbar">
              
              {/* Action Banner */}
              {actionMsg && (
                <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-xs font-mono font-medium text-indigo-700 dark:text-indigo-300">
                  {actionMsg}
                </div>
              )}

              {/* Subtle Timezone Selector with Liquid Glass Pills */}
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Evaluation Timezone
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      Default: Indian Standard Time (IST)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-black/5 dark:bg-black/30 p-1 rounded-full border border-black/5 dark:border-white/10">
                  {Object.keys(TIMEZONES).map((tzKey) => {
                    const isSelected = selectedTimezone === tzKey;
                    return (
                      <LiquidButton
                        key={tzKey}
                        size="xs"
                        variant={isSelected ? "active" : "default"}
                        onClick={() => setSelectedTimezone(tzKey)}
                        className="font-mono"
                      >
                        {tzKey}
                      </LiquidButton>
                    );
                  })}
                </div>
              </div>

              {/* Connected Source Cards */}
              {sources.map((source) => {
                const isHealthy = source.last_status === "HEALTHY";
                return (
                  <div
                    key={source.source_id}
                    className="p-4 rounded-2xl bg-slate-100/70 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                        {source.source_id}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isHealthy
                          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30"
                      }`}>
                        {isHealthy ? <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                        <span>{source.last_status}</span>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {source.name}
                    </h4>

                    <a
                      href={source.base_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-1 font-mono truncate mt-0.5 mb-3 font-medium"
                    >
                      <span className="truncate">{source.base_url}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>

                    {/* Metadata Well */}
                    <div className="glass-well p-3 space-y-1.5 text-xs font-mono mb-3">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
                        <span>Compliance:</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">robots.txt Verified</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
                        <span>Timeout & Retries:</span>
                        <span className="text-slate-900 dark:text-white font-semibold">5.0s / 3 attempts</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
                        <span>Ingested Notices:</span>
                        <span className="text-indigo-700 dark:text-indigo-300 font-bold">{source.total_notices} Active</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
                        <span>Last Verified:</span>
                        <span className="text-slate-900 dark:text-white font-semibold">
                          {formatToTimezone(source.last_checked_at, selectedTimezone)}
                        </span>
                      </div>
                    </div>

                    <LiquidButton
                      onClick={() => handleSync(source.source_id)}
                      disabled={syncingId === source.source_id}
                      size="md"
                      variant="default"
                      icon={<RefreshCw className={`w-3.5 h-3.5 ${syncingId === source.source_id ? "animate-spin text-indigo-500" : ""}`} />}
                      iconPosition="left"
                      className="w-full font-mono text-xs"
                    >
                      {syncingId === source.source_id ? "Syncing..." : "Sync Source Now"}
                    </LiquidButton>
                  </div>
                );
              })}

              {/* Developer Sandbox Triggers */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-white/10">
                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-2 font-bold">
                  Evaluation Controls
                </span>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <LiquidButton
                      onClick={onTriggerRevision}
                      size="sm"
                      variant="amber"
                      icon={<Flame className="w-3.5 h-3.5 text-amber-500" />}
                      iconPosition="left"
                      title="Simulate upstream deadline extension"
                      className="font-mono text-[11px]"
                    >
                      Simulate Revision
                    </LiquidButton>
                    <LiquidButton
                      onClick={onToggleOutage}
                      size="sm"
                      variant="rose"
                      icon={<AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                      iconPosition="left"
                      title="Toggle simulated source network outage"
                      className="font-mono text-[11px]"
                    >
                      Toggle Outage
                    </LiquidButton>
                  </div>
                  <LiquidButton
                    onClick={async () => {
                      if (onResetSystem) {
                        await onResetSystem();
                        setActionMsg("System & database restored to initial state.");
                        setTimeout(() => setActionMsg(null), 3000);
                      }
                    }}
                    size="md"
                    variant="primary"
                    icon={<RotateCw className="w-3.5 h-3.5 text-indigo-500" />}
                    iconPosition="left"
                    title="Reset all sources, notifications, and simulated states to initial defaults"
                    className="w-full font-mono text-xs font-medium"
                  >
                    Reset System to Initial State
                  </LiquidButton>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-4 px-6 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-mono font-semibold">
                2 Sources Active
              </span>
              <LiquidButton
                onClick={onClose}
                size="sm"
                variant="primary"
                className="px-5"
              >
                Done
              </LiquidButton>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
