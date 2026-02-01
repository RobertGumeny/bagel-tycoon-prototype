# BUG REPORT: [Component] - [Brief Title]

**Reported by:** [Agent Name/Human]
**Date:** [YYYY-MM-DD]
**Severity:** [Low | Medium | High | Critical]
**Status:** [❌ OPEN | 🛠 IN_PROGRESS | ✅ FIXED]
**Affected Area:** [File/Method Name]
**Related Task:** [Task ID, e.g., BT-004]

---

## ✅ Fix Summary

_Briefly describe the resolution if the status is FIXED._

- **Implementation:** [e.g., Option 1 (Default handling)]
- **Key Changes:** [e.g., Added null-check in merge logic]
- **Verification:** [e.g., 71 tests passing; added 3 regression tests]

---

## 🔍 The Problem

### **Summary**

Describe what is happening vs. what should happen.

> _Example: mergeWithDefaults() creates an empty Map instead of using defaults when the property is missing._

### **Root Cause**

Explain the "why."

> _Example: `partial.stations || {}` evaluates to an empty object when undefined, overwriting the default Map._

---

## 🛠 How to Reproduce

_Provide a minimal code snippet or steps._

```typescript
// Example:
const engine = BagelTycoonEngine.getInstance({ money: 1000 });
console.log(engine.getState().stations); // Expected: 6, Actual: 0
```

---

## 💡 Proposed Fixes

### **Option 1: [Name] (Recommended)**

- **Code:** [Snippet of the intended fix]
- **Pros:** [e.g., Minimal change, preserves existing behavior]

### **Option 2: [Name]**

- **Code:** [Snippet]
- **Pros/Cons:** [e.g., Over-engineering for current scope]

---

## 🩹 Workarounds

_List any temporary "hacks" used to keep the project moving._

- **Helper:** `createEngineWithMoney()` directly modifies internal state via casting to `any`.
- **Debt:** Update ~50 test calls once the fix is deployed.

---

## 🧪 Testing the Fix

_Specific scenarios to verify the resolution._

1. **Partial State:** Verify money updates without wiping stations.
2. **Full State:** Ensure existing save/load functionality remains intact.

---
