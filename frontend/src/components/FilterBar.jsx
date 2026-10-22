import React from 'react';
import { SlidersHorizontal, X, CheckSquare, Square } from 'lucide-react';
import LiquidButton from './LiquidButton';

export default function FilterBar({
  filters,
  setFilters,
  totalResults = 0,
  onResetFilters
}) {
  const noticeTypes = ["All", "Scholarship", "Fellowship"];
  const degreeLevels = ["All", "Undergraduate", "Postgraduate (Master's)", "PhD / Doctoral", "Postdoctoral"];
  const disciplines = ["All", "Engineering & Tech", "Science & Research", "Medical", "Humanities & Commerce"];
  const regions = ["All India", "Central Govt (NSP)", "Corporate / Private Trust", "International (For Indians)"];

  const hasActiveFilters =
    filters.education_level !== "All" ||
    filters.discipline !== "All" ||
    filters.region !== "All" ||
    filters.notice_type !== "All" ||
    filters.confirmed_only;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 mb-8">
      <div className="liquidglass glassContainer liquid-glass flex-col items-stretch p-4 sm:p-5">

        {/* Top Header inside filter box */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-black/5 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-wide">
              Filter Scholarships & Grants
            </span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-900/[0.06] dark:bg-white/[0.08] text-slate-700 dark:text-white/70">
              {totalResults} {totalResults === 1 ? "Program" : "Programs"} Available
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Toggle: Confirmed Deadlines Only in Liquid Glass */}
            <LiquidButton
              id="filter-confirmed-toggle"
              size="sm"
              variant={filters.confirmed_only ? "active" : "default"}
              onClick={() => setFilters(prev => ({ ...prev, confirmed_only: !prev.confirmed_only }))}
              icon={filters.confirmed_only ? (
                <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
              )}
              iconPosition="left"
              className="text-xs"
            >
              Confirmed Deadlines Only
            </LiquidButton>

            {/* Clear Filters Button in Liquid Glass */}
            {hasActiveFilters && (
              <LiquidButton
                onClick={onResetFilters}
                size="sm"
                variant="rose"
                icon={<X className="w-3 h-3" />}
                iconPosition="left"
                className="text-xs"
              >
                Reset Filters
              </LiquidButton>
            )}
          </div>
        </div>

        {/* Filter Pills Grid with Horizontal Scroll on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* Program Type Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider block mb-1.5">
              Program Type
            </label>
            <div className="flex flex-wrap gap-2 py-1.5 px-0.5 items-center overflow-visible">
              {noticeTypes.map((type) => {
                const isActive = filters.notice_type === type;
                return (
                  <LiquidButton
                    key={type}
                    size="sm"
                    variant={isActive ? "active" : "default"}
                    onClick={() => setFilters(prev => ({ ...prev, notice_type: type }))}
                    className="flex-shrink-0 h-[34px]"
                  >
                    {type}
                  </LiquidButton>
                );
              })}
            </div>
          </div>

          {/* Degree Level Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider block mb-1.5">
              Degree Level
            </label>
            <div className="flex flex-wrap gap-2 py-1.5 px-0.5 items-center overflow-visible">
              {degreeLevels.map((lvl) => {
                const isActive = filters.education_level === lvl;
                return (
                  <LiquidButton
                    key={lvl}
                    size="sm"
                    variant={isActive ? "active" : "default"}
                    onClick={() => setFilters(prev => ({ ...prev, education_level: lvl }))}
                    className="flex-shrink-0 h-[34px]"
                  >
                    {lvl}
                  </LiquidButton>
                );
              })}
            </div>
          </div>

          {/* Discipline Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider block mb-1.5">
              Discipline
            </label>
            <div className="flex flex-wrap gap-2 py-1.5 px-0.5 items-center overflow-visible">
              {disciplines.map((disc) => {
                const isActive = filters.discipline === disc;
                return (
                  <LiquidButton
                    key={disc}
                    size="sm"
                    variant={isActive ? "active" : "default"}
                    onClick={() => setFilters(prev => ({ ...prev, discipline: disc }))}
                    className="flex-shrink-0 h-[34px]"
                  >
                    {disc}
                  </LiquidButton>
                );
              })}
            </div>
          </div>

          {/* Scope / Region Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider block mb-1.5">
              Scope / Region
            </label>
            <div className="flex flex-wrap gap-2 py-1.5 px-0.5 items-center overflow-visible">
              {["All", ...regions].map((reg) => {
                const isActive = (filters.region === "All" && reg === "All") || filters.region === reg;
                return (
                  <LiquidButton
                    key={reg}
                    size="sm"
                    variant={isActive ? "active" : "default"}
                    onClick={() => setFilters(prev => ({ ...prev, region: reg }))}
                    className="flex-shrink-0 h-[34px]"
                  >
                    {reg}
                  </LiquidButton>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
