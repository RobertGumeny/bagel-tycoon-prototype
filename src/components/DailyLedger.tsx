import { X } from "lucide-react";
import type { SaleRecord } from "../engine/types";

interface DailyLedgerProps {
  open: boolean;
  onClose: () => void;
  sales: SaleRecord[];
}

export function DailyLedger({ open, onClose, sales }: DailyLedgerProps) {
  if (!open) return null;

  function speedLabel(s: string) {
    switch (s) {
      case "lightning":
        return "Lightning";
      case "good":
        return "Good";
      case "normal":
        return "Normal";
      case "slow":
        return "Slow";
      default:
        return s;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-lg">Daily Ledger</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {sales.length === 0 && (
            <div className="text-sm text-slate-600">No sales recorded yet.</div>
          )}

          {sales.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"
            >
              <div>
                <div className="font-semibold">{s.orderName}</div>
                <div className="text-xs text-slate-500">
                  {new Date(s.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">+${s.finalPrice.toFixed(2)}</div>
                <div className="text-xs text-slate-500">
                  {speedLabel(s.speedBonus)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DailyLedger;
