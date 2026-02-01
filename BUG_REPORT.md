# Bug Report: mergeWithDefaults Creates Empty Stations Map

**Reported by:** Claude Sonnet 4.5
**Date:** 2026-02-01
**Fixed Date:** 2026-02-01
**Severity:** Medium
**Status:** ✅ FIXED
**Affected File:** `src/engine/BagelTycoonEngine.ts`
**Affected Method:** `mergeWithDefaults()`
**Related Task:** BT-004 (Unit Tests for Engine Core)
**Fix Branch:** `fix/BUG-1-mergeWithDefaults-empty-stations`

---

## ✅ Fix Summary

**Implementation:** Option 1 (Use Default Stations When Partial Has None)

**Changes Made:**
1. Modified `mergeWithDefaults()` in `src/engine/BagelTycoonEngine.ts` (lines 172-185)
2. Added conditional check: only convert `partial.stations` if it exists, otherwise use `defaults.stations`
3. Added 3 regression tests in `src/engine/BagelTycoonEngine.test.ts`

**Test Results:**
- ✅ All 71 unit tests passing
- ✅ Regression tests verify partial state initialization works correctly
- ✅ No breaking changes to existing functionality

**Code Change:**
```typescript
// Before (buggy):
const stations = partial.stations instanceof Map
  ? partial.stations
  : new Map(Object.entries(partial.stations || {}) as [string, StationState][]);

// After (fixed):
const stations = partial.stations
  ? (partial.stations instanceof Map
      ? partial.stations
      : new Map(Object.entries(partial.stations) as [string, StationState][]))
  : defaults.stations;
```

---

## Summary

The `mergeWithDefaults()` method in `BagelTycoonEngine` incorrectly creates an empty `stations` Map when provided with a partial `GameState` that doesn't include the `stations` property. This prevents proper initialization of engine instances with partial state for testing purposes.

---

## Location

**File:** `src/engine/BagelTycoonEngine.ts`
**Lines:** 172-185
**Method:** `private mergeWithDefaults(partial: Partial<GameState>): GameState`

### Current Implementation

```typescript
private mergeWithDefaults(partial: Partial<GameState>): GameState {
  const defaults = this.initializeDefaultState();

  // Convert stations object back to Map if needed
  const stations = partial.stations instanceof Map
    ? partial.stations
    : new Map(Object.entries(partial.stations || {}) as [string, StationState][]);

  return {
    ...defaults,
    ...partial,
    stations,
  };
}
```

---

## Problem Description

### Root Cause

When `partial.stations` is `undefined` (i.e., not provided in the partial state), the current logic evaluates:

```typescript
new Map(Object.entries(partial.stations || {}) as [string, StationState][])
// Becomes: new Map(Object.entries({}))
// Results in: new Map() (empty Map)
```

This empty Map then **overwrites** the properly initialized `defaults.stations` in the return statement:

```typescript
return {
  ...defaults,      // Has properly initialized stations Map
  ...partial,       // Spreads partial properties (e.g., money: 1000)
  stations,         // OVERWRITES with empty Map!
};
```

### Impact

1. **Testing**: Cannot easily create engine instances with custom money/properties for tests
2. **State Loading**: May cause issues if saved states are incomplete or corrupted
3. **Future Features**: Limits ability to partially update state from external sources

---

## How to Reproduce

```typescript
// This should work but doesn't:
const engine = BagelTycoonEngine.getInstance({ money: 1000 });
const state = engine.getState();

// Expected: state.stations should have all 6 stations initialized
// Actual: state.stations is an empty object {}

// Attempting to use the engine fails:
engine.unlockStation('beverages');
// Error: "Station not found: beverages"
```

### Why This Happens

1. `getInstance({ money: 1000 })` calls `new BagelTycoonEngine({ money: 1000 })`
2. Constructor calls `mergeWithDefaults({ money: 1000 })`
3. `partial.stations` is `undefined`
4. Method creates empty Map: `new Map(Object.entries({}))`
5. Return statement overwrites `defaults.stations` with empty Map
6. Engine initializes with no stations

---

## Proposed Fix

### Option 1: Use Default Stations When Partial Has None (Recommended)

```typescript
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
```

**Pros:**
- Minimal change
- Preserves existing behavior when stations are provided
- Allows partial state without stations property

**Cons:**
- None identified

### Option 2: Deep Merge Stations

```typescript
private mergeWithDefaults(partial: Partial<GameState>): GameState {
  const defaults = this.initializeDefaultState();

  let stations = defaults.stations;

  if (partial.stations) {
    const partialStations = partial.stations instanceof Map
      ? partial.stations
      : new Map(Object.entries(partial.stations) as [string, StationState][]);

    // Merge partial stations into defaults
    partialStations.forEach((stationState, stationId) => {
      stations.set(stationId, stationState);
    });
  }

  return {
    ...defaults,
    ...partial,
    stations,
  };
}
```

