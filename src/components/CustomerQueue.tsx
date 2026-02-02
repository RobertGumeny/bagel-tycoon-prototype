/**
 * CustomerQueue Component
 * Task: BT-010
 *
 * Displays the customer queue with emoji avatars (max 5 slots)
 */

import { Users } from 'lucide-react';

interface CustomerQueueProps {
  queue: string[]; // Array of emoji customer IDs
  maxSize?: number; // Maximum queue size (default: 5)
}

export function CustomerQueue({ queue, maxSize = 5 }: CustomerQueueProps) {
  // Create array of slots (filled or empty)
  const slots = Array.from({ length: maxSize }, (_, index) => queue[index] || null);

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-slate-600" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
          Customer Queue ({queue.length}/{maxSize})
        </h2>
      </div>

      {/* Queue Slots */}
      <div className="flex gap-3">
        {slots.map((customer, index) => (
          <div
            key={index}
            className={`
              w-14 h-14 rounded-2xl flex items-center justify-center text-3xl
              transition-all duration-300
              ${
                customer
                  ? 'bg-amber-100 border-2 border-amber-300 scale-100'
                  : 'bg-gray-100 border-2 border-gray-200 border-dashed scale-95'
              }
            `}
          >
            {customer ? (
              <span className="animate-in fade-in slide-in-from-right-2 duration-300">
                {customer}
              </span>
            ) : (
              <span className="text-gray-300 text-lg">•</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
