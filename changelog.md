# Changelog

All notable changes to Bagel Tycoon will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added - 2026-02-01

#### BT-011: Station Grid & Modals

- Created StationCard component with locked and unlocked states:
  - Locked state: Grayscale card with lock icon and unlock button
  - Unlocked state: Color-coded card with station stats (Speed Lvl, Quality Lvl, Storage)
  - Manager badge display when station has professional staff
  - Station colors match PRD palette (orange, blue, amber, emerald, yellow)
  - Click to open management modal on unlocked stations
  - Unlock buttons disabled when player lacks sufficient funds
- Created StationGrid component:
  - 2x3 grid layout displaying all 6 stations in proper order
  - Responsive grid with proper spacing and card styling
  - Modal state management for station selection
  - Integrated with App.tsx to replace placeholder main content
- Created StationModal component with comprehensive upgrade interface:
  - Color-coded header matching station (orange, blue, amber, emerald, yellow)
  - 2-column grid layout for Equipment and Quality upgrades
  - Equipment section: Current level display and upgrade button with cost
  - Quality section: Current level display and upgrade button with cost
  - Manager section: Hire manager button or hired badge with "Professional Staff" label
  - Storage section: Current capacity display (Lvl X, Y slots) with upgrade button
  - Ingredients section: Unlocked ingredient tags and "Add Next Ingredient" button
  - All upgrade buttons hide/disable when player lacks sufficient funds
  - Storage upgrade button hidden when at max level (Level 3)
  - "All Ingredients Unlocked" message when station has all available ingredients
  - "Storage Full - Upgrade Storage" message when trying to add ingredients at capacity
- Cost calculations:
  - Equipment: `10 * 1.6^currentLevel`
  - Quality: `10 * 1.6^currentLevel`
  - Storage: `50 * (currentLevel + 1)`
  - Ingredient: `$25` (flat cost)
  - Manager: `$200` (one-time)
- Connected all station management handlers to engine methods:
  - `unlockStation()` - Purchase and unlock stations
  - `upgradeStation()` - Upgrade equipment, quality, or storage
  - `hireManager()` - Hire station manager
  - `addIngredient()` - Unlock next ingredient in sequence
- Ingredient name formatting utility converts IDs to display names (e.g., "plainBagel" → "Plain Bagel")
- Updated App.tsx to integrate StationGrid with all required handlers
- Full POS-style design with rounded-3xl corners, proper spacing, and hover/active states

**Technical Details:**

- StationCard uses Lucide React icons (Lock, Zap, Star, Package, CheckCircle2)
- StationModal uses Lucide React icons (X, Zap, Star, Package, Users, Plus)
- Color mapping object provides consistent theming across components
- All buttons use Tailwind CSS with active:scale-95 for tactile feedback
- Modal uses fixed overlay with centered positioning and max-height scrolling
- Storage capacity calculated from STORAGE_CAPS array [3, 5, 8]
- Next ingredient determined from station config's availableIngredients array
- All cost formulas match PRD specifications exactly

**Testing:**

- ✅ All 118 unit tests passing (no new tests required for UI components)
- ✅ TypeScript compilation successful
- ✅ ESLint passes with no errors or warnings
- ✅ Build successful (226.57 KB bundle)
- ✅ All station management features functional
- ✅ Button states correctly respond to player funds
- ✅ Ingredient unlocking respects storage capacity limits

#### BT-010: Active Order & Queue UI

- Created CustomerQueue component displaying 5 slots for customer queue:
  - Emoji avatars rendered from gameState.customerQueue array
  - Empty slots show subtle gray placeholder circles with dashed borders
  - Filled slots have amber background with smooth fade-in/slide-in animations
  - Header displays "CUSTOMER QUEUE (X/5)" with user icon
  - Uses POS-style card styling with proper rounded corners
- Created ActiveOrder component with dual states:
  - Empty state: Centered muted italic text "Welcome to Bagel Tycoon, how can I help you?"
  - Active state displays:
    - Customer emoji avatar and order name (combines food + beverage)
    - Animated progress bar filling smoothly based on 100ms engine tick updates
    - Progress percentage and time fraction display
    - Large countdown timer showing remainingTime in seconds
    - Dark background (slate-800) with light text for visual contrast
