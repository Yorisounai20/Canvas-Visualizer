# Frame-by-Frame Export: Design Requirement

## ⚠️ CRITICAL DESIGN DECISION ⚠️

### Frame-by-Frame Export is OPTIONAL

The frame-by-frame export system must be implemented as an **optional alternative mode** alongside the existing live recording system.

---

## Implementation Strategy

### Two Export Modes (User Choice)

**Mode 1: Live Recording (Default - Existing)**
- Current MediaRecorder-based system
- Real-time canvas capture at 30 FPS
- Fast for users with good hardware
- Remains the default option

**Mode 2: Frame-by-Frame (Optional - New)**
- Offline rendering using `analyzeAudioForExport`
- Hardware-independent quality
- For users with weak laptops or wanting highest quality
- User explicitly selects this mode

---

## UI Integration Plan

### Export Modal Changes

**Add Mode Selector:**
```tsx
<select value={exportMode} onChange={(e) => setExportMode(e.target.value)}>
  <option value="live">Live Recording (Faster)</option>
  <option value="frame-by-frame">Frame-by-Frame (Better Quality)</option>
</select>
```

**Conditional Workflow:**
```typescript
if (exportMode === 'live') {
  // Use existing exportVideo() function
  await exportVideo();
} else if (exportMode === 'frame-by-frame') {
  // Use new frame-by-frame system
  const frequencyData = await analyzeAudioForExport(audioBuffer);
  await renderFrameByFrame(frequencyData);
}
```

---

## Phase Implementation with Optional Mode

### Phase 1: Audio Pre-Analysis ✅ COMPLETE
- **Status:** Agnostic to mode selection
- **Function:** `analyzeAudioForExport()` is a helper
- **Usage:** Only called when user selects frame-by-frame mode
- **Impact:** Zero impact on existing live recording

### Phase 2: Frame-by-Frame Rendering (UPCOMING)
- **Requirement:** Must check `exportMode` state
- **Implementation:** Only execute if `exportMode === 'frame-by-frame'`
- **Default:** Existing `exportVideo()` continues to work
- **No Breaking Changes:** Live recording unchanged

### Phase 3: UI Integration (UPCOMING)
- **Add:** Export mode selector in VideoExportModal
- **Default:** `exportMode = 'live'` (backward compatible)
- **Option:** User can switch to `'frame-by-frame'`
- **Remember:** User preference in localStorage

---

## Code Structure

### State Variable (To Add in Phase 2/3)
```typescript
const [exportMode, setExportMode] = useState<'live' | 'frame-by-frame'>('live');
```

### Export Dispatcher (To Add in Phase 2/3)
```typescript
const handleExport = async () => {
  if (exportMode === 'live') {
    // Existing functionality - NO CHANGES
    await exportVideo();
  } else {
    // New functionality - ONLY if user selects it
    await exportVideoFrameByFrame();
  }
};
```

### Benefits of Optional Approach

✅ **Backward Compatible**
- Existing users see no change
- Default behavior unchanged
- No breaking changes

✅ **User Choice**
- Users with good hardware: Use fast live recording
- Users with weak hardware: Use reliable frame-by-frame
- Best of both worlds

✅ **Low Risk**
- New code isolated from existing code
- Can disable feature with one state change
- Easy to test and debug

✅ **Gradual Adoption**
- Users can try frame-by-frame without commitment
- Can switch back to live if preferred
- Analytics can track which mode is popular

---

## Validation Checklist for All Phases

Before implementing any phase, verify:

- [ ] Does NOT modify existing live recording code
- [ ] Only executes when `exportMode === 'frame-by-frame'`
- [ ] Default behavior is `exportMode === 'live'`
- [ ] Existing users experience no change
- [ ] UI clearly shows mode selection
- [ ] Can switch between modes freely

---

## Example User Flow

### Scenario 1: User with Good Hardware (Default)
1. Click "Export Video"
2. Modal opens with `exportMode = 'live'` (default)
3. Click "Export Full Video"
4. **Uses existing live recording** ✅
5. Fast, familiar experience

### Scenario 2: User with Weak Laptop (Opt-in)
1. Click "Export Video"
2. Modal opens with `exportMode = 'live'` (default)
3. **User changes to** `exportMode = 'frame-by-frame'`
4. Click "Export Full Video"
5. Sees "Analyzing audio..." progress
6. **Uses new frame-by-frame system** ✅
7. Slower but perfect quality on weak hardware

---

## Remember for Future Phases

### Phase 2: Frame-by-Frame Rendering
- Create `exportVideoFrameByFrame()` function
- Call `analyzeAudioForExport()` inside it
- Only called when `exportMode === 'frame-by-frame'`
- Does NOT replace `exportVideo()`

### Phase 3: UI Integration
- Add mode selector to VideoExportModal
- Default to 'live' mode
- Add explanatory text for each mode
- Store user preference

### Phase 4: Testing & Polish
- Test both modes independently
- Verify mode switching works
- Ensure no interference between modes
- Document both export methods

---

## Critical Notes

⚠️ **DO NOT:**
- Replace existing `exportVideo()` function
- Make frame-by-frame the default
- Remove live recording option
- Force all users to use new system

✅ **DO:**
- Add alongside existing system
- Make it user-selectable
- Default to existing live recording
- Allow switching between modes

---

**Summary:** Frame-by-frame export is an **optional enhancement**, not a replacement. Both systems coexist, user chooses which to use.

---

*Documented: February 19, 2026*
*Applies to: All phases (2, 3, 4, ...)*
