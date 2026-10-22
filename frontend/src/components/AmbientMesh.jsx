import React from 'react';

export default function AmbientMesh({ theme = 'light' }) {
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {isDark ? (
        <>
          {/* Dark Mode: Obsidian Canvas with Deep Indigo, Violet & Teal Ambient Orbs */}
          <div className="absolute -top-[15%] -left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-500/12 blur-[150px] pointer-events-none transition-all duration-700" />
          <div className="absolute top-[10%] -right-[15%] w-[650px] h-[650px] rounded-full bg-violet-600/10 blur-[160px] pointer-events-none transition-all duration-700" />
          <div className="absolute top-[50%] left-[25%] w-[700px] h-[700px] rounded-full bg-teal-500/10 blur-[170px] pointer-events-none transition-all duration-700" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </>
      ) : (
        <>
          {/* Light Mode: True Apple Daylight Pearl Alabaster with Sky Blue, Soft Violet, and Warm Rose */}
          <div 
            className="absolute -top-[10%] -left-[5%] w-[620px] h-[620px] rounded-full blur-[130px] pointer-events-none transition-all duration-700"
            style={{ backgroundColor: 'rgba(186, 230, 253, 0.55)' }}
          />
          <div 
            className="absolute top-[12%] -right-[8%] w-[640px] h-[640px] rounded-full blur-[130px] pointer-events-none transition-all duration-700"
            style={{ backgroundColor: 'rgba(221, 214, 254, 0.50)' }}
          />
          <div 
            className="absolute top-[48%] left-[22%] w-[680px] h-[680px] rounded-full blur-[130px] pointer-events-none transition-all duration-700"
            style={{ backgroundColor: 'rgba(254, 205, 211, 0.35)' }}
          />
        </>
      )}
    </div>
  );
}
