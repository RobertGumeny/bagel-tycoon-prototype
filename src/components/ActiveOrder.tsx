/**
 * ActiveOrder Component
 * Task: BT-010
 *
 * Displays the active order with progress bar and countdown timer
 */

import { Clock } from 'lucide-react';
import type { Order } from '../engine/types';

interface ActiveOrderProps {
  order: Order | null;
}

export function ActiveOrder({ order }: ActiveOrderProps) {
  // Empty state - no active order
  if (!order) {
    return (
      <div className="card p-8 flex items-center justify-center min-h-[200px]">
        <p className="text-slate-400 italic text-center">
          Welcome to Bagel Tycoon, how can I help you?
        </p>
      </div>
    );
  }

  // Calculate progress percentage
  const progress = ((order.totalTime - order.remainingTime) / order.totalTime) * 100;

  // Build order name (food + optional beverage)
  const orderName = order.beverageRecipe
    ? `${order.foodRecipe.name} & ${order.beverageRecipe.name}`
    : order.foodRecipe.name;

  return (
    <div className="card p-6 bg-slate-800 text-white">
      {/* Order Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">{order.customerName}</span>
            <h3 className="text-lg font-bold uppercase tracking-wide">
              {orderName}
            </h3>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-100 ease-linear rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-slate-300">
          <span>{progress.toFixed(0)}% Complete</span>
          <span className="font-mono">{order.remainingTime.toFixed(1)}s / {order.totalTime.toFixed(1)}s</span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <Clock className="w-5 h-5 text-emerald-400" />
        <span className="text-2xl font-black text-emerald-400 money">
          {order.remainingTime.toFixed(1)}s remaining
        </span>
      </div>
    </div>
  );
}
