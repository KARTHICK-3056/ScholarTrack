import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Search,
  Bell,
  Sun,
  Moon,
  X
} from 'lucide-react';
import LiquidButton from './LiquidButton';

export default function Dock({
  searchQuery,
  setSearchQuery,
  unreadAlertsCount,
  onOpenAlerts,
  onOpenSources,
  sourcesCount = "2/2",
  isSourceOutage = false,
  theme,
  setTheme
}) {
  const isDark = theme === "dark";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const inputRef = useRef(null);
  const lastScrollY = useRef(0);

  // Ultra-fast spring physics with signature iOS snappy response
  const fastSpring = {
    type: "spring",
    stiffness: 580,
    damping: 32,
    mass: 0.45
  };

  // Directional scroll listener:
  // - Scrolling down past 70px collapses into the pure floating search bar fast.
  // - Scrolling UP even slightly restores the full big navbar instantly!
  // - Near top (scrollY <= 50px), always full navbar.
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const deltaY = currentScrollY - lastScrollY.current;

          if (currentScrollY <= 50) {
            setIsCollapsed(false);
          } else if (deltaY > 6 && currentScrollY > 70) {
            // Scrolling down -> collapse
            setIsCollapsed(true);
          } else if (deltaY < -6) {
            // Scrolling up -> expand
            setIsCollapsed(false);
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = (e) => {
    e.stopPropagation();
    setTheme(isDark ? "light" : "dark");
  };

  // When clicking the small search bar, expand and focus the input
  const handleNavClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
    }
  };

  return (
    <header className="sticky top-4 z-40 px-4 max-w-7xl mx-auto w-full flex justify-center pointer-events-none">
      <motion.nav
        animate={{
          maxWidth: isCollapsed ? 340 : 1024,
        }}
        whileHover={isCollapsed ? { scale: 1.025, y: -2 } : {}}
        whileTap={isCollapsed ? { scale: 0.975 } : {}}
        transition={fastSpring}
        aria-label="Dynamic Island Navigation"
        onClick={handleNavClick}
        className={`pointer-events-auto liquidglass glassContainer liquid-dock rounded-full flex items-center shadow-2xl w-full ${isCollapsed
            ? "cursor-pointer py-1.5 px-3.5 justify-center ring-1 ring-indigo-500/20"
            : "py-2 px-3 sm:px-4 justify-between"
          }`}
      >

        {/* Brand / Logo (Left) — Smoothly springs width to 0 when collapsed */}
        <motion.div
          animate={{
            maxWidth: isCollapsed ? 0 : 200,
            opacity: isCollapsed ? 0 : 1,
            scale: isCollapsed ? 0.85 : 1,
          }}
          transition={fastSpring}
          style={{ pointerEvents: isCollapsed ? "none" : "auto" }}
          className="overflow-hidden flex-shrink-0"
        >
          <div className="flex items-center gap-2.5 pr-3 whitespace-nowrap">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-400 p-[1px] shadow-[0_0_15px_rgba(99,102,241,0.35)]">
              <div className="w-full h-full bg-slate-900 dark:bg-[#070913] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
              </div>
            </div>
            <span className="font-bold tracking-tight text-base text-slate-900 dark:text-white">
              ScholarTrack
            </span>
          </div>
        </motion.div>

        {/* Dynamic Island Search Bar:
            In collapsed mode: the entire dock IS the search bar! (No inner border, no inner background, no 'nav around it').
            In expanded mode: subtle recessed pill inside the main navbar. */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/40 pointer-events-none" />
          <input
            ref={inputRef}
            id="global-search-input"
            type="text"
            value={searchQuery}
            onFocus={() => {
              if (isCollapsed) setIsCollapsed(false);
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isCollapsed ? "Search scholarships..." : "Search NSP, PMRF, AICTE, Reliance, CSIR, IIT..."}
            className={`w-full text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none transition-colors duration-100 ${isCollapsed
                ? "bg-transparent border-0 pl-8 pr-7 py-1.5 focus:ring-0 shadow-none cursor-pointer"
                : "bg-slate-900/[0.04] dark:bg-white/[0.04] hover:bg-slate-900/[0.07] dark:hover:bg-white/[0.07] focus:bg-white dark:focus:bg-white/[0.09] border border-black/5 dark:border-white/[0.1] focus:border-indigo-500 dark:focus:border-indigo-400/50 rounded-full pl-9 pr-8 py-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]"
              }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded-full"
              title="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Controls: Theme Toggle, Sources Pill, Alerts Pill — Springs to 0 when collapsed */}
        <motion.div
          animate={{
            maxWidth: isCollapsed ? 0 : 320,
            opacity: isCollapsed ? 0 : 1,
            scale: isCollapsed ? 0.85 : 1,
          }}
          transition={fastSpring}
          style={{ pointerEvents: isCollapsed ? "none" : "auto" }}
          className={`${isCollapsed ? "overflow-hidden" : "overflow-visible"} flex-shrink-0 py-1`}
        >
          <div className="flex items-center gap-2.5 pl-2 whitespace-nowrap overflow-visible">

            {/* Light / Dark Mode Toggle */}
            <LiquidButton
              id="theme-toggle-btn"
              size="icon"
              onClick={toggleTheme}
              onMouseDown={(e) => e.stopPropagation()}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="flex-shrink-0 w-[36px] h-[36px]"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </LiquidButton>

            {/* Alert Queue Pill (Horizontally aligned with 36px height matching Theme Toggle) */}
            <LiquidButton
              id="alerts-drawer-btn"
              size="sm"
              variant={unreadAlertsCount > 0 ? "amber" : "default"}
              onClick={(e) => {
                e.stopPropagation();
                onOpenAlerts();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              icon={<Bell className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 group-hover:rotate-12 transition-transform" />}
              iconPosition="left"
              className="text-xs font-semibold h-[36px] px-3 flex-shrink-0"
            >
              <span>Alerts</span>
              {unreadAlertsCount > 0 && (
                <span className="ml-1.5 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-mono font-bold rounded-full bg-amber-500 text-black shadow-sm">
                  {unreadAlertsCount}
                </span>
              )}
            </LiquidButton>

          </div>
        </motion.div>

      </motion.nav>
    </header>
  );
}

