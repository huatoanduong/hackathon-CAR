# AGENT_GUIDELINES.md
> **Read this first.** Every AI agent working in this repository must read this file before touching any code.

---

## 1. Who This File Is For

This file is for AI coding agents (Claude, GPT-4, Cursor, Devin, Copilot, etc.) working on the **hackathon-CAR** EV Route Planner project. It defines how agents should orient themselves, navigate the repo, make changes, and hand off context.

---

## 2. Project in One Sentence

An interactive web application that helps electric vehicle drivers plan optimal routes with charging stops, built with React + Leaflet on the frontend and a Python/FastAPI backend.

---

## 3. Mandatory Reading Order (Cold Start)

When starting a new session with zero context, read these files in order:

```
1. README.md                    ← project summary, tech stack, how to run
2. SYSTEM_OVERVIEW.md           ← architecture, data flow, key decisions
3. context/ARCHITECTURE.md      ← component map, folder purposes, conventions
4. tasks/CURRENT_TASK.md        ← what is actively being worked on RIGHT NOW
5. agent_memory/KNOWN_ISSUES.md ← gotchas, broken things, workarounds
```

Only after reading all five files above should you begin writing code.

---

## 4. Repository Navigation Map

```
hackathon-CAR/
│
├── AGENT_GUIDELINES.md     ← YOU ARE HERE — read first
├── SYSTEM_OVERVIEW.md      ← architecture & data flow
├── README.md               ← human-facing project overview
│
├── context/                ← static project knowledge (rarely changes)
│   ├── ARCHITECTURE.md     ← component structure, file conventions
│   ├── API_REFERENCE.md    ← all API endpoints, request/response shapes
│   └── DECISIONS.md        ← Architecture Decision Records (ADRs)
│
├── tasks/                  ← task tracking (update every session)
│   ├── CURRENT_TASK.md     ← the ONE thing being worked on now
│   ├── BACKLOG.md          ← prioritized list of future work
│   └── DONE.md             ← completed work log
│
├── agent_memory/           ← persistent cross-session agent knowledge
│   ├── KNOWN_ISSUES.md     ← bugs, gotchas, broken things
│   └── PROGRESS.md         ← what has been built, what hasn't
│
├── prompts/                ← reusable prompt templates for common tasks
│   ├── feature_request.md
│   ├── bug_report.md
│   └── code_review.md
│
├── docs/                   ← operational documentation
│   ├── SETUP.md            ← dev environment setup
│   └── DEPLOYMENT.md       ← how to build and deploy
│
├── web/                    ← React frontend application (primary codebase)
│   ├── src/
│   │   ├── components/     ← UI components (MapView, ControlPanel, etc.)
│   │   ├── services/       ← API client (api.js)
│   │   └── App.jsx         ← root component, layout, state
│   ├── Dockerfile
│   └── vite.config.js
│
├── data/                   ← EV station datasets (read-only, do not modify)
├── scripts/                ← utility scripts (data fetching, preprocessing)
└── plan/                   ← planning artifacts (diagrams, rough notes)
```

---

## 5. Task Lifecycle Protocol

Every agent session MUST follow this protocol:

### 5.1 Session Start
```
[ ] Read mandatory files (section 3 above)
[ ] Read tasks/CURRENT_TASK.md — understand what is in progress
[ ] Read agent_memory/KNOWN_ISSUES.md — check for relevant blockers
[ ] Confirm the task scope with the user before writing any code
```

### 5.2 During Work
```
[ ] Make the smallest change that solves the problem — no scope creep
[ ] After each meaningful change, note it in tasks/CURRENT_TASK.md
[ ] If you discover a bug unrelated to your task, log it in agent_memory/KNOWN_ISSUES.md
[ ] If you make an architectural decision, add an ADR to context/DECISIONS.md
```

### 5.3 Session End / Handoff
```
[ ] Update tasks/CURRENT_TASK.md with: what was done, what is left, any blockers
[ ] Move fully completed tasks to tasks/DONE.md
[ ] Update agent_memory/PROGRESS.md with components that are now complete
[ ] If a known issue was fixed, remove or resolve it in agent_memory/KNOWN_ISSUES.md
[ ] Leave a one-paragraph "handoff note" at the top of tasks/CURRENT_TASK.md
```

---

## 6. Code Conventions

### Frontend (web/src/)
- **Components**: PascalCase filenames (`MapView.jsx`), one component per file
- **Styles**: Co-located CSS files with the same name (`MapView.css`)
- **Services**: camelCase filenames (`api.js`), one concern per file
- **State**: Lifted to `App.jsx` unless truly local to a single component
- **No TypeScript** in this project — plain JSX only

### File Placement Rules
| What | Where |
|------|-------|
| New UI component | `web/src/components/ComponentName.jsx` + `ComponentName.css` |
| API call logic | `web/src/services/api.js` |
| New data file (JSON/CSV) | `data/` — never inside `web/` |
| One-off utility script | `scripts/` |
| Documentation update | `docs/` or the relevant `context/` file |

### What NOT to Do
- Do NOT add `console.log` statements in production code
- Do NOT import data files directly into React components — use the API service
- Do NOT create new top-level folders without documenting them here
- Do NOT modify files in `data/` — treat as read-only ground truth
- Do NOT commit `.env` files or API keys

---

## 7. Testing Approach

- No automated test suite exists yet (as of project start)
- Manual testing: run `npm run dev` in `web/`, test in browser
- When adding tests: place them in `tests/` mirroring the `web/src/` structure

---

## 8. How to Escalate Uncertainty

If you are unsure whether to:
- Delete a file → **don't, log the question in tasks/CURRENT_TASK.md**
- Refactor beyond the task scope → **don't, add to tasks/BACKLOG.md**
- Make an API breaking change → **stop and ask the user**
- Change a decision recorded in context/DECISIONS.md → **add a new ADR, don't overwrite**

---

## 9. Common Mistakes Agents Make (Avoid These)

| Mistake | Why It Hurts | What to Do Instead |
|---------|-------------|-------------------|
| Starting work without reading CURRENT_TASK.md | Duplicates or conflicts with in-progress work | Always read first |
| Adding features beyond the stated task | Creates unreviewed, untested surface area | Scope strictly, log extras to BACKLOG |
| Silently fixing bugs in other files | Hides changes, breaks reviewer trust | Log in KNOWN_ISSUES or ask first |
| Writing verbose comments explaining what code does | Comments rot; code should be self-documenting | Comment only non-obvious WHY |
| Creating new folders without documenting them | Future agents can't navigate | Update this file if you add a folder |
| Assuming the last AI session's code was correct | Agents make mistakes | Verify by reading the actual file |

---

## 10. Agent Memory System

Agents should maintain state across sessions using these files:

| File | What to Store | Update Frequency |
|------|--------------|-----------------|
| `tasks/CURRENT_TASK.md` | Active work, blockers, next steps | Every session |
| `tasks/DONE.md` | Completed features with brief description | When task finishes |
| `agent_memory/KNOWN_ISSUES.md` | Bugs, broken things, workarounds | When discovered/fixed |
| `agent_memory/PROGRESS.md` | What is built vs. not yet built | Weekly or per milestone |
| `context/DECISIONS.md` | Architecture choices with rationale | When a decision is made |

---

*Last updated: 2026-05-09 | Maintained by: development team*
