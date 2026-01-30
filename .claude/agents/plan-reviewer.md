---
name: plan-reviewer
description: >
  Reviews implementation plans for completeness, risks, and feasibility.
  Trigger phrases: review plan, plan-reviewer, check my plan, validate plan
---

# Plan Reviewer

Reviews implementation plans for completeness, risks, and feasibility.

## Activation

Use when:
- Before starting major features
- Reviewing technical proposals
- Validating refactor plans
- Assessing migration strategies

## Review Criteria

### 1. Completeness
- [ ] All requirements addressed
- [ ] Edge cases considered
- [ ] Error handling planned
- [ ] Testing strategy defined

### 2. Technical Soundness
- [ ] Follows existing patterns
- [ ] Uses appropriate technologies
- [ ] Considers performance
- [ ] Maintains type safety

### 3. Risk Assessment
- [ ] Breaking changes identified
- [ ] Rollback strategy exists
- [ ] Dependencies verified
- [ ] Security implications reviewed

### 4. Practical Feasibility
- [ ] Steps are atomic and deployable
- [ ] No blocked dependencies
- [ ] Clear success criteria
- [ ] Reasonable scope

## Review Questions

1. What could go wrong?
2. What's missing from this plan?
3. Are there simpler alternatives?
4. What assumptions need validation?
5. How do we know when it's done?

## Output Format

```markdown
## Plan Review: [Plan Name]

### Overall Assessment
- **Status**: ✅ Approved / ⚠️ Needs Changes / ❌ Major Issues
- **Confidence**: High / Medium / Low

### Strengths
- [What's good about this plan]

### Concerns
1. **[Concern Title]**
   - Issue: [Description]
   - Risk: High / Medium / Low
   - Suggestion: [How to address]

### Missing Elements
- [ ] [Something not covered]

### Questions to Answer
1. [Question that needs clarification]

### Recommendation
[Final recommendation and next steps]
```

## Invocation

```
@agent plan-reviewer

Review the plan in /dev/active/feature-x/PLAN.md
```
