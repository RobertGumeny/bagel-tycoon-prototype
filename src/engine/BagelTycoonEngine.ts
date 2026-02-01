/**
 * BagelTycoonEngine - Core game logic engine
 * Tasks: BT-002, BT-003
 *
 * Singleton class that manages all game state and logic.
 * Completely decoupled from React/DOM for maximum testability and reusability.
 */

import type {
  GameState,
  StationState,
  Order,
  SaleRecord,
} from './types';

import {
  STATION_CONFIGS,
  STORAGE_CAPS,
  UPGRADE_MULTIPLIER,
  BASE_COSTS,
  CUSTOMER_EMOJIS,
  TIMING,
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
    // Return a deep clone to prevent external mutation
    return JSON.parse(JSON.stringify({
      ...this.state,
      stations: Object.fromEntries(this.state.stations),
    }));
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

    // Create placeholder order (actual order generation in BT-005)
    // For now, create a minimal order structure
    const order: Order = {
      id: `order-${Date.now()}`,
      customerName: customer,
      foodRecipe: {
        id: 'plainBagel',
        name: 'Plain Bagel',
        category: 'food',
        requiredStations: ['bagelCase'],
        requiredIngredients: ['plainBagel'],
        basePrice: 1.50,
        baseTime: 2,
      },
      startTime: Date.now(),
      totalTime: 2,
      remainingTime: 2,
      stationsInvolved: ['bagelCase'],
    };

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

    // Spawn customers every 5 seconds (BT-005)
    if (now - this.state.lastCustomerSpawn >= TIMING.customerSpawnInterval) {
      this.spawnCustomer();
      this.state.lastCustomerSpawn = now;
    }

    // Update active order progress
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
   * Complete the current active order
   * Full implementation in BT-007, this is a placeholder
   */
  private completeOrder(): void {
    if (!this.state.activeOrder) {
      return;
    }

    // Placeholder: Just clear the order for now
    // Full pricing and bonus calculation will be added in BT-007
    const order = this.state.activeOrder;
    const basePrice = order.foodRecipe.basePrice + (order.beverageRecipe?.basePrice ?? 0);

    // Add money (basic implementation)
    this.addMoney(basePrice);

    // Clear active order
    this.state.activeOrder = null;

    console.log(`Order completed: ${order.foodRecipe.name}, earned $${basePrice.toFixed(2)}`);
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
