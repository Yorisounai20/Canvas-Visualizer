# CanvasVisualizer — Implementation Roadmap (feature/canvas-visualizer-unify)

Goal
- Replace the two existing modes (VisualizerEditor & visualizer-software) with a brand-new unified workspace named CanvasVisualizer.
- Add a conservative PresetManager foundation and a concrete hammerhead demo preset + a wiring/implementation stub so follow-up agents can implement behavior in small, testable PRs.
- Keep the migration safe and reversible via an archive of original files and a runtime feature flag.

Principles
- Small, reviewable PRs that each complete a single vertical slice (UI + wiring + tests).
- Preserve existing behavior as a fallback until parity is validated.
- Provide clear ownerable tasks so agents can pick up specific items.
- Each task must include files to change, acceptance criteria, test steps, and expected output.

Branch & Feature Flag
- Branch: `feature/canvas-visualizer-unify`
- Feature flag (two-layer):
  - Build-time env var: `VITE_USE_UNIFIED_VISUALIZER=true`
  - Runtime override: `localStorage.setItem('unifiedVisualizer', 'true')`
- App entry will select CanvasVisualizer when flag is enabled; otherwise old behavior remains.

Top-level milestones (priority order)
1. Archive & Feature-Flag Wiring (safe baseline)
2. New UI Shell (CanvasVisualizer) + basic CanvasPane & TimelinePane
3. PresetManager skeleton + types + hammerhead.json
4. Implementation stub: `presets/implementations/hammerhead-setup.ts` (registerSetter/registerAction)
5. Wire PresetManager into render loop (camera first) with parity fallback
6. Shape setter implementations and particle action wiring (hammerhead)
7. Automation UI & Preset Library (load JSON presets)
8. Full replacement of legacy per-preset inline logic (gradual)
9. Export validation & deterministic tests
10. Polish, perf, and docs

Milestone 1 — Archive & Flag (small, non-destructive)
- Tasks:
  - T1.1: git mv original files to archive:
    - `src/VisualizerEditor.tsx -> src/archived/VisualizerEditor.tsx.backup`
    - `src/visualizer-software.tsx -> src/archived/visualizer-software.tsx.backup`
  - T1.2: Add feature-flag condition in App entry (e.g., `src/main.tsx` or `src/App.tsx`) to mount `CanvasVisualizer` when enabled.
- Acceptance:
  - With flag off: app behavior unchanged.
  - With flag on: CanvasVisualizer component mounts (initial empty shell) and no console errors.
- Tests:
  - Toggle `localStorage` flag and reload; confirm switching.

Milestone 2 — CanvasVisualizer UI Shell
- Tasks:
  - T2.1: Add new root `src/CanvasVisualizer.tsx` (composes TopBar, LeftToolbox, CanvasPane, TimelinePane, InspectorPane).
  - T2.2: Implement skeleton components under `src/ui/`:
    - `TopBar.tsx`, `LeftToolbox.tsx`, `CanvasPane.tsx`, `TimelinePane.tsx`, `InspectorPane.tsx`
  - T2.3: `CanvasPane` provides `onReady(modulesRoot)` and `onFrame(t, audioSnapshot)` hooks.
- Acceptance:
  - CanvasVisualizer renders with new UI skeleton.
  - `CanvasPane` can emit `onReady` (mockable) and `onFrame`.
- Tests:
  - Mount CanvasVisualizer with a mock CanvasPane that calls `onReady` and ensure no exceptions.

Milestone 3 — PresetManager + Types + Example Preset
- Tasks:
  - T3.1: Add `src/types/presets.ts` (schema for presets).
  - T3.2: Add `src/presets/PresetManager.ts` (skeleton): `loadPreset`, `loadFromKeyframes`, `evaluate`, `registerSetter`, `registerAction`, `applyResolved`.
  - T3.3: Add `src/presets/hammerhead.json`.
- Acceptance:
  - PresetManager compiles, can load the hammerhead JSON, and `evaluate()` returns a structure: `{ camera?, params: {...}, events? }`.
