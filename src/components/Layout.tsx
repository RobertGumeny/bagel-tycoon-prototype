/**
 * Layout Component
 * Task: BT-009
 *
 * Provides the 2-column POS-style layout structure
 * - Sidebar: 33% width (left side)
 * - Main: 66% width (right side)
 */

import type { ReactNode } from 'react';

interface LayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export function Layout({ sidebar, main }: LayoutProps) {
  return (
    <div className="flex h-full">
      {/* Sidebar - 33% */}
      <aside className="w-1/3 border-r border-gray-200 bg-gray-50 p-6">
        {sidebar}
      </aside>

      {/* Main Content - 66% (auto-fills remaining space) */}
      <main className="flex-1 bg-gray-50 p-6">
        {main}
      </main>
    </div>
  );
}
