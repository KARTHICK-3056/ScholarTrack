import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ArrowRight, ExternalLink, CheckCheck } from 'lucide-react';
import { formatToTimezone } from '../utils/timezones';
import LiquidButton from './LiquidButton';

export default function AlertDrawer({
  isOpen,
  onClose,
  alerts,
  selectedTimezone,
  onSelectNoticeFromAlert
}) {
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
            
            {/* Sticky Header */}
            <div className="p-6 pb-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Deadline Updates
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Official extensions and date revisions
                  </p>
                </div>
              </div>

              <LiquidButton
                size="icon-sm"
                onClick={onClose}
                title="Close Alerts"
              >
                <X className="w-4 h-4" />
              </LiquidButton>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 pt-4 overflow-y-auto flex-1 space-y-3 no-scrollbar">
              {alerts.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <CheckCheck className="w-6 h-6" />
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    No recent deadline changes
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 font-medium max-w-xs mx-auto">
                    All deadlines are current with official notifications.
                  </p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <motion.div
                    key={alert.change_id}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 rounded-2xl bg-slate-100/70 dark:bg-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] transition-all group shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wide">
                        Deadline Extended
                      </span>
                      <span className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300">
                        {formatToTimezone(alert.detected_at, selectedTimezone)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {alert.notice_title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                      {alert.notice_provider}
                    </p>

                    {/* Deadline Shift Diff */}
                    <div className="glass-well p-3 my-2.5 space-y-1 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 line-through">
                        <span>Original:</span>
                        <span>{formatToTimezone(alert.previous_deadline, selectedTimezone)}</span>
                      </div>
                      <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold">
                        <span className="flex items-center gap-1">
                          <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Extended:</span>
                        </span>
                        <span>{formatToTimezone(alert.updated_deadline, selectedTimezone)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <LiquidButton
                        as="a"
                        href={alert.notice_url}
                        target="_blank"
                        rel="noreferrer"
                        size="xs"
                        variant="primary"
                        icon={<ExternalLink className="w-3 h-3" />}
                        className="text-[11px]"
                      >
                        Official Portal
                      </LiquidButton>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Sticky Footer */}
            <div className="p-4 px-6 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-mono font-semibold">
                Total Logged: {alerts.length}
              </span>
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
      )}
    </AnimatePresence>
  );
}
