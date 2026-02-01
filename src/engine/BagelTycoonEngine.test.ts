/**
 * Unit Tests for BagelTycoonEngine
 * Task: BT-004
 *
 * Comprehensive test coverage for all implemented engine functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BagelTycoonEngine } from './BagelTycoonEngine';
import { STATION_CONFIGS, BASE_COSTS, UPGRADE_MULTIPLIER, STORAGE_CAPS } from './types';
import type { GameState, StationState } from './types';

/**
 * Helper to access stations as a Record (getState returns object, not Map at runtime)
 * TypeScript sees Map but runtime is object due to JSON serialization
 */
function getStations(state: Readonly<GameState>): Record<string, StationState> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return state.stations as any;
}

/**
 * Helper function to get engine instance with money
 * Directly modifies internal state for testing purposes
 * Note: Assumes resetInstance() was called in beforeEach
 */
function createEngineWithMoney(money: number): BagelTycoonEngine {
  const engine = BagelTycoonEngine.getInstance();

  // Directly modify internal state for testing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (engine as any).state.money = money;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (engine as any).state.totalEarnings = money;

  return engine;
}

/**
 * Helper function to set up engine with a customer queue
 * Directly modifies internal state for testing purposes
 */
function createEngineWithQueue(customers: string[]): BagelTycoonEngine {
  const engine = BagelTycoonEngine.getInstance();

  // Directly modify internal state for testing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (engine as any).state.customerQueue = [...customers];

  return engine;
}

