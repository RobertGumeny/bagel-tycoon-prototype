/**
 * Type Definitions & Core Constants for Bagel Tycoon
 * Task: BT-001
 */

// ============================================================================
// Core Type Definitions
// ============================================================================

/**
 * Represents the state of a single station in the shop
 */
export interface StationState {
  id: string;
  unlocked: boolean;
  equipmentLevel: number; // Affects processing speed
  qualityLevel: number; // Affects sale price multiplier
  storageLevel: number; // Determines max ingredient slots (1-3)
  hasManager: boolean; // Enables parallel processing
  unlockedIngredients: string[]; // List of ingredient IDs available at this station
}

/**
 * Represents a recipe that can be ordered
 */
export interface Recipe {
  id: string;
  name: string;
  category: 'food' | 'beverage';
  requiredStations: string[]; // Station IDs needed to prepare this recipe
  requiredIngredients: string[]; // Ingredient IDs needed
  basePrice: number; // Base price in dollars
  baseTime: number; // Base preparation time in seconds
}

/**
 * Represents an active customer order being processed
 */
export interface Order {
  id: string;
  customerName: string; // Emoji avatar
  foodRecipe: Recipe;
  beverageRecipe?: Recipe; // Optional beverage
  startTime: number; // Timestamp when order was taken
  totalTime: number; // Total calculated processing time
  remainingTime: number; // Time left to complete (in seconds)
  stationsInvolved: string[]; // Station IDs involved in this order
}

/**
 * Represents a completed sale in the ledger
 */
export interface SaleRecord {
  id: string;
  orderName: string;
  speedBonus: 'lightning' | 'good' | 'normal' | 'slow'; // Performance rating
  qualityBonus: number; // Total quality multiplier applied
  finalPrice: number; // Amount earned
  timestamp: number;
}

/**
 * Main game state container
 */
export interface GameState {
  // Economy
  money: number;
  totalEarnings: number; // Lifetime earnings for prestige tracking

  // Stations
  stations: Map<string, StationState>;

  // Order Management
  activeOrder: Order | null;
  customerQueue: string[]; // Array of emoji customer IDs (max 5)

  // Sales History
  salesHistory: SaleRecord[]; // Last 5 sales for the ledger

  // Automation
  hasRegisterManager: boolean; // Auto-takes orders
  hasSecondRegister: boolean; // Additional register slot

  // Prestige System
  prestigeLevel: number;
  prestigePerks: string[]; // IDs of acquired perks

  // Timing
  lastCustomerSpawn: number; // Timestamp of last customer spawn
  lastSave: number; // Timestamp of last auto-save
}

/**
 * Configuration for a station including all possible ingredients
 */
export interface StationConfig {
  id: string;
  name: string;
  unlockCost: number;
  availableIngredients: string[]; // All ingredients that can be unlocked for this station
  defaultIngredients: string[]; // Ingredients unlocked when station is purchased
}

// ============================================================================
// Game Constants
// ============================================================================

/**
 * Storage capacity by storage level (1-3)
 * Level 1: 3 slots, Level 2: 5 slots, Level 3: 8 slots
 */
export const STORAGE_CAPS = [3, 5, 8] as const;

/**
 * Exponential multiplier for equipment and quality upgrade costs
 * Cost formula: baseCost * (UPGRADE_MULTIPLIER ^ currentLevel)
 */
export const UPGRADE_MULTIPLIER = 1.6;

/**
 * Quality bonus per level above 1
 * Quality multiplier formula: 1 + (level - 1) * QUALITY_MULTIPLIER
 */
export const QUALITY_MULTIPLIER = 0.12;

/**
 * Speed bonus per equipment level above 1
 * Speed formula: baseTime / (1 + (level - 1) * SPEED_MULTIPLIER)
 */
export const SPEED_MULTIPLIER = 0.25;

/**
 * Base costs for various upgrades
 */
export const BASE_COSTS = {
  equipment: 10, // Per level
  quality: 10, // Per level
  storagePerLevel: 50, // Multiplied by target level
  ingredient: 25, // Flat cost per ingredient
  manager: 200, // One-time hire per station
  registerManager: 250, // One-time automation
  secondRegister: 500, // One-time additional register
} as const;

/**
 * Station configurations with unlock costs and available ingredients
 */
