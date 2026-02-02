/**
 * StationCard Component
 * Task: BT-011
 *
 * Displays individual station card with locked/unlocked states
 */

import { Lock, Zap, Star, Package, CheckCircle2, Utensils, Refrigerator, Coffee, Beef, Flame } from 'lucide-react';
import type { StationState } from '../engine/types';
import { STATION_CONFIGS, STORAGE_CAPS } from '../engine/types';
import type { LucideIcon } from 'lucide-react';

interface StationCardProps {
  station: StationState;
  money: number;
  onClick: () => void;
  onUnlock: () => void;
}

// Station color mapping from PRD
const STATION_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  bagelCase: { bg: 'bg-orange-100', text: 'text-orange-900', icon: 'text-orange-700' },
  cooler: { bg: 'bg-blue-100', text: 'text-blue-900', icon: 'text-blue-700' },
  beverages: { bg: 'bg-amber-100', text: 'text-amber-900', icon: 'text-amber-700' },
  slicer: { bg: 'bg-emerald-100', text: 'text-emerald-900', icon: 'text-emerald-700' },
  griddle: { bg: 'bg-orange-100', text: 'text-orange-900', icon: 'text-orange-700' },
  fryer: { bg: 'bg-yellow-100', text: 'text-yellow-900', icon: 'text-yellow-700' },
};

// Station icon mapping from BT-014
const STATION_ICONS: Record<string, LucideIcon> = {
  bagelCase: Utensils,
  cooler: Refrigerator,
  beverages: Coffee,
  slicer: Beef,
  griddle: Flame,
  fryer: Zap,
};

export function StationCard({ station, money, onClick, onUnlock }: StationCardProps) {
  const config = STATION_CONFIGS[station.id];
  if (!config) return null;

  const colors = STATION_COLORS[station.id] || STATION_COLORS.bagelCase;
  const maxStorage = STORAGE_CAPS[station.storageLevel - 1];
  const canAffordUnlock = money >= config.unlockCost;

  // Locked state
  if (!station.unlocked) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4">
          <Lock className="w-12 h-12 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-500 uppercase tracking-wide text-center">
            {config.name}
          </h3>
          <button
            onClick={onUnlock}
            disabled={!canAffordUnlock}
            className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wide transition-all ${
              canAffordUnlock
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Unlock ${config.unlockCost}
          </button>
        </div>
      </div>
    );
  }

  // Unlocked state
  const StationIcon = STATION_ICONS[station.id] || Utensils;

  return (
    <button
      onClick={onClick}
      className={`${colors.bg} border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[0.98] transition-all active:scale-95 text-left w-full`}
    >
      <div className="flex flex-col gap-4">
        {/* Station Icon */}
        <div className="flex justify-center">
          <StationIcon className={`w-12 h-12 ${colors.icon}`} />
        </div>

        {/* Station Name */}
        <h3 className={`text-lg font-bold ${colors.text} uppercase tracking-wide text-center`}>
          {config.name}
        </h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          {/* Speed Level */}
          <div className="flex items-center gap-1">
            <Zap className={`w-4 h-4 ${colors.icon}`} />
            <span className={`font-semibold ${colors.text}`}>Lvl {station.equipmentLevel}</span>
          </div>

          {/* Quality Level */}
          <div className="flex items-center gap-1">
            <Star className={`w-4 h-4 ${colors.icon}`} />
            <span className={`font-semibold ${colors.text}`}>Lvl {station.qualityLevel}</span>
          </div>

          {/* Storage */}
          <div className="flex items-center gap-1">
            <Package className={`w-4 h-4 ${colors.icon}`} />
            <span className={`font-semibold ${colors.text}`}>
              {station.unlockedIngredients.length}/{maxStorage}
            </span>
          </div>
        </div>

        {/* Manager Badge */}
        {station.hasManager && (
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className={`w-4 h-4 ${colors.icon}`} />
            <span className={colors.text}>Professional Staff</span>
          </div>
        )}

        {/* Manage Button */}
        <div className="mt-2 pt-4 border-t border-slate-300">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-center font-bold uppercase tracking-wide text-sm">
            Click to Manage
          </div>
        </div>
      </div>
    </button>
  );
}