- Tests:
  - Unit test: load hammerhead.json and call `evaluate(t=1.2, audio=mock)`. Ensure returned object shape is correct.

Milestone 4 — Implementation Stub (handoff file)
- Tasks:
  - T4.1: Add `src/presets/implementations/hammerhead-setup.ts`:
    - Exports a `registerHammerhead(presetManager, modulesRoot)` function that registers setters/actions used by hammerhead preset (with TODOs where exact indices or emitter APIs need verification).
    - Provide clear comments about where to map `obj.cubes`/`obj.octas`/`obj.tetras`.
- Purpose:
  - Serves as the single handoff point for follow-up agents; contains TODOs for exact mapping and defensive checks.
- Acceptance:
  - File is present, documented, and importable without side effects.
- Tests:
  - Import `registerHammerhead` in a test harness to ensure it gracefully no-ops if `modulesRoot` lacks expected structures.

Milestone 5 — Wire PM into Render Loop (camera only, fallback)
- Tasks:
  - T5.1: Add PM instantiation to CanvasVisualizer and pass `modulesRoot` when `CanvasPane.onReady` fires.
  - T5.2: Modify `CanvasPane` render loop to call `pm.evaluate(t, audio)` and `pm.applyResolved(resolved, { t, dt })`.
  - T5.3: Only apply camera results from PM initially; fallback to legacy camera interpolation if PM returns null.
- Acceptance:
  - Camera moves according to PM when preset loaded; otherwise legacy behavior continues.
  - No visible regressions with PM off.
- Tests:
  - Compare camera position for a few timestamps between legacy logic and PM-driven logic for parity.

Milestone 6 — Implement Hammerhead Setters & Actions
- Tasks:
  - T6.1: Implement concrete setter functions in `hammerhead-setup.ts`:
    - Map logical parts to primitive arrays (e.g., tailSegments -> `obj.octas.slice(0,N)`).
    - Setters must accept `(value, ctx)` and only mutate existing objects.
  - T6.2: Register a `particleBurst` action that calls emitter APIs or safe stubs if absent.
- Acceptance:
  - With hammerhead preset loaded and PM active, shapes respond to automations and audioReactive values.
  - Particle bursts trigger when preset events are fired.
- Tests:
  - Manual visual test: scrub timeline and verify the tail wave, forward movement, and burst events.
  - Unit test: call setter functions with a mock `modulesRoot` and verify object fields were mutated.

Milestone 7 — Preset Library & Automation UI
- Tasks:
  - T7.1: Add a small Preset Library panel to load preset JSON files from `src/presets/`.
  - T7.2: Add a basic automation lane UI to create simple two-point automations for a target parameter.
- Acceptance:
  - User can load `hammerhead.json` from the library; the timeline reflects clip boundaries.
  - Changes to automation update PM data (reload or direct mutation).
- Tests:
  - Manual: load preset, edit an automation point, scrub to see changes live.

Milestone 8 — Gradual Replacement of Legacy Logic
- Tasks:
  - T8.1: Replace inline automation & audio modulation logic in archived runtime with calls to PM outputs, one parameter group at a time (camera, then shapes, particles, lights).
  - T8.2: Remove duplication and dead code once parity tests pass.
- Acceptance:
  - All behavior driven by PM; legacy inline functions removed with feature parity confirmed.
- Tests:
  - Regression: Full manual QA pass across major presets (hammerhead, orbit, explosion).

Milestone 9 — Export Validation (deterministic)
- Tasks:
  - T9.1: Ensure PM-driven animations are deterministic (seeded RNG if needed).
  - T9.2: Validate export flow (frame-by-frame rendering) using offline audio analysis or precomputed bands.
- Acceptance:
  - Exported video matches preview frame-accurately for camera and shape animations.
- Tests:
  - Automated script: render N frames for a test preset in preview and export mode and compare pixel or parameter logs for differences.

