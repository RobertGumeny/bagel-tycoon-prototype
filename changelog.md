# Changelog

All notable changes to Bagel Tycoon will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added - 2026-02-01

#### BT-001: Type Definitions & Core Constants

- Created `src/engine/types.ts` with complete type system for game engine
- Defined core interfaces:
  - `GameState` - Main game state container with economy, stations, orders, and prestige data
  - `StationState` - Individual station tracking (unlock status, levels, manager, ingredients)
  - `Recipe` - Recipe definition with stations, ingredients, price, and time
  - `Order` - Active order tracking with customer, recipes, and timing
  - `SaleRecord` - Completed sale information for ledger display
  - `StationConfig` - Station configuration template
- Implemented game constants:
  - `STATION_CONFIGS` - All 6 stations with unlock costs and available ingredients:
    - Bagel Case ($0) - 8 bagel varieties
    - Cooler & Cutting Board ($0) - 8 spread/topping options
    - Beverage Station ($50) - 8 drink options
    - Slicer Station ($250) - 6 meat options
    - Griddle Station ($750) - 5 cooked items
    - Fryer Station ($2000) - 5 fried items
  - `STORAGE_CAPS` - [3, 5, 8] slots for storage levels 1-3
  - `UPGRADE_MULTIPLIER` - 1.6 for exponential upgrade costs
  - `QUALITY_MULTIPLIER` - 0.12 for quality bonus calculation
  - `SPEED_MULTIPLIER` - 0.25 for equipment speed bonus
  - `BASE_COSTS` - All upgrade base costs (equipment, quality, ingredients, managers)
  - `CUSTOMER_EMOJIS` - Pool of 16 customer avatars
  - `TAGLINES` - 8 rotating taglines for header
  - `TIMING` - Game loop, spawn, and save intervals
  - `PRESTIGE` - Prestige threshold and income bonus

**Technical Details:**
- Zero dependencies on React or DOM
- Full TypeScript strict mode compliance
- All constants typed with `as const` for maximum type safety
- Comprehensive JSDoc comments for all interfaces and constants

**Testing:**
- ✅ TypeScript compilation successful
- ✅ ESLint passes with no warnings
- ✅ Build successful (193.91 KB bundle)
