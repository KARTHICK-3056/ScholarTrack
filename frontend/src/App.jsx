import React, { useState, useEffect, useCallback } from 'react';
import AmbientMesh from './components/AmbientMesh';
import Dock from './components/Dock';
import BentoMetrics from './components/BentoMetrics';
import FilterBar from './components/FilterBar';
import NoticeCard from './components/NoticeCard';
import SourceDrawer from './components/SourceDrawer';
import DiffModal from './components/DiffModal';
import AlertDrawer from './components/AlertDrawer';
import LiquidButton from './components/LiquidButton';
import { Compass, RefreshCw, CheckCircle2, ArrowRight, Server } from 'lucide-react';

const API_BASE = "/api";

export default function App() {
  const [notices, setNotices] = useState([]);
  const [sources, setSources] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Theme state persisted in localStorage (default to light or dark per user preference)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("scholartrack_theme") || "light";
  });

  // Timezone state - Default to IST (Asia/Kolkata)
  const [selectedTimezone, setSelectedTimezone] = useState("IST");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    notice_type: "All",
    education_level: "All",
    discipline: "All",
    region: "All",
    confirmed_only: false,
  });

  // Modals & Drawers
  const [selectedNoticeForDiff, setSelectedNoticeForDiff] = useState(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("scholartrack_theme", theme);
  }, [theme]);

  // Show brief feedback toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all core data
  const loadAllData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (filters.education_level !== "All") params.append("education_level", filters.education_level);
      if (filters.discipline !== "All") params.append("discipline", filters.discipline);
      if (filters.region !== "All" && filters.region !== "All India") {
        params.append("region", filters.region);
      }
      if (filters.notice_type !== "All") params.append("notice_type", filters.notice_type);
      if (filters.confirmed_only) params.append("confirmed_only", "true");

      const [noticesRes, sourcesRes, metricsRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/notices?${params.toString()}`).then(r => r.json()),
        fetch(`${API_BASE}/sources`).then(r => r.json()),
        fetch(`${API_BASE}/metrics`).then(r => r.json()),
        fetch(`${API_BASE}/alerts`).then(r => r.json()),
      ]);

      setNotices(noticesRes.notices || []);
      setSources(sourcesRes.sources || []);
      setMetrics(metricsRes);
      setAlerts(alertsRes.alerts || []);
    } catch (err) {
      console.error("Error loading ScholarTrack data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handlers for Source operations
  const handleRefreshSource = async (sourceId) => {
    const res = await fetch(`${API_BASE}/sources/${sourceId}/refresh`, { method: "POST" });
    const data = await res.json();
    await loadAllData();
    showToast(`Refreshed ${sourceId}`);
    return data;
  };

  const handleTriggerRevision = async () => {
    const res = await fetch(`${API_BASE}/mentor-challenge/revise-deadline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notice_id: "aicte-pragati-swanath",
        new_deadline: "2026-11-20T18:29:59Z",
        reason: "Official Extension via Ministry Portal"
      })
    });
    const data = await res.json();
    await loadAllData();
    showToast("AICTE Pragati deadline extended to 20 Nov 2026!");
    return data;
  };

  const [isOutageActive, setIsOutageActive] = useState(false);
  const handleToggleOutage = async () => {
    const nextState = !isOutageActive;
    setIsOutageActive(nextState);
    const res = await fetch(`${API_BASE}/mentor-challenge/simulate-outage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_id: "source_alpha",
        simulate: nextState,
        reason: nextState ? "HTTP 503 Gateway Timeout (Simulated)" : null
      })
    });
    const data = await res.json();
    await loadAllData();
    showToast(nextState ? "Source Alpha marked Offline" : "Source Alpha Restored");
    return data;
  };

  const handleResetSystem = async () => {
    setIsOutageActive(false);
    const res = await fetch(`${API_BASE}/mentor-challenge/reset`, { method: "POST" });
    const data = await res.json();
    await loadAllData();
    showToast("System reset to initial state");
    return data;
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilters({
      notice_type: "All",
      education_level: "All",
      discipline: "All",
      region: "All",
      confirmed_only: false,
    });
  };

  const isHealthySources = sources.every(s => s.last_status === "HEALTHY");

  return (
    <div className="relative min-h-screen pb-12 transition-colors duration-300">

      {/* 1. Ambient Mesh Canvas (Apple Daylight Pastel in Light / Obsidian in Dark) */}
      <AmbientMesh theme={theme} />

      {/* 2. Floating Top Dock (iOS Dynamic Island Scroll-Collapsing Search Bar) */}
      <Dock
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        unreadAlertsCount={alerts.length}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenSources={() => setIsSourcesOpen(true)}
        sourcesCount={`${sources.filter(s => s.last_status === "HEALTHY").length}/${sources.length}`}
        isSourceOutage={!isHealthySources}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-900/90 dark:bg-indigo-950/90 border border-indigo-400/40 text-white shadow-2xl backdrop-blur-xl font-mono text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Hero Section (Crisp, High-Contrast Apple Daylight Typography) */}
      <main className="relative z-10 pt-28 sm:pt-32">
        <header className="max-w-7xl mx-auto px-4 text-center mb-8">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#0F172A] dark:text-white mb-2">
            Scholarships & Fellowships
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-indigo-300 dark:via-indigo-100 dark:to-violet-300 mb-3">
            Verified Deadline Tracker
          </h2>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed font-normal">
            Track verified Indian and global scholarships, eligibility criteria, and real-time deadline updates directly from official portals.
          </p>

          {/* Liquid Glass Hero Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mt-6">
            <LiquidButton
              size="lg"
              variant="primary"
              showOrb
              icon={
                <svg className="w-4 h-4 fill-current" viewBox="0 0 1024 1024">
                  <path d="M779.180132 473.232045 322.354755 16.406668c-21.413706-21.413706-56.121182-21.413706-77.534887 0-21.413706 21.413706-21.413706 56.122205 0 77.534887l418.057421 418.057421L244.819868 930.057421c-21.413706 21.413706-21.413706 56.122205 0 77.534887 10.706853 10.706853 24.759917 16.059767 38.767955 16.059767s28.061103-5.353938 38.767955-16.059767L779.180132 550.767955C800.593837 529.35425 800.593837 494.64575 779.180132 473.232045z" />
                </svg>
              }
              onClick={() => {
                document.getElementById('scholarships-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Get started
            </LiquidButton>

            <LiquidButton
              size="lg"
              showOrb
              icon={<Server className="w-4 h-4" />}
              onClick={() => setIsSourcesOpen(true)}
            >
              Inspect Sources ({sources.filter(s => s.last_status === "HEALTHY").length}/{sources.length})
            </LiquidButton>
          </div>
        </header>

        {/* 3. Bento Metric Ribbon (Tactile Spring Bounce Micro-Interactions) */}
        <BentoMetrics
          metrics={metrics}
          onFilterClosingSoon={() => {
            setFilters(prev => ({ ...prev, confirmed_only: true }));
          }}
          onOpenSources={() => setIsSourcesOpen(true)}
        />

        {/* 4. Filter Bar (Sliding layoutId Glass Pill Indicator) */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          totalResults={notices.length}
          onResetFilters={handleResetFilters}
        />

        {/* 5. Liquid Glass Notice Cards Grid */}
        <div id="scholarships-grid" className="max-w-7xl mx-auto px-4 scroll-mt-24">
          {isLoading ? (
            <div className="text-center py-20">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-mono text-slate-500 dark:text-white/50">Fetching verified notifications...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="liquidglass glassContainer liquid-glass p-12 text-center max-w-xl mx-auto">
              <Compass className="w-10 h-10 text-slate-400 dark:text-white/30 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No Matching Scholarships Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/50 mb-4">
                Try loosening your degree level, discipline, or region filters.
              </p>
              <LiquidButton
                onClick={handleResetFilters}
                size="md"
                variant="primary"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Reset All Filters
              </LiquidButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notices.map((notice) => (
                <NoticeCard
                  key={notice.notice_id}
                  notice={notice}
                  selectedTimezone={selectedTimezone}
                  onOpenDiff={(n) => setSelectedNoticeForDiff(n)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Clean Footer with Subtle Legal/Eligibility Disclaimer */}
      <footer className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-black/5 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-white/40">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-white/70">ScholarTrack</span>
          <span>•</span>
          <span>Verified Indian & International Scholarships</span>
        </div>
        <p className="text-center sm:text-right max-w-xl text-[11px] leading-relaxed">
          *Eligibility criteria and deadlines are extracted directly from official notifications. Please verify full guidelines on respective official portals.
        </p>
      </footer>

      {/* Date History & Verification Floating Window */}
      <DiffModal
        notice={selectedNoticeForDiff}
        onClose={() => setSelectedNoticeForDiff(null)}
        selectedTimezone={selectedTimezone}
      />

      {/* Deadline Updates Floating Window */}
      <AlertDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        selectedTimezone={selectedTimezone}
        onSelectNoticeFromAlert={(alert) => {
          setIsAlertsOpen(false);
          const found = notices.find(n => n.notice_id === alert.notice_id);
          if (found) setSelectedNoticeForDiff(found);
        }}
      />

      {/* Official Sources Floating Window (with Timezone Selector & Evaluation Controls) */}
      <SourceDrawer
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
        sources={sources}
        selectedTimezone={selectedTimezone}
        setSelectedTimezone={setSelectedTimezone}
        onRefreshSource={handleRefreshSource}
        onTriggerRevision={handleTriggerRevision}
        onToggleOutage={handleToggleOutage}
        onResetSystem={handleResetSystem}
      />

    </div>
  );
}