- Updated App.tsx to integrate both components into sidebar:
  - Replaced placeholder content with CustomerQueue and ActiveOrder components
  - Added proper spacing between components (gap-6)
  - Connected to gameState via engine subscription for real-time updates
- Progress bar updates automatically every 100ms via React subscription to engine state
- Both components follow existing POS design patterns (Tailwind 4, card styling, rounded-3xl)

**Technical Details:**

- CustomerQueue accepts queue array and optional maxSize prop (defaults to 5)
- ActiveOrder accepts nullable Order prop for empty/active state switching
- Progress calculation: `((totalTime - remainingTime) / totalTime) * 100`
- Order name combines foodRecipe and beverageRecipe names when both present
- Smooth transitions using Tailwind duration-300 and linear easing for progress bar
- Uses Lucide React icons (Users, Clock) for visual elements

**Testing:**

- ✅ All 118 unit tests passing (no new tests required for UI components)
- ✅ TypeScript compilation successful
- ✅ ESLint passes with no errors or warnings
- ✅ Build successful (214.82 KB bundle)
- ✅ Components render correctly with empty and active states
- ✅ Progress bar fills smoothly based on engine updates

#### BT-009: POS Layout & Shell

- Installed and configured Tailwind CSS 4 with custom theme
- Created 2-column POS-style layout component (33% sidebar, 66% main)
- Implemented Header component with:
  - Logo display (🥯 emoji in rounded amber box)
  - "BAGEL TYCOON" title with amber accent on "TYCOON"
  - Random tagline selection from PRD pool on component mount
  - Real-time money counter with tabular numerals for consistent formatting
- Integrated BagelTycoonEngine with React using subscription pattern
- Updated App.tsx to manage engine state and render new UI components
- Configured Tailwind 4 with custom station colors and design system tokens

#### BT-006: Dynamic Order Generation

- Implemented comprehensive recipe system with 27 unique recipes:
  - 19 food recipes covering all station combinations (simple bagels to multi-station deluxe sandwiches)
  - 8 beverage recipes for the beverage station
- Implemented dynamic order generation in `generateOrder()` method:
  - Filters recipes by unlocked stations and ingredients
  - Randomly selects from available food recipes
  - 60% probability to add beverage when beverages station is unlocked
  - Calculates total base time as sum of food and beverage preparation times
  - Generates unique order IDs using timestamp + counter
- Updated `takeOrder()` to use new dynamic order generation
- Added order counter to ensure unique order IDs even when created in rapid succession
- Added 13 comprehensive unit tests:
  - Recipe filtering by unlocked stations and ingredients
  - Beverage addition probability testing (60% chance)
  - Total time calculation verification
  - Edge cases (no available recipes, starter recipes only)
  - Order uniqueness and customer emoji handling

**Technical Details:**

- All recipes defined in `types.ts` as `RECIPES` constant with proper typing
- Recipe filtering checks both station unlock status and ingredient availability
- Beverage probability implemented with `Math.random() < 0.6` check
- Unique stations list generated using Set to avoid duplicates
- Order counter prevents ID collisions when orders created in tight loops

**Testing:**

- ✅ All 92 unit tests passing (79 previous + 13 new)
- ✅ TypeScript compilation successful
- ✅ ESLint passes with no errors or warnings
- ✅ Build successful (193.91 KB bundle)
- ✅ Recipe filtering works correctly for all unlock states
- ✅ Beverage probability verified across 100 orders (statistical validation)

#### BT-007: Processing Logic (Parallel vs. Series)

- Implemented order processing time calculations with speed multipliers and parallel/series logic
- Added `calculateOrderProcessingTime()` private method to BagelTycoonEngine:
  - Applies speed multiplier per station: `baseTime / (1 + (equipmentLevel - 1) * 0.25)`
  - Parallel processing (max time) when all stations involved have managers
  - Series processing (sum of times) when any station lacks a manager
  - Handles both food-only and food + beverage orders correctly
  - Accounts for different equipment levels across multiple stations
- Updated `generateOrder()` to use new processing time calculation instead of simple baseTime sum
- Speed multiplier implementation:
  - Each station processes at its own speed based on equipment level
  - Level 1: 1.0x speed (no bonus)
  - Level 2: 1.25x speed (20% faster)
  - Level 3: 1.5x speed (33% faster)
  - Level 5: 2.0x speed (50% faster)
