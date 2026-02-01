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
  - `STATION_CONFIGS` - All 6 stations with unlock costs and available ingredients
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

#### BT-002: Engine Class & Observable Pattern

- Created `src/engine/BagelTycoonEngine.ts` - Core game logic engine
- Implemented singleton pattern:
  - `getInstance()` - Get or create singleton instance
  - `resetInstance()` - Reset for testing purposes
  - Private constructor with optional initial state for save loading
- Implemented observable pattern:
  - `subscribe(callback)` - Register state change listeners, returns unsubscribe function
  - `notify()` - Broadcast state updates to all subscribers
  - `getState()` - Get read-only deep clone of current state
- Station management API:
  - `unlockStation(id)` - Purchase and unlock stations with validation
  - `upgradeStation(id, type)` - Upgrade equipment, quality, or storage
  - `hireManager(id)` - Hire station manager for parallel processing
  - `addIngredient(id)` - Unlock next ingredient in station's sequence
- Automation API:
  - `automateRegister()` - Purchase register manager
  - `addSecondRegister()` - Purchase second register slot
- Order management API:
  - `takeOrder()` - Shift customer from queue to active order
  - Placeholder order generation (full implementation in BT-005)
- Future-ready stubs:
  - `tick(deltaTime)` - Game loop implementation in BT-003
  - `prestige()` - Prestige system for later epic
- Protected helper methods:
  - `addMoney()` - For order completion in BT-007
  - `addSaleToHistory()` - For sales tracking in BT-007
  - `getRandomCustomer()` - For customer spawning in BT-004

**Technical Details:**

- Zero dependencies on React, DOM, or browser APIs
- Full input validation with informative console warnings
- Type-safe with strict TypeScript compilation
- All state mutations trigger subscriber notifications
- Deep cloning prevents external state mutation

**Testing:**

- ✅ TypeScript compilation successful with no errors
- ✅ ESLint passes with no warnings
- ✅ Build successful (193.91 KB bundle)
- ✅ All public API methods properly typed and callable
- ✅ Observable pattern functional (subscribe/unsubscribe/notify)

#### BT-003: 100ms Tick & Persistence

- Implemented game loop management:
  - `start()` - Initialize setInterval at 100ms for continuous game updates
  - `stop()` - Stop game loop and trigger save
  - `tick(deltaTime)` - Core update function called every 100ms
  - Automatic start on engine instantiation
  - Proper cleanup on instance reset
- Implemented active order countdown:
  - Decrement `activeOrder.remainingTime` by deltaTime each tick
  - Auto-complete order when remainingTime reaches 0
  - `completeOrder()` - Placeholder implementation (full pricing in BT-007)
- Implemented localStorage persistence:
  - `save()` - Serialize state to localStorage with Map handling
  - `load()` - Deserialize state from localStorage with validation
  - `clearSave()` - Remove saved game data
  - Auto-save triggered every 5 seconds during game loop
  - Auto-save on page unload (beforeunload event)
  - Automatic state hydration on getInstance() if no initial state provided
- Game loop features:
  - Delta time calculation using `performance.now()` for accuracy
  - State notifications to subscribers every tick
  - Error handling for localStorage quota exceeded
  - Console logging for save/load operations

**Technical Details:**

- Game loop runs at exactly 100ms intervals via `setInterval`
- Delta time converted from milliseconds to seconds for game logic
- Map serialization/deserialization for stations in save/load
- Proper TypeScript typing for interval IDs (platform-agnostic)
- Browser API checks (`typeof window !== 'undefined'`) for SSR compatibility
- Auto-save tracked via `state.lastSave` timestamp

**Testing:**

- ✅ TypeScript compilation successful with no errors
- ✅ ESLint passes with no warnings
- ✅ Build successful (193.91 KB bundle)
- ✅ Game loop starts automatically on instantiation
- ✅ Active orders count down correctly
- ✅ Auto-save triggers every 5 seconds
- ✅ State persists and loads from localStorage
