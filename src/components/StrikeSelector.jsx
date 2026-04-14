import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { getDepthStore } from '../hooks/useMarketData';
import { INDEX_SPOT_MAP, findContract } from '../utils/contracts';

const StrikeSelector = ({ contracts, onAdd }) => {
  const [index, setIndex] = useState('NIFTY');
  const [expiry, setExpiry] = useState('');
  const [type, setType] = useState('CE');
  const [side, setSide] = useState('buy');
  const [searchText, setSearchText] = useState('');
  const [selectedStrikes, setSelectedStrikes] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Available expiries
  const availableExpiries = useMemo(() => {
    if (!contracts.length) return [];
    const searchIndex = index === 'SENSEX' ? 'BSX' : index;
    const filtered = contracts.filter((c) => c.s === searchIndex);
    const expiries = [...new Set(filtered.map((c) => c.e))].sort();
    const today = new Date().toISOString().split('T')[0];
    return expiries.filter((e) => e >= today);
  }, [contracts, index]);

  // Auto-select nearest expiry
  useEffect(() => {
    if (availableExpiries.length > 0 && !availableExpiries.includes(expiry)) {
      setExpiry(availableExpiries[0]);
    }
  }, [availableExpiries, expiry]);

  // All strikes for current index+expiry
  const allStrikes = useMemo(() => {
    if (!contracts.length || !expiry) return [];
    const searchIndex = index === 'SENSEX' ? 'BSX' : index;
    const filtered = contracts.filter(
      (c) => c.s === searchIndex && c.e === expiry
    );
    return [...new Set(filtered.map((c) => Number(c.st)))]
      .sort((a, b) => a - b)
      .map((s) => Math.round(s));
  }, [contracts, index, expiry]);

  // Filtered strikes based on search
  const filteredStrikes = useMemo(() => {
    if (!searchText.trim()) return allStrikes;
    return allStrikes.filter((s) => s.toString().includes(searchText.trim()));
  }, [allStrikes, searchText]);

  // Click outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (focusIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[focusIndex]) {
        items[focusIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusIndex]);

  const toggleStrike = useCallback((strike) => {
    setSelectedStrikes((prev) => {
      if (prev.includes(strike)) {
        return prev.filter((s) => s !== strike);
      }
      return [...prev, strike].sort((a, b) => a - b);
    });
  }, []);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        setFocusIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((i) => Math.min(i + 1, filteredStrikes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && focusIndex >= 0) {
      e.preventDefault();
      toggleStrike(filteredStrikes[focusIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setFocusIndex(-1);
    }
  };

  const handleAdd = () => {
    if (selectedStrikes.length === 0 || !expiry) return;
    const searchIndex = index === 'SENSEX' ? 'BSX' : index;
    const newTokens = [];

    selectedStrikes.forEach((strike) => {
      const strikeVal = Number(strike).toFixed(5);
      const typesToFind = type === 'Both' ? ['CE', 'PE'] : [type];

      const sidesToAdd = side === 'both' ? ['buy', 'sell'] : [side];

      typesToFind.forEach((t) => {
        const match = contracts.find(
          (c) =>
            c.s === searchIndex &&
            Number(c.st).toFixed(5) === strikeVal &&
            c.p === t &&
            c.e === expiry
        );
        if (match) {
          sidesToAdd.forEach((s) => {
            newTokens.push({
              id: `${match.t}_${s}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              tkn: match.t,
              symbol: `${index} ${strike} ${t}`,
              strike: strike.toString(),
              type: t,
              side: s,
              expiry,
              index,
            });
          });
        }
      });
    });

    if (newTokens.length > 0) {
      onAdd(newTokens);
      setSelectedStrikes([]);
      setSearchText('');
      setIsOpen(false);
    }
  };

  const removeChip = (strike) => {
    setSelectedStrikes((prev) => prev.filter((s) => s !== strike));
  };

  const handleQuickStrikes = () => {
    if (!expiry) return;

    const store = getDepthStore();
    const spotConfig = INDEX_SPOT_MAP[index];
    if (!spotConfig) return;

    const spotPacket = store[spotConfig.tokenId];
    if (!spotPacket) {
      alert(`No spot price data yet for ${index}. Wait for WebSocket data.`);
      return;
    }

    const spotPrice = parseFloat(
      spotPacket.Price || spotPacket.iv || spotPacket.ltp || spotPacket.LastTradedPrice ||
      spotPacket.depths?.[0]?.BP || 0
    );
    if (!spotPrice) return;

    const step = spotConfig.step;
    const atm = Math.round(spotPrice / step) * step;

    // CE: ITM = below ATM, OTM = above ATM
    const ceStrikes = [];
    for (let i = 2; i >= 1; i--) ceStrikes.push(atm - i * step);
    ceStrikes.push(atm);
    for (let i = 1; i <= 5; i++) ceStrikes.push(atm + i * step);

    // PE: ITM = above ATM, OTM = below ATM
    const peStrikes = [];
    for (let i = 2; i >= 1; i--) peStrikes.push(atm + i * step);
    peStrikes.push(atm);
    for (let i = 1; i <= 5; i++) peStrikes.push(atm - i * step);

    const typesToFind = type === 'Both' ? ['CE', 'PE'] : [type];
    const sidesToAdd = side === 'both' ? ['buy', 'sell'] : [side];
    const newTokens = [];

    typesToFind.forEach((t) => {
      const strikes = t === 'CE' ? ceStrikes : peStrikes;
      strikes.forEach((strike) => {
        const match = findContract(contracts, index, strike, t, expiry);
        if (match) {
          sidesToAdd.forEach((s) => {
            newTokens.push({
              id: `${match.t}_${s}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              tkn: match.t,
              symbol: `${index} ${strike} ${t}`,
              strike: strike.toString(),
              type: t,
              side: s,
              expiry,
              index,
            });
          });
        }
      });
    });

    if (newTokens.length > 0) {
      onAdd(newTokens);
    } else {
      alert(`No contracts found for ${index} around ATM ${atm}. Check expiry selection.`);
    }
  };

  const formatExpiry = (e) => {
    if (!e) return '';
    const d = new Date(e);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Index + Expiry */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[9px] uppercase text-white/30 font-semibold tracking-wider mb-1 block">
            Index
          </label>
          <select
            value={index}
            onChange={(e) => {
              setIndex(e.target.value);
              setSelectedStrikes([]);
            }}
            className="w-full bg-bg-input border border-border rounded-md px-2.5 py-1.5 text-xs text-white/90 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all appearance-none cursor-pointer"
          >
            {['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'].map((i) => (
              <option key={i} value={i} className="bg-bg-secondary">
                {i}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[9px] uppercase text-white/30 font-semibold tracking-wider mb-1 block">
            Expiry
          </label>
          <select
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full bg-bg-input border border-border rounded-md px-2.5 py-1.5 text-xs text-white/90 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all appearance-none cursor-pointer"
          >
            {availableExpiries.map((e) => (
              <option key={e} value={e} className="bg-bg-secondary">
                {formatExpiry(e)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Type + Side */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[9px] uppercase text-white/30 font-semibold tracking-wider mb-1 block">
            Type
          </label>
          <div className="flex bg-bg-input rounded-md border border-border overflow-hidden">
            {['CE', 'PE', 'Both'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-1.5 text-[10px] font-semibold transition-all ${
                  type === t
                    ? t === 'CE'
                      ? 'bg-emerald-500/20 text-emerald-400 border-b-2 border-emerald-400'
                      : t === 'PE'
                      ? 'bg-red-500/20 text-red-400 border-b-2 border-red-400'
                      : 'bg-accent/20 text-accent border-b-2 border-accent'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[9px] uppercase text-white/30 font-semibold tracking-wider mb-1 block">
            Side
          </label>
          <div className="flex bg-bg-input rounded-md border border-border overflow-hidden">
            {['buy', 'sell', 'both'].map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={`flex-1 py-1.5 text-[10px] font-semibold capitalize transition-all ${
                  side === s
                    ? s === 'buy'
                      ? 'bg-emerald-500/20 text-emerald-400 border-b-2 border-emerald-400'
                      : s === 'sell'
                      ? 'bg-red-500/20 text-red-400 border-b-2 border-red-400'
                      : 'bg-accent/20 text-accent border-b-2 border-accent'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Chips */}
      {selectedStrikes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedStrikes.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/15 text-accent text-[10px] font-medium rounded-full border border-accent/20"
            >
              {s}
              <button
                onClick={() => removeChip(s)}
                className="text-accent/50 hover:text-accent transition-colors"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Strike Search + Dropdown */}
      <div ref={containerRef} className="relative">
        <label className="text-[9px] uppercase text-white/30 font-semibold tracking-wider mb-1 block">
          Strikes
          {selectedStrikes.length > 0 && (
            <span className="text-accent ml-1">({selectedStrikes.length})</span>
          )}
        </label>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type to search strikes..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setIsOpen(true);
            setFocusIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-bg-input border border-border rounded-md px-2.5 py-2 text-xs text-white/90 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-white/20"
        />

        {/* Dropdown */}
        {isOpen && filteredStrikes.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-light rounded-lg shadow-2xl shadow-black/50 z-50 max-h-52 overflow-y-auto">
            <div
              ref={listRef}
              className="py-1"
            >
              {filteredStrikes.map((strike, i) => {
                const isSelected = selectedStrikes.includes(strike);
                const isFocused = focusIndex === i;
                return (
                  <div
                    key={strike}
                    onClick={() => toggleStrike(strike)}
                    className={`flex items-center gap-2.5 px-3 py-1.5 cursor-pointer transition-all text-xs ${
                      isFocused ? 'bg-white/8' : ''
                    } ${isSelected ? '' : 'hover:bg-white/5'}`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? 'bg-accent border-accent'
                          : 'border-white/20'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`font-mono ${
                        isSelected
                          ? 'text-white font-semibold'
                          : 'text-white/60'
                      }`}
                    >
                      {strike}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isOpen && filteredStrikes.length === 0 && searchText && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-light rounded-lg shadow-2xl z-50 p-4 text-center text-white/30 text-xs">
            No strikes found for "{searchText}"
          </div>
        )}
      </div>

      {/* Quick Strikes Button */}
      <button
        onClick={handleQuickStrikes}
        className="w-full py-2 rounded-lg text-xs font-semibold transition-all bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 hover:border-amber-500/50 flex items-center justify-center gap-1.5"
        title="Auto-add ATM + 2 ITM + 5 OTM based on current spot price"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick Strikes
      </button>

      {/* Add Button */}
      <button
        onClick={handleAdd}
        disabled={selectedStrikes.length === 0}
        className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
          selectedStrikes.length > 0
            ? 'bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20'
            : 'bg-white/5 text-white/20 cursor-not-allowed'
        }`}
      >
        {selectedStrikes.length > 0
          ? `Add ${selectedStrikes.length} Strike${selectedStrikes.length > 1 ? 's' : ''} to Monitor`
          : 'Select Strikes to Add'}
      </button>
    </div>
  );
};

export default StrikeSelector;