Milestone 10 — Polish & Documentation
- Tasks:
  - T10.1: Add developer docs (this roadmap plus API reference).
  - T10.2: Performance improvements (cache setters, precompute curves).
  - T10.3: Add end-user docs for the new CanvasVisualizer UI.
- Acceptance:
  - Clean docs, no regressions, and acceptable performance on target hardware.

Task format for agents (pick-and-do)
- Each task should produce:
  1. Small PR (<= ~300 LOC where possible).
  2. Unit tests where feasible.
  3. Clear PR description with testing steps and screenshots/GIF if visual.
  4. Link to this roadmap and to the specific files changed.
- Example assignable work-items:
  - Implement `CanvasPane.onReady` prop and ensure it returns `{ obj, emitters, materials }`.
  - Implement `hammerhead-setup` tail-mutation code for `obj.octas`.
  - Build a small Preset Library UI to list `src/presets/*.json` and load selected preset into PM.
  - Add dot-path fallback resolver in PresetManager for simple setters (e.g., `objects.foo.position.y`).

Developer notes & conventions
- Mutate Three objects via refs (do not store per-frame values in React state).
- Setters signature: `(value: number, ctx: { t: number; dt?: number }) => void`.
- Actions signature: `(args: any, ctx: { t: number }) => void`.
- Avoid allocations in hot paths (reuse typed arrays, cache resolved setter functions).
- Preset JSON schema: follow `src/types/presets.ts`.
- Keep `src/archived/` files until final deprecation; revert via `git mv` if needed.

Testing & QA checklist (PR-level)
- Unit tests: presets schema parsing, PM.evaluate shape, automation evaluation.
- Integration tests:
  - Toggled off: legacy app runs unchanged.
  - Toggled on: CanvasVisualizer mounts and no console errors.
  - PM basic call: `evaluate` returns expected types for several `t` values.
- Manual checks:
  - Scrub timeline to verify camera moves.
  - Trigger event-based particle bursts.
  - Switch presets on timeline; confirm no leftover shapes (shape cleanup behavior).
- Export smoke test:
  - Run export flow for a short segment (with Claude's fix applied separately) and verify no truncated animation.

Rollback & safety
- Revert PR or disable runtime flag to immediately restore prior behavior.
- `src/archived/` contains copies of original modes until final removal.
- Keep PRs small; maintain CI green for type-check and lint.

Handoff points (where future agents pick up)
- `src/presets/implementations/hammerhead-setup.ts` — exact wiring for hammerhead.
- `src/presets/PresetManager.ts` — extend dot-path resolution, curve precomputation, seeded RNG.
- `src/ui/*` — flesh out UI components (curve editor, automation lanes, preset library).
- `CanvasPane` — integrate Three.js scene creation + module refs + render-loop hooks.

Estimated effort (rough)
- M1 (archive & flag): 1–2 hours
- M2 (UI shell): 4–8 hours
- M3 (PresetManager + types + example): 6–12 hours
- M4 (implementation stub): 2–4 hours
- M5–M6 (wiring + hammerhead setters): 8–24 hours (iterative, debugging/visual tuning)
- M7–M10 (UI features, export validation, polish): multi-week depending on scope

Appendix — Useful commands
- Toggle runtime flag:
  - `localStorage.setItem('unifiedVisualizer','true'); location.reload();`
  - `localStorage.removeItem('unifiedVisualizer'); location.reload();`
- Restore archived files:
  - `git mv src/archived/VisualizerEditor.tsx.backup src/VisualizerEditor.tsx`
  - `git mv src/archived/visualizer-software.tsx.backup src/visualizer-software.tsx`
  - Commit & push.

Contact / Next steps
- I will open PR `feature/canvas-visualizer-unify` implementing Option A (new UI shell + PresetManager skeleton + hammerhead setup stub) once you confirm.
- After PR is open I will include the prioritized task list and label tasks in the PR description so agents can claim them.

If you'd like I can now:
- (1) open the PR with the initial files and include this roadmap in the PR body, or
- (2) produce the initial commit patch here for you to review before I create the branch.

Which do you prefer?