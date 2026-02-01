# Bagel Shop Tycoon - v1.0 PRD

**Version:** 1.0
**Last Updated:** 02/01/2026
**Target Platform:** Web (HTML5 for itch.io)  
**Tech Stack:** React + TypeScript + Tailwind CSS + Vite  
**Estimated Scope:** 3-4 development steps

---

## Overview

An idle clicker game where players manage a bagel shop by unlocking stations, upgrading equipment, hiring staff, and serving customers. The core loop is: customers queue → player takes order → stations process → earn money → upgrade/unlock → repeat. Players can upgrade the storage capacity of their different stations and add new ingredients to unlock more valuable recipe combinations. Includes a prestige system for replayability.

**Key Design Principle:** Separation of concerns. Game engine (simulation, state management, game logic) should be completely decoupled from UI layer (React components). This enables future UI replacements (e.g., visual restaurant UI in v2.0) without rewriting game logic. All tuning and balance statistics should be easily tunable from one centralized location.

---

## Core Game Loop

1. **Customers arrive** in queue (max 5, spawn every 5 seconds)
2. **Player takes order** (or register manager automatically takes order if hired)
3. **Order generates** based on available ingredients/stations
4. **Stations process** order over time (series or parallel based on managers)
5. **Order completes**, player earns money based on speed/quality
6. **Money invested** in unlocks, upgrades, ingredients, automation
7. **Loop repeats** with increasing complexity and income
8. **Prestige** at milestone to reset with permanent bonuses + perks

---

## Game Systems

### Stations

Six stations, unlocked progressively by spending money:

| Station ID  | Name                   | Unlock Cost | Starting Ingredients                 |
| ----------- | ---------------------- | ----------- | ------------------------------------ |
| `bagelCase` | Bagel Case             | $0 (free)   | Plain Bagel                          |
| `cooler`    | Cooler & Cutting Board | $0 (free)   | Butter, Plain Cream Cheese           |
| `beverages` | Beverage Station       | $50         | Coffee (unlocked on purchase)        |
| `slicer`    | Slicer Station         | $250        | Sliced Turkey (unlocked on purchase) |
| `griddle`   | Griddle Station        | $750        | Fried Egg (unlocked on purchase)     |
| `fryer`     | Fryer Station          | $2000       | Hash Browns (unlocked on purchase)   |

Each station has:

- **Possible Ingredients:** 5-8 ingredients that can be unlocked for $25 each
- **Equipment Level:** Affects processing speed (exponential cost: `10 * 1.6^level`)
- **Quality Level:** Affects sale price multiplier (exponential cost: `10 * 1.6^level`)
- **Storage Level:** Max ingredients that can be stocked (3 levels: 3/5/8 slots, cost: `50 * level`)
- **Manager:** One-time hire for $200, enables parallel processing with other managed stations

### Recipes

Two categories: Food and Beverages

**Food Recipes** (examples):

- Plain Bagel: $1.50 base, 2s prep, requires Bagel Case
- Everything Bagel w/ Schmear: $4.00 base, 5s prep, requires Bagel Case + Cooler
- Turkey Sandwich: $9.50 base, 10s prep, requires Bagel Case + Cooler + Slicer
- Bacon Egg & Cheese: $10.00 base, 12s prep, requires Bagel Case + Cooler + Griddle

**Beverage Recipes** (examples):

- Hot Coffee: $2.00 base, 3s prep, requires Beverage Station
- Hot Tea: $1.50 base, 2s prep, requires Beverage Station

Recipes are dynamically available based on:

1. All required stations unlocked
2. All required ingredients purchased

### Order Processing

**Time Calculation:**

- Each recipe has a base time split across required stations
- Station speed: `baseTime / (1 + (equipmentLevel - 1) * 0.25)`
- If food + beverage ordered:
  - **With managers** on all required stations: Process in parallel (max time)
  - **Without managers**: Process in series (sum of times)

**Pricing Calculation:**

```
basePrice = food.price + beverage.price (if ordered)
qualityMultiplier = 1 + sum of ((stationQuality - 1) * 0.12) for all used stations
speedBonus = 1.5 if fast (<50% of base time), 1.2 if good (<100%), 1.0 if normal, 0.7 if slow
finalPrice = basePrice * qualityMultiplier * speedBonus
```

### Automation & Front-of-House Upgrades

- **Register Manager** ($250): Auto-takes orders when queue has customers and no active order
- **Additional Register** ($500): One additional register available after first is automated, player can continue to manually take orders or hire an additional register manager
- **Station Managers** ($200 each): Enable parallel processing when multiple stations involved

### Prestige System

**Trigger:** Player reaches $10,000 total earnings

**On Prestige:**

