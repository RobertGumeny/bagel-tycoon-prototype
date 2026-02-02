/**
 * Main App Component
 * Tasks: BT-009, BT-010, BT-011, BT-012
 *
 * Manages game engine integration and renders the UI
 */

import { useEffect, useState } from "react";
import { ActiveOrder } from "./components/ActiveOrder";
import { CustomerQueue } from "./components/CustomerQueue";
import { DailyLedger } from "./components/DailyLedger";
import { Header } from "./components/Header";
import { Layout } from "./components/Layout";
import { Register } from "./components/Register";
import { StationGrid } from "./components/StationGrid";
import { BagelTycoonEngine } from "./engine/BagelTycoonEngine";
import type { GameState } from "./engine/types";

function App() {
  // Initialize engine instance (singleton)
  const [engine] = useState(() => BagelTycoonEngine.getInstance());
  const [gameState, setGameState] = useState<GameState>(engine.getState());

  // Subscribe to engine state changes and enable customer spawning (BT-013)
  useEffect(() => {
    // Enable customer spawning after component is mounted
    engine.enableCustomerSpawning();

    const unsubscribe = engine.subscribe((newState) => {
      setGameState(newState);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [engine]);

  // Order management handlers
  const handleTakeOrder = () => {
    engine.takeOrder();
  };

  const [ledgerOpen, setLedgerOpen] = useState(false);

  const handleOpenLedger = () => setLedgerOpen(true);
  const handleCloseLedger = () => setLedgerOpen(false);

  const handleAutomateRegister = () => {
    engine.automateRegister();
  };

  // Station management handlers
  const handleUnlockStation = (stationId: string) => {
    engine.unlockStation(stationId);
  };

  const handleUpgradeStation = (
    stationId: string,
    type: "equipment" | "quality" | "storage",
  ) => {
    engine.upgradeStation(stationId, type);
  };

  const handleHireManager = (stationId: string) => {
    engine.hireManager(stationId);
  };

  const handleAddIngredient = (stationId: string) => {
    engine.addIngredient(stationId);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header
        money={gameState.money}
        salesHistory={gameState.salesHistory}
        onOpenLedger={handleOpenLedger}
      />

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        <Layout
          sidebar={
            <div className="flex flex-col gap-6">
              <CustomerQueue queue={gameState.customerQueue} />
              <ActiveOrder order={gameState.activeOrder} />
              <Register
                hasRegisterManager={gameState.hasRegisterManager}
                canTakeOrder={
                  gameState.customerQueue.length > 0 &&
                  gameState.activeOrder === null
                }
                money={gameState.money}
                onTakeOrder={handleTakeOrder}
                onAutomateRegister={handleAutomateRegister}
              />
            </div>
          }
          main={
            <StationGrid
              gameState={gameState}
              onUnlockStation={handleUnlockStation}
              onUpgradeStation={handleUpgradeStation}
              onHireManager={handleHireManager}
              onAddIngredient={handleAddIngredient}
            />
          }
        />
      </div>
      <DailyLedger
        open={ledgerOpen}
        onClose={handleCloseLedger}
        sales={gameState.salesHistory}
      />
    </div>
  );
}

export default App;
