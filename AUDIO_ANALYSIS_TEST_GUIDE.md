# Audio Analysis Test Guide

## 🧪 Testing Phase 1: Audio Pre-Analysis

### Purpose
Verify that the offline audio frequency analysis function works correctly before proceeding to Phase 2 (frame rendering).

---

## Test Setup

### Prerequisites
1. ✅ Phase 1 implementation complete (`analyzeAudioForExport` function)
2. ✅ Test function added (`testAudioAnalysis`)
3. ✅ Test button added to export modal
4. ✅ Audio file loaded in the application

---

## How to Run the Test

### Step 1: Start the Application
```bash
npm run dev
```

### Step 2: Load Audio File
1. Navigate to the visualizer
2. Click on "Waveforms" or "Audio" tab
3. Upload an audio file (MP3, WAV, etc.)
4. Wait for audio to load

### Step 3: Open Export Modal
1. Click the "Export" button in the UI
2. Export modal should open

### Step 4: Select Frame-by-Frame Mode
1. In the export modal, find "Export Mode" dropdown
2. Select "Frame-by-Frame (Offline) - Better for Weak Laptops"
3. The test button should now appear

### Step 5: Run Test
1. Click the "🧪 Test Audio Analysis" button
2. Open browser console (Press F12)
3. Switch to "Console" tab
4. Observe the output

---

## Expected Console Output

### Successful Test Output

```
🧪 Testing Audio Analysis...
✅ Analyzed 14400 frames in 3500ms

📊 Sample Frames:
Frame 0: { bass: 0.42, mids: 0.31, highs: 0.15, all: 0.29 }
Frame 100: { bass: 0.55, mids: 0.28, highs: 0.22, all: 0.35 }
Frame 1000: { bass: 0.38, mids: 0.41, highs: 0.19, all: 0.33 }

✅ Audio analysis test complete! Check logs above.
```

### Output Breakdown

**Line 1:** Test start indicator
```
🧪 Testing Audio Analysis...
```

**Line 2:** Success message with performance metrics
```
✅ Analyzed 14400 frames in 3500ms
```
- `14400` = number of frames (varies by audio duration)
- `3500ms` = time taken (varies by CPU speed)

**Lines 3-6:** Sample frequency data
```
📊 Sample Frames:
Frame 0: { bass: 0.42, mids: 0.31, highs: 0.15, all: 0.29 }
Frame 100: { bass: 0.55, mids: 0.28, highs: 0.22, all: 0.35 }
Frame 1000: { bass: 0.38, mids: 0.41, highs: 0.19, all: 0.33 }
```
- `bass`: Low frequency magnitude (0-1)
- `mids`: Mid frequency magnitude (0-1)
- `highs`: High frequency magnitude (0-1)
- `all`: Average of complete spectrum (0-1)

**Line 7:** Completion message
```
✅ Audio analysis test complete! Check logs above.
```

---

## What to Verify

### ✅ Success Indicators

1. **No Errors**
   - No red error messages in console
   - No exceptions thrown

2. **Reasonable Frame Count**
   - Matches audio duration × 30 FPS
   - Example: 60 second audio = ~1800 frames
   - Example: 8 minute audio = ~14400 frames

3. **Reasonable Performance**
   - Processing time should be < 10 seconds for most audio
   - Faster CPUs: 2-5 seconds
   - Slower CPUs: 5-10 seconds

4. **Valid Frequency Data**
   - All values between 0 and 1
   - Bass/mids/highs vary between frames
   - Numbers look reasonable (not all 0 or all 1)

5. **Sample Frames Display**
   - Frame 0, 100, and 1000 all show data
   - Each frame has different values (proving analysis is working)

### ❌ Failure Indicators

1. **Error Messages**
   ```
   ❌ No audio loaded. Please load an audio file first.
   ```
   **Solution:** Load an audio file first

2. **Exception Errors**
   ```
   ❌ Audio analysis test failed: [error details]
   ```
   **Solution:** Check error details, report to developer

3. **All Zeros**
   ```
   Frame 0: { bass: 0.00, mids: 0.00, highs: 0.00, all: 0.00 }
   ```
   **Problem:** Frequency analysis not working
   **Solution:** Debug frequency extraction logic

4. **Very Long Processing Time**
   ```
   ✅ Analyzed 14400 frames in 45000ms
   ```
   **Problem:** Algorithm inefficiency
   **Note:** Still functional, just slow

---

## Performance Benchmarks

### Expected Performance by Audio Length

| Audio Duration | Frames (30 FPS) | Expected Time | Status |
|----------------|-----------------|---------------|---------|
| 5 seconds | 150 | < 1 second | ✅ Fast |
| 30 seconds | 900 | 1-2 seconds | ✅ Fast |
| 1 minute | 1,800 | 2-4 seconds | ✅ Good |
| 3 minutes | 5,400 | 4-8 seconds | ✅ Good |
| 5 minutes | 9,000 | 6-12 seconds | ⚠️ Acceptable |
| 8 minutes | 14,400 | 10-20 seconds | ⚠️ Acceptable |
| 10+ minutes | 18,000+ | 15-30+ seconds | ⚠️ Slow but OK |

**Note:** Times vary significantly based on CPU speed.

---

## Troubleshooting

### Issue: Button Doesn't Appear

**Possible Causes:**
1. Audio not loaded → Load audio file
2. Not in frame-by-frame mode → Select frame-by-frame mode
3. Currently exporting → Wait for export to complete

