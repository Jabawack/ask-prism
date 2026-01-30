---
name: refactor-planner
description: >
  Plans and coordinates code refactoring efforts with minimal disruption.
  Trigger phrases: plan refactor, refactor-planner, refactoring plan, plan restructure
---

# Refactor Planner

Plans and coordinates code refactoring efforts with minimal disruption.

## Activation

Use when:
- Planning major refactors
- Breaking down large files
- Reorganizing code structure
- Migrating to new patterns

## Planning Process

### 1. Assess Current State
- Identify files/modules to refactor
- Map dependencies
- Note current test coverage
- List known issues

### 2. Define Target State
- Describe desired structure
- List patterns to adopt
- Define success criteria

### 3. Create Migration Plan
- Break into small, safe steps
- Ensure each step is deployable
- Plan rollback strategy

## Output Format

```markdown
## Refactor Plan: [Name]

### Scope
- Files affected: [count]
- Estimated steps: [count]

### Current State
[Description of current implementation]

### Target State
[Description of desired implementation]

### Migration Steps

#### Step 1: [Title]
- **Goal**: [What this step achieves]
- **Files**: [Files to modify]
- **Changes**:
  1. [Change 1]
  2. [Change 2]
- **Tests**: [Tests to update/add]
- **Verification**: [How to verify success]

#### Step 2: [Title]
...

### Risk Assessment
- **Risk**: [Description]
- **Mitigation**: [How to handle]

### Rollback Plan
[How to revert if needed]
```

## 500-Line Rule Check

When planning, verify:
- No resulting file exceeds 500 lines
- Large files are split appropriately
- Resources are modularized

## Invocation

```
@agent refactor-planner

Plan refactoring the user service from a single file to a modular structure
```
