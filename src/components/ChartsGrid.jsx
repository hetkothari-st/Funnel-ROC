import React from 'react';
import ChartPanel from './ChartPanel';

const ChartsGrid = ({ tokens, onRemoveToken }) => {
  if (tokens.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-white/20 text-sm font-medium mb-1">No charts yet</p>
          <p className="text-white/10 text-xs">Select strikes from the sidebar to begin</p>
        </div>
      </div>
    );
  }

  const count = tokens.length;

  const getGridCols = () => {
    if (count === 1) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return Math.min(4, Math.ceil(Math.sqrt(count)));
  };

  const cols = getGridCols();
  const rows = Math.ceil(count / cols);

  // For scrollable grids (many charts), use fixed height per chart
  // For few charts, fill available space
  const useFixedHeight = rows > 2;
  const chartMinHeight = 320;

  const gridStyle = useFixedHeight
    ? {
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridAutoRows: `${chartMinHeight}px`,
      }
    : {
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      };

  return (
    <div
      className={`flex-1 p-3 grid gap-3 ${useFixedHeight ? 'overflow-auto' : 'overflow-hidden'}`}
      style={gridStyle}
    >
      {tokens.map((token) => (
        <div key={token.id} className="min-h-0 h-full">
          <ChartPanel
            item={token}
            onRemove={onRemoveToken}
          />
        </div>
      ))}
    </div>
  );
};

export default ChartsGrid;