**Pros:**
- Allows partial station updates
- More flexible for future use cases

**Cons:**
- More complex
- May not be needed for current use cases

### Recommendation

**Use Option 1.** It's simple, fixes the bug, and doesn't change existing behavior. Option 2 is over-engineering for the current needs.

---

## Workarounds Used in Tests

To work around this bug during BT-004, I implemented helper functions that directly modify the engine's internal state using TypeScript reflection:

### Helper Functions Created

```typescript
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
```

### Tests Using Workarounds

The following tests should be updated once the bug is fixed:

**File:** `src/engine/BagelTycoonEngine.test.ts`

1. **All tests using `createEngineWithMoney()`** (approximately 40 tests)
   - Station unlocking tests
   - Station upgrade tests (equipment, quality, storage)
   - Manager hiring tests
   - Ingredient unlocking tests
   - Automation tests (register manager, second register)
   - Cost calculation tests

2. **All tests using `createEngineWithQueue()`** (4 tests)
   - Order management tests
   - Queue behavior tests (FIFO, etc.)

### How to Update Tests After Fix

Once the bug is fixed, these helpers can be removed and tests can use the cleaner pattern:

```typescript
// BEFORE (current workaround):
const engine = createEngineWithMoney(1000);

// AFTER (once bug is fixed):
BagelTycoonEngine.resetInstance();
const engine = BagelTycoonEngine.getInstance({ money: 1000 });
```

**Search pattern to find all uses:**
```bash
grep -n "createEngineWithMoney\|createEngineWithQueue" src/engine/BagelTycoonEngine.test.ts
```

**Estimated changes:** ~50 test modifications across the file

---

## Additional Notes

### Why This Wasn't Caught Earlier

1. The engine is typically instantiated with no arguments or with full saved state
2. The bug only manifests when using partial state initialization
3. Most common use case (load from localStorage) provides full state including stations

### Related Type Issues

There's also a related TypeScript type mismatch:

- `getState()` returns `Readonly<GameState>` which specifies `stations: Map<string, StationState>`
- But the implementation uses `JSON.parse(JSON.stringify(...))` which converts Maps to plain objects
- At runtime, `state.stations` is actually a plain object, not a Map

This required an additional helper in tests:

```typescript
/**
 * Helper to access stations as a Record (getState returns object, not Map at runtime)
 * TypeScript sees Map but runtime is object due to JSON serialization
 */
function getStations(state: Readonly<GameState>): Record<string, StationState> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return state.stations as any;
}
```

This type issue should also be addressed, possibly by:
1. Fixing `getState()` to return accurate types, OR
2. Converting the plain object back to a Map before returning

---

## Testing the Fix

After implementing the proposed fix, verify with:

```typescript
// Test 1: Partial state with money only
BagelTycoonEngine.resetInstance();
const engine1 = BagelTycoonEngine.getInstance({ money: 1000 });
const state1 = engine1.getState();
expect(Object.keys(state1.stations)).toHaveLength(6); // Should pass
expect(state1.money).toBe(1000); // Should pass

// Test 2: Partial state with custom queue
BagelTycoonEngine.resetInstance();
const engine2 = BagelTycoonEngine.getInstance({
  customerQueue: ['😀', '😎']
});
const state2 = engine2.getState();
expect(Object.keys(state2.stations)).toHaveLength(6); // Should pass
expect(state2.customerQueue).toEqual(['😀', '😎']); // Should pass

// Test 3: Full state (existing behavior should not change)
BagelTycoonEngine.resetInstance();
const defaultEngine = BagelTycoonEngine.getInstance();
const fullState = defaultEngine.getState();
const engine3 = BagelTycoonEngine.getInstance(fullState);
expect(engine3.getState()).toEqual(fullState); // Should pass
```

---

## Estimated Fix Effort

- **Code Change:** 5 minutes (5 lines of code)
- **Testing:** 10 minutes (verify existing tests still pass)
- **Test Cleanup:** 30 minutes (update ~50 test helper calls)
- **Total:** ~45 minutes

---

## Priority

**Medium Priority**

- **Not blocking** current development (workarounds in place)
- **Should be fixed** before EPIC-2 to avoid propagating the workaround pattern
- **Low risk** of breaking existing functionality when fixed properly
- **High benefit** for code cleanliness and future test maintenance

---

## References

- Issue discovered during: BT-004 (Unit Tests for Engine Core)
- Workaround commit: `ce73bcd` on branch `feature/BT-004-engine-tests`
- Test file with workarounds: `src/engine/BagelTycoonEngine.test.ts`
- Lines 18-41 (helper functions)
- Lines throughout file (usage of helpers)
