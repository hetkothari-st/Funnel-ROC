import React from 'react';

const Header = ({ status, monitors, activeMonitorId, onSelectMonitor, onAddMonitor, onRemoveMonitor, user, onLogout }) => {
  return (
    <header className="h-12 flex-shrink-0 bg-bg-secondary border-b border-border flex items-center px-4 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-[10px] font-black tracking-tighter">
          FR
        </div>
        <span className="text-sm font-semibold text-white/90 tracking-tight">Funnel ROC</span>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-1.5 text-[10px] text-white/50 mr-4">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            status === 'connected'
              ? 'bg-emerald-400 animate-pulse'
              : status === 'connecting'
              ? 'bg-yellow-400 animate-pulse'
              : 'bg-red-400'
          }`}
        />
        <span className="uppercase tracking-wider font-medium">
          {status === 'connected' ? 'Live Feed' : status}
        </span>
      </div>

      {/* Monitor Tabs */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
        {monitors.map((m, idx) => (
          <button
            key={m.id}
            onClick={() => onSelectMonitor(m.id)}
            className={`group relative px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeMonitorId === m.id
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <span>Monitor {idx + 1}</span>
            {monitors.length > 1 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveMonitor(m.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all text-[10px]"
              >
                ✕
              </span>
            )}
          </button>
        ))}
        <button
          onClick={onAddMonitor}
          className="px-2.5 py-1.5 rounded-md border border-dashed border-white/10 text-white/25 text-xs hover:border-white/30 hover:text-white/50 transition-all"
        >
          +
        </button>
      </div>

      {/* User chip + logout */}
      {user && (
        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/10 rounded h-7 pl-1.5 pr-1 ml-auto flex-shrink-0">
          <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[9px] font-black text-blue-300">
            {(user.name || user.email || '?').charAt(0).toUpperCase()}
          </div>
          <span className="text-[10px] font-bold text-white/60 max-w-[80px] truncate">
            {user.name || user.email}
          </span>
          <button
            onClick={onLogout}
            title="Sign out"
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
