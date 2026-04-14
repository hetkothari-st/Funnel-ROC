import React, { useState } from 'react';
import StrikeSelector from './StrikeSelector';

const Sidebar = ({ contracts, tokens, onAddTokens, onRemoveToken, onClearTokens }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="w-10 flex-shrink-0 bg-bg-secondary border-r border-border flex flex-col items-center py-3">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-all"
          title="Expand sidebar"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-bg-secondary border-r border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-[10px] uppercase text-white/30 font-bold tracking-widest">
          Strike Config
        </span>
        <button
          onClick={() => setIsCollapsed(true)}
          className="w-6 h-6 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Strike Selector */}
      <div className="flex-1 overflow-y-auto p-3">
        <StrikeSelector contracts={contracts} onAdd={onAddTokens} />
      </div>

      {/* Active Charts List */}
      {tokens.length > 0 && (
        <div className="border-t border-border">
          <div className="p-3 flex items-center justify-between">
            <span className="text-[10px] uppercase text-white/30 font-bold tracking-widest">
              Active ({tokens.length})
            </span>
            <button
              onClick={onClearTokens}
              className="text-[9px] text-red-400/60 hover:text-red-400 transition-colors font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto px-3 pb-3 space-y-1">
            {tokens.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-1.5 px-2 rounded-md bg-white/[0.02] hover:bg-white/[0.04] group transition-all"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      t.type === 'CE' ? 'bg-emerald-400' : 'bg-purple-400'
                    }`}
                  />
                  <span className="text-[11px] text-white/70 font-medium">
                    {t.strike} {t.type}
                  </span>
                  <span
                    className={`text-[8px] uppercase font-semibold ${
                      t.side === 'buy'
                        ? 'text-emerald-400/50'
                        : t.side === 'sell'
                        ? 'text-red-400/50'
                        : 'text-accent/50'
                    }`}
                  >
                    {t.side}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveToken(t.id)}
                  className="text-white/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-[10px]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
