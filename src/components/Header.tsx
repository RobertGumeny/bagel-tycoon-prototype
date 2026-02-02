/**
 * Header Component
 * Task: BT-009
 *
 * Displays logo, random tagline, and real-time money counter
 */

import { useState } from 'react';
import { TAGLINES } from '../engine/types';

interface HeaderProps {
  money: number;
}

/**
 * Selects a random tagline from the PRD tagline pool
 */
const getRandomTagline = (): string => {
  const randomIndex = Math.floor(Math.random() * TAGLINES.length);
  return TAGLINES[randomIndex];
};

export function Header({ money }: HeaderProps) {
  // Select random tagline on mount only
  const [tagline] = useState(() => getRandomTagline());

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-between">
        {/* Left Side: Logo and Title */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-md">
            🥯
          </div>

          {/* Title and Tagline */}
          <div>
            <h1 className="text-3xl font-black leading-none">
              <span className="text-slate-900">BAGEL </span>
              <span className="text-amber-600">TYCOON</span>
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-400 mt-1">
              {tagline}
            </p>
          </div>
        </div>

        {/* Right Side: Money Display */}
        <div className="card px-8 py-4">
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
              Cash
            </span>
            <span className="text-3xl font-black text-emerald-600 money">
              ${money.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
