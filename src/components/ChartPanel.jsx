import React, { useEffect, useRef } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';
import { getDepthStore } from '../hooks/useMarketData';

const ChartPanel = ({ item, onRemove }) => {
  const chartContainerRef = useRef(null);
  const rocSeriesRef = useRef(null);
  const zeroSeriesRef = useRef(null);
  const bidSeriesRef = useRef(null);
  const prevBidRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const lastSecondRef = useRef(0);

  // Create chart once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#6b7280',
        fontSize: 10,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(99,102,241,0.3)', width: 1, style: LineStyle.Dashed },
        horzLine: { color: 'rgba(99,102,241,0.3)', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: (time) => {
          const d = new Date(time * 1000);
          return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        },
      },
      handleScroll: { vertTouchDrag: false },
    });

    const rocSeries = chart.addLineSeries({
      color: item.type === 'CE' ? '#10b981' : '#a855f7',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerRadius: 4,
    });

    const zeroSeries = chart.addLineSeries({
      color: 'rgba(255,255,255,0.1)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const bidSeries = chart.addLineSeries({
      color: 'rgba(250,204,21,0.5)',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
      priceScaleId: 'bid',
    });

    chart.priceScale('bid').applyOptions({
      scaleMargins: { top: 0.1, bottom: 0.1 },
      borderVisible: false,
    });

    rocSeriesRef.current = rocSeries;
    zeroSeriesRef.current = zeroSeries;
    bidSeriesRef.current = bidSeries;

    const now = Math.floor(Date.now() / 1000);
    zeroSeries.setData([
      { time: now - 60, value: 0 },
      { time: now + 3600, value: 0 },
    ]);

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    resizeObserverRef.current.observe(chartContainerRef.current);

    // Chart update loop - reads directly from shared store, no React involvement
    const tkn = item.tkn;
    const headerRef = { bid: '-', ask: '-' };

    // Fast loop: read store every 50ms, update header via DOM, chart at 1pt/sec
    const interval = setInterval(() => {
      const store = getDepthStore();
      const depth = store[tkn] || store[Number(tkn)];
      if (!depth) return;

      const depthArr = depth.depths || depth.Depth;
      if (!depthArr || !depthArr[0]) return;

      const currentBid = parseFloat(depthArr[0].BP || 0);
      const currentAsk = parseFloat(depthArr[0].SP || 0);
      if (isNaN(currentBid) || currentBid === 0) return;

      // Update header display at full speed via DOM (no React setState)
      const bidStr = currentBid.toFixed(2);
      const askStr = currentAsk > 0 ? currentAsk.toFixed(2) : '-';
      if (bidStr !== headerRef.bid || askStr !== headerRef.ask) {
        headerRef.bid = bidStr;
        headerRef.ask = askStr;
        const container = chartContainerRef.current?.parentElement;
        if (container) {
          const bidEl = container.querySelector('[data-bid]');
          const askEl = container.querySelector('[data-ask]');
          if (bidEl) bidEl.textContent = 'B: ' + bidStr;
          if (askEl) askEl.textContent = 'A: ' + askStr;
        }
      }

      const now = Math.floor(Date.now() / 1000);

      // Chart: 1 data point per second (lightweight-charts constraint)
      if (now === lastSecondRef.current) return;
      lastSecondRef.current = now;

      // Bid series
      if (bidSeriesRef.current) {
        try { bidSeriesRef.current.update({ time: now, value: currentBid }); } catch {}
      }

      // ROC
      const prevBid = prevBidRef.current;
      if (prevBid !== null && prevBid !== 0) {
        const roc = Math.abs(((currentBid - prevBid) / prevBid) * 100);
        if (rocSeriesRef.current) {
          try { rocSeriesRef.current.update({ time: now, value: roc }); } catch {}
        }
        if (zeroSeriesRef.current) {
          try { zeroSeriesRef.current.update({ time: now + 60, value: 0 }); } catch {}
        }
      }

      prevBidRef.current = currentBid;
    }, 50);

    return () => {
      clearInterval(interval);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      chart.remove();
    };
  }, [item.tkn, item.type]);

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden group hover:border-border-light transition-all flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-bold tracking-tight ${
              item.type === 'CE' ? 'text-emerald-400' : 'text-purple-400'
            }`}
          >
            {item.strike} {item.type}
          </span>
          <span className="text-[9px] text-white/20 font-mono">{item.index}</span>
          <span
            className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${
              item.side === 'buy'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : item.side === 'sell'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-accent/10 text-accent border border-accent/20'
            }`}
          >
            {item.side}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px]">
            <span data-bid className="text-emerald-400 font-mono font-semibold">B: -</span>
            <span data-ask className="text-red-400 font-mono font-semibold">A: -</span>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="w-5 h-5 rounded flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all text-xs"
          >
            ✕
          </button>
        </div>
      </div>
      <div ref={chartContainerRef} className="flex-1 min-h-0" />
    </div>
  );
};

export default React.memo(ChartPanel);