describe('BagelTycoonEngine', () => {
  // Clean up singleton and localStorage between tests
  beforeEach(() => {
    BagelTycoonEngine.resetInstance();
    localStorage.clear();
    vi.clearAllTimers();
  });

  afterEach(() => {
    BagelTycoonEngine.resetInstance();
    localStorage.clear();
  });

  // ============================================================================
  // Singleton Pattern Tests
  // ============================================================================

  describe('Singleton Pattern', () => {
    it('should create a singleton instance', () => {
      const engine1 = BagelTycoonEngine.getInstance();
      expect(engine1).toBeDefined();
      expect(engine1).toBeInstanceOf(BagelTycoonEngine);
    });

    it('should return the same instance on multiple calls', () => {
      const engine1 = BagelTycoonEngine.getInstance();
      const engine2 = BagelTycoonEngine.getInstance();
      expect(engine1).toBe(engine2);
    });

    it('should reset singleton instance', () => {
      const engine1 = BagelTycoonEngine.getInstance();
      BagelTycoonEngine.resetInstance();
      const engine2 = BagelTycoonEngine.getInstance();
      expect(engine1).not.toBe(engine2);
    });

    it('should stop game loop on reset', () => {
      const engine = BagelTycoonEngine.getInstance();
      const stopSpy = vi.spyOn(engine, 'stop');
      BagelTycoonEngine.resetInstance();
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Observable Pattern Tests
  // ============================================================================

  describe('Observable Pattern', () => {
    it('should subscribe to state changes', () => {
      const engine = BagelTycoonEngine.getInstance();
      const callback = vi.fn();

      engine.subscribe(callback);

      // Callback should be called immediately with current state
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(engine.getState());
    });

    it('should return unsubscribe function', () => {
      const engine = BagelTycoonEngine.getInstance();
      const callback = vi.fn();

      const unsubscribe = engine.subscribe(callback);
      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should notify subscribers on state change', () => {
      const engine = createEngineWithMoney(100);
      const callback = vi.fn();

      engine.subscribe(callback);
      callback.mockClear(); // Clear the initial call

      // Trigger a state change
      engine.unlockStation('beverages');

      // Should notify subscribers
      expect(callback).toHaveBeenCalled();
    });

    it('should unsubscribe correctly', () => {
      const engine = BagelTycoonEngine.getInstance();
      const callback = vi.fn();

      const unsubscribe = engine.subscribe(callback);
      callback.mockClear();

      unsubscribe();

      // Trigger a state change
      engine.unlockStation('beverages');

      // Callback should not be called
      expect(callback).not.toHaveBeenCalled();
    });

    it('should return a deep clone from getState', () => {
      const engine = BagelTycoonEngine.getInstance();
      const state1 = engine.getState();
      const state2 = engine.getState();

      // Should be equal but not the same reference
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
      expect(state1.stations).not.toBe(state2.stations);
    });
  });

  // ============================================================================
  // State Initialization Tests
  // ============================================================================

  describe('State Initialization', () => {
    it('should initialize with default state', () => {
      const engine = BagelTycoonEngine.getInstance();
      const state = engine.getState();

      expect(state.money).toBe(0);
      expect(state.totalEarnings).toBe(0);
      expect(state.customerQueue).toEqual([]);
      expect(state.activeOrder).toBeNull();
      expect(state.salesHistory).toEqual([]);
      expect(state.hasRegisterManager).toBe(false);
      expect(state.hasSecondRegister).toBe(false);
      expect(state.prestigeLevel).toBe(0);
      expect(state.prestigePerks).toEqual([]);
    });

    it('should initialize all stations from config', () => {
      const engine = BagelTycoonEngine.getInstance();
      const state = engine.getState();

      // All 6 stations should exist
      expect(Object.keys(state.stations)).toHaveLength(6);

      Object.keys(STATION_CONFIGS).forEach(stationId => {
        expect(getStations(state)[stationId]).toBeDefined();
      });
    });

    it('should unlock free stations at start', () => {
      const engine = BagelTycoonEngine.getInstance();
      const state = engine.getState();

      // Bagel Case and Cooler are free
      expect(getStations(state).bagelCase.unlocked).toBe(true);
      expect(getStations(state).cooler.unlocked).toBe(true);

      // Other stations are locked
      expect(getStations(state).beverages.unlocked).toBe(false);
      expect(getStations(state).slicer.unlocked).toBe(false);
      expect(getStations(state).griddle.unlocked).toBe(false);
      expect(getStations(state).fryer.unlocked).toBe(false);
    });

    it('should initialize free stations with default ingredients', () => {
      const engine = BagelTycoonEngine.getInstance();
      const state = engine.getState();

      expect(getStations(state).bagelCase.unlockedIngredients).toEqual(['plainBagel']);
      expect(getStations(state).cooler.unlockedIngredients).toEqual(['butter', 'plainCreamCheese']);
    });

    it('should initialize all stations with level 1 stats', () => {
      const engine = BagelTycoonEngine.getInstance();
      const state = engine.getState();

      Object.values(state.stations).forEach(station => {
        expect(station.equipmentLevel).toBe(1);
        expect(station.qualityLevel).toBe(1);
        expect(station.storageLevel).toBe(1);
        expect(station.hasManager).toBe(false);
      });
    });
  });

  // ============================================================================
  // Station Unlock Tests
  // ============================================================================

  describe('Station Unlocking', () => {
    it('should unlock station when player has sufficient funds', () => {
      const richEngine = createEngineWithMoney(1000);

      const result = richEngine.unlockStation('beverages');
      expect(result).toBe(true);

      const newState = richEngine.getState();
      expect(getStations(newState).beverages.unlocked).toBe(true);
      expect(newState.money).toBe(1000 - STATION_CONFIGS.beverages.unlockCost);
    });

    it('should not unlock station with insufficient funds', () => {
      const engine = BagelTycoonEngine.getInstance();
      const result = engine.unlockStation('beverages');

      expect(result).toBe(false);

      const state = engine.getState();
      expect(getStations(state).beverages.unlocked).toBe(false);
      expect(state.money).toBe(0);
    });

    it('should not unlock already unlocked station', () => {
      const engine = createEngineWithMoney(1000);

      // First unlock
      engine.unlockStation('beverages');
      const moneyAfterFirst = engine.getState().money;

      // Try to unlock again
      const result = engine.unlockStation('beverages');
      expect(result).toBe(false);
      expect(engine.getState().money).toBe(moneyAfterFirst); // Money unchanged
    });

    it('should unlock default ingredients on station unlock', () => {
      const engine = createEngineWithMoney(1000);

      engine.unlockStation('beverages');

      const state = engine.getState();
      expect(getStations(state).beverages.unlockedIngredients).toEqual(
        STATION_CONFIGS.beverages.defaultIngredients
      );
    });

    it('should return false for unknown station', () => {
      const engine = BagelTycoonEngine.getInstance();
      const result = engine.unlockStation('unknownStation');
      expect(result).toBe(false);
    });

    it('should deduct correct cost for each station', () => {
      const testCases = [
        { id: 'beverages', cost: 50 },
        { id: 'slicer', cost: 250 },
        { id: 'griddle', cost: 750 },
        { id: 'fryer', cost: 2000 },
      ];

      testCases.forEach(({ id, cost }) => {
        const engine = createEngineWithMoney(5000);

        engine.unlockStation(id);

        const state = engine.getState();
        expect(state.money).toBe(5000 - cost);
      });
    });
  });

  // ============================================================================
  // Station Upgrade Tests
  // ============================================================================

  describe('Station Upgrades', () => {
    describe('Equipment Upgrades', () => {
      it('should upgrade equipment level', () => {
        const engine = createEngineWithMoney(1000);

        const result = engine.upgradeStation('bagelCase', 'equipment');
        expect(result).toBe(true);

        const state = engine.getState();
        expect(getStations(state).bagelCase.equipmentLevel).toBe(2);
      });

      it('should calculate equipment cost correctly', () => {
        const engine = createEngineWithMoney(1000);

        // Level 1 -> 2: baseCost * 1.6^1 = 10 * 1.6 = 16
        engine.upgradeStation('bagelCase', 'equipment');
        expect(engine.getState().money).toBe(1000 - 16);

        // Level 2 -> 3: baseCost * 1.6^2 = 10 * 2.56 = 25.6
        engine.upgradeStation('bagelCase', 'equipment');
        expect(engine.getState().money).toBeCloseTo(1000 - 16 - 25.6, 1);
      });

      it('should fail with insufficient funds', () => {
        const engine = BagelTycoonEngine.getInstance();
        const result = engine.upgradeStation('bagelCase', 'equipment');

        expect(result).toBe(false);
        const state = engine.getState();
        expect(getStations(state).bagelCase.equipmentLevel).toBe(1);
      });
    });

    describe('Quality Upgrades', () => {
      it('should upgrade quality level', () => {
        const engine = createEngineWithMoney(1000);

        const result = engine.upgradeStation('bagelCase', 'quality');
        expect(result).toBe(true);

        const state = engine.getState();
        expect(getStations(state).bagelCase.qualityLevel).toBe(2);
      });

      it('should calculate quality cost correctly', () => {
        const engine = createEngineWithMoney(1000);

        // Level 1 -> 2: baseCost * 1.6^1 = 10 * 1.6 = 16
        engine.upgradeStation('bagelCase', 'quality');
        expect(engine.getState().money).toBe(1000 - 16);
      });
    });

    describe('Storage Upgrades', () => {
      it('should upgrade storage level', () => {
        const engine = createEngineWithMoney(1000);

        const result = engine.upgradeStation('bagelCase', 'storage');
        expect(result).toBe(true);

        const state = engine.getState();
        expect(getStations(state).bagelCase.storageLevel).toBe(2);
      });

      it('should calculate storage cost correctly', () => {
        const engine = createEngineWithMoney(1000);

        // Level 1 -> 2: 50 * 2 = 100
        engine.upgradeStation('bagelCase', 'storage');
        expect(engine.getState().money).toBe(1000 - 100);

        // Level 2 -> 3: 50 * 3 = 150
        engine.upgradeStation('bagelCase', 'storage');
        expect(engine.getState().money).toBe(1000 - 100 - 150);
      });

      it('should not upgrade storage beyond level 3', () => {
        const engine = createEngineWithMoney(10000);

        // Upgrade to level 2
        engine.upgradeStation('bagelCase', 'storage');
        // Upgrade to level 3
        engine.upgradeStation('bagelCase', 'storage');

        const moneyBeforeFail = engine.getState().money;

        // Try to upgrade to level 4
        const result = engine.upgradeStation('bagelCase', 'storage');
        expect(result).toBe(false);
        const finalState = engine.getState();
        expect(getStations(finalState).bagelCase.storageLevel).toBe(3);
        expect(engine.getState().money).toBe(moneyBeforeFail);
      });
    });

    it('should not upgrade locked station', () => {
      const engine = createEngineWithMoney(1000);

      const result = engine.upgradeStation('beverages', 'equipment');
      expect(result).toBe(false);
    });

    it('should return false for unknown upgrade type', () => {
      const engine = createEngineWithMoney(1000);

      // @ts-expect-error - Testing invalid input
      const result = engine.upgradeStation('bagelCase', 'invalid');
      expect(result).toBe(false);
    });

    it('should return false for unknown station', () => {
      const engine = createEngineWithMoney(1000);

      const result = engine.upgradeStation('unknownStation', 'equipment');
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Manager Hiring Tests
  // ============================================================================

  describe('Manager Hiring', () => {
    it('should hire manager when player has sufficient funds', () => {
      const engine = createEngineWithMoney(1000);

      const result = engine.hireManager('bagelCase');
      expect(result).toBe(true);

      const state = engine.getState();
      expect(getStations(state).bagelCase.hasManager).toBe(true);
      expect(state.money).toBe(1000 - BASE_COSTS.manager);
    });

    it('should not hire manager with insufficient funds', () => {
      const engine = BagelTycoonEngine.getInstance();
      const result = engine.hireManager('bagelCase');

      expect(result).toBe(false);
      const checkState = engine.getState();
      expect(getStations(checkState).bagelCase.hasManager).toBe(false);
    });

    it('should not hire manager for locked station', () => {
      const engine = createEngineWithMoney(1000);

      const result = engine.hireManager('beverages');
      expect(result).toBe(false);
    });

    it('should not hire manager twice for same station', () => {
      const engine = createEngineWithMoney(1000);

      engine.hireManager('bagelCase');
      const moneyAfterFirst = engine.getState().money;

      const result = engine.hireManager('bagelCase');
      expect(result).toBe(false);
      expect(engine.getState().money).toBe(moneyAfterFirst);
    });

    it('should return false for unknown station', () => {
      const engine = createEngineWithMoney(1000);

      const result = engine.hireManager('unknownStation');
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Ingredient Unlock Tests
  // ============================================================================

  describe('Ingredient Unlocking', () => {
    it('should add next ingredient when player has sufficient funds', () => {
      const engine = createEngineWithMoney(1000);

      const initialState = engine.getState();
      const initialIngredients = getStations(initialState).bagelCase.unlockedIngredients;

      const result = engine.addIngredient('bagelCase');
      expect(result).toBe(true);

      const state = engine.getState();
      expect(getStations(state).bagelCase.unlockedIngredients.length).toBe(
        initialIngredients.length + 1
      );
      expect(state.money).toBe(1000 - BASE_COSTS.ingredient);
    });

    it('should add ingredients in sequence from config', () => {
      const engine = createEngineWithMoney(1000);

      const config = STATION_CONFIGS.bagelCase;
      const startingState = engine.getState();
      const startingIngredients = getStations(startingState).bagelCase.unlockedIngredients;

      engine.addIngredient('bagelCase');

      const state = engine.getState();
      const addedIngredient = getStations(state).bagelCase.unlockedIngredients[
        getStations(state).bagelCase.unlockedIngredients.length - 1
      ];

      // Should be the next ingredient from config
      const expectedIngredient = config.availableIngredients.find(
        ing => !startingIngredients.includes(ing)
      );
      expect(addedIngredient).toBe(expectedIngredient);
    });

    it('should not add ingredient with insufficient funds', () => {
      const engine = BagelTycoonEngine.getInstance();
      const result = engine.addIngredient('bagelCase');

      expect(result).toBe(false);
    });

    it('should not add ingredient to locked station', () => {
      const engine = createEngineWithMoney(1000);

      const result = engine.addIngredient('beverages');
      expect(result).toBe(false);
    });

    it('should not exceed storage capacity', () => {
      const engine = createEngineWithMoney(10000);

      // Storage level 1 = 3 slots, bagelCase starts with 1 ingredient
      engine.addIngredient('bagelCase'); // 2 ingredients
      engine.addIngredient('bagelCase'); // 3 ingredients (at capacity)

      const result = engine.addIngredient('bagelCase'); // Try to add 4th
      expect(result).toBe(false);
      const capacityState = engine.getState();
      expect(getStations(capacityState).bagelCase.unlockedIngredients.length).toBe(3);
    });

    it('should respect increased storage capacity after upgrade', () => {
      const engine = createEngineWithMoney(10000);

      // Fill to level 1 capacity (3 slots)
      engine.addIngredient('bagelCase');
      engine.addIngredient('bagelCase');

      // Upgrade storage to level 2 (5 slots)
      engine.upgradeStation('bagelCase', 'storage');

      // Should now be able to add more
      const result = engine.addIngredient('bagelCase');
      expect(result).toBe(true);
      const afterUpgradeState = engine.getState();
      expect(getStations(afterUpgradeState).bagelCase.unlockedIngredients.length).toBe(4);
    });

    it('should not add ingredient when all are unlocked', () => {
      const engine = createEngineWithMoney(10000);

      // Upgrade storage to max
      engine.upgradeStation('bagelCase', 'storage');
      engine.upgradeStation('bagelCase', 'storage');

      // Add all possible ingredients (8 total for bagelCase)
      const maxIngredients = STATION_CONFIGS.bagelCase.availableIngredients.length;
      for (let i = 0; i < maxIngredients; i++) {
        engine.addIngredient('bagelCase');
      }

      const result = engine.addIngredient('bagelCase');
      expect(result).toBe(false);
      const allIngredientsState = engine.getState();
      expect(getStations(allIngredientsState).bagelCase.unlockedIngredients.length).toBe(8);
    });

    it('should return false for unknown station', () => {
      const engine = createEngineWithMoney(1000);

      const result = engine.addIngredient('unknownStation');
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Automation Tests
  // ============================================================================

  describe('Register Automation', () => {
    it('should automate register when player has sufficient funds', () => {
      const engine = createEngineWithMoney(1000);

      const result = engine.automateRegister();
      expect(result).toBe(true);

      const state = engine.getState();
      expect(state.hasRegisterManager).toBe(true);
      expect(state.money).toBe(1000 - BASE_COSTS.registerManager);
    });

    it('should not automate register with insufficient funds', () => {
      const engine = BagelTycoonEngine.getInstance();
      const result = engine.automateRegister();

      expect(result).toBe(false);
      expect(engine.getState().hasRegisterManager).toBe(false);
    });

    it('should not automate register twice', () => {
      const engine = createEngineWithMoney(1000);

      engine.automateRegister();
      const moneyAfterFirst = engine.getState().money;

      const result = engine.automateRegister();
      expect(result).toBe(false);
      expect(engine.getState().money).toBe(moneyAfterFirst);
    });
  });

  describe('Second Register', () => {
    it('should add second register after automating first', () => {
      const engine = createEngineWithMoney(2000);

      engine.automateRegister();
      const result = engine.addSecondRegister();

      expect(result).toBe(true);
      expect(engine.getState().hasSecondRegister).toBe(true);
    });

    it('should not add second register without automating first', () => {
      const engine = createEngineWithMoney(2000);

      const result = engine.addSecondRegister();
      expect(result).toBe(false);
      expect(engine.getState().hasSecondRegister).toBe(false);
    });

    it('should not add second register with insufficient funds', () => {
      const engine = createEngineWithMoney(300);

      engine.automateRegister();
      const result = engine.addSecondRegister();

      expect(result).toBe(false);
      expect(engine.getState().hasSecondRegister).toBe(false);
    });

    it('should not add second register twice', () => {
      const engine = createEngineWithMoney(2000);

      engine.automateRegister();
      engine.addSecondRegister();
      const moneyAfterFirst = engine.getState().money;

      const result = engine.addSecondRegister();
      expect(result).toBe(false);
      expect(engine.getState().money).toBe(moneyAfterFirst);
    });

    it('should deduct correct cost', () => {
      const engine = createEngineWithMoney(2000);

      engine.automateRegister();
      engine.addSecondRegister();

      expect(engine.getState().money).toBe(
        2000 - BASE_COSTS.registerManager - BASE_COSTS.secondRegister
      );
    });
  });

  // ============================================================================
  // Order Management Tests
  // ============================================================================

  describe('Order Management', () => {
    it('should take order from queue', () => {
      const engine = createEngineWithQueue(['😀', '😎']);

      const result = engine.takeOrder();
      expect(result).toBe(true);

      const state = engine.getState();
      expect(state.activeOrder).not.toBeNull();
      expect(state.customerQueue.length).toBe(1);
    });

    it('should not take order from empty queue', () => {
      const engine = BagelTycoonEngine.getInstance();
      const result = engine.takeOrder();

      expect(result).toBe(false);
      expect(engine.getState().activeOrder).toBeNull();
    });

    it('should not take order when order is already active', () => {
      const engine = createEngineWithQueue(['😀', '😎']);

      engine.takeOrder();
      const queueLengthAfterFirst = engine.getState().customerQueue.length;

      const result = engine.takeOrder();
      expect(result).toBe(false);
      expect(engine.getState().customerQueue.length).toBe(queueLengthAfterFirst);
    });

    it('should create order with customer from queue', () => {
      const engine = createEngineWithQueue(['😀', '😎']);

      engine.takeOrder();

      const state = engine.getState();
      expect(state.activeOrder?.customerName).toBe('😀');
    });

    it('should remove customer from front of queue (FIFO)', () => {
      const engine = createEngineWithQueue(['😀', '😎', '🤓']);

      engine.takeOrder();

      const state = engine.getState();
      expect(state.customerQueue).toEqual(['😎', '🤓']);
    });
  });

  // ============================================================================
  // Persistence Tests
  // ============================================================================

  describe('Persistence', () => {
    it('should save state to localStorage', () => {
      const engine = BagelTycoonEngine.getInstance();
      engine.save();

      const saved = localStorage.getItem('bagel-tycoon-save');
      expect(saved).not.toBeNull();
    });

    it('should load state from localStorage', () => {
      // Create and save a state
      const engine1 = createEngineWithMoney(500);
      engine1.save();

      // Reset and load
      BagelTycoonEngine.resetInstance();
      const loaded = BagelTycoonEngine.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.money).toBe(500);
    });

    it('should load saved state on getInstance with no initial state', () => {
      // Save a state
      const engine1 = createEngineWithMoney(750);
      engine1.save();

      // Reset and create new instance without initial state
      BagelTycoonEngine.resetInstance();
      const engine2 = BagelTycoonEngine.getInstance();

      expect(engine2.getState().money).toBe(750);
    });

    it('should return null when no save exists', () => {
      localStorage.clear();
      const loaded = BagelTycoonEngine.load();
      expect(loaded).toBeNull();
    });

    it('should clear save from localStorage', () => {
      const engine = BagelTycoonEngine.getInstance();
      engine.save();

      expect(localStorage.getItem('bagel-tycoon-save')).not.toBeNull();

      BagelTycoonEngine.clearSave();

      expect(localStorage.getItem('bagel-tycoon-save')).toBeNull();
    });

    it('should serialize and deserialize stations Map correctly', () => {
      BagelTycoonEngine.resetInstance();
      const engine1 = createEngineWithMoney(1000);
      engine1.unlockStation('beverages');
      engine1.save();

      BagelTycoonEngine.resetInstance();
      const engine2 = BagelTycoonEngine.getInstance();

      const state = engine2.getState();
      expect(getStations(state).beverages.unlocked).toBe(true);
      expect(typeof state.stations).toBe('object');
    });

    it('should preserve all state properties on save/load', () => {
      // Create engine and set complex state
      const engine1 = BagelTycoonEngine.getInstance();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine1 as any).state.money = 123;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine1 as any).state.totalEarnings = 456;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine1 as any).state.customerQueue = ['😀', '😎'];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine1 as any).state.hasRegisterManager = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine1 as any).state.prestigeLevel = 2;
      engine1.save();

      BagelTycoonEngine.resetInstance();
      const engine2 = BagelTycoonEngine.getInstance();
      const state = engine2.getState();

      expect(state.money).toBe(123);
      expect(state.totalEarnings).toBe(456);
      expect(state.customerQueue).toEqual(['😀', '😎']);
      expect(state.hasRegisterManager).toBe(true);
      expect(state.prestigeLevel).toBe(2);
    });
  });

  // ============================================================================
  // Cost Calculation Tests
  // ============================================================================

  describe('Cost Calculations', () => {
    it('should calculate equipment upgrade costs with exponential formula', () => {
      const engine = createEngineWithMoney(100000);

      const testCases = [
        { expectedCost: BASE_COSTS.equipment * Math.pow(UPGRADE_MULTIPLIER, 1) },
        { expectedCost: BASE_COSTS.equipment * Math.pow(UPGRADE_MULTIPLIER, 2) },
        { expectedCost: BASE_COSTS.equipment * Math.pow(UPGRADE_MULTIPLIER, 3) },
      ];

      testCases.forEach(({ expectedCost }) => {
        const moneyBefore = engine.getState().money;
        engine.upgradeStation('bagelCase', 'equipment');
        const moneyAfter = engine.getState().money;
        const actualCost = moneyBefore - moneyAfter;

        expect(actualCost).toBeCloseTo(expectedCost, 1);
      });
    });

    it('should calculate quality upgrade costs with exponential formula', () => {
      const engine = createEngineWithMoney(100000);

      const moneyBefore = engine.getState().money;
      engine.upgradeStation('bagelCase', 'quality');
      const moneyAfter = engine.getState().money;

      const expectedCost = BASE_COSTS.quality * Math.pow(UPGRADE_MULTIPLIER, 1);
      expect(moneyBefore - moneyAfter).toBeCloseTo(expectedCost, 1);
    });

    it('should calculate storage upgrade costs with linear formula', () => {
      const engine = createEngineWithMoney(100000);

      // Level 1 -> 2: 50 * 2 = 100
      const moneyBefore1 = engine.getState().money;
      engine.upgradeStation('bagelCase', 'storage');
      const moneyAfter1 = engine.getState().money;
      expect(moneyBefore1 - moneyAfter1).toBe(100);

      // Level 2 -> 3: 50 * 3 = 150
      const moneyBefore2 = engine.getState().money;
      engine.upgradeStation('bagelCase', 'storage');
      const moneyAfter2 = engine.getState().money;
      expect(moneyBefore2 - moneyAfter2).toBe(150);
    });

    it('should use correct storage capacity values', () => {
      expect(STORAGE_CAPS).toEqual([3, 5, 8]);

      const engine = createEngineWithMoney(100000);

      // Test each storage level capacity
      const state = engine.getState();

      // Level 1: 3 slots
      expect(getStations(state).bagelCase.storageLevel).toBe(1);

      // Upgrade to level 2: 5 slots
      engine.upgradeStation('bagelCase', 'storage');
      const level2State = engine.getState();
      expect(getStations(level2State).bagelCase.storageLevel).toBe(2);

      // Upgrade to level 3: 8 slots
      engine.upgradeStation('bagelCase', 'storage');
      const level3State = engine.getState();
      expect(getStations(level3State).bagelCase.storageLevel).toBe(3);
    });
  });
});