- Parallel vs. Series processing:
  - Parallel (all managers): Order completes when slowest station finishes (max time)
  - Series (any without manager): Stations process sequentially (sum of times)
  - Manager hiring now has significant gameplay impact on order completion speed
- Added SPEED_MULTIPLIER constant import from types.ts
- Added 11 comprehensive unit tests:
  - Speed multiplier calculations for different equipment levels
  - Multi-station recipes with different upgrade levels per station
  - Series processing verification (no managers)
  - Parallel processing verification (all managers hired)
  - Mixed manager scenarios (some hired, some not)
  - Beverage orders with parallel and series processing
  - Single-station order handling
  - Combined speed multipliers with parallel/series logic
- Updated 3 existing BT-006 tests to reflect new processing logic

**Technical Details:**

- Processing time calculated per station, then combined based on manager status
- All unique stations involved in order checked for manager status
- Speed multiplier uses SPEED_MULTIPLIER constant (0.25) for consistency
- Works correctly with single-station, multi-station, and beverage orders
- Maintains backward compatibility with existing order generation system

**Testing:**

- ✅ All 103 unit tests passing (92 previous + 11 new)
- ✅ TypeScript compilation successful
- ✅ ESLint passes with no errors or warnings
- ✅ Build successful (193.91 KB bundle)
- ✅ Speed multipliers verified for equipment levels 1-5
- ✅ Parallel/series logic verified across multiple scenarios
- ✅ Beverage order processing correctly handles all manager combinations

#### BT-008: Pricing & Speed Bonus Logic

- Implemented complete pricing system with quality and speed bonuses in `completeOrder()` method
- Quality multiplier calculation:
  - Sums quality bonuses from all stations involved in order
  - Formula: `1 + sum((stationQuality - 1) * 0.12)` for each station
  - Applies to both single and multi-station orders
  - Properly handles beverage orders with multiple stations
- Speed bonus tiers based on completion time:
  - **Lightning** (1.5x): Completed in less than 50% of base time
  - **Good** (1.2x): Completed in 50-100% of base time
  - **Normal** (1.0x): Completed in 100-200% of base time
  - **Slow** (0.7x): Completed in 200%+ of base time
- Final price calculation: `basePrice * qualityMultiplier * speedBonus`
- Sales history tracking:
  - Creates SaleRecord with order name, speed bonus label, quality bonus, and final price
  - Order names include both food and beverage when applicable (e.g., "Bagel with Butter & Hot Coffee")
  - Maintains last 5 sales in history (newest first)
  - Records unique order ID and timestamp for each sale
- Money and earnings tracking:
  - Updates player money with final calculated price
  - Updates totalEarnings for prestige threshold tracking
- Added 15 comprehensive unit tests covering:
  - Quality bonus calculations with different station quality levels
  - All four speed bonus tiers (lightning, good, normal, slow)
  - Combined quality and speed bonus calculations
  - Sales history tracking and ordering
  - Money and totalEarnings updates
  - Order name formatting for food-only and food+beverage orders
  - Beverage order price calculations

**Technical Details:**

- Added QUALITY_MULTIPLIER import to BagelTycoonEngine
- Speed bonus determination based on actual elapsed time vs base time
- Actual time calculated from order start timestamp to completion
- Quality bonus accumulates additively across all stations
- Sales records stored with all relevant metadata for UI display
- Console logging includes quality multiplier and speed bonus labels

**Testing:**

- ✅ All 118 unit tests passing (103 previous + 15 new)
- ✅ TypeScript compilation successful
- ✅ ESLint passes with no errors or warnings
- ✅ Build successful (193.91 KB bundle)
- ✅ Quality multipliers verified for all station combinations
- ✅ Speed bonuses correctly applied across all time ranges
- ✅ Final pricing accurately combines quality and speed modifiers
- ✅ Sales history properly tracks all completed orders

### Fixed - 2026-02-01

#### BUG-002: getState() Map Type Preservation

- Fixed `getState()` method in BagelTycoonEngine to preserve Map type when returning state to React components
- StationGrid and other components can now use `.get()` method on stations Map without runtime errors
- Updated test helper to convert Map to object for easier test assertions
- All 118 unit tests passing with no regressions

**Technical Details:**

