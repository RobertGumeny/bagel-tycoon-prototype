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

    // Regression test for BUG-1: mergeWithDefaults should preserve default stations when partial state doesn't include them
    it('should initialize default stations when creating instance with partial state (money only)', () => {
      BagelTycoonEngine.resetInstance();
      const engine = BagelTycoonEngine.getInstance({ money: 1000 });
      const state = engine.getState();

      // Should have all 6 stations initialized from defaults
      expect(Object.keys(state.stations)).toHaveLength(6);

      // Should preserve the partial state property
      expect(state.money).toBe(1000);

      // Stations should be properly initialized and usable
      Object.keys(STATION_CONFIGS).forEach(stationId => {
        expect(getStations(state)[stationId]).toBeDefined();
      });
    });

    it('should initialize default stations when creating instance with partial state (custom queue)', () => {
      BagelTycoonEngine.resetInstance();
      const engine = BagelTycoonEngine.getInstance({
        customerQueue: ['😀', '😎']
      });
      const state = engine.getState();

      // Should have all 6 stations initialized from defaults
      expect(Object.keys(state.stations)).toHaveLength(6);

      // Should preserve the partial state property
      expect(state.customerQueue).toEqual(['😀', '😎']);
    });

    it('should preserve full state when all properties are provided', () => {
      BagelTycoonEngine.resetInstance();
      const defaultEngine = BagelTycoonEngine.getInstance();
      const fullState = defaultEngine.getState();

      BagelTycoonEngine.resetInstance();
      const engine = BagelTycoonEngine.getInstance(fullState);

      // Should match the full state exactly
      expect(engine.getState()).toEqual(fullState);
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
  // Customer Queue & Spawning Tests (BT-005)
  // ============================================================================

  describe('Customer Spawning', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should spawn a customer after 5 seconds', () => {
      const engine = BagelTycoonEngine.getInstance();

      // Initially queue should be empty
      let state = engine.getState();
      expect(state.customerQueue.length).toBe(0);

      // Advance time by 5 seconds (includes game loop ticks)
      vi.advanceTimersByTime(5100);

      // Customer should be spawned
      state = engine.getState();
      expect(state.customerQueue.length).toBe(1);
      expect(state.customerQueue[0]).toBeTruthy();
    });

    it('should spawn multiple customers over time', () => {
      const engine = BagelTycoonEngine.getInstance();

      // Spawn 3 customers
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(5100);
      }

      const state = engine.getState();
      expect(state.customerQueue.length).toBe(3);
    });

    it('should not exceed maximum queue size of 5', () => {
      const engine = BagelTycoonEngine.getInstance();

      // Try to spawn 10 customers
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(5100);
      }

      const state = engine.getState();
      expect(state.customerQueue.length).toBe(5);
    });

    it('should stop spawning when queue is full', () => {
      const engine = BagelTycoonEngine.getInstance();

      // Fill queue to max (5 customers)
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(5100);
      }

      const queueBeforeExtraTime = [...engine.getState().customerQueue];

      // Advance more time
      vi.advanceTimersByTime(10100);

      const state = engine.getState();
      expect(state.customerQueue.length).toBe(5);
      expect(state.customerQueue).toEqual(queueBeforeExtraTime);
    });

    it('should resume spawning after queue has space', () => {
      const engine = BagelTycoonEngine.getInstance();

      // Fill queue
      for (let i = 0; i < 5; i++) {
        vi.advanceTimersByTime(5100);
      }

      expect(engine.getState().customerQueue.length).toBe(5);

      // Take an order to make space
      engine.takeOrder();
      expect(engine.getState().customerQueue.length).toBe(4);

      // Spawn another customer
      vi.advanceTimersByTime(5100);
      expect(engine.getState().customerQueue.length).toBe(5);
    });

    it('should use customer emojis from CUSTOMER_EMOJIS constant', () => {
      const engine = BagelTycoonEngine.getInstance();

      vi.advanceTimersByTime(5100);

      const state = engine.getState();
      const customer = state.customerQueue[0];

      // Customer should be a string (emoji)
      expect(typeof customer).toBe('string');
      expect(customer.length).toBeGreaterThan(0);
    });

    it('should spawn customers at regular intervals', () => {
      const engine = BagelTycoonEngine.getInstance();

      // Check spawning at each 5-second interval
      for (let i = 0; i < 4; i++) {
        vi.advanceTimersByTime(5100);
        expect(engine.getState().customerQueue.length).toBe(i + 1);
      }
    });

    it('should not spawn before 5 seconds have elapsed', () => {
      const engine = BagelTycoonEngine.getInstance();

      // Advance time by less than 5 seconds
      vi.advanceTimersByTime(4900);

      const state = engine.getState();
      expect(state.customerQueue.length).toBe(0);
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

  // ============================================================================
  // Dynamic Order Generation Tests (BT-006)
  // ============================================================================

  describe('Dynamic Order Generation (BT-006)', () => {
    it('should generate orders with only starter recipes (bagelCase + cooler)', () => {
      const engine = createEngineWithQueue(['😀']);
      const success = engine.takeOrder();

      expect(success).toBe(true);
      const state = engine.getState();
      expect(state.activeOrder).not.toBeNull();
      expect(state.activeOrder?.foodRecipe).toBeDefined();

      // Should only use bagelCase and/or cooler stations (free stations)
      const usedStations = state.activeOrder?.foodRecipe.requiredStations ?? [];
      expect(usedStations.every(s => s === 'bagelCase' || s === 'cooler')).toBe(true);
    });

    it('should filter recipes by unlocked stations', () => {
      // Only bagelCase and cooler are unlocked by default
      const engine = createEngineWithQueue(['😀']);
      engine.takeOrder();

      const state = engine.getState();
      const order = state.activeOrder;

      // Should not generate orders requiring slicer, griddle, fryer, or beverages
      const requiredStations = order?.foodRecipe.requiredStations ?? [];
      expect(requiredStations).not.toContain('slicer');
      expect(requiredStations).not.toContain('griddle');
      expect(requiredStations).not.toContain('fryer');
      expect(requiredStations).not.toContain('beverages');
    });

    it('should filter recipes by unlocked ingredients', () => {
      const engine = createEngineWithQueue(['😀']);

      // Default ingredients for free stations:
      // bagelCase: plainBagel
      // cooler: butter, plainCreamCheese

      engine.takeOrder();
      const state = engine.getState();
      const order = state.activeOrder;

      // Check that all required ingredients are in the default set
      const defaultIngredients = ['plainBagel', 'butter', 'plainCreamCheese'];
      const requiredIngredients = order?.foodRecipe.requiredIngredients ?? [];

      requiredIngredients.forEach(ingredient => {
        expect(defaultIngredients).toContain(ingredient);
      });
    });

    it('should unlock more recipes when station is unlocked', () => {
      const engine = createEngineWithMoney(1000);

      // Unlock beverages station
      engine.unlockStation('beverages');

      // Add customers and take several orders to see variety
      const orderNames = new Set<string>();
      for (let i = 0; i < 20; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.customerQueue.push('😀');
        engine.takeOrder();
        const order = engine.getState().activeOrder;
        if (order) {
          orderNames.add(order.foodRecipe.name);
          // Clear order for next iteration
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (engine as any).state.activeOrder = null;
        }
      }

      // Should have generated at least a few different recipes
      // (given randomness, this is probabilistic but should pass)
      expect(orderNames.size).toBeGreaterThan(1);
    });

    it('should unlock more recipes when new ingredients are added', () => {
      const engine = createEngineWithMoney(1000);

      // Add a new ingredient to bagelCase
      engine.addIngredient('bagelCase');

      // Take an order
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine as any).state.customerQueue.push('😀');
      engine.takeOrder();

      const state = engine.getState();
      expect(state.activeOrder).not.toBeNull();

      // The order should be valid (this tests that the new ingredient is properly recognized)
      expect(state.activeOrder?.foodRecipe).toBeDefined();
    });

    it('should add beverage to order 60% of the time when beverages unlocked', () => {
      const engine = createEngineWithMoney(1000);

      // Unlock beverages station
      engine.unlockStation('beverages');

      // Take many orders to test probability
      let ordersWithBeverages = 0;
      const totalOrders = 100;

      for (let i = 0; i < totalOrders; i++) {
        // Add customer and take order
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.customerQueue.push('😀');
        engine.takeOrder();

        const order = engine.getState().activeOrder;
        if (order?.beverageRecipe) {
          ordersWithBeverages++;
        }

        // Clear order for next iteration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.activeOrder = null;
      }

      // Should be approximately 60% (with some tolerance for randomness)
      // Using a generous range: 45% to 75%
      const percentage = ordersWithBeverages / totalOrders;
      expect(percentage).toBeGreaterThan(0.45);
      expect(percentage).toBeLessThan(0.75);
    });

    it('should not add beverage when beverages station is locked', () => {
      const engine = createEngineWithQueue(['😀']);

      // Beverages station should be locked by default
      engine.takeOrder();

      const state = engine.getState();
      const order = state.activeOrder;

      expect(order?.beverageRecipe).toBeUndefined();
    });

    it('should calculate totalTime with processing logic for food and beverage orders', () => {
      const engine = createEngineWithMoney(1000);

      // Unlock beverages station
      engine.unlockStation('beverages');

      // Take orders until we get one with a beverage
      let orderWithBeverage = null;
      for (let i = 0; i < 50; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.customerQueue.push('😀');
        engine.takeOrder();

        const order = engine.getState().activeOrder;
        if (order?.beverageRecipe) {
          orderWithBeverage = order;
          break;
        }

        // Clear order for next iteration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.activeOrder = null;
      }

      // Should have found at least one order with beverage in 50 tries
      expect(orderWithBeverage).not.toBeNull();

      if (orderWithBeverage) {
        // With BT-007 processing logic, time includes speed multipliers and series processing
        // Since no managers are hired, processing is in series (sum of all station times)
        const foodBaseTime = orderWithBeverage.foodRecipe.baseTime;
        const beverageBaseTime = orderWithBeverage.beverageRecipe?.baseTime ?? 0;
        const foodStationCount = orderWithBeverage.foodRecipe.requiredStations.length;
        const beverageStationCount = orderWithBeverage.beverageRecipe?.requiredStations.length ?? 0;

        // With all equipment at level 1 (speed multiplier = 1.0) and series processing:
        // Each station processes for baseTime / 1.0 = baseTime
        // Total = sum of all station times
        const expectedTime = foodBaseTime * foodStationCount + beverageBaseTime * beverageStationCount;

        expect(orderWithBeverage.totalTime).toBeCloseTo(expectedTime, 1);
        expect(orderWithBeverage.remainingTime).toBeCloseTo(expectedTime, 1);
      }
    });

    it('should calculate totalTime for food-only orders', () => {
      const engine = createEngineWithQueue(['😀']);

      // Beverages locked, so all orders will be food-only
      engine.takeOrder();

      const state = engine.getState();
      const order = state.activeOrder;

      expect(order).not.toBeNull();

      if (order) {
        // With BT-007 processing logic, time accounts for all stations
        // Since no managers are hired, processing is in series
        // With all equipment at level 1 (speed multiplier = 1.0):
        // Each station processes for baseTime / 1.0 = baseTime
        const baseTime = order.foodRecipe.baseTime;
        const stationCount = order.foodRecipe.requiredStations.length;
        const expectedTime = baseTime * stationCount;

        expect(order.totalTime).toBeCloseTo(expectedTime, 1);
        expect(order.remainingTime).toBeCloseTo(expectedTime, 1);
      }
    });

    it('should include all unique stations in stationsInvolved', () => {
      const engine = createEngineWithMoney(1000);

      // Unlock beverages station
      engine.unlockStation('beverages');

      // Take orders until we get one with both food and beverage
      let foundCombinedOrder = false;
      for (let i = 0; i < 50; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.customerQueue.push('😀');
        engine.takeOrder();

        const order = engine.getState().activeOrder;
        if (order?.beverageRecipe) {
          // Check that stationsInvolved includes stations from both recipes
          const foodStations = order.foodRecipe.requiredStations;
          const beverageStations = order.beverageRecipe.requiredStations;
          const allStations = [...foodStations, ...beverageStations];

          // All stations should be in stationsInvolved
          allStations.forEach(station => {
            expect(order.stationsInvolved).toContain(station);
          });

          // stationsInvolved should have unique stations only
          const uniqueStations = new Set(order.stationsInvolved);
          expect(order.stationsInvolved.length).toBe(uniqueStations.size);

          foundCombinedOrder = true;
          break;
        }

        // Clear order for next iteration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.activeOrder = null;
      }

      expect(foundCombinedOrder).toBe(true);
    });

    it('should return null and keep customer in queue if no recipes available', () => {
      // Create an engine with all stations locked except bagelCase
      const engine = BagelTycoonEngine.getInstance();

      // Manually remove all ingredients from bagelCase to make no recipes available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine as any).state.stations.get('bagelCase').unlockedIngredients = [];

      // Add a customer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine as any).state.customerQueue.push('😀');

      const success = engine.takeOrder();

      expect(success).toBe(false);
      const state = engine.getState();
      expect(state.activeOrder).toBeNull();
      expect(state.customerQueue.length).toBe(1); // Customer should still be in queue
    });

    it('should generate unique order IDs', () => {
      const engine = createEngineWithMoney(1000);

      const orderIds = new Set<string>();

      for (let i = 0; i < 10; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.customerQueue.push('😀');
        engine.takeOrder();

        const order = engine.getState().activeOrder;
        if (order) {
          orderIds.add(order.id);
          // Clear order for next iteration
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (engine as any).state.activeOrder = null;
        }
      }

      // All order IDs should be unique
      expect(orderIds.size).toBe(10);
    });

    it('should use customer emoji in generated order', () => {
      const testEmoji = '🥳';
      const engine = createEngineWithQueue([testEmoji]);

      engine.takeOrder();

      const state = engine.getState();
      expect(state.activeOrder?.customerName).toBe(testEmoji);
    });
  });

  // ============================================================================
  // Processing Logic Tests (BT-007)
  // ============================================================================

  describe('Processing Logic - Speed Multipliers (BT-007)', () => {
    it('should apply speed multiplier to reduce processing time', () => {
      const engine = createEngineWithMoney(1000);

      // Lock cooler to ensure single-station recipes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine as any).state.stations.get('cooler').unlocked = false;

      // Upgrade bagelCase equipment to level 2
      engine.upgradeStation('bagelCase', 'equipment');

      // Add customer and take order
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine as any).state.customerQueue.push('😀');
      engine.takeOrder();

      const order = engine.getState().activeOrder;
      expect(order).not.toBeNull();

      if (order) {
        const baseTime = order.foodRecipe.baseTime;
        // Speed multiplier for level 2: 1 + (2 - 1) * 0.25 = 1.25
        // Expected time: baseTime / 1.25
        const expectedTime = baseTime / 1.25;

        expect(order.totalTime).toBeCloseTo(expectedTime, 1);
      }
    });

    it('should apply different speed multipliers for different equipment levels', () => {
      const testCases = [
        { level: 1, multiplier: 1.0 },   // 1 + (1-1) * 0.25 = 1.0
        { level: 2, multiplier: 1.25 },  // 1 + (2-1) * 0.25 = 1.25
        { level: 3, multiplier: 1.5 },   // 1 + (3-1) * 0.25 = 1.5
        { level: 5, multiplier: 2.0 },   // 1 + (5-1) * 0.25 = 2.0
      ];

      testCases.forEach(({ level, multiplier }) => {
        BagelTycoonEngine.resetInstance();

        // Create engine with only bagelCase unlocked
        const initialState = {
          money: 100000,
          stations: new Map([
            ['bagelCase', {
              id: 'bagelCase',
              unlocked: true,
              equipmentLevel: 1,
              qualityLevel: 1,
              storageLevel: 1,
              hasManager: false,
              unlockedIngredients: ['plainBagel'],
            }],
            ['cooler', {
              id: 'cooler',
              unlocked: false,  // Keep cooler locked
              equipmentLevel: 1,
              qualityLevel: 1,
              storageLevel: 1,
              hasManager: false,
              unlockedIngredients: [],
            }],
            ['beverages', {
              id: 'beverages',
              unlocked: false,
              equipmentLevel: 1,
              qualityLevel: 1,
              storageLevel: 1,
              hasManager: false,
              unlockedIngredients: [],
            }],
            ['slicer', {
              id: 'slicer',
              unlocked: false,
              equipmentLevel: 1,
              qualityLevel: 1,
              storageLevel: 1,
              hasManager: false,
              unlockedIngredients: [],
            }],
            ['griddle', {
              id: 'griddle',
              unlocked: false,
              equipmentLevel: 1,
              qualityLevel: 1,
              storageLevel: 1,
              hasManager: false,
              unlockedIngredients: [],
            }],
            ['fryer', {
              id: 'fryer',
              unlocked: false,
              equipmentLevel: 1,
              qualityLevel: 1,
              storageLevel: 1,
              hasManager: false,
              unlockedIngredients: [],
            }],
          ]),
        };
        const engine = BagelTycoonEngine.getInstance(initialState as any);

        // Upgrade bagelCase to target level
        for (let i = 1; i < level; i++) {
          const success = engine.upgradeStation('bagelCase', 'equipment');
          expect(success).toBe(true);
        }

        // Verify equipment level
        const state = engine.getState();
        expect(getStations(state).bagelCase.equipmentLevel).toBe(level);

        // Add customer and take order
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.customerQueue.push('😀');
        const orderTaken = engine.takeOrder();
        expect(orderTaken).toBe(true);

        const order = engine.getState().activeOrder;
        expect(order).not.toBeNull();

        if (order) {
          const baseTime = order.foodRecipe.baseTime;
          const expectedTime = baseTime / multiplier;
          expect(order.totalTime).toBeCloseTo(expectedTime, 1);
        }
      });
    });

    it('should apply speed multiplier per station for multi-station recipes', () => {
      const engine = createEngineWithMoney(100000);

      // Upgrade bagelCase to level 2 (multiplier 1.25)
      engine.upgradeStation('bagelCase', 'equipment');
      // Upgrade cooler to level 3 (multiplier 1.5)
      engine.upgradeStation('cooler', 'equipment');
      engine.upgradeStation('cooler', 'equipment');

      // Add customer and take order
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine as any).state.customerQueue.push('😀');
      engine.takeOrder();

      const order = engine.getState().activeOrder;
      expect(order).not.toBeNull();

      if (order) {
        // For multi-station orders without managers, time is sum of station times
        // Each station processes with its own speed multiplier
        const baseTime = order.foodRecipe.baseTime;

        // Without managers, series processing: sum of times per station
        // Expected: baseTime/1.25 + baseTime/1.5 = baseTime * (0.8 + 0.667)
        const expectedTime = baseTime / 1.25 + baseTime / 1.5;

        expect(order.totalTime).toBeCloseTo(expectedTime, 1);
      }
    });
  });

  describe('Processing Logic - Parallel vs Series (BT-007)', () => {
    it('should process in series (sum of times) when no managers are hired', () => {
      const engine = createEngineWithMoney(100000);

      // Unlock slicer to get multi-station orders
      engine.unlockStation('slicer');

      // Take orders until we get one with multiple stations
      let multiStationOrder = null;
      for (let i = 0; i < 50; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.customerQueue.push('😀');
        engine.takeOrder();

        const order = engine.getState().activeOrder;
        if (order && order.foodRecipe.requiredStations.length > 1) {
          multiStationOrder = order;
          break;
        }

        // Clear order for next iteration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.activeOrder = null;
      }

      expect(multiStationOrder).not.toBeNull();

      if (multiStationOrder) {
        // With no managers, should use series processing (sum)
        const baseTime = multiStationOrder.foodRecipe.baseTime;
        const numStations = multiStationOrder.foodRecipe.requiredStations.length;

        // Without equipment upgrades (all level 1), each station takes baseTime
        // Total should be baseTime * numStations
        expect(multiStationOrder.totalTime).toBeCloseTo(baseTime * numStations, 1);
      }
    });

    it('should process in parallel (max time) when all stations have managers', () => {
      const engine = createEngineWithMoney(100000);

      // Hire managers for bagelCase and cooler
      engine.hireManager('bagelCase');
      engine.hireManager('cooler');

      // Add customer and take order (will use bagelCase + cooler)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine as any).state.customerQueue.push('😀');
      engine.takeOrder();

      const order = engine.getState().activeOrder;
      expect(order).not.toBeNull();

      if (order && order.foodRecipe.requiredStations.length > 1) {
        // With all managers, should use parallel processing (max)
        const baseTime = order.foodRecipe.baseTime;

        // All equipment level 1, so max time should be baseTime (not sum)
        expect(order.totalTime).toBeCloseTo(baseTime, 1);
      }
    });

    it('should process in series when any station lacks a manager', () => {
      const engine = createEngineWithMoney(100000);

      // Hire manager only for bagelCase, not for cooler
      engine.hireManager('bagelCase');

      // Take order with multiple stations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine as any).state.customerQueue.push('😀');
      engine.takeOrder();

      const order = engine.getState().activeOrder;
      expect(order).not.toBeNull();

      if (order && order.foodRecipe.requiredStations.length > 1) {
        // With any station lacking a manager, should use series processing
        const baseTime = order.foodRecipe.baseTime;
        const numStations = order.foodRecipe.requiredStations.length;

        // Should be sum (series), not max (parallel)
        expect(order.totalTime).toBeCloseTo(baseTime * numStations, 1);
      }
    });

    it('should handle parallel processing with beverages correctly', () => {
      const engine = createEngineWithMoney(100000);

      // Unlock beverages and hire managers for all stations
      engine.unlockStation('beverages');
      engine.hireManager('bagelCase');
      engine.hireManager('cooler');
      engine.hireManager('beverages');

      // Take orders until we get one with beverage
      let orderWithBeverage = null;
      for (let i = 0; i < 50; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.customerQueue.push('😀');
        engine.takeOrder();

        const order = engine.getState().activeOrder;
        if (order?.beverageRecipe) {
          orderWithBeverage = order;
          break;
        }

        // Clear order for next iteration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.activeOrder = null;
      }

      expect(orderWithBeverage).not.toBeNull();

      if (orderWithBeverage) {
        // With all managers, should use parallel (max time)
        const foodTime = orderWithBeverage.foodRecipe.baseTime;
        const beverageTime = orderWithBeverage.beverageRecipe?.baseTime ?? 0;
        const expectedTime = Math.max(foodTime, beverageTime);

        expect(orderWithBeverage.totalTime).toBeCloseTo(expectedTime, 1);
      }
    });

    it('should handle series processing with beverages correctly', () => {
      const engine = createEngineWithMoney(100000);

      // Unlock beverages but don't hire any managers
      engine.unlockStation('beverages');

      // Take orders until we get one with beverage
      let orderWithBeverage = null;
      for (let i = 0; i < 50; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.customerQueue.push('😀');
        engine.takeOrder();

        const order = engine.getState().activeOrder;
        if (order?.beverageRecipe) {
          orderWithBeverage = order;
          break;
        }

        // Clear order for next iteration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (engine as any).state.activeOrder = null;
      }

      expect(orderWithBeverage).not.toBeNull();

      if (orderWithBeverage) {
        // Without managers, should use series (sum of all station times)
        const foodBaseTime = orderWithBeverage.foodRecipe.baseTime;
        const beverageBaseTime = orderWithBeverage.beverageRecipe?.baseTime ?? 0;
        const foodStations = orderWithBeverage.foodRecipe.requiredStations.length;
        const beverageStations = orderWithBeverage.beverageRecipe?.requiredStations.length ?? 0;

        // Sum of all individual station times
        const expectedTime = foodBaseTime * foodStations + beverageBaseTime * beverageStations;

        expect(orderWithBeverage.totalTime).toBeCloseTo(expectedTime, 1);
      }
    });

    it('should process single-station orders correctly', () => {
      const engine = createEngineWithMoney(100000);

      // Take order with single station (bagelCase only)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine as any).state.customerQueue.push('😀');
      engine.takeOrder();

      const order = engine.getState().activeOrder;
      expect(order).not.toBeNull();

      if (order && order.foodRecipe.requiredStations.length === 1) {
        // Single station order should just use baseTime
        const baseTime = order.foodRecipe.baseTime;
        expect(order.totalTime).toBeCloseTo(baseTime, 1);
      }
    });

    it('should combine speed multipliers with parallel processing', () => {
      const engine = createEngineWithMoney(100000);

      // Upgrade equipment levels
      engine.upgradeStation('bagelCase', 'equipment'); // Level 2: multiplier 1.25
      engine.upgradeStation('cooler', 'equipment'); // Level 2: multiplier 1.25

      // Hire managers for parallel processing
      engine.hireManager('bagelCase');
      engine.hireManager('cooler');

      // Take order
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine as any).state.customerQueue.push('😀');
      engine.takeOrder();

      const order = engine.getState().activeOrder;
      expect(order).not.toBeNull();

      if (order && order.foodRecipe.requiredStations.length > 1) {
        const baseTime = order.foodRecipe.baseTime;

        // With parallel processing and speed multipliers:
        // Each station: baseTime / 1.25
        // Parallel takes max, so: baseTime / 1.25
        const expectedTime = baseTime / 1.25;

        expect(order.totalTime).toBeCloseTo(expectedTime, 1);
      }
    });

    it('should combine speed multipliers with series processing', () => {
      const engine = createEngineWithMoney(100000);

      // Upgrade equipment levels differently for each station
      engine.upgradeStation('bagelCase', 'equipment'); // Level 2: multiplier 1.25
      engine.upgradeStation('cooler', 'equipment'); // Level 2: multiplier 1.25
      engine.upgradeStation('cooler', 'equipment'); // Level 3: multiplier 1.5

      // Don't hire managers - series processing

      // Take order
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (engine as any).state.customerQueue.push('😀');
      engine.takeOrder();

      const order = engine.getState().activeOrder;
      expect(order).not.toBeNull();

      if (order && order.foodRecipe.requiredStations.length > 1) {
        const baseTime = order.foodRecipe.baseTime;

        // With series processing and speed multipliers:
        // bagelCase: baseTime / 1.25
        // cooler: baseTime / 1.5
        // Total: sum of both
        const expectedTime = baseTime / 1.25 + baseTime / 1.5;

        expect(order.totalTime).toBeCloseTo(expectedTime, 1);
      }
    });
  });
});
