---
type: research
status: inbox
topic: Deep Engineering Track
created: 2026-05-09
---

# Deep Engineering Track - Ideas

Requirement:

> Build something extremely deep with Engineering prowess.
> Leverage Codex's extreme research capabilities.
> Leverage Codex Auto Runners' massive scalability.
> Show your depth.
> Judges are engineering veterans who could have built complex systems without AI. You will be tested.

## What Judges Probably Care About

The project should not feel like a wrapper around an LLM. It should feel like a serious engineering system where AI enables a scale, feedback loop, or reasoning workflow that would be painful for humans to operate manually.

Strong signals:

- Real architecture, not just prompt chains.
- Hard technical domain with measurable correctness.
- Parallel work orchestration.
- Reproducible evaluation.
- Failure handling.
- Observability.
- Clear tradeoffs.
- Useful output that can be inspected, tested, and challenged.

Weak signals:

- Chatbot UI.
- Generic code generation.
- Vague "AI assistant for X".
- No tests.
- No measurable benchmark.
- No hard systems problem.
- No reason Codex Auto Runners matter.

## North Star

Build a system where Codex is not the product. Codex is the engineering workforce, researcher, test writer, adversary, debugger, and migration assistant operating inside a serious technical pipeline.

The demo should prove:

1. The system can decompose a complex engineering problem.
2. Many agents/runners can safely work in parallel.
3. Outputs are automatically verified.
4. Bad outputs are rejected or repaired.
5. The final result is something a senior engineer respects.

## Idea 1 - Autonomous Legacy System Modernizer

Build a migration engine that takes an old, messy codebase and upgrades it across language, framework, tests, and architecture while preserving behavior.

Examples:

- Python 2 to Python 3.
- AngularJS to modern React.
- Express REST API to typed Fastify/NestJS.
- JavaScript to TypeScript.
- Monolith modules into service boundaries.

Why this is deep:

- Requires static analysis, dynamic tests, dependency analysis, codemods, semantic preservation, and incremental verification.
- Veterans know migrations are painful because correctness is hidden in behavior, not syntax.
- Auto Runners matter because each module can be migrated, tested, reviewed, and repaired independently.

System architecture:

- Codebase ingestor builds dependency graph.
- Baseline behavior recorder captures test output, API responses, golden files, and runtime traces.
- Planner splits migration into safe work units.
- Codex runners migrate independent modules.
- Verification runners run tests, diff behavior, fuzz endpoints, and inspect type errors.
- Review runners critique patches.
- Merge coordinator accepts only changes that satisfy gates.

Demo:

- Start with an intentionally ugly legacy app.
- Show dependency graph and migration plan.
- Run parallel agents across modules.
- Show failed migrations being rejected.
- Show final app passing old behavior tests and new type checks.

Judge test points:

- "How do you know behavior is preserved?"
- "What happens when two agents edit related files?"
- "How do you prevent broad rewrites?"
- "How does rollback work?"

Depth enhancers:

- Add mutation testing.
- Add API contract replay.
- Add semantic diff summaries.
- Add per-runner ownership boundaries.
- Add confidence scoring per file.

## Idea 2 - Distributed Research-to-Implementation Engine

Build a system that researches a technical topic, extracts algorithms from papers/docs, implements competing variants, benchmarks them, and produces a verified engineering report.

Example domains:

- Vector index algorithms.
- Cache eviction policies.
- CRDT implementations.
- Rate limiter algorithms.
- SAT solver heuristics.
- Transaction isolation simulators.

Why this is deep:

- Combines research, implementation, benchmarking, and adversarial testing.
- Shows Codex as a scalable research and engineering lab.
- Judges can inspect whether claims are backed by code and measurements.

System architecture:

- Research planner creates questions and source targets.
- Research runners summarize primary sources.
- Implementation runners build variants behind one interface.
- Test runners generate unit, property, fuzz, and benchmark tests.
- Adversarial runners search for edge cases.
- Report generator links claims to benchmark data and source material.

Demo:

