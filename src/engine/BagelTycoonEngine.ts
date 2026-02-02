/**
 * BagelTycoonEngine - Core game logic engine
 * Tasks: BT-002, BT-003, BT-007
 *
 * Singleton class that manages all game state and logic.
 * Completely decoupled from React/DOM for maximum testability and reusability.
 */

import type {
  GameState,
  StationState,
  Order,
  SaleRecord,
  Recipe,
} from './types';

import {
  STATION_CONFIGS,
  STORAGE_CAPS,
  UPGRADE_MULTIPLIER,
  BASE_COSTS,
  CUSTOMER_EMOJIS,
  TIMING,
  RECIPES,
  SPEED_MULTIPLIER,
  QUALITY_MULTIPLIER,
} from './types';

/**
 * LocalStorage key for persisting game state
 */
const SAVE_KEY = 'bagel-tycoon-save';

/**
 * Type for state change subscribers
 */
type StateSubscriber = (state: Readonly<GameState>) => void;

/**
 * Main game engine class - manages all game logic and state
 */
export class BagelTycoonEngine {
  private static instance: BagelTycoonEngine | null = null;
  private state: GameState;
  private subscribers: Set<StateSubscriber> = new Set();

  // Game loop management
  private tickIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastTickTime: number = performance.now();
  private isRunning: boolean = false;

  // Customer spawning control (BT-013)
  private customerSpawningEnabled: boolean = false;
  private firstCustomerSpawnTime: number | null = null;

  // Order ID counter for uniqueness
  private orderCounter: number = 0;

