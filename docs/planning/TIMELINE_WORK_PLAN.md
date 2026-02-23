# Scrollable Per‑Track Timeline — Work Plan (chunked)

Reference
- Repo: Yorisounai20/Canvas-Visualizer
- Visual reference: Image 1 (provided by requester)
- Primary targets: `src/components/Timeline/Timeline.tsx`, `src/components/Timeline/WaveformVisualizer.tsx`, `src/visualizer-software.tsx`, `src/visualizer/LayoutShell.tsx`

Purpose
- Replace the existing single-big-waveform UI with a scrollable, per-track timeline GUI that supports horizontal + vertical scrolling, zoom, pan, marquee selection, per-track waveforms, collapsible rows, playhead controls, keyboard stepping, and good performance (virtualization + RAF throttling).
- Implement features incrementally (chunked) so each chunk is reviewable and testable.

How to use this file
- Each numbered "Chunk" below is a self-contained task or group of closely related tasks. Implement chunks in order (1 → 6 recommended). Each chunk includes:
  - Goals & description
  - Files to change
  - Acceptance criteria
  - Tests / checklist
  - Estimated complexity (Low/Medium/High)
- Mark chunks done as you complete or open PRs per chunk.

Chunk 0 — Project & safety (always do first)
- Goal:
  - Add a runtime feature flag so the new timeline can be toggled on/off easily for QA and fallback.
- Files / changes:
  - Introduce a small flags utility (e.g., `src/lib/featureFlags.ts`) or read/write localStorage key `cv_use_scrollable_timeline`.
  - Optionally respect `REACT_APP_USE_NEW_TIMELINE` env var.
- Acceptance:
  - App reads the runtime flag and uses it to choose old vs new timeline implementation.
  - Developer docs/instructions explain how to toggle it.
- Tests:
  - Manual: flip localStorage flag and confirm timeline behavior toggles.
- Complexity: Low

Chunk 1 — Utilities, constants & unit tests
- Goal:
  - Add time/pixel utilities and constants for consistent sizing and math.
- Files to add/edit:
  - `src/components/Timeline/utils.ts`
  - Unit tests under `src/components/Timeline/__tests__/utils.test.ts`
- Include:
  - BASE_PX_PER_SECOND = 40
  - MIN_ZOOM = 0.25, MAX_ZOOM = 4.0
  - timeToPixels(timeSec, pixelsPerSecond)
  - pixelsToTime(px, pixelsPerSecond)
  - formatTime(seconds, fps?)
- Acceptance:
  - Unit tests verify inverse properties and rounding for common values; stepping math covered (frame rounding).
- Tests:
  - `timeToPixels(pixelsToTime(x)) ≈ x`
  - Frame stepping rounding tests (FPS fallback = 30)
- Complexity: Low

Chunk 2 — Core layout & sizing (the scrollable surface)
- Goal:
  - Implement the two-column timeline layout with sticky ruler and sticky left labels.
  - Compute and expose `timelineWidth` = max(duration * pixelsPerSecond, MIN_WIDTH)
- Files to change:
  - `src/components/Timeline/Timeline.tsx` (or add `TimelineV2.tsx` and mount it via feature flag)
  - Update `src/visualizer-software.tsx` (or the code that passes `timeline` prop to `LayoutShell`) to mount new timeline when flag on.
- Acceptance:
  - Left column fixed (240px), right area scrollable with native scrollbars (both axes).
  - Time ruler sticky at top of the scroll container.
  - timelineWidth computed as described and used for content container width.
- Tests / manual:
  - Load audio of 17s → verify ruler shows 0..17s and `timelineWidth` computed.
  - Resize window & zoom states persist/adjust.
- Complexity: Medium

Chunk 3 — Per‑track waveforms & efficient canvas handling
- Goal:
  - Render one WaveformVisualizer per track, each with canvas width = `timelineWidth`.
  - Avoid repeated canvas resets during scroll/zoom: redraw only when audioBuffer or width actually change (debounced).