- Modified `getState()` to create new Map instance with cloned station values
- Proper deep cloning of all nested arrays and objects (unlockedIngredients, activeOrder, etc.)
- Preserves Map type compatibility with GameState interface
- Updated test helper `getStations()` to use `Object.fromEntries()` for test access

#### BUG-1: mergeWithDefaults Empty Stations Fix

- Fixed `mergeWithDefaults()` method in BagelTycoonEngine to preserve default stations when partial state doesn't include them
- Engine instances can now be created with partial state (e.g., `{ money: 1000 }`) without losing station initialization
- Added 3 regression tests to prevent future occurrences
- All 71 unit tests passing

**Technical Details:**

- Modified `mergeWithDefaults()` to check if `partial.stations` exists before attempting conversion
- Falls back to `defaults.stations` when partial state omits stations property
- Prevents empty Map from overwriting properly initialized default stations

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

#### BT-004: Unit Tests for Engine Core

- Set up Vitest testing framework with happy-dom environment
- Created comprehensive test suite (`src/engine/BagelTycoonEngine.test.ts`) with 68 tests
- Test coverage includes:
  - Singleton pattern (getInstance, resetInstance)
  - Observable pattern (subscribe, unsubscribe, notify, getState)
  - State initialization (default state, free stations, station configs)
  - Station unlocking (validation, costs, default ingredients)
  - Station upgrades (equipment, quality, storage with cost formulas)
  - Manager hiring (validation, one-time purchase)
  - Ingredient unlocking (sequence, storage limits)
  - Automation (register manager, second register)
  - Order management (queue, takeOrder, FIFO behavior)
  - Persistence (save to localStorage, load, hydration)
  - Cost calculations (exponential upgrade formulas, linear storage costs)
- Added test scripts to package.json (test, test:watch, test:ui)
- Configured Vitest in vite.config.ts

**Technical Details:**

- All 68 tests passing
- Helper functions for test state setup (createEngineWithMoney, createEngineWithQueue, getStations)
- Type-safe test code with proper handling of Map/object serialization
- Tests use reflection to access protected methods for state setup
- ESLint compliant with proper disable comments for intentional any types

**Testing:**

- ✅ All 68 unit tests passing
- ✅ TypeScript compilation successful
- ✅ ESLint passes with no errors or warnings
- ✅ Build successful (193.91 KB bundle)
- ✅ Test coverage for all implemented engine features

#### BT-005: Customer Queue & Spawning

- Implemented automatic customer spawning in game loop:
  - Added `spawnCustomer()` method to BagelTycoonEngine
  - Customers spawn every 5 seconds when queue has space
  - Queue respects maximum size of 5 customers
  - Spawning integrated into existing `tick()` method
  - Uses `TIMING.customerSpawnInterval` and `TIMING.maxQueueSize` constants
  - Updates `lastCustomerSpawn` timestamp for proper timing
- Customer spawning features:
  - Random emoji selection from `CUSTOMER_EMOJIS` pool via `getRandomCustomer()`
  - Automatic spawning stops when queue is full
  - Resumes spawning after queue has space (e.g., after takeOrder)
  - Customers stored as emoji string IDs in queue array
- Verified existing `takeOrder()` functionality:
  - Properly shifts customers from queue (FIFO)
  - Creates active order with customer emoji
  - Validates queue state before taking order
- Added comprehensive test suite with 8 new tests:
  - Customer spawns after 5 seconds
  - Multiple customers spawn at regular intervals
  - Queue never exceeds 5 customers
  - Spawning stops when full and resumes when space available
  - Customers use emojis from CUSTOMER_EMOJIS constant
  - No spawning before 5-second interval elapses

**Technical Details:**

- Customer spawning integrated into 100ms game loop tick
- Time-based spawning using `Date.now()` and `lastCustomerSpawn` comparison
- Queue size validation prevents overflow
- Tests use Vitest fake timers with `vi.useFakeTimers()` and `vi.useRealTimers()`
- Timer advancement properly triggers game loop intervals

**Testing:**

- ✅ All 79 unit tests passing (71 previous + 8 new)
- ✅ TypeScript compilation successful
- ✅ ESLint passes with no errors or warnings
- ✅ Customer spawning verified at correct intervals
- ✅ Queue size limits enforced correctly
