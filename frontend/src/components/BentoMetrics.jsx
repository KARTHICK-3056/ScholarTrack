import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Hourglass, 
  CalendarClock, 
  Server, 
  ArrowUpRight 
} from 'lucide-react';
import LiquidButton from './LiquidButton';

export default function BentoMetrics({ 
  metrics, 
  onFilterClosingSoon, 
  onOpenSources 
}) {
  const activeCount = metrics?.active_verified_count ?? 0;
  const closingSoonCount = metrics?.closing_soon_count ?? 0;
  const revisedCount = metrics?.revisions_detected_count ?? 0;
  const syncHealth = metrics?.adapter_sync_health;
  const isHealthy = syncHealth?.all_healthy ?? true;

  const springTransition = { type: "spring", stiffness: 450, damping: 25 };

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto w-full px-4 mb-6">
      
      {/* 1. Active Scholarships */}
      <motion.div 
        whileHover={{ scale: 1.015, y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
        className="liquidglass glassContainer liquid-glass flex flex-col justify-between p-5 relative overflow-hidden group cursor-default"
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-white/60 tracking-wider uppercase">
            Active Scholarships
          </span>
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
            {activeCount}
          </span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Verified & Open</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-white/50 mt-2">
          Government & foundation grants
        </p>
      </motion.div>

      {/* 2. Closing Within 14 Days */}
      <motion.div 
        whileHover={{ scale: 1.015, y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
        onClick={onFilterClosingSoon}
        className="liquidglass glassContainer liquid-glass flex flex-col justify-between p-5 relative overflow-hidden group cursor-pointer hover:border-amber-400/50"
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-white/60 tracking-wider uppercase">
            Closing Within 14 Days
          </span>
          <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
            <Hourglass className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
            {closingSoonCount}
          </span>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Urgent Deadlines</span>
        </div>
        <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/[0.06] flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-white/50">Expiring opportunities</span>
          <LiquidButton
            size="xs"
            variant="amber"
            icon={<ArrowUpRight className="w-3 h-3" />}
            onClick={(e) => {
              e.stopPropagation();
              onFilterClosingSoon();
            }}
          >
            View
          </LiquidButton>
        </div>
      </motion.div>

      {/* 3. Recently Updated Dates */}
      <motion.div 
        whileHover={{ scale: 1.015, y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
        className="liquidglass glassContainer liquid-glass flex flex-col justify-between p-5 relative overflow-hidden group cursor-default"
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-white/60 tracking-wider uppercase">
            Recently Updated Dates
          </span>
          <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
            <CalendarClock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
            {revisedCount}
          </span>
          <span className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">Extensions Tracked</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-white/50 mt-2">
          Official deadline revisions
        </p>
      </motion.div>

      {/* 4. Official Sources Connected */}
      <motion.div 
        whileHover={{ scale: 1.015, y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
        onClick={onOpenSources}
        className="liquidglass glassContainer liquid-glass flex flex-col justify-between p-5 relative overflow-hidden group cursor-pointer hover:border-indigo-400/50"
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-white/60 tracking-wider uppercase">
            Official Sources Connected
          </span>
          <div className="w-8 h-8 rounded-full bg-slate-900/5 dark:bg-white/10 border border-black/5 dark:border-white/10 text-slate-700 dark:text-white/80 flex items-center justify-center shadow-sm">
            <Server className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tight font-mono ${
            isHealthy ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}>
            {isHealthy ? "2 Portals Live" : "1 Portal Offline"}
          </span>
        </div>
        <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/[0.06] flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-white/50">NSP, AICTE, CSIR</span>
          <LiquidButton
            size="xs"
            variant="primary"
            icon={<ArrowUpRight className="w-3 h-3" />}
            onClick={(e) => {
              e.stopPropagation();
              onOpenSources();
            }}
          >
            Manage
          </LiquidButton>
        </div>
      </motion.div>

    </section>
  );
}
