import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMarketData } from './hooks/useMarketData';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChartsGrid from './components/ChartsGrid';
import { useAuth, buildWsCredential } from './auth/AuthContext';
import LoginPage from './auth/LoginPage';

const App = () => {
  const { user, logout } = useAuth();
  const wsCredential = useMemo(() => buildWsCredential(user), [user]);

  const [contracts, setContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(true);

  // Monitor management
  const [monitors, setMonitors] = useState(() => {
    const saved = localStorage.getItem('mtc_monitors');
    return saved ? JSON.parse(saved) : [{ id: 0, tokens: [] }];
  });
  const [activeMonitorId, setActiveMonitorId] = useState(() => {
    const saved = localStorage.getItem('mtc_active_monitor');
    return saved ? JSON.parse(saved) : 0;
  });

  // WebSocket
  const { status, subscribe, unsubscribe } = useMarketData(!!user, wsCredential);

  if (!user) return <LoginPage />;

  // Load contracts
  useEffect(() => {
    fetch('/contracts_nsefo.json')
      .then((r) => r.json())
      .then((data) => {
        setContracts(data);
        setContractsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load contracts:', err);
        setContractsLoading(false);
      });
  }, []);

  // Persist monitors
  useEffect(() => {
    localStorage.setItem('mtc_monitors', JSON.stringify(monitors));
  }, [monitors]);

  useEffect(() => {
    localStorage.setItem('mtc_active_monitor', JSON.stringify(activeMonitorId));
  }, [activeMonitorId]);

  // Get current monitor
  const activeMonitor = monitors.find((m) => m.id === activeMonitorId) || monitors[0];

  // Monitor actions
  const handleAddMonitor = useCallback(() => {
    const newId = Math.max(...monitors.map((m) => m.id), -1) + 1;
    setMonitors((prev) => [...prev, { id: newId, tokens: [] }]);
    setActiveMonitorId(newId);
  }, [monitors]);

  const handleRemoveMonitor = useCallback(
    (id) => {
      if (monitors.length <= 1) return;
      setMonitors((prev) => prev.filter((m) => m.id !== id));
      if (activeMonitorId === id) {
        const remaining = monitors.filter((m) => m.id !== id);
        setActiveMonitorId(remaining[0]?.id ?? 0);
      }
    },
    [monitors, activeMonitorId]
  );

  // Token actions for active monitor
  const handleAddTokens = useCallback(
    (newTokens) => {
      // Subscribe to WebSocket
      const quotes = newTokens.map((t) => ({
        Tkn: String(t.tkn),
        Xchg: 'NSEFO',
      }));
      subscribe(quotes, 2);

      // Add to active monitor
      setMonitors((prev) =>
        prev.map((m) =>
          m.id === activeMonitorId
            ? { ...m, tokens: [...m.tokens, ...newTokens] }
            : m
        )
      );
    },
    [activeMonitorId, subscribe]
  );

  const handleRemoveToken = useCallback(
    (tokenId) => {
      const monitor = monitors.find((m) => m.id === activeMonitorId);
      const token = monitor?.tokens.find((t) => t.id === tokenId);

      setMonitors((prev) =>
        prev.map((m) =>
          m.id === activeMonitorId
            ? { ...m, tokens: m.tokens.filter((t) => t.id !== tokenId) }
            : m
        )
      );

      // Check if any other monitor still uses this token
      if (token) {
        const stillUsed = monitors.some(
          (m) =>
            m.id !== activeMonitorId &&
            m.tokens.some((t) => t.tkn === token.tkn)
        );
        if (!stillUsed) {
          unsubscribe([token.tkn]);
        }
      }
    },
    [activeMonitorId, monitors, unsubscribe]
  );

  const handleClearTokens = useCallback(() => {
    setMonitors((prev) =>
      prev.map((m) =>
        m.id === activeMonitorId ? { ...m, tokens: [] } : m
      )
    );
  }, [activeMonitorId]);

  if (contractsLoading) {
    return (
      <div className="h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/30 text-xs">Loading contracts data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary text-white overflow-hidden">
      <Header
        status={status}
        monitors={monitors}
        activeMonitorId={activeMonitorId}
        onSelectMonitor={setActiveMonitorId}
        onAddMonitor={handleAddMonitor}
        onRemoveMonitor={handleRemoveMonitor}
        user={user}
        onLogout={logout}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          contracts={contracts}
          tokens={activeMonitor?.tokens || []}
          onAddTokens={handleAddTokens}
          onRemoveToken={handleRemoveToken}
          onClearTokens={handleClearTokens}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChartsGrid
            tokens={activeMonitor?.tokens || []}
            onRemoveToken={handleRemoveToken}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