  /**
   * Private constructor enforces singleton pattern
   */
  private constructor(initialState?: Partial<GameState>) {
    this.state = initialState
      ? this.mergeWithDefaults(initialState)
      : this.initializeDefaultState();

    // Start game loop automatically
    this.start();

    // Set up auto-save on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.save();
      });
    }
  }

  /**
   * Get singleton instance of the engine
   * Automatically loads from localStorage if no initial state provided
   */
  public static getInstance(initialState?: Partial<GameState>): BagelTycoonEngine {
    if (!BagelTycoonEngine.instance) {
      // Load from localStorage if no initial state provided
      const savedState = initialState ?? BagelTycoonEngine.load() ?? undefined;
      BagelTycoonEngine.instance = new BagelTycoonEngine(savedState);
    }
    return BagelTycoonEngine.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    if (BagelTycoonEngine.instance) {
      BagelTycoonEngine.instance.stop();
    }
    BagelTycoonEngine.instance = null;
  }

  // ============================================================================
  // Observable Pattern
  // ============================================================================

  /**
   * Subscribe to state changes
   * @param callback Function called whenever state updates
   * @returns Unsubscribe function
   */
  public subscribe(callback: StateSubscriber): () => void {
    this.subscribers.add(callback);
    // Immediately call with current state
    callback(this.getState());

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of state change
   */
  private notify(): void {
    const readonlyState = this.getState();
    this.subscribers.forEach(callback => callback(readonlyState));
  }

  /**
   * Get read-only copy of current state
   */
  public getState(): Readonly<GameState> {
    // Clone the stations Map while preserving Map type
    const clonedStations = new Map<string, StationState>();
    this.state.stations.forEach((station, key) => {
      clonedStations.set(key, { ...station, unlockedIngredients: [...station.unlockedIngredients] });
    });

    // Return a deep clone to prevent external mutation
    return {
      ...this.state,
      stations: clonedStations,
      customerQueue: [...this.state.customerQueue],
      salesHistory: this.state.salesHistory.map(sale => ({ ...sale })),
      prestigePerks: [...this.state.prestigePerks],
      activeOrder: this.state.activeOrder ? {
        ...this.state.activeOrder,
        foodRecipe: { ...this.state.activeOrder.foodRecipe },
        beverageRecipe: this.state.activeOrder.beverageRecipe ? { ...this.state.activeOrder.beverageRecipe } : undefined,
        stationsInvolved: [...this.state.activeOrder.stationsInvolved],
      } : null,
    } as Readonly<GameState>;
  }

  // ============================================================================
  // State Initialization
  // ============================================================================

  /**
   * Create default initial game state
   */
  private initializeDefaultState(): GameState {
    const stations = new Map<string, StationState>();

    // Initialize all stations from config
    Object.values(STATION_CONFIGS).forEach(config => {
      const isFree = config.unlockCost === 0;
      stations.set(config.id, {
        id: config.id,
        unlocked: isFree, // Bagel Case and Cooler start unlocked
        equipmentLevel: 1,
        qualityLevel: 1,
        storageLevel: 1,
        hasManager: false,
        unlockedIngredients: isFree ? [...config.defaultIngredients] : [],
      });
    });

    return {
      money: 0,
      totalEarnings: 0,
      stations,
      activeOrder: null,
      customerQueue: [],
      salesHistory: [],
      hasRegisterManager: false,
      hasSecondRegister: false,
      prestigeLevel: 0,
      prestigePerks: [],
      lastCustomerSpawn: Date.now(),
      lastSave: Date.now(),
    };
  }

  /**
   * Merge partial state with defaults (for loading saves)
   */
  private mergeWithDefaults(partial: Partial<GameState>): GameState {
    const defaults = this.initializeDefaultState();

    // Only convert if partial.stations exists, otherwise use defaults
    const stations = partial.stations
      ? (partial.stations instanceof Map
          ? partial.stations
          : new Map(Object.entries(partial.stations) as [string, StationState][]))
      : defaults.stations;

    return {
      ...defaults,
      ...partial,
      stations,
    };
  }

  // ============================================================================
  // Public API - Station Management
  // ============================================================================

  /**
   * Unlock a station by spending money
   * @param stationId ID of the station to unlock
   * @returns true if unlock successful, false otherwise
   */
  public unlockStation(stationId: string): boolean {
    const config = STATION_CONFIGS[stationId];
    if (!config) {
      console.warn(`Unknown station: ${stationId}`);
      return false;
    }

    const station = this.state.stations.get(stationId);
    if (!station) {
      console.warn(`Station not found in state: ${stationId}`);
      return false;
    }

    // Already unlocked
    if (station.unlocked) {
      console.warn(`Station already unlocked: ${stationId}`);
      return false;
    }

    // Check funds
    if (this.state.money < config.unlockCost) {
      console.warn(`Insufficient funds to unlock ${stationId}. Need $${config.unlockCost}, have $${this.state.money}`);
      return false;
    }

    // Perform unlock
    this.state.money -= config.unlockCost;
    station.unlocked = true;
    station.unlockedIngredients = [...config.defaultIngredients];

    this.notify();
    return true;
  }

  /**
   * Upgrade a station's equipment, quality, or storage
   * @param stationId ID of the station to upgrade
   * @param upgradeType Type of upgrade to perform
   * @returns true if upgrade successful, false otherwise
   */
  public upgradeStation(
    stationId: string,
    upgradeType: 'equipment' | 'quality' | 'storage'
  ): boolean {
    const station = this.state.stations.get(stationId);
    if (!station) {
      console.warn(`Station not found: ${stationId}`);
      return false;
    }

    if (!station.unlocked) {
      console.warn(`Cannot upgrade locked station: ${stationId}`);
      return false;
    }

    let cost: number;
    let canUpgrade = true;

    switch (upgradeType) {
      case 'equipment': {
        cost = BASE_COSTS.equipment * Math.pow(UPGRADE_MULTIPLIER, station.equipmentLevel);
        break;
      }
      case 'quality': {
        cost = BASE_COSTS.quality * Math.pow(UPGRADE_MULTIPLIER, station.qualityLevel);
        break;
      }
      case 'storage': {
        if (station.storageLevel >= 3) {
          console.warn(`Storage already at max level for ${stationId}`);
          canUpgrade = false;
        }
        cost = BASE_COSTS.storagePerLevel * (station.storageLevel + 1);
        break;
      }
      default:
        console.warn(`Unknown upgrade type: ${upgradeType}`);
        return false;
    }

    if (!canUpgrade) {
      return false;
    }

    // Check funds
    if (this.state.money < cost) {
      console.warn(`Insufficient funds for ${upgradeType} upgrade. Need $${cost}, have $${this.state.money}`);
      return false;
    }

    // Perform upgrade
    this.state.money -= cost;

    switch (upgradeType) {
      case 'equipment':
        station.equipmentLevel += 1;
        break;
      case 'quality':
        station.qualityLevel += 1;
        break;
      case 'storage':
        station.storageLevel += 1;
        break;
    }

    this.notify();
    return true;
  }

  /**
   * Hire a manager for a station
   * @param stationId ID of the station
   * @returns true if hire successful, false otherwise
   */
  public hireManager(stationId: string): boolean {
    const station = this.state.stations.get(stationId);
    if (!station) {
      console.warn(`Station not found: ${stationId}`);
      return false;
    }

    if (!station.unlocked) {
      console.warn(`Cannot hire manager for locked station: ${stationId}`);
      return false;
    }

    if (station.hasManager) {
      console.warn(`Station already has manager: ${stationId}`);
      return false;
    }

    // Check funds
    if (this.state.money < BASE_COSTS.manager) {
      console.warn(`Insufficient funds to hire manager. Need $${BASE_COSTS.manager}, have $${this.state.money}`);
      return false;
    }

    // Hire manager
    this.state.money -= BASE_COSTS.manager;
    station.hasManager = true;

    this.notify();
    return true;
  }

  /**
   * Add the next ingredient to a station
   * @param stationId ID of the station
   * @returns true if ingredient added, false otherwise
   */
  public addIngredient(stationId: string): boolean {
    const config = STATION_CONFIGS[stationId];
    const station = this.state.stations.get(stationId);

    if (!config || !station) {
      console.warn(`Station not found: ${stationId}`);
      return false;
    }

    if (!station.unlocked) {
      console.warn(`Cannot add ingredient to locked station: ${stationId}`);
      return false;
    }

    // Check storage capacity
    const maxSlots = STORAGE_CAPS[station.storageLevel - 1];
    if (station.unlockedIngredients.length >= maxSlots) {
      console.warn(`Storage full for ${stationId}. Upgrade storage first.`);
      return false;
    }

    // Find next ingredient to unlock
    const nextIngredient = config.availableIngredients.find(
      ing => !station.unlockedIngredients.includes(ing)
    );

    if (!nextIngredient) {
      console.warn(`All ingredients already unlocked for ${stationId}`);
      return false;
    }

    // Check funds
    if (this.state.money < BASE_COSTS.ingredient) {
      console.warn(`Insufficient funds to add ingredient. Need $${BASE_COSTS.ingredient}, have $${this.state.money}`);
      return false;
    }

    // Add ingredient
    this.state.money -= BASE_COSTS.ingredient;
    station.unlockedIngredients.push(nextIngredient);

    this.notify();
    return true;
  }

  // ============================================================================
  // Public API - Automation
  // ============================================================================

  /**
   * Purchase register manager automation
   * @returns true if purchase successful, false otherwise
   */
  public automateRegister(): boolean {
    if (this.state.hasRegisterManager) {
      console.warn('Register already automated');
      return false;
    }

    // Check funds
    if (this.state.money < BASE_COSTS.registerManager) {
      console.warn(`Insufficient funds for register manager. Need $${BASE_COSTS.registerManager}, have $${this.state.money}`);
      return false;
    }

    // Purchase automation
    this.state.money -= BASE_COSTS.registerManager;
    this.state.hasRegisterManager = true;

    this.notify();
    return true;
  }

  /**
   * Purchase second register
   * @returns true if purchase successful, false otherwise
   */
  public addSecondRegister(): boolean {
    if (!this.state.hasRegisterManager) {
      console.warn('Must automate first register before adding second');
      return false;
    }

    if (this.state.hasSecondRegister) {
      console.warn('Second register already purchased');
      return false;
    }

    // Check funds
    if (this.state.money < BASE_COSTS.secondRegister) {
      console.warn(`Insufficient funds for second register. Need $${BASE_COSTS.secondRegister}, have $${this.state.money}`);
      return false;
    }

    // Purchase second register
    this.state.money -= BASE_COSTS.secondRegister;
    this.state.hasSecondRegister = true;

    this.notify();
    return true;
  }

  /**
   * Enable customer spawning after game is mounted
   * BT-013: Adds first customer delay to prevent overwhelming the player
   */
  public enableCustomerSpawning(): void {
    if (this.customerSpawningEnabled) {
      console.warn('Customer spawning already enabled');
      return;
    }

    this.customerSpawningEnabled = true;
    const now = Date.now();

    // Set first customer to spawn after the initial delay
    this.firstCustomerSpawnTime = now + TIMING.firstCustomerDelay;

    // Reset last spawn time to now to ensure proper timing
    this.state.lastCustomerSpawn = now;

    console.log(`Customer spawning enabled. First customer will arrive in ${TIMING.firstCustomerDelay}ms`);
  }

  // ============================================================================
  // Public API - Order Management
  // ============================================================================

  /**
   * Take an order from the queue
   * Generates order based on available recipes and creates active order
   * @returns true if order taken, false otherwise
   */
  public takeOrder(): boolean {
    // Check if queue has customers
    if (this.state.customerQueue.length === 0) {
      console.warn('No customers in queue');
      return false;
    }

    // Check if order already active
    if (this.state.activeOrder !== null) {
      console.warn('Order already in progress');
      return false;
    }

    // Remove customer from queue
    const customer = this.state.customerQueue.shift();
    if (!customer) {
      return false;
    }

    // Generate order based on unlocked stations and ingredients (BT-006)
    const order = this.generateOrder(customer);

    if (!order) {
      console.warn('No available recipes to fulfill order');
      // Put customer back in queue if no recipes available
      this.state.customerQueue.unshift(customer);
      return false;
    }

    this.state.activeOrder = order;
    this.notify();
    return true;
  }

  // ============================================================================
  // Public API - Game Loop (BT-003)
  // ============================================================================

  /**
   * Start the game loop
   * Called automatically on instantiation
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('Game loop already running');
      return;
    }

    this.isRunning = true;
    this.lastTickTime = performance.now();

    this.tickIntervalId = setInterval(() => {
      const now = performance.now();
      const deltaTime = (now - this.lastTickTime) / 1000; // Convert to seconds
      this.lastTickTime = now;

      this.tick(deltaTime);
    }, TIMING.tickInterval);

    console.log('Game loop started');
  }

  /**
   * Stop the game loop and save state
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.tickIntervalId !== null) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }

    this.isRunning = false;
    this.save();

    console.log('Game loop stopped');
  }

  /**
   * Update game state based on elapsed time
   * Called every 100ms by game loop
   * @param deltaTime Time elapsed since last tick in seconds
   */
  private tick(deltaTime: number): void {
    const now = Date.now();

    // Customer spawning logic (BT-005, BT-013)
    if (this.customerSpawningEnabled) {
      // Check if we need to wait for the first customer delay
      if (this.firstCustomerSpawnTime !== null) {
        if (now >= this.firstCustomerSpawnTime) {
          // First customer delay has passed, spawn the first customer
          this.spawnCustomer();
          this.firstCustomerSpawnTime = null; // Clear the flag
          this.state.lastCustomerSpawn = now; // Start the regular spawn interval
        }
        // Otherwise, skip spawning until first customer delay passes
      } else {
        // Normal spawning logic: spawn customers every 5 seconds
        if (now - this.state.lastCustomerSpawn >= TIMING.customerSpawnInterval) {
          this.spawnCustomer();
          this.state.lastCustomerSpawn = now;
        }
      }
    }

    // Update active order progress
    // If register is automated, automatically take orders when possible
    if (this.state.hasRegisterManager && this.state.activeOrder === null && this.state.customerQueue.length > 0) {
      this.takeOrder();
    }

    if (this.state.activeOrder) {
      this.state.activeOrder.remainingTime -= deltaTime;

      // Complete order when time runs out
      if (this.state.activeOrder.remainingTime <= 0) {
        this.completeOrder();
      }
    }

    // Auto-save every 5 seconds
    if (now - this.state.lastSave >= TIMING.autoSaveInterval) {
      this.save();
      this.state.lastSave = now;
    }

    // Notify subscribers of state changes
    this.notify();
  }

  /**
   * Generate an order based on currently unlocked stations and ingredients
   * BT-006: Dynamic Order Generation
   * @param customerName The customer emoji for this order
   * @returns Generated order or null if no recipes available
   */
  private generateOrder(customerName: string): Order | null {
    // Filter food recipes by unlocked status
    const availableFoodRecipes = RECIPES.filter(recipe => {
      if (recipe.category !== 'food') return false;

      // Check if all required stations are unlocked
      const allStationsUnlocked = recipe.requiredStations.every(stationId => {
        const station = this.state.stations.get(stationId);
        return station?.unlocked ?? false;
      });

      if (!allStationsUnlocked) return false;

      // Check if all required ingredients are unlocked
      const allIngredientsUnlocked = recipe.requiredIngredients.every(ingredientId => {
        // Find which station(s) have this ingredient
        for (const stationId of recipe.requiredStations) {
          const station = this.state.stations.get(stationId);
          if (station?.unlockedIngredients.includes(ingredientId)) {
            return true;
          }
        }
        return false;
      });

      return allIngredientsUnlocked;
    });

    // No available food recipes
    if (availableFoodRecipes.length === 0) {
      return null;
    }

    // Randomly select a food recipe
    const foodRecipe = availableFoodRecipes[
      Math.floor(Math.random() * availableFoodRecipes.length)
    ];

    // Check if beverages station is unlocked
    const beveragesStation = this.state.stations.get('beverages');
    let beverageRecipe: typeof RECIPES[number] | undefined = undefined;

    if (beveragesStation?.unlocked) {
      // 60% chance to add a beverage
      if (Math.random() < 0.6) {
        // Filter available beverage recipes
        const availableBeverages = RECIPES.filter(recipe => {
          if (recipe.category !== 'beverage') return false;

          // Check if all required ingredients are unlocked
          return recipe.requiredIngredients.every(ingredientId =>
            beveragesStation.unlockedIngredients.includes(ingredientId)
          );
        });

        // Select random beverage if any available
        if (availableBeverages.length > 0) {
          beverageRecipe = availableBeverages[
            Math.floor(Math.random() * availableBeverages.length)
          ];
        }
      }
    }

    // Get all unique stations involved
    const stationsInvolved = [
      ...new Set([
        ...foodRecipe.requiredStations,
        ...(beverageRecipe?.requiredStations ?? []),
      ]),
    ];

    // Calculate processing time with speed multipliers and parallel/series logic (BT-007)
    const totalTime = this.calculateOrderProcessingTime(foodRecipe, beverageRecipe);

    // Create order with unique ID
    this.orderCounter++;
    const order: Order = {
      id: `order-${Date.now()}-${this.orderCounter}`,
      customerName,
      foodRecipe,
      beverageRecipe,
      startTime: Date.now(),
      totalTime,
      remainingTime: totalTime,
      stationsInvolved,
    };

    return order;
  }

  /**
   * Calculate order processing time with speed multipliers and parallel/series logic
   * BT-007: Processing Logic
   *
   * The baseTime represents the total time to complete the entire order.
   * Each station's contribution is: baseTime / speedMultiplier
   * For multi-station orders:
   * - PARALLEL (all managers): max time among stations
   * - SERIES (any without manager): sum of all station times
   *
   * @param foodRecipe The food recipe in the order
   * @param beverageRecipe Optional beverage recipe in the order
   * @returns Total processing time in seconds
   */
  private calculateOrderProcessingTime(
    foodRecipe: Recipe,
    beverageRecipe?: Recipe
  ): number {
    // Calculate processing time for the food recipe at each station
    const foodStationTimes: number[] = foodRecipe.requiredStations.map(stationId => {
      const station = this.state.stations.get(stationId);
      if (!station) return foodRecipe.baseTime;

      // Apply speed multiplier: baseTime / (1 + (level - 1) * 0.25)
      const speedMultiplier = 1 + (station.equipmentLevel - 1) * SPEED_MULTIPLIER;
      return foodRecipe.baseTime / speedMultiplier;
    });

    // Calculate processing time for the beverage recipe if present
    let beverageStationTimes: number[] = [];
    if (beverageRecipe) {
      beverageStationTimes = beverageRecipe.requiredStations.map(stationId => {
        const station = this.state.stations.get(stationId);
        if (!station) return beverageRecipe.baseTime;

        // Apply speed multiplier
        const speedMultiplier = 1 + (station.equipmentLevel - 1) * SPEED_MULTIPLIER;
        return beverageRecipe.baseTime / speedMultiplier;
      });
    }

    // Get all unique stations involved in the entire order
    const allStations = [
      ...new Set([
        ...foodRecipe.requiredStations,
        ...(beverageRecipe?.requiredStations ?? []),
      ]),
    ];

    // Check if all stations have managers
    const allHaveManagers = allStations.every(stationId => {
      const station = this.state.stations.get(stationId);
      return station?.hasManager ?? false;
    });

    // Calculate total time based on parallel vs. series processing
    if (allHaveManagers) {
      // PARALLEL: All stations work simultaneously, use maximum time
      const allTimes = [...foodStationTimes, ...beverageStationTimes];
      return Math.max(...allTimes);
    } else {
      // SERIES: Stations work sequentially, sum all times
      const allTimes = [...foodStationTimes, ...beverageStationTimes];
      return allTimes.reduce((sum, time) => sum + time, 0);
    }
  }

  /**
   * Complete the current active order
   * BT-008: Calculate pricing with quality multipliers and speed bonuses
   */
  private completeOrder(): void {
    if (!this.state.activeOrder) {
      return;
    }

    const order = this.state.activeOrder;

    // Calculate base price (food + beverage if present)
    const basePrice = order.foodRecipe.basePrice + (order.beverageRecipe?.basePrice ?? 0);

    // Calculate quality multiplier: 1 + sum((stationQuality - 1) * 0.12) for all used stations
    let qualityBonus = 1;
    order.stationsInvolved.forEach(stationId => {
      const station = this.state.stations.get(stationId);
      if (station) {
        qualityBonus += (station.qualityLevel - 1) * QUALITY_MULTIPLIER;
      }
    });

    // Calculate actual time taken (in seconds)
    const actualTime = (Date.now() - order.startTime) / 1000;
    const baseTime = order.totalTime;

    // Calculate speed bonus based on actual vs base time
    let speedMultiplier: number;
    let speedLabel: 'lightning' | 'good' | 'normal' | 'slow';

    if (actualTime < baseTime * 0.5) {
      speedMultiplier = 1.5;
      speedLabel = 'lightning';
    } else if (actualTime < baseTime * 1.0) {
      speedMultiplier = 1.2;
      speedLabel = 'good';
    } else if (actualTime < baseTime * 2.0) {
      speedMultiplier = 1.0;
      speedLabel = 'normal';
    } else {
      speedMultiplier = 0.7;
      speedLabel = 'slow';
    }

    // Calculate final price
    const finalPrice = basePrice * qualityBonus * speedMultiplier;

    // Create sale record
    const orderName = order.beverageRecipe
      ? `${order.foodRecipe.name} & ${order.beverageRecipe.name}`
      : order.foodRecipe.name;

    const sale: SaleRecord = {
      id: order.id,
      orderName,
      speedBonus: speedLabel,
      qualityBonus,
      finalPrice,
      timestamp: Date.now(),
    };

    // Add money and sale to history
    this.addMoney(finalPrice);
    this.addSaleToHistory(sale);

    // Clear active order
    this.state.activeOrder = null;

    console.log(`Order completed: ${orderName}, earned $${finalPrice.toFixed(2)} (Quality: ${qualityBonus.toFixed(2)}x, Speed: ${speedLabel})`);
  }

  /**
   * Spawn a new customer in the queue
   * BT-005: Customer spawning logic
   */
  private spawnCustomer(): void {
    // Don't spawn if queue is full
    if (this.state.customerQueue.length >= TIMING.maxQueueSize) {
      return;
    }

    // Add random customer emoji to queue
    const customer = this.getRandomCustomer();
    this.state.customerQueue.push(customer);
  }

  // ============================================================================
  // Public API - Persistence (BT-003)
  // ============================================================================

  /**
   * Save current game state to localStorage
   */
  public save(): void {
    try {
      const serializedState = {
        ...this.state,
        // Convert Map to object for JSON serialization
        stations: Object.fromEntries(this.state.stations),
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(serializedState));
      console.log('Game saved successfully');
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  /**
   * Load game state from localStorage
   * @returns Loaded state or null if not found/invalid
   */
  public static load(): Partial<GameState> | null {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) {
        console.log('No saved game found');
        return null;
      }

      const parsed = JSON.parse(saved);

      // Convert stations object back to Map
      if (parsed.stations && typeof parsed.stations === 'object') {
        parsed.stations = new Map(Object.entries(parsed.stations) as [string, StationState][]);
      }

      console.log('Game loaded successfully');
      return parsed;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Clear saved game from localStorage
   */
  public static clearSave(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
      console.log('Saved game cleared');
    } catch (error) {
      console.error('Failed to clear save:', error);
    }
  }

  // ============================================================================
  // Public API - Prestige (Stub for Future)
  // ============================================================================

  /**
   * Perform prestige - reset progress with permanent bonuses
   * @returns true if prestige successful, false otherwise
   */
  public prestige(): boolean {
    // Implementation will be added in later tasks
    // This stub ensures the method exists for future implementation
    console.warn('Prestige not yet implemented');
    return false;
  }

  // ============================================================================
  // Helper Methods (Protected for future use in BT-004, BT-007)
  // ============================================================================

  /**
   * Add money to player (used by order completion in BT-007)
   * @param amount Amount to add
   */
  protected addMoney(amount: number): void {
    this.state.money += amount;
    this.state.totalEarnings += amount;
    this.notify();
  }

  /**
   * Add a sale to history (keeps last 5) (used in BT-007)
   * @param sale Sale record to add
   */
  protected addSaleToHistory(sale: SaleRecord): void {
    this.state.salesHistory.unshift(sale);
    if (this.state.salesHistory.length > 5) {
      this.state.salesHistory = this.state.salesHistory.slice(0, 5);
    }
    this.notify();
  }

  /**
   * Get random customer emoji (used in BT-004)
   */
  protected getRandomCustomer(): string {
    const index = Math.floor(Math.random() * CUSTOMER_EMOJIS.length);
    return CUSTOMER_EMOJIS[index];
  }
}
