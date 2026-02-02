/**
 * StationGrid Component
 * Task: BT-011
 *
 * 2x3 grid of station cards
 */

import { useState } from 'react';
import type { GameState } from '../engine/types';
import { StationCard } from './StationCard';
import { StationModal } from './StationModal';

interface StationGridProps {
  gameState: GameState;
  onUnlockStation: (stationId: string) => void;
  onUpgradeStation: (stationId: string, type: 'equipment' | 'quality' | 'storage') => void;
  onHireManager: (stationId: string) => void;
  onAddIngredient: (stationId: string) => void;
}

// Station order for 2x3 grid
const STATION_ORDER = [
  'bagelCase',
  'cooler',
  'beverages',
  'slicer',
  'griddle',
  'fryer',
];

export function StationGrid({
  gameState,
  onUnlockStation,
  onUpgradeStation,
  onHireManager,
  onAddIngredient,
}: StationGridProps) {
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  const handleCloseModal = () => {
    setSelectedStation(null);
  };

  const handleOpenModal = (stationId: string) => {
    const station = gameState.stations.get(stationId);
    if (station?.unlocked) {
      setSelectedStation(stationId);
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-6">
        {STATION_ORDER.map(stationId => {
          const station = gameState.stations.get(stationId);
          if (!station) return null;

          return (
            <StationCard
              key={stationId}
              station={station}
              money={gameState.money}
              onClick={() => handleOpenModal(stationId)}
              onUnlock={() => onUnlockStation(stationId)}
            />
          );
        })}
      </div>

      {/* Station Modal */}
      {selectedStation && (
        <StationModal
          stationId={selectedStation}
          gameState={gameState}
          onClose={handleCloseModal}
          onUpgradeStation={onUpgradeStation}
          onHireManager={onHireManager}
          onAddIngredient={onAddIngredient}
        />
      )}
    </>
  );
}