- Pick one hard topic: CRDT text editing, LSM tree compaction, or consistent hashing.
- Generate 3-5 implementations.
- Benchmark across workloads.
- Show where each implementation fails or wins.
- Produce a final engineering decision memo.

Judge test points:

- "Can I reproduce your benchmark?"
- "Are your workloads realistic?"
- "Did the system discover a non-obvious tradeoff?"
- "What assumptions did the research agents get wrong?"

Depth enhancers:

- Use property-based testing.
- Add benchmark variance analysis.
- Track citations to specific claims.
- Produce flamegraphs or perf traces.
- Include a "failed approaches" appendix.

## Idea 3 - Multi-Agent Kernel Bug Triage and Patch Lab

Build an automated lab that ingests real low-level bug reports, reproduces failures, bisects commits, proposes patches, and validates fixes in isolated runners.

Scope can be narrowed to:

- A toy operating system.
- A database storage engine.
- A networking stack simulator.
- A filesystem implementation.
- A WebAssembly runtime.

Why this is deep:

- Low-level debugging is hard.
- Reproduction and minimization are engineering-heavy.
- It requires observability, isolation, deterministic test harnesses, and patch validation.

System architecture:

- Bug report parser extracts symptoms and reproduction hints.
- Reproduction runner creates failing test.
- Minimizer reduces failure case.
- Bisect runner identifies suspicious change.
- Patch runners propose independent fixes.
- Verification runners run regression, fuzz, and stress tests.
- Arbiter selects patch with best correctness/minimality tradeoff.

Demo:

- Seed 5-10 real bugs into a systems project.
- Show the lab reproducing failures.
- Show one bug minimized from complex scenario to tiny test.
- Show multiple patches rejected.
- Show final patch with regression test.

Judge test points:

- "Could this patch hide the bug instead of fixing it?"
- "What does the minimized repro prove?"
- "How do you handle nondeterminism?"
- "How do you keep runners isolated?"

Depth enhancers:

- Deterministic replay.
- Sanitizer integration.
- Coverage-guided fuzzing.
- Crash deduplication.
- Patch minimality scoring.

## Idea 4 - Auto-Scaling Formal Spec and Test Generator

Build a tool that reads an implementation, infers or drafts a formal-ish specification, then generates tests, fuzzers, and model-checking scenarios to find correctness gaps.

Good target systems:

- Distributed lock service.
- Job queue.
- Cache with TTL and invalidation.
- Payment state machine.
- Collaborative document state.
- Retry/backoff scheduler.

Why this is deep:

- Senior engineers respect specification work because it finds bugs normal tests miss.
- Codex research can study known failure modes.
- Auto Runners can generate and test many state-machine scenarios.

System architecture:

- Code analyzer extracts state transitions and invariants.
- Spec drafter creates TLA+/PlusCal-like or executable model.
- Scenario runners generate histories.
- Implementation runner executes same histories against real code.
- Differential checker compares model vs implementation.
- Repair runners propose code or spec fixes.

Demo:

- Build a distributed job queue with retries, leases, cancellation, and worker crashes.
- Ask system to infer invariants.
- Run generated histories.
- Find a real bug, such as double execution, lost job, or stuck lease.
- Patch and prove with replay.

Judge test points:

- "What is the boundary between inferred spec and intended behavior?"
- "How do you avoid testing the implementation against itself?"
- "Can the model expose bugs humans missed?"
- "How do you shrink failing histories?"

Depth enhancers:

- Add linearizability checking.
- Add Jepsen-style history generation.
- Add property shrinking.
- Add visual state graph.
- Add invariant confidence levels.

## Idea 5 - Software Archaeology and Architecture Recovery System

Build a system that ingests an unknown large codebase and reconstructs the architecture: domains, dependencies, data flows, hidden contracts, risky modules, and refactor plan.

Why this is deep:

- Understanding unknown systems is one of the hardest senior engineering tasks.
- It is not enough to summarize files. The system must build a defensible model.
- Codex runners can inspect slices of the codebase in parallel and reconcile findings.

System architecture:

- Static analyzer extracts imports, call graph, data models, config, routes, and ownership clues.
- Explorer runners investigate subsystems.
- Contradiction detector finds conflicting claims.
- Architecture graph builder creates bounded contexts and dependency layers.
- Risk model scores modules by churn, complexity, test coverage, and centrality.
- Refactor planner proposes staged interventions.

Demo:

- Use a real open-source project with nontrivial size.
- Hide the README from the system at first.
- Ask it to reconstruct architecture.
- Compare against actual docs.
- Generate a refactor plan and verify with small patches.

Judge test points:

- "How do you know this architecture map is not hallucinated?"
- "Can I click from every claim to evidence?"
- "Does it distinguish runtime dependency from import dependency?"
- "Can it find hidden coupling?"

Depth enhancers:

- Evidence-linked claims.
- Confidence scoring.
- Contradiction resolution.
- Graph visualization.
- Change impact simulator.

## Idea 6 - Autonomous Database Internals Lab

Build a mini database engine and use Codex runners to research, implement, benchmark, and evolve core internals.

Possible features:

- WAL.
- B+ tree.
- LSM tree.
- MVCC.
- Query planner.
- Lock manager.
- Snapshot isolation.
- Crash recovery.

Why this is deep:

- Database internals are a classic engineering credibility domain.
- Correctness is testable through crash simulations, concurrency tests, and consistency checks.
- Auto Runners can explore design alternatives in parallel.

System architecture:

- Core database with pluggable storage/index/concurrency modules.
- Research runners investigate algorithms.
- Implementation runners build alternatives.
- Chaos runners simulate crashes and concurrent transactions.
- Benchmark runners compare throughput, latency, write amplification, and recovery time.
- Report runner explains tradeoffs.

Demo:

- Implement two storage engines: B+ tree and LSM.
- Implement WAL and crash recovery.
- Run random operation histories.
- Kill process mid-write.
- Recover and verify invariants.

Judge test points:

- "What are your durability guarantees?"
- "What isolation level do you actually provide?"
- "What happens during torn writes?"
- "Can your benchmark be trusted?"

Depth enhancers:

- Fault injection.
- Deterministic scheduler.
- Write amplification metrics.
- Page checksum.
- Transaction history checker.

## Idea 7 - Codex Swarm CI: Parallel Code Review, Test, and Repair Platform

Build a CI platform where every pull request is reviewed by a swarm of specialized agents: security, performance, correctness, API compatibility, test quality, maintainability, and documentation.

Why this is deep:

- The value is in orchestration, verification, and conflict resolution.
- Veteran judges know code review is contextual and hard.
- Auto Runners are directly relevant.

System architecture:

- PR ingestor computes changed dependency graph.
- Specialist runners inspect different risk classes.
- Test runners generate targeted tests.
- Patch runners fix narrow issues.
- Arbiter ranks findings by evidence and severity.
- Human-facing report includes proof, repro, and patch.

Demo:

- Create a PR with hidden bugs: race condition, API break, perf regression, security issue, flaky test.
- Show specialist agents finding different classes.
- Show generated failing tests.
- Show auto-repair for some issues.
- Show unresolved issues escalated with evidence.

Judge test points:

- "How do you avoid noisy review comments?"
- "Can findings be reproduced?"
- "What prevents agents from fighting each other?"
- "How do you decide severity?"

Depth enhancers:

- Finding deduplication.
- Evidence-first comments.
- Historical project memory.
- Flake detection.
- Risk-based runner allocation.

## Idea 8 - Production Incident Simulator and Autonomous Runbook Engineer

Build a system that takes a service, injects realistic production incidents, detects symptoms, writes runbooks, and validates recovery playbooks.

Incident types:

- Memory leak.
- Slow dependency.
- Partial outage.
- Queue backlog.
- Bad deploy.
- Database lock contention.
- Retry storm.
- Cache stampede.

Why this is deep:

- Reliability engineering is difficult and respected.
- It combines systems, observability, diagnosis, and operational correctness.
- Codex runners can act as incident commanders, SREs, app engineers, and chaos testers.

System architecture:

- Service sandbox with telemetry.
- Fault injector.
- Detection runner analyzes metrics/logs/traces.
- Diagnosis runners propose root causes.
- Runbook writer creates remediation steps.
- Validation runner executes runbook in fresh incident scenario.
- Postmortem generator writes evidence-based report.

Demo:

- Run a microservice with queue, database, cache, and worker.
- Inject retry storm plus slow DB.
- Show diagnosis from telemetry.
- Generate and execute runbook.
- Verify SLO recovery.

Judge test points:

- "Was the diagnosis causal or just correlated?"
- "Can the runbook make things worse?"
- "How do you validate remediation?"
- "What happens with simultaneous incidents?"

Depth enhancers:

- Trace correlation.
- Blast-radius analysis.
- SLO budget model.
- Automated rollback.
- Incident timeline reconstruction.

## Idea 9 - Compiler Optimization Tournament

Build a small compiler or query optimizer where Codex runners research and implement optimization passes, then a tournament harness validates correctness and performance.

Possible domains:

- SQL query optimizer.
- Bytecode VM optimizer.
- Tensor expression optimizer.
- Regex engine optimizer.
- Graph query planner.

Why this is deep:

- Compilers require correctness-preserving transformation.
- Performance claims can be measured.
- Auto Runners can compete with different optimization strategies.

System architecture:

- Baseline parser/interpreter.
- Optimization pass interface.
- Runner pool proposes passes.
- Equivalence checker validates optimized output.
- Benchmark harness compares workloads.
- Tournament scoreboard tracks wins and regressions.

Demo:

- Build a SQL-like query engine.
- Have agents implement predicate pushdown, projection pruning, join reordering, and index selection.
- Use random query generation to test equivalence.
- Show perf gains with correctness guardrails.

Judge test points:

- "How do you prove optimized results are equivalent?"
- "What workloads did you benchmark?"
- "Can an optimization regress another workload?"
- "How does the tournament prevent overfitting?"

Depth enhancers:

- Cost model learning.
- Random query generator.
- Differential testing against SQLite.
- Plan visualizer.
- Regression corpus.

## Idea 10 - AI-Native Distributed Systems Test Harness

Build a harness that generates distributed systems scenarios, executes them under controlled faults, and asks Codex runners to explain, fix, and harden the system.

Target systems:

- Raft implementation.
- Distributed cache.
- Leader election.
- Replicated queue.
- Gossip membership.
- Idempotent payment processing.

Why this is deep:

- Distributed systems fail in subtle interleavings.
- Codex research can study protocol invariants.
- Auto Runners can explore many schedules and fault combinations.

System architecture:

- Deterministic scheduler.
- Network partition simulator.
- Clock skew simulator.
- Node crash/restart simulator.
- History recorder.
- Invariant checker.
- Agent repair loop.

Demo:

- Implement a small Raft or leader election system.
- Inject partitions and crashes.
- Find split-brain or lost update.
- Generate minimal counterexample.
- Patch and verify across larger fault matrix.

Judge test points:

- "Is your scheduler deterministic?"
- "Can you replay the failure exactly?"
- "What invariants are checked?"
- "How do you distinguish liveness from safety?"

Depth enhancers:

- Lineage-driven fault injection.
- Minimal failing schedule shrinker.
- Protocol invariant dashboard.
- Model vs implementation differential checking.
- Long-running soak tests.

## Best Bets

Top 3 for maximum engineering credibility:

1. **AI-Native Distributed Systems Test Harness**
   - Highest depth.
   - Hard to fake.
   - Great judge challenge surface.
   - Strong use of Auto Runners for schedule and fault exploration.

2. **Autonomous Database Internals Lab**
   - Extremely respected domain.
   - Easy to demo correctness and performance.
   - Strong combination of research, implementation, and testing.

