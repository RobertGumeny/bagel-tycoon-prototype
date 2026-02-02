/**
 * StationModal Component
 * Task: BT-011
 *
 * Modal for managing station upgrades, manager, and ingredients
 */

import { Package, Plus, Star, Users, X, Zap } from "lucide-react";
import type { GameState } from "../engine/types";
import {
    BASE_COSTS,
    STATION_CONFIGS,
    STORAGE_CAPS,
    UPGRADE_MULTIPLIER,
} from "../engine/types";

interface StationModalProps {
  stationId: string;
  gameState: GameState;
  onClose: () => void;
  onUpgradeStation: (
    stationId: string,
    type: "equipment" | "quality" | "storage",
  ) => void;
  onHireManager: (stationId: string) => void;
  onAddIngredient: (stationId: string) => void;
}

// Station color mapping (same as StationCard)
const STATION_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  bagelCase: {
    bg: "bg-orange-100",
    text: "text-orange-900",
    border: "border-orange-200",
  },
  cooler: {
    bg: "bg-blue-100",
    text: "text-blue-900",
    border: "border-blue-200",
  },
  beverages: {
    bg: "bg-amber-100",
    text: "text-amber-900",
    border: "border-amber-200",
  },
  slicer: {
    bg: "bg-emerald-100",
    text: "text-emerald-900",
    border: "border-emerald-200",
  },
  griddle: {
    bg: "bg-orange-100",
    text: "text-orange-900",
    border: "border-orange-200",
  },
  fryer: {
    bg: "bg-yellow-100",
    text: "text-yellow-900",
    border: "border-yellow-200",
  },
};

export function StationModal({
  stationId,
  gameState,
  onClose,
  onUpgradeStation,
  onHireManager,
  onAddIngredient,
}: StationModalProps) {
  const station = gameState.stations.get(stationId);
  const config = STATION_CONFIGS[stationId];

  if (!station || !config) return null;

  const colors = STATION_COLORS[stationId] || STATION_COLORS.bagelCase;

  // Calculate costs
  const equipmentCost =
    BASE_COSTS.equipment * Math.pow(UPGRADE_MULTIPLIER, station.equipmentLevel);
  const qualityCost =
    BASE_COSTS.quality * Math.pow(UPGRADE_MULTIPLIER, station.qualityLevel);
  const storageCost =
    station.storageLevel < 3
      ? BASE_COSTS.storagePerLevel * (station.storageLevel + 1)
      : 0;
  const managerCost = BASE_COSTS.manager;
  const ingredientCost = BASE_COSTS.ingredient;

  // Check affordability
  const canAffordEquipment = gameState.money >= equipmentCost;
  const canAffordQuality = gameState.money >= qualityCost;
  const canAffordStorage =
    gameState.money >= storageCost && station.storageLevel < 3;
  const canAffordManager =
    gameState.money >= managerCost && !station.hasManager;
  const canAffordIngredient = gameState.money >= ingredientCost;

  // Check storage limits and available ingredients
  const maxStorage = STORAGE_CAPS[station.storageLevel - 1];
  const isStorageFull = station.unlockedIngredients.length >= maxStorage;
  const nextIngredient = config.availableIngredients.find(
    (ing) => !station.unlockedIngredients.includes(ing),
  );
  const hasMoreIngredients = !!nextIngredient;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className={`${colors.bg} ${colors.text} px-8 py-6 flex items-center justify-between border-b ${colors.border}`}
        >
          <h2 className="text-2xl font-bold uppercase tracking-wide">
            {config.name}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl hover:bg-black/10 transition-colors ${colors.text}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6">
            {/* Upgrades Grid - 2 Columns */}
            <div className="grid grid-cols-2 gap-6">
              {/* Equipment (Speed) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-wide text-sm">
                    Equipment
                  </h3>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                  <div className="text-slate-600">
                    <div className="text-xs uppercase tracking-widest text-slate-500">
                      Current Level
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {station.equipmentLevel}
                    </div>
                  </div>
                  <button
                    onClick={() => onUpgradeStation(stationId, "equipment")}
                    disabled={!canAffordEquipment}
                    className={`w-full px-4 py-3 rounded-xl font-bold uppercase tracking-wide text-sm transition-all ${
                      canAffordEquipment
                        ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Upgrade ${equipmentCost.toFixed(0)}
                  </button>
                </div>
              </div>

              {/* Quality */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Star className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-wide text-sm">
                    Quality
                  </h3>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                  <div className="text-slate-600">
                    <div className="text-xs uppercase tracking-widest text-slate-500">
                      Current Level
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {station.qualityLevel}
                    </div>
                  </div>
                  <button
                    onClick={() => onUpgradeStation(stationId, "quality")}
                    disabled={!canAffordQuality}
                    className={`w-full px-4 py-3 rounded-xl font-bold uppercase tracking-wide text-sm transition-all ${
                      canAffordQuality
                        ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Upgrade ${qualityCost.toFixed(0)}
                  </button>
                </div>
              </div>
            </div>

            {/* Manager Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-wide text-sm">
                  Manager
                </h3>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                {station.hasManager ? (
                  <div className="flex items-center gap-3 text-emerald-700">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold">Professional Staff Hired</div>
                      <div className="text-sm text-slate-600">
                        Enables Parallel Workflows
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-slate-600">
                      Hire a manager to enable parallel processing with other
                      managed stations.
                    </div>
                    <button
                      onClick={() => onHireManager(stationId)}
                      disabled={!canAffordManager}
                      className={`w-full px-4 py-3 rounded-xl font-bold uppercase tracking-wide text-sm transition-all ${
                        canAffordManager
                          ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      Hire Manager ${managerCost}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Storage Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Package className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-wide text-sm">
                  Storage
                </h3>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-500">
                      Current Capacity
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      Level {station.storageLevel} ({maxStorage} slots)
                    </div>
                  </div>
                  {station.storageLevel < 3 && (
                    <button
                      onClick={() => onUpgradeStation(stationId, "storage")}
                      disabled={!canAffordStorage}
                      className={`px-4 py-3 rounded-xl font-bold uppercase tracking-wide text-sm transition-all ${
                        canAffordStorage
                          ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      Upgrade ${storageCost}
                    </button>
                  )}
                  {station.storageLevel >= 3 && (
                    <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">
                      Max Level
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Plus className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-wide text-sm">
                  Ingredients
                </h3>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                {/* Current Ingredients */}
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">
                    Unlocked ({station.unlockedIngredients.length}/{maxStorage})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {station.unlockedIngredients.map((ing) => (
                      <span
                        key={ing}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                      >
                        {formatIngredientName(ing)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Add Ingredient Button (refined tag-style) */}
                {hasMoreIngredients && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onAddIngredient(stationId)}
                      disabled={!canAffordIngredient || isStorageFull}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isStorageFull
                          ? "border border-dashed border-slate-300 bg-slate-100 text-slate-300 cursor-not-allowed"
                          : "border border-dashed border-slate-300 bg-white text-slate-500 hover:bg-slate-50 active:scale-95"
                      }`}
                      aria-disabled={!canAffordIngredient || isStorageFull}
                    >
                      <span className="text-slate-400">+</span>
                      <span>{formatIngredientName(nextIngredient)}</span>
                      <span className="ml-2 text-slate-400">
                        ${ingredientCost}
                      </span>
                    </button>

                    {isStorageFull && (
                      <div className="text-xs text-slate-400">Storage Full</div>
                    )}

                    {!isStorageFull && !canAffordIngredient && (
                      <div className="text-xs text-slate-400">
                        Insufficient funds
                      </div>
                    )}
                  </div>
                )}

                {!hasMoreIngredients && (
                  <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide text-center">
                    All Ingredients Unlocked
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Format ingredient ID to display name
 * Example: "plainBagel" -> "Plain Bagel"
 */
function formatIngredientName(ingredientId: string): string {
  return ingredientId
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
