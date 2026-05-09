# Feature Request Prompt Template
> Copy this template when asking an AI agent to implement a new feature.
> Fill in every section — partial prompts produce partial implementations.

---

```
## Feature: [Short title, e.g. "Add charging station availability badge"]

### Context
I am working on the hackathon-CAR EV route planner (React + Leaflet frontend,
FastAPI backend). Read AGENT_GUIDELINES.md and tasks/CURRENT_TASK.md before starting.

### What I Want
[Describe the feature from the user's perspective. What should the user be able
to do that they can't do today?]

### Where It Goes
- Frontend component: [e.g., MapView.jsx — add badge to station markers]
- Backend endpoint: [e.g., GET /stations should return availability_count field]
- Data: [e.g., data/ev-stations.raw.json needs an available_slots field]

### Acceptance Criteria
- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]
- [ ] [Specific, testable criterion 3]

### What NOT to Change
- Do not modify [specific file or component]
- Do not change the [specific API shape or contract]
- Keep the change scoped to [specific area]

### Related Files to Read First
- context/ARCHITECTURE.md (component conventions)
- context/API_REFERENCE.md (existing API shape)
- web/src/components/[relevant component].jsx

### Definition of Done
- All acceptance criteria checked
- tasks/DONE.md updated with a one-paragraph summary
- context/API_REFERENCE.md updated if any endpoint changed
- context/ARCHITECTURE.md updated if a new component was created
```