3. **Auto-Scaling Formal Spec and Test Generator**
   - Elegant and defensible.
   - Shows deep reasoning instead of flashy UI.
   - Can find real bugs in stateful systems.

Most practical to build in limited time:

1. **Codex Swarm CI**
2. **Production Incident Simulator**
3. **Research-to-Implementation Engine**

Most impressive if executed well:

1. **Distributed Systems Test Harness**
2. **Database Internals Lab**
3. **Legacy System Modernizer**

## Recommended Project

Build **Codex Fault Lab**:

> A multi-agent engineering lab that researches distributed systems failure modes, generates deterministic fault schedules, finds invariant violations in a real implementation, shrinks failures into minimal counterexamples, and coordinates Codex runners to patch and verify the system.

Target implementation:

- Start with a replicated job queue or leader election service, not full Raft unless there is enough time.
- Include a deterministic scheduler.
- Include message delay/drop/reorder.
- Include node crash/restart.
- Include invariant checks.
- Include replayable failure histories.
- Include agent-generated patches.

Core invariants:

- No two leaders in same term.
- No acknowledged job is lost.
- A job is not completed twice.
- Lease expires before reassignment.
- State converges after partition heals.

Why this satisfies the requirement:

- **Extreme research:** agents gather and summarize failure modes from distributed systems literature, Jepsen-style testing, Raft invariants, queue semantics, and fault injection.
- **Massive scalability:** runners explore schedules, partitions, crash points, and repair candidates in parallel.
- **Engineering depth:** deterministic replay, invariant checking, counterexample shrinking, fault injection, CI gating, and patch arbitration.
- **Judge-resistant:** every claim can be tested by replaying the failure history.

## Demo Script

1. Show the system under test: a replicated queue or leader election service.
2. Show invariants in code.
3. Launch the fault matrix.
4. Runners explore schedules in parallel.
5. A failing history is found.
6. The system shrinks the failure from many events to a minimal trace.
7. Codex runners propose competing fixes.
8. Verification runners reject weak patches.
9. Accepted patch passes replay, randomized fault tests, and regression suite.
10. Final report explains root cause, fix, proof, and remaining risks.

## Concrete Build Plan

Phase 1 - Core simulation:

- Implement deterministic event loop.
- Implement nodes, messages, timers, and persistent state.
- Implement network faults: drop, delay, duplicate, reorder, partition.
- Implement crash and restart.

Phase 2 - System under test:

- Implement replicated queue or leader election.
- Keep the protocol small enough to understand.
- Intentionally seed 2-3 realistic bugs.

Phase 3 - Invariant engine:

- Define safety properties.
- Record every event.
- Fail fast when invariant breaks.
- Serialize history to replay file.

Phase 4 - Search:

- Random schedule generation.
- Seeded reproducibility.
- Parallel runners.
- Coverage tracking.

Phase 5 - Shrinking:

- Remove irrelevant events.
- Reduce nodes.
- Reduce messages.
- Preserve failure.

Phase 6 - Codex repair loop:

- Assign one runner per suspected subsystem.
- Generate patch plus regression test.
- Verify patch against replay.
- Run broader fault suite.
- Compare patches.

Phase 7 - Presentation:

- Web dashboard or CLI TUI.
- Show current runs, found failures, minimized traces, accepted patches.
- Generate final engineering report.

## What To Avoid

- Do not build a generic agent dashboard.
- Do not make the UI the main artifact.
- Do not rely on subjective judge trust.
- Do not claim formal proof unless there is actual model checking.
- Do not hide failures; show failed patches and why they failed.
- Do not overbuild full distributed consensus if time is limited.

## Strong One-Liner

Codex Fault Lab turns Codex Auto Runners into a distributed systems test organization: researchers identify known failure modes, runners explore thousands of deterministic fault schedules, and repair agents produce patches that must survive replayable counterexamples before they are accepted.

## Possible Naming

- Codex Fault Lab
- Counterexample Foundry
- SwarmCheck
- Invariant Forge
- Codex Jepsen Lab
- Failure Atlas
- ReplayOps
- FaultSmith