1. All progress resets (stations, money, unlocks, upgrades)
2. Permanent income bonus applied: +10% per prestige level
3. **Perk Draft:** Player chooses 1 of 3 randomly selected perks
4. Prestige level increments
5. New run begins

**Prestige Perks** (15-20 total, examples):

- Premium Bagels: All Bagel Case items +25% value
- Efficient Prep: Cooler processes 50% faster
- Breakfast Rush: Griddle items +$2 flat bonus
- Beverage Hookup: All beverage ingredients unlock free
- Trained Staff: All stations start at Quality Level 2
- Prime Location: Customers arrive 25% faster
- Expanded Seating: Queue holds +2 customers (7 total)
- Hiring Network: Manager costs -50%
- Loyalty Program: Every 10th order pays double
- Investor Backing: Start each run with $100

**Perk Selection:** Show 3 random perks not already owned, player clicks one

---

## Art Direction

**Visual Style:** Modern touchscreen POS (Square, Toast) meets arcade game aesthetic

**Core Principles:**

- Square's layout and clarity + arcade game personality and color
- Clean grid-based layouts with generous spacing
- High contrast, readable typography
- Vibrant but organized (not chaotic)
- Playful language, professional structure

**Color Palette:**

- Background: `#FAFAFA` (off-white)
- Cards: White with subtle borders
- Text: Slate-900 (high contrast)
- Primary Action: Blue (`#2563EB`) - bold CTA
- Money/Earnings: Emerald-600
- Station Colors: Vibrant pastel backgrounds with saturated text
  - Bagel Case: Orange (bg-orange-100, text-orange-900)
  - Cooler: Blue (bg-blue-100, text-blue-900)
  - Beverages: Amber (bg-amber-100, text-amber-900)
  - Slicer: Emerald (bg-emerald-100, text-emerald-900)
  - Griddle: Red-Orange (bg-orange-100, text-orange-900)
  - Fryer: Yellow (bg-yellow-100, text-yellow-900)

**Typography:**

- System font stack (SF Pro, Segoe UI, Inter fallback)
- UPPERCASE labels for scanability (POS-style)
- Bold/Black weights for hierarchy
- Tabular numerals for money displays

**UI Components:**

- Rounded corners: 24px+ (softer than typical POS)
- Buttons: Solid fills, bold text, hover/active states
- Cards: White bg, 1px border, subtle shadow
- Progress bars: Full-width, rounded, high-contrast fill
- Modals: Centered overlay, rounded, drop shadow

**Icons:** Lucide React (functional, consistent set)

**Animations:** Minimal, functional

- Button press: Scale down to 0.95
- Queue/sales: Slide-in transitions
- No bounces, spins, or excessive flourishes

---

## User Interface

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo + Tagline | Money Display + Take Order    │
├──────────────────────┬──────────────────────────────────┤
│  Customer Queue      │  Active Order Display            │
│  (5 emoji slots)     │  (progress bar, timer, name)     │
├──────────────────────┴──────────────────────────────────┤
│           Station Grid (2x3) + Sales Ledger              │
│  [Station] [Station] [Station]        [Ledger Card]     │
│  [Station] [Station] [Station]                          │
└──────────────────────────────────────────────────────────┘
```

### Header

**Left Side:**

- Logo: 🥯 emoji in rounded colored box
- Title: "BAGEL TYCOON" (large, bold, black text with amber accent on "TYCOON")
- **Tagline:** Random selection from pool, small uppercase tracking-widest text in slate-400
  - Examples: "Serving up Sunshine", "Freshly Baked Fun", "Rise and Grind", "Schmear Campaign", "Carbs & Capitalism", "Everything Bagel Energy", "The Daily Grind", "Knead for Speed"
  - Pick random on load for variety/personality

**Right Side:**

- Money display: Large (`$XXX.XX`), emerald-600, in white rounded card
- "TAKE ORDER" button: Blue, bold, disabled when queue empty or order active
- "Automate Register ($250)" button: Amber dashed border, shows until purchased
- Once automated: "Automated ✓" badge replaces button

### Customer Queue

- 5 horizontal slots
- Display emoji avatars (😀, 😎, 🧐, 🥳, 🤠, etc.)
- Empty slots show subtle placeholder
- New customers slide in from right
- Label: "Customer Queue (X/5)" with icon

### Active Order Display

**When Empty:**

- Centered italic text: "Welcome to Bagel Tycoon, how can I help you?"
- Muted appearance

**When Active:**

- Order name: Large, bold (e.g., "Everything Bagel w/ Schmear & Hot Coffee")
- Progress bar: Animated fill, percentage display
- Timer: Large countdown (e.g., "3.2s remaining")
- Visual contrast (dark background, light text) to stand out

### Station Grid

**Locked State:**

- Grayscale card
- Lock icon
- Station name
- "Unlock for $XXX" button (disabled if insufficient funds)

**Unlocked State:**

- Color-coded card (per station color palette)
- Station icon (from Lucide)
- Station name
- Stats display: Speed Lvl X, Quality Lvl X, Stock X/Y
- Manager badge if hired (small icon + "Professional Staff")
- Click to open upgrade modal

### Station Upgrade Modal

**Header:**

- Station icon + name
- Color-coded background matching station
- Close button (X)

**Body:**

- **Upgrade Grid (2 columns):**
  - Equipment (Speed): Current level, cost to upgrade
  - Quality: Current level, cost to upgrade
- **Manager Section:**
  - "Hire Manager ($200)" button (one-time)
  - Description: "Unlocks Parallel Workflows"
  - Shows checkmark badge once hired

- **Storage Section:**
  - Current level display (e.g., "Lvl 3 (8 slots)")
  - Upgrade button with cost
  - Max level: 3

- **Ingredients Section:**
  - List of currently unlocked ingredients (small tags)
  - "Add [Next Ingredient] ($25)" button
  - Disabled if storage full or insufficient funds

### Sales Ledger

- White card in grid
- Title: "Daily Ledger" with icon
- Last 5 completed orders
- Each entry shows:
  - Order name (truncated if long)
  - Speed bonus indicator ("Lightning Fast! ⚡", "Good Speed", "Service Delay")
  - Quality bonus indicator ("Perfect Quality!")
  - Price earned (large, emerald, "+$XX.XX")
- Newest at top, slide-in animation
- Empty state: "Awaiting your first sale..."

### Prestige Modal (when unlocked)

**Trigger:** Display "Open New Location" button when total earnings ≥ $10,000

**Modal Content:**

- Title: "Open New Location"
- Current run stats: Total earnings, stations unlocked, orders completed
- Prestige bonus: "+10% income permanently"
- **Perk Draft:** 3 cards showing random perks
  - Perk name
  - Description
  - Click to select
- "Confirm & Prestige" button (after perk selected)
- Warning: "This will reset your current progress"

---

## Development Steps

### Step 1: Game Engine Architecture

**Goal:** Build the core game engine as a standalone TypeScript class, completely decoupled from UI.

**Deliverables:**

- [ ] Define TypeScript interfaces for all game state (`GameState`, `StationStats`, `Recipe`, `Order`, etc.)
- [ ] Create `BagelTycoonEngine` class with:
  - Constructor (accepts optional initial state for loading saves)
  - Public API methods: `takeOrder()`, `unlockStation()`, `upgradeStation()`, `hireManager()`, `addIngredient()`, `prestige()`, etc.
  - Observable pattern: `subscribe(callback)` for UI updates
  - Internal game loop: `tick(deltaTime)` called every 100ms
- [ ] Implement all game constants (stations, recipes, costs, storage levels, perks)
- [ ] Add localStorage save/load functionality

**Technical Notes:**

- Engine should have zero React/DOM dependencies
- Use `setInterval` for game loop
- Notify subscribers on every state change
- All game logic lives here (order generation, pricing, time calculation, prestige)

---

### Step 2: Core Simulation Logic

**Goal:** Implement all game systems within the engine.

**Deliverables:**

- [ ] Customer queue spawning (every 5 seconds, max 5)
- [ ] Order generation logic:
  - Filter valid recipes by unlocked stations + ingredients
  - Randomly select food item
  - 60% chance to add beverage (if station unlocked)
- [ ] Order processing:
  - Calculate total time (series vs. parallel based on managers)
  - Tick down remaining time each frame
  - Apply speed multipliers from equipment levels
- [ ] Order completion:
  - Calculate final price (base _ quality _ speed bonus)
  - Add money to player
  - Log sale to history
- [ ] Upgrade logic:
  - Validate costs
  - Deduct money
  - Increment stats
- [ ] Register manager auto-ordering
- [ ] Prestige logic:
  - Reset state
  - Apply income multiplier
  - Store selected perk
  - Apply perk effects

**Testing:**

- [ ] Verify orders generate correctly
- [ ] Verify pricing calculations match spec
- [ ] Verify parallel processing works with managers
- [ ] Verify prestige resets and bonuses apply

---

### Step 3: React UI Layer

**Goal:** Build the user interface that renders game state and captures user input.

**Deliverables:**

- [ ] Set up Vite + React + TypeScript + Tailwind
- [ ] Create main `App.tsx` that:
  - Instantiates `BagelTycoonEngine` on mount
  - Subscribes to engine state updates
  - Renders all UI components
- [ ] Build components:
  - `Header` (logo, tagline, money, take order button)
  - `CustomerQueue` (5 slots, emoji avatars)
  - `ActiveOrder` (progress bar, timer, order name)
  - `StationGrid` (locked/unlocked cards)
  - `StationModal` (upgrades, manager, ingredients)
  - `SalesLedger` (last 5 sales)
  - `PrestigeModal` (stats, perk draft, confirm)
- [ ] Wire up all click handlers to engine methods
- [ ] Implement random tagline selection on load
- [ ] Add basic transitions (slide-in, fade, scale on press)

**UI State:**

- Game state comes from engine subscription
- Local UI state only for: active modal, selected perk (during draft)

---

### Step 4: Polish & Balance

**Goal:** Add final touches, tune economy, and prepare for deployment.

**Deliverables:**

- [ ] Animations:
  - Money counter animates on sale (+$XX.XX floats up)
  - Customers slide in/out of queue
  - Progress bar smooth fill
  - Button hover/press feedback
- [ ] Prestige perk pool (15-20 perks with varied effects)
- [ ] Balance pass:
  - Play 20-30 minute session
  - Adjust unlock costs if progression feels grindy/too fast
  - Ensure prestige reachable in ~15-20 minutes
  - Verify income scaling feels good
- [ ] Persistence:
  - Auto-save every 5 seconds
  - Load on mount
  - Add "Reset Progress" option in settings (optional)
- [ ] Responsive check (ensure works on 1280x720+ screens)
- [ ] Build for production:
  - `npm run build`
  - Test `/dist` locally
  - Verify assets load correctly
- [ ] Deployment:
  - ZIP `/dist` contents
  - Upload to itch.io as HTML5 game
  - Set embed dimensions, test in iframe

**Final Testing:**

- [ ] Full playthrough from start to first prestige
- [ ] Verify all upgrades work
- [ ] Verify prestige works and bonuses persist
- [ ] No console errors
- [ ] Save/load works correctly

---

## Out of Scope (v2.0+)

The following features are explicitly NOT included in v1.0:

- ❌ Visual restaurant UI (top-down or isometric view)
- ❌ Perk tree / skill tree system
- ❌ Research system
- ❌ Catering orders (big one-time payouts)
- ❌ Multiple locations/biomes
- ❌ Marketing upgrades (customer arrival speed)
- ❌ Dining room customization
- ❌ Achievements system
- ❌ Leaderboards
- ❌ Sound effects / music

These may be considered for future versions after v1.0 ships.

---

## Success Criteria

v1.0 is considered complete when:

- ✅ Full gameplay loop works: queue → order → process → earn → upgrade → unlock
- ✅ All 6 stations unlock and upgrade correctly
- ✅ Prestige system functional with perk draft
- ✅ Economy feels balanced (not too grindy, not trivial)
- ✅ UI matches art direction (POS-inspired, clean, playful)
- ✅ Game saves and loads correctly
- ✅ No major bugs or broken features
- ✅ Deployed to itch.io and playable in browser
- ✅ 15-20 minute playthrough to first prestige feels satisfying

---

## Technical Constraints

- **Bundle Size:** Keep under 5MB total (should be <1MB with React + game code)
- **Performance:** 60fps on modern browsers, smooth animations
- **Browser Support:** Chrome, Firefox, Safari (latest versions)
- **Screen Size:** Optimized for 1280x720+, playable on laptop screens
- **Dependencies:** Minimal - React, Tailwind, Lucide icons only

---

## Appendix: Key Formulas

**Speed Multiplier:**

```
speedMult = 1 + (equipmentLevel - 1) * 0.25
processTime = baseTime / speedMult
```

**Quality Multiplier:**

```
qualityMult = 1 + (qualityLevel - 1) * 0.12
```

**Final Price:**

```
basePrice = food.price + (beverage?.price || 0)
totalQualityMult = 1 + sum((stationQuality - 1) * 0.12) for all used stations
speedBonus = actualTime < baseTime * 0.5 ? 1.5 :
             actualTime < baseTime * 1.0 ? 1.2 :
             actualTime < baseTime * 2.0 ? 1.0 : 0.7
finalPrice = basePrice * totalQualityMult * speedBonus
```

**Upgrade Costs:**

```
equipmentCost = 10 * (1.6 ^ currentLevel)
qualityCost = 10 * (1.6 ^ currentLevel)
storageCost = 50 * currentLevel
ingredientCost = 25 (flat)
managerCost = 200 (one-time)
```

**Prestige Income Bonus:**

```
incomeMultiplier = 1 + (prestigeLevel * 0.10)
```

---

**End of PRD**