**Check:**
```javascript
// In console
console.log('Audio ready:', audioReady);
console.log('Export mode:', exportMode);
console.log('Is exporting:', isExporting);
```

### Issue: "No audio loaded" Error

**Solution:**
1. Go to Audio/Waveforms tab
2. Click "Load Audio" or similar button
3. Select audio file
4. Wait for loading to complete
5. Try test again

### Issue: Very Slow Performance

**Possible Causes:**
1. Very long audio file (10+ minutes)
2. Slow CPU
3. Browser throttling (tab not active)

**Solutions:**
- Use shorter audio for testing
- Keep tab active and visible
- Close other tabs/applications

### Issue: Incorrect Frequency Values

**Check:**
1. Values should be 0-1 range
2. Should vary between frames
3. Should reflect actual audio content

**Debug:**
```javascript
// Check a few more frames
const frequencyData = await analyzeAudioForExport(audioBufferRef.current);
console.log('Frame 500:', frequencyData[500]);
console.log('Frame 1500:', frequencyData[1500]);
```

---

## Interpreting Results

### Good Results Example

```
✅ Analyzed 1800 frames in 2500ms

Frame 0: { bass: 0.65, mids: 0.42, highs: 0.28, all: 0.45 }
Frame 100: { bass: 0.48, mids: 0.55, highs: 0.31, all: 0.44 }
Frame 1000: { bass: 0.52, mids: 0.38, highs: 0.29, all: 0.40 }
```

**Analysis:**
- ✅ Processed quickly (2.5 seconds)
- ✅ Reasonable frame count (60 seconds @ 30 FPS)
- ✅ Values vary between frames (0.28-0.65 range)
- ✅ Different frequency bands have different values
- ✅ Average (all) reflects mixed frequencies

**Verdict:** ✅ PASS - Ready for Phase 2

### Problematic Results Example

```
✅ Analyzed 1800 frames in 35000ms

Frame 0: { bass: 0.00, mids: 0.00, highs: 0.00, all: 0.00 }
Frame 100: { bass: 0.00, mids: 0.00, highs: 0.00, all: 0.00 }
Frame 1000: { bass: 0.00, mids: 0.00, highs: 0.00, all: 0.00 }
```

**Problems:**
- ⚠️ Very slow (35 seconds for 60 second audio)
- ❌ All values are zero (frequency analysis failed)

**Verdict:** ❌ FAIL - Need to debug before Phase 2

---

## Next Steps

### If Test Passes ✅

1. **Report Success**
   - Copy console output
   - Share with team/developer
   - Note: "Audio analysis test passed!"

2. **Move to Phase 2**
   - Frame-by-frame rendering implementation
   - Use pre-analyzed frequency data
   - Render without real-time playback

3. **Remove Test Button** (Optional)
   - After Phase 2 is complete
   - Or keep for debugging

### If Test Fails ❌

1. **Report Failure**
   - Copy full console output including errors
   - Share with developer
   - Include audio file details (duration, format, size)

2. **Debug Phase 1**
   - Review `analyzeAudioForExport` implementation
   - Check FFT calculations
   - Verify buffer sampling logic

3. **Retest**
   - After fixes applied
   - Try with different audio files
   - Verify consistency

---

## Sample Audio Files for Testing

### Recommended Test Files

**Short Test (5-10 seconds):**
- Quick validation
- Fast results
- Good for initial testing

**Medium Test (1-2 minutes):**
- Standard music video length
- Realistic scenario
- Balance of speed and thoroughness

**Long Test (5+ minutes):**
- Stress test
- Performance validation
- Edge case testing

### Audio Characteristics to Test

1. **Varied Frequency Content**
   - Music with bass, mids, highs
   - Not silence or single tone

2. **Different Genres**
   - Electronic (heavy bass)
   - Classical (varied dynamics)
   - Rock (balanced frequencies)

3. **Different Sample Rates**
   - 44.1kHz (CD quality)
   - 48kHz (video standard)
   - 96kHz (high quality)

---

## Logging in Application

The test also logs to the application's debug console:

1. Look for logs in the visualizer's debug panel
2. Messages will appear with timestamps
3. Same information as browser console
4. Easier to share/screenshot

---

## Automation (Future)

### Unit Test (To Add Later)

```typescript
describe('analyzeAudioForExport', () => {
  it('should analyze audio and return frequency data', async () => {
    const mockAudioBuffer = createMockAudioBuffer(60); // 60 seconds
    const result = await analyzeAudioForExport(mockAudioBuffer);
    
    expect(result).toHaveLength(1800); // 60 * 30 FPS
    expect(result[0]).toHaveProperty('bass');
    expect(result[0]).toHaveProperty('mids');
    expect(result[0]).toHaveProperty('highs');
    expect(result[0]).toHaveProperty('all');
    expect(result[0].bass).toBeGreaterThanOrEqual(0);
    expect(result[0].bass).toBeLessThanOrEqual(1);
  });
});
```

---

## Summary Checklist

Before reporting results, verify:

- [ ] Test button appears in export modal
- [ ] Clicking button shows console output
- [ ] No error messages
- [ ] Frame count matches audio duration × 30
- [ ] Processing time is reasonable
- [ ] Frequency values are 0-1 range
- [ ] Values vary between sample frames
- [ ] Both console and app logs show results

**When all checked:** ✅ Report "Audio analysis test PASSED"

**If any unchecked:** ❌ Report "Audio analysis test FAILED" with details

---

*Testing Guide Version 1.0*  
*Created: February 19, 2026*
