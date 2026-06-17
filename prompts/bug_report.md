# Bug Report Prompt Template
> Copy this template when asking an AI agent to diagnose or fix a bug.

---

```
## Bug: [Short title, e.g. "Map doesn't show route polyline after planning"]

### Context
I am working on the hackathon-CAR EV route planner. Read AGENT_GUIDELINES.md
and agent_memory/KNOWN_ISSUES.md before investigating — the issue may already
be documented there.

### What Goes Wrong
[Describe exactly what happens. Be specific about what you see vs. what you expect.]

**Expected:** [What should happen]
**Actual:** [What actually happens]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3 — include specific inputs, clicks, data]

### Environment
- Browser: [Chrome / Firefox / Safari]
- Screen: [desktop / mobile]
- Data: [any specific vehicle, origin, destination that triggers it]

### What I've Already Tried
- [Thing 1 I tried]
- [Thing 2 I tried]

### Relevant Files (Your Best Guess)
- [e.g., web/src/components/MapView.jsx — where the polyline is rendered]
- [e.g., web/src/services/api.js — where the route response is parsed]

### Constraints
- Do not refactor code outside the bug fix
- Do not change the API contract in context/API_REFERENCE.md without asking
- If you discover a related bug, log it in agent_memory/KNOWN_ISSUES.md

### Definition of Done
- Bug no longer reproduces with the steps above
- Root cause is understood and documented
- If the bug was in KNOWN_ISSUES.md, mark it [RESOLVED] with the date
- If the fix introduced a new known issue, add it to KNOWN_ISSUES.md
```
