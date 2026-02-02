import { useEffect, useState } from "react";
import type { SaleRecord } from "../engine/types";

interface SalesTickerProps {
  salesHistory: SaleRecord[];
  onOpenLedger: () => void;
}

export function SalesTicker({ salesHistory, onOpenLedger }: SalesTickerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (salesHistory.length === 0) return;
    setIndex(0);
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % Math.max(1, salesHistory.length));
    }, 2000);
    return () => clearInterval(id);
  }, [salesHistory]);

  if (salesHistory.length === 0) {
    return (
      <div className="px-4 py-2 rounded-lg bg-slate-50 text-sm text-slate-600">
        No recent sales
      </div>
    );
  }

  const sale = salesHistory[index];

  function speedIcon(label: string) {
    switch (label) {
      case "lightning":
        return "⚡";
      case "good":
        return "⭐";
      case "normal":
        return "⏱";
      case "slow":
        return "🐢";
      default:
        return "";
    }
  }

  return (
    <button
      onClick={onOpenLedger}
      className="px-4 py-2 rounded-lg bg-slate-50 text-sm text-slate-800 flex items-center gap-3 hover:bg-slate-100 active:scale-95 transition"
      aria-label="Open ledger"
    >
      <span className="text-xs uppercase text-slate-500">Recent</span>
      <span className="font-bold text-slate-900">
        +${sale.finalPrice.toFixed(2)}
      </span>
      <span className="text-xl">{speedIcon(sale.speedBonus)}</span>
    </button>
  );
}

export default SalesTicker;
