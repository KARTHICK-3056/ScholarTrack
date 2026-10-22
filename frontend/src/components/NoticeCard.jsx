import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Clock,
  Calendar,
  Award,
  History,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { formatToTimezone, calculateCountdown, formatFreshness } from '../utils/timezones';
import LiquidButton from './LiquidButton';

export default function NoticeCard({
  notice,
  selectedTimezone,
  onOpenDiff
}) {
  const [countdown, setCountdown] = useState(() => calculateCountdown(notice.due_at));

  useEffect(() => {
    if (!notice.due_at) return;
    setCountdown(calculateCountdown(notice.due_at));
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(notice.due_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [notice.due_at]);

  const isRevised = notice.notice_status === 'REVISED';
  const isStale = notice.notice_status === 'STALE';
  const hasDeadline = notice.due_at !== null && notice.due_at !== undefined;

  const formattedDueDate = hasDeadline
    ? formatToTimezone(notice.due_at, selectedTimezone)
    : null;

  const formattedPreviousDate = notice.previous_deadline
    ? formatToTimezone(notice.previous_deadline, selectedTimezone)
    : null;

  // Clean tags from eligibility
  const eligibilityTags = notice.eligibility_excerpt
    ? notice.eligibility_excerpt
      .replace(/Eligibility:\s*/i, '')
      .split(/[,;•]/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && s.length < 50)
      .slice(0, 3)
    : [];

  const spring = { type: "spring", stiffness: 450, damping: 25 };

  return (
    <motion.article
      whileHover={{ scale: 1.015, y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={spring}
      className={`liquidglass glassContainer liquid-glass relative flex flex-col justify-between p-6 group cursor-default ${isRevised
          ? "border-amber-500/40 shadow-[0_8px_30px_rgba(245,158,11,0.12)]"
          : ""
        } ${isStale ? "border-rose-500/40" : ""
        }`}
    >
      {/* Specular Top Border Highlight */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent rounded-t-3xl pointer-events-none" />

      {/* Top Header: Provider, Type Pill, Freshness Indicator */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-300 tracking-wide uppercase">
              {notice.provider}
            </span>
            <span className="text-slate-300 dark:text-white/20">•</span>
            <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full ${notice.notice_type === "Fellowship"
                ? "bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30"
                : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
              }`}>
              {notice.notice_type}
            </span>
          </div>

          {/* Freshness Badge */}
          {isStale ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-mono font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Source Unreachable</span>
            </div>
          ) : isRevised ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Date Extended</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{formatFreshness(notice.verified_at)}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors mb-3 line-clamp-2">
          {notice.title}
        </h3>

        {/* Benefit Highlight Box */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.06] mb-4">
          <Award className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-800 dark:text-white/90 font-medium leading-relaxed">
            {notice.benefit_text}
          </p>
        </div>

        {/* Scope Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-900/[0.04] dark:bg-white/[0.05] text-slate-700 dark:text-white/70 border border-black/5 dark:border-white/[0.06]">
            {notice.education_level}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-900/[0.04] dark:bg-white/[0.05] text-slate-700 dark:text-white/70 border border-black/5 dark:border-white/[0.06]">
            {notice.discipline}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-900/[0.04] dark:bg-white/[0.05] text-slate-700 dark:text-white/70 border border-black/5 dark:border-white/[0.06]">
            {notice.region}
          </span>
        </div>

        {/* Clean Eligibility Tags */}
        {eligibilityTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {eligibilityTags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/[0.08] dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-200 border border-indigo-500/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Recessed Glass Time Well */}
      <div className="mt-auto">
        <div className="glass-well p-4 mb-4">
          {hasDeadline ? (
            <div>
              {/* Clean Header: Countdown to Deadline */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500 dark:text-white/50 flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>Countdown to Deadline</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium">
                  {selectedTimezone}
                </span>
              </div>

              {countdown?.isExpired ? (
                <div className="text-rose-600 dark:text-rose-400 font-mono text-sm font-semibold">
                  Application Closed
                </div>
              ) : countdown ? (
                <div className="font-mono text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 py-1">
                  <span className="px-2 py-1 rounded bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 text-indigo-700 dark:text-indigo-300">
                    {String(countdown.days).padStart(2, '0')}d
                  </span>
                  <span className="text-slate-400 dark:text-white/40">:</span>
                  <span className="px-2 py-1 rounded bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 text-indigo-700 dark:text-indigo-300">
                    {String(countdown.hours).padStart(2, '0')}h
                  </span>
                  <span className="text-slate-400 dark:text-white/40">:</span>
                  <span className="px-2 py-1 rounded bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 text-indigo-700 dark:text-indigo-300">
                    {String(countdown.minutes).padStart(2, '0')}m
                  </span>
                  <span className="text-slate-400 dark:text-white/40">:</span>
                  <span className="px-2 py-1 rounded bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 text-indigo-700 dark:text-indigo-300 text-sm">
                    {String(countdown.seconds).padStart(2, '0')}s
                  </span>
                </div>
              ) : null}

              {/* Deadline Date Row */}
              <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono">
                {isRevised ? (
                  <div className="flex flex-col gap-0.5 w-full">
                    <span className="text-[11px] text-slate-400 dark:text-white/40 line-through">
                      Previous: {formattedPreviousDate}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                      <span>Extended: {formattedDueDate}</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-white/80">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{formattedDueDate}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CSIR-UGC NET JRF & Rolling/TBA Deadlines */
            <div>
              {/* Header: Status / Mode */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500 dark:text-white/50 flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>Timeline Status</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>{selectedTimezone} (Rolling)</span>
                </span>
              </div>

              {/* Segmented Hero Well - Matches Countdown digits style, height, and liquid glass */}
              <div className="py-2.5 px-3 rounded-lg bg-black/5 dark:bg-black/50 border border-black/10 dark:border-white/10 flex items-center justify-center gap-2 my-1 shadow-inner">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse flex-shrink-0" />
                <span className="font-mono text-xs sm:text-sm font-bold tracking-tight text-slate-900 dark:text-white text-center">
                  Dates To Be Announced by Official Source
                </span>
              </div>

              {/* Footer Row matching deadline cards */}
              <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-white/70">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Next notification expected soon on apex portal</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer: Official Portal link & Date History trigger */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/[0.06]">
          <LiquidButton
            as="a"
            href={notice.url}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="primary"
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Official Portal
          </LiquidButton>

          <LiquidButton
            onClick={() => onOpenDiff(notice)}
            size="sm"
            icon={<History className="w-3.5 h-3.5 text-indigo-500" />}
            iconPosition="left"
            className="text-xs font-mono"
          >
            Date History
          </LiquidButton>
        </div>

      </div>
    </motion.article>
  );
}
