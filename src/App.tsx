/**
 * Main App Component
 * Tasks: BT-009, BT-010
 *
 * Manages game engine integration and renders the UI
 */

import { useEffect, useState } from 'react';
import { BagelTycoonEngine } from './engine/BagelTycoonEngine';
import type { GameState } from './engine/types';
import { Header } from './components/Header';
import { Layout } from './components/Layout';
import { CustomerQueue } from './components/CustomerQueue';
import { ActiveOrder } from './components/ActiveOrder';

function App() {
  // Initialize engine instance (singleton)
  const [engine] = useState(() => BagelTycoonEngine.getInstance());
  const [gameState, setGameState] = useState<GameState>(engine.getState());

  // Subscribe to engine state changes
  useEffect(() => {
    const unsubscribe = engine.subscribe((newState) => {
      setGameState(newState);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [engine]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header money={gameState.money} />

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        <Layout
          sidebar={
            <div className="flex flex-col gap-6">
              <CustomerQueue queue={gameState.customerQueue} />
              <ActiveOrder order={gameState.activeOrder} />
            </div>
          }
          main={
            <div className="text-slate-600">
              <h2 className="text-xl font-bold mb-4">Main Content</h2>
              <p className="text-sm">Station Grid and Sales Ledger will go here.</p>
            </div>
          }
        />
      </div>
    </div>
  );
}

export default App;
