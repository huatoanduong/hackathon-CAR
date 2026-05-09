# Code Review Prompt Template
> Use this to ask an AI agent to review a specific file or set of changes.

---

```
## Code Review: [Short title, e.g. "Review new RoutePlannerWorkspace component"]

### Context
I am working on the hackathon-CAR EV route planner. Review the following against
the conventions in context/ARCHITECTURE.md and AGENT_GUIDELINES.md.

### Files to Review
- [web/src/components/RoutePlannerWorkspace.jsx]
- [web/src/components/RoutePlannerWorkspace.css]

### What to Check

**Correctness:**
- [ ] Does it handle loading and error states?
- [ ] Are edge cases covered (null data, empty arrays, etc.)?
- [ ] Are any API calls made directly from the component (violation of convention)?

**Code Quality:**
- [ ] Is each component doing exactly one thing?
- [ ] Is state placed at the right level (not too high, not too low)?
- [ ] Are prop types clearly named and consistently used?
- [ ] Is there any duplicated logic that should be extracted?

**Conventions:**
- [ ] Does the file follow the import order in ARCHITECTURE.md?
- [ ] Is the CSS co-located and using kebab-case class names?
- [ ] Are there any console.log() calls left in?
- [ ] Is state being lifted to App.jsx when shared across components?

**Agent-Friendliness:**
- [ ] Would a new agent understand what this component does from the code alone?
- [ ] Are any non-obvious decisions explained with a comment (the WHY, not WHAT)?

### Output Format
For each issue found:
1. File and line number
2. What the issue is
3. Suggested fix (show the code change)

For things done well, note them briefly — don't just list problems.
If you find a bug unrelated to the review scope, add it to agent_memory/KNOWN_ISSUES.md.
```