- Files to change:
  - `src/components/Timeline/WaveformVisualizer.tsx`
  - Timeline component to mount multiple WaveformVisualizer instances
- Acceptance:
  - Per-track stacked waveforms render in alignment.
  - Scrolling horizontally does not force waveform redraws; resizing/zoom triggers a single redraw (debounced).
- Tests:
  - Add / remove audio tracks, verify waveform per track.
  - Zoom in/out once — waveform redraws once per zoom change.
- Complexity: Medium

Chunk 4 — Mouse interactions: pan, zoom, marquee, drag keyframes
- Goal:
  - Implement interactions:
    - Wheel: shift+wheel = zoom centered at mouse; wheel alone = scroll horizontally.
    - Right-click drag = omni-directional pan.
    - Shift + right-click drag = marquee selection (additive by default).
    - Left-click keyframe: select + open/focus Inspector.
    - Left-drag keyframe: horizontal move with RAF-throttled updates; finalize & resort on mouseup.
    - Short right-click (no drag): open context menu (copy, delete, duplicate, rename).
- Implementation details (include in PR):
  - Example wheel zoom pseudocode (keep semantics: preserve mouseTime under cursor)
  - RAF throttling for drag updates
  - Document-level listeners on drag start, removed on drag end
  - Prevent page scroll when over timeline interactions
- Files to change:
  - `src/components/Timeline/Timeline.tsx` (+ possible helper hooks `useDrag`, `useWheelZoom`)
- Acceptance:
  - Wheel & right-click behaviors match spec.
  - Left-drag is smooth; final state applied only at mouseup (no re-sorting during drag).
  - Marquee selection creates/updates selection rectangle, supports additive selection when Shift held.
- Tests:
  - Manual check: drag, zoom, marquee; ensure inspector opens on selection and context menu works.
- Complexity: High

Chunk 5 — Playhead, keyboard stepping & accessibility
- Goal:
  - Implement playhead rendering + behaviors and keyboard stepping:
    - Space toggles play/pause
    - Left/Right = frame step (1/FPS; fallback 30)
    - Shift+Left/Right = 1s; Ctrl/Cmd+Left/Right = 5s
    - PageUp/PageDown = viewport jump
    - Home/End = start/end
  - Auto-scroll playhead to keep it visible during playback and after stepping.
  - Focus scoping: keyboard handlers active only when timeline (or child) has focus.
- Files to change:
  - `src/components/Timeline/Timeline.tsx`
  - Add small `KeyboardShortcuts` helper or local handler in component
- Acceptance:
  - Frame stepping math respects FPS and rounds to nearest frame.
  - After stepping or play, playhead remains visible (scroll into view or center).
- Tests:
  - Unit tests for stepping math.
  - Manual tests for keyboard behavior and focus interactions.
- Complexity: Medium

Chunk 6 — Track rows, naming, collapse, virtualization & persistence
- Goal:
  - Implement row collapse/expand behavior and track naming rules (default auto-name = first keyframe type; rename allowed).
  - Implement row virtualization (react-virtual or react-window) when tracks > 20 OR total keyframes > 500 (configurable threshold).
  - Persist collapsed state and zoom/scroll position per project in localStorage (optional).
- Files to change:
  - `src/components/Timeline/Timeline.tsx`
  - `src/components/Timeline/VirtualizedTrackList.tsx` (new)
- Acceptance:
  - With 4 typical tracks, UI behaves normally. With >20 tracks, only visible rows are mounted.
  - Collapsed rows hide waveform/keyframes and can be toggled.
  - Track rename UI works (double-click or context menu).
- Tests:
  - Manual: simulate 25 tracks and verify virtualization and scroll/interaction.
  - Confirm persistence of collapsed state and zoom across reloads (if implemented).
- Complexity: Medium → High (virtualization integration)