export const STATION_CONFIGS: Record<string, StationConfig> = {
  bagelCase: {
    id: 'bagelCase',
    name: 'Bagel Case',
    unlockCost: 0, // Free at start
    defaultIngredients: ['plainBagel'],
    availableIngredients: [
      'plainBagel',
      'everythingBagel',
      'sesameBagel',
      'poppySeedBagel',
      'cinnamon-raisinBagel',
      'onionBagel',
      'garlicBagel',
      'wholeWheatBagel',
    ],
  },
  cooler: {
    id: 'cooler',
    name: 'Cooler & Cutting Board',
    unlockCost: 0, // Free at start
    defaultIngredients: ['butter', 'plainCreamCheese'],
    availableIngredients: [
      'butter',
      'plainCreamCheese',
      'veggieCreamCheese',
      'loxCreamCheese',
      'onionCreamCheese',
      'lettuce',
      'tomato',
      'onion',
    ],
  },
  beverages: {
    id: 'beverages',
    name: 'Beverage Station',
    unlockCost: 50,
    defaultIngredients: ['coffee'],
    availableIngredients: [
      'coffee',
      'tea',
      'espresso',
      'latte',
      'cappuccino',
      'orangeJuice',
      'appleCider',
      'hotChocolate',
    ],
  },
  slicer: {
    id: 'slicer',
    name: 'Slicer Station',
    unlockCost: 250,
    defaultIngredients: ['slicedTurkey'],
    availableIngredients: [
      'slicedTurkey',
      'slicedHam',
      'roastBeef',
      'pastrami',
      'salami',
      'bacon',
    ],
  },
  griddle: {
    id: 'griddle',
    name: 'Griddle Station',
    unlockCost: 750,
    defaultIngredients: ['friedEgg'],
    availableIngredients: [
      'friedEgg',
      'scrambledEgg',
      'sausagePatty',
      'baconStrips',
      'grilledCheese',
    ],
  },
  fryer: {
    id: 'fryer',
    name: 'Fryer Station',
    unlockCost: 2000,
    defaultIngredients: ['hashBrowns'],
    availableIngredients: [
      'hashBrowns',
      'frenchFries',
      'onionRings',
      'mozzarellaSticks',
      'jalapenoPoppers',
    ],
  },
} as const;

/**
 * Customer emoji pool for queue avatars
 */
export const CUSTOMER_EMOJIS = [
  '😀', '😃', '😄', '😁', '😊', '🙂', '😎', '🤓',
  '🧐', '🤠', '🥳', '😋', '🤗', '🤩', '😺', '🐶',
] as const;

/**
 * Taglines for header rotation
 */
export const TAGLINES = [
  'Serving up Sunshine',
  'Freshly Baked Fun',
  'Rise and Grind',
  'Schmear Campaign',
  'Carbs & Capitalism',
  'Everything Bagel Energy',
  'The Daily Grind',
  'Knead for Speed',
] as const;

/**
 * Timing constants (in milliseconds)
 */
export const TIMING = {
  tickInterval: 100, // Game loop runs every 100ms
  customerSpawnInterval: 5000, // New customer every 5 seconds
  firstCustomerDelay: 3000, // Initial delay before first customer spawns (3 seconds)
  autoSaveInterval: 5000, // Auto-save every 5 seconds
  maxQueueSize: 5, // Maximum customers in queue
} as const;

/**
 * Prestige system constants
 */
export const PRESTIGE = {
  threshold: 10000, // $10,000 total earnings to unlock prestige
  incomeBonus: 0.10, // +10% income per prestige level
} as const;

/**
 * All available recipes in the game
 * Organized by category (food and beverage)
 */
export const RECIPES: Recipe[] = [
  // ============================================================================
  // Food Recipes
  // ============================================================================

  // Bagel Case Only
  {
    id: 'plainBagel',
    name: 'Plain Bagel',
    category: 'food',
    requiredStations: ['bagelCase'],
    requiredIngredients: ['plainBagel'],
    basePrice: 1.50,
    baseTime: 2,
  },
  {
    id: 'everythingBagel',
    name: 'Everything Bagel',
    category: 'food',
    requiredStations: ['bagelCase'],
    requiredIngredients: ['everythingBagel'],
    basePrice: 2.00,
    baseTime: 2,
  },
  {
    id: 'sesameBagel',
    name: 'Sesame Bagel',
    category: 'food',
    requiredStations: ['bagelCase'],
    requiredIngredients: ['sesameBagel'],
    basePrice: 2.00,
    baseTime: 2,
  },

  // Bagel Case + Cooler
  {
    id: 'bagelWithButter',
    name: 'Bagel with Butter',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler'],
    requiredIngredients: ['plainBagel', 'butter'],
    basePrice: 2.50,
    baseTime: 3,
  },
  {
    id: 'bagelWithCreamCheese',
    name: 'Bagel with Cream Cheese',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler'],
    requiredIngredients: ['plainBagel', 'plainCreamCheese'],
    basePrice: 3.00,
    baseTime: 3,
  },
  {
    id: 'everythingBagelSchmear',
    name: 'Everything Bagel w/ Schmear',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler'],
    requiredIngredients: ['everythingBagel', 'plainCreamCheese'],
    basePrice: 4.00,
    baseTime: 5,
  },
  {
    id: 'veggieBagel',
    name: 'Veggie Bagel',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler'],
    requiredIngredients: ['everythingBagel', 'veggieCreamCheese'],
    basePrice: 4.50,
    baseTime: 5,
  },
  {
    id: 'loxBagel',
    name: 'Lox Bagel',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler'],
    requiredIngredients: ['sesameBagel', 'loxCreamCheese'],
    basePrice: 6.00,
    baseTime: 6,
  },

  // Bagel Case + Cooler + Slicer
  {
    id: 'turkeySandwich',
    name: 'Turkey Sandwich',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler', 'slicer'],
    requiredIngredients: ['plainBagel', 'plainCreamCheese', 'slicedTurkey'],
    basePrice: 9.50,
    baseTime: 10,
  },
  {
    id: 'hamSandwich',
    name: 'Ham Sandwich',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler', 'slicer'],
    requiredIngredients: ['sesameBagel', 'butter', 'slicedHam'],
    basePrice: 9.00,
    baseTime: 10,
  },
  {
    id: 'roastBeefSandwich',
    name: 'Roast Beef Sandwich',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler', 'slicer'],
    requiredIngredients: ['everythingBagel', 'plainCreamCheese', 'roastBeef'],
    basePrice: 10.50,
    baseTime: 11,
  },
  {
    id: 'pastramiSandwich',
    name: 'Pastrami Sandwich',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler', 'slicer'],
    requiredIngredients: ['onionBagel', 'plainCreamCheese', 'pastrami'],
    basePrice: 11.00,
    baseTime: 11,
  },

  // Bagel Case + Cooler + Griddle
  {
    id: 'eggSandwich',
    name: 'Egg Sandwich',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler', 'griddle'],
    requiredIngredients: ['plainBagel', 'butter', 'friedEgg'],
    basePrice: 6.50,
    baseTime: 8,
  },
  {
    id: 'baconEggCheese',
    name: 'Bacon Egg & Cheese',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler', 'griddle'],
    requiredIngredients: ['everythingBagel', 'plainCreamCheese', 'baconStrips'],
    basePrice: 10.00,
    baseTime: 12,
  },
  {
    id: 'sausageEggSandwich',
    name: 'Sausage Egg Sandwich',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler', 'griddle'],
    requiredIngredients: ['sesameBagel', 'butter', 'sausagePatty'],
    basePrice: 9.00,
    baseTime: 10,
  },

  // Bagel Case + Cooler + Fryer
  {
    id: 'hashBrownBagel',
    name: 'Hash Brown Bagel',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler', 'fryer'],
    requiredIngredients: ['plainBagel', 'butter', 'hashBrowns'],
    basePrice: 5.50,
    baseTime: 8,
  },

  // Bagel Case + Cooler + Slicer + Griddle
  {
    id: 'deluxeBreakfast',
    name: 'Deluxe Breakfast Sandwich',
    category: 'food',
    requiredStations: ['bagelCase', 'cooler', 'slicer', 'griddle'],
    requiredIngredients: ['everythingBagel', 'plainCreamCheese', 'bacon', 'friedEgg'],
    basePrice: 12.50,
    baseTime: 15,
  },

  // ============================================================================
  // Beverage Recipes
  // ============================================================================

  {
    id: 'hotCoffee',
    name: 'Hot Coffee',
    category: 'beverage',
    requiredStations: ['beverages'],
    requiredIngredients: ['coffee'],
    basePrice: 2.00,
    baseTime: 3,
  },
  {
    id: 'hotTea',
    name: 'Hot Tea',
    category: 'beverage',
    requiredStations: ['beverages'],
    requiredIngredients: ['tea'],
    basePrice: 1.50,
    baseTime: 2,
  },
  {
    id: 'espresso',
    name: 'Espresso',
    category: 'beverage',
    requiredStations: ['beverages'],
    requiredIngredients: ['espresso'],
    basePrice: 2.50,
    baseTime: 2,
  },
  {
    id: 'latte',
    name: 'Latte',
    category: 'beverage',
    requiredStations: ['beverages'],
    requiredIngredients: ['latte'],
    basePrice: 3.50,
    baseTime: 4,
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    category: 'beverage',
    requiredStations: ['beverages'],
    requiredIngredients: ['cappuccino'],
    basePrice: 3.50,
    baseTime: 4,
  },
  {
    id: 'orangeJuice',
    name: 'Orange Juice',
    category: 'beverage',
    requiredStations: ['beverages'],
    requiredIngredients: ['orangeJuice'],
    basePrice: 2.50,
    baseTime: 1,
  },
  {
    id: 'appleCider',
    name: 'Apple Cider',
    category: 'beverage',
    requiredStations: ['beverages'],
    requiredIngredients: ['appleCider'],
    basePrice: 3.00,
    baseTime: 3,
  },
  {
    id: 'hotChocolate',
    name: 'Hot Chocolate',
    category: 'beverage',
    requiredStations: ['beverages'],
    requiredIngredients: ['hotChocolate'],
    basePrice: 2.50,
    baseTime: 3,
  },
] as const;
