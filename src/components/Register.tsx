/**
 * Register Component
 * Task: BT-012
 *
 * The cash register UI element that handles order taking and automation.
 * Positioned below ActiveOrder, bridges the gap between Queue and Active Order.
 */

import { CheckCircle2 } from "lucide-react";
import { BASE_COSTS } from "../engine/types";

interface RegisterProps {
  hasRegisterManager: boolean;
  canTakeOrder: boolean; // Queue has customers and no active order
  money: number;
  onTakeOrder: () => void;
  onAutomateRegister: () => void;
  hasSecondRegister?: boolean;
  onAddSecondRegister?: () => void;
}

const REGISTER_MANAGER_COST = BASE_COSTS.registerManager;

export function Register({
  hasRegisterManager,
  canTakeOrder,
  money,
  onTakeOrder,
  onAutomateRegister,
  hasSecondRegister,
  onAddSecondRegister,
}: RegisterProps) {
  const canAffordManager = money >= REGISTER_MANAGER_COST;
  const showAutomateButton = !hasRegisterManager;

  return (
    <div
      className={`p-6 rounded-3xl ${
        hasRegisterManager
          ? "card" // Solid POS-card style when automated
          : "border-2 border-dashed border-slate-300 bg-white" // Dashed border when unautomated
      }`}
    >
      {/* Register Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
          Cash Register
        </h3>
        {hasRegisterManager && (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Automated
            </span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        {/* Take Order Button */}
        <button
          onClick={onTakeOrder}
          disabled={!canTakeOrder || hasRegisterManager}
          className={`btn btn-primary w-full ${
            hasRegisterManager ? "py-2 text-sm" : "py-4 text-base"
          } font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Take Order
        </button>

        {/* Automate Register Button */}
        {showAutomateButton && (
          <button
            onClick={onAutomateRegister}
            disabled={!canAffordManager}
            className="btn btn-secondary w-full py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed border-2 border-dashed border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 active:scale-95 transition-transform"
          >
            Hire Register Manager (${REGISTER_MANAGER_COST})
          </button>
        )}

        {/* Second Register Button (shown when automated and not yet purchased) */}
        {hasRegisterManager && !hasSecondRegister && onAddSecondRegister && (
          <button
            onClick={onAddSecondRegister}
            disabled={money < BASE_COSTS.secondRegister}
            className="btn btn-outline w-full py-2 text-sm font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed border-2 border-slate-200 bg-white hover:bg-slate-50 active:scale-95 transition-transform"
          >
            Add Second Register (${BASE_COSTS.secondRegister})
          </button>
        )}
      </div>

      {/* Description when not automated */}
      {!hasRegisterManager && (
        <p className="mt-3 text-xs text-slate-500 italic text-center">
          Hire a manager to automatically take orders
        </p>
      )}
    </div>
  );
}