Chunk 7 — PR, docs, tests, and QA checklist
- Goal:
  - Produce PR(s) that are reviewable and incremental:
    - Suggested PR breakdown:
      - PR A (small): utilities + WaveformVisualizer improvements + unit tests.
      - PR B (layout): layout + feature flag + timeline mounting.
      - PR C (interactions): wheel/pan/drag + playhead + keyboard stepping.
      - PR D (virtualization & polish): virtualized rows, collapse, persistence, zoom-to-fit, minimap (optional).
  - Provide PR body with acceptance criteria and manual QA checklist.
- PR content checklist:
  - Summary, motivations, files changed
  - How to enable new timeline (flag)
  - Unit + manual test instructions
  - Screenshots / GIFs for major interactions (zoom, pan, marquee, playhead)
  - Link to Image 1 as visual reference
- Files to update:
  - `TIMELINE_KEYFRAME_MANAGER.md` and/or create `TIMELINE_WORK_PLAN.md` (this file) updated in repo
- Complexity: Low → Medium

Implementation hints & gotchas
- Canvas resizing: setting `canvas.width` resets the bitmap. Debounce canvas size changes and batch redraws when possible.
- Prevent page scroll: call `e.preventDefault()` on wheel when interacting with timeline to stop whole-page scroll.
- RAF: use requestAnimationFrame for high-frequency updates and setState only inside RAF callback.
- Dragging: avoid re-sorting arrays on every intermediate drag update; re-sort on drag end to maintain order.
- Backwards compatibility: preserve keyframe data formats; do not alter serialized project schema unless accompanied by migration notes.

Acceptance Criteria (summary)
- 0..duration ruler reflects audio duration.
- Sticky ruler and sticky left labels remain in view while scrolling.
- Per-track waveforms rendered and aligned across timelineWidth.
- Wheel and right-click behavior implemented as specified.
- Playhead controls + keyboard stepping implemented and tested.
- Virtualization enabled by threshold; performance acceptable for typical usage (4 tracks) and improved for larger usage.
- Unit tests for utils and stepping; no TypeScript build errors.
- Feature flag available (runtime localStorage + optional env var).

PR/branch naming recommendation
- Feature branch examples:
  - `feature/timeline-scrollable`
  - `chore/timeline-utils`
- PR titles:
  - `feat(timeline): add scrollable per-track timeline layout`
  - `refactor(timeline): extract utilities and waveform optimizations`

Acceptance / Delivery checklist (to include in PR)
- [ ] Utilities added + unit tests pass
- [ ] New layout implemented and behind flag
- [ ] Per-track waveforms render and redraw behavior optimized
- [ ] Wheel (zoom/scroll), pan, marquee selection implemented
- [ ] Left-drag keyframe move + inspector integration
- [ ] Playhead, space toggle, keyboard stepping implemented (Home/End, PageUp/PageDown)
- [ ] Virtualization implemented or scaffolded
- [ ] Documentation updated (how to enable flag, how to test)
- [ ] Screenshots + demo instructions added to PR

Notes for reviewer / agent
- If you cannot find a direct import of `Timeline` in `visualizer-software.tsx`, search for the `LayoutShell` usage and the variable passed as `timeline` prop (e.g., `timelinePanelJSX`). The repo contains refactors/backups; prefer the main code path used in `src/visualizer/index.tsx`.
- Use Image 1 as a visual guide for placement, colors, and size relationships.

---

When ready:
- Implement chunk 0 → 1 → 2... in the branch `feature/timeline-scrollable`.
- Create PRs as granular chunks (A/B/C) as suggested above. Include the manual checklist and screenshots.

If you'd like I can:
- Create a GitHub issue body from this plan, or
- Open the branch & PRs for the first chunk (utilities + WaveformVisualizer) if you say “create a pull request” and confirm branch name.

Mark which chunk you want implemented first or say “create PR for chunk 1” and I’ll prepare the PR body & diff instructions.  
```