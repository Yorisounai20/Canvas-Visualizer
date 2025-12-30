# 🎵 3D Timeline Visualizer - README

## **What Is This?**

A **music video editor** that creates 3D animated visualizations synced to audio. Think of it as a video editor specifically designed for making music visualizers - you upload a song, set different animations for different parts, customize colors, and record the final video.

---

## **Core Features**

### 🎨 **Timeline-Based Animation System**
- Split your song into sections (e.g., 0:00-0:20, 0:20-0:45, etc.)
- Assign different animation presets to each section
- Smooth transitions between animation styles
- Real-time audio frequency analysis (bass, mids, highs)

### 🌀 **9 Animation Presets**

1. **Orbital Dance** 🌀 - Solar system simulation with planets orbiting a pulsing sun
2. **Explosion** 💥 - Objects exploding outward from center with radial motion
3. **Tunnel Rush** 🚀 - Flying through a tunnel of geometric shapes
4. **Wave Motion** 🌊 - Audio waveform visualized in 3D with vectorscopes
5. **Spiral Galaxy** 🌌 - Spiraling geometric formations
6. **Chill Vibes** 🎵 - Gentle floating motion, relaxed animation
7. **Pulse Grid** ⚡ - Grid of objects pulsing in sync with music
8. **Vortex Storm** 🌪️ - Swirling vortex with dynamic rotation
9. **Azure Dragon** 🐉 - Serpentine dragon flying through mountains (most complex)

### 🎨 **Customization Options**

**Colors:**
- Bass frequency color (low sounds)
- Mids frequency color (vocals, melody)
- Highs frequency color (cymbals, hi-hats)
- All objects react to audio and change color accordingly

**Camera Controls:**
- Zoom distance (5-50 units)
- Height offset (-10 to +10)
- Rotation offset (0-360°)
- Auto-rotate toggle (orbits around scene automatically)
- Reset to defaults button

**Visual Effects:**
- Letterbox bars (cinematic black bars top/bottom)
- Adjustable letterbox size (0-100px)
- HUD toggle (show/hide time, title, seekbar)

### 🎤 **3D Song Name Overlay**
- Custom text that appears in 3D space
- Each letter bounces to music frequencies
- Uses custom fonts (.typeface.json format)
- Falls back to default Helvetiker font
- Letters color-coded by frequency (bass/mids/highs)

### 🎥 **Recording System**
- Records canvas + audio simultaneously
- Exports as WebM or MP4 (if browser supports)
- 30 FPS capture
- Includes synchronized audio
- Downloads automatically when stopped
- **Selectable export resolution:**
  - 960x540 (SD) - compact file size
  - 1280x720 (HD 720p) - good quality
  - 1920x1080 (Full HD 1080p) - highest quality
- Canvas displays at 960x540 for optimal performance, but exports at chosen resolution

---

## **How It Works**

### **Audio Analysis:**
1. Loads audio file into Web Audio API
2. Uses FFT (Fast Fourier Transform) to analyze frequencies in real-time
3. Splits frequencies into 3 bands:
   - **Bass** (0-10 bins) - affects large central objects
   - **Mids** (10-100 bins) - affects medium-sized objects  
   - **Highs** (100-200 bins) - affects small particles/details

### **3D Rendering:**
- Built with Three.js (WebGL)
- 960x540 canvas (16:9 aspect ratio)
- Fog effect for depth
- Wireframe + solid rendering modes
- Geometric primitives: Cubes, Octahedrons, Tetrahedrons, Spheres

### **Animation System:**
Each preset controls:
- Camera position and movement
- Object positions, rotations, scales
- Object opacity based on audio
- Material colors from user-selected palette
- Smooth blending when switching between presets

---

## **Technical Stack**

- **React** - UI and state management
- **Three.js** (r128) - 3D graphics rendering
- **Web Audio API** - Audio loading and frequency analysis
- **MediaRecorder API** - Video recording
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

---

## **Key Components**

### **Scene Objects:**
- **8 Cubes** - Main animated shapes (planets in Orbit, segments in Seiryu)
- **30+ Octahedrons** - Mid-sized elements (moons, mountains, particles)
- **30 Tetrahedrons** - Small particles (asteroids, horns, clouds)
- **1 Sphere** - Central object (sun in Orbit, hidden in other presets)

### **State Management:**
- Audio state (playing, ready, duration, current time)
- Section definitions (timeline data)
- Visual settings (colors, camera, effects)
- UI state (active tab, recording status, logs)

### **Debug Console:**
- Real-time logging of events
- Shows font loading, audio loading, text creation
- Color-coded by type (info/success/error)
- Last 10 messages displayed

---

## **Use Cases**

1. **Music Video Creation** - Make custom visualizers for your songs
2. **Live Performance Visuals** - Real-time reactive visuals for DJs/musicians
3. **Audio Analysis** - Visualize frequency content of tracks
4. **Creative Experimentation** - Test different visual styles quickly
5. **Social Media Content** - Export videos for YouTube, Instagram, TikTok

---

## **File Format Support**

- **Audio Input:** Any format browser supports (MP3, WAV, OGG, M4A, FLAC)
- **Font Input:** Three.js .typeface.json format
- **Video Output:** WebM (VP9 video + Opus audio)

---

## **Performance Notes**

- Runs at 30 FPS during recording
- 60 FPS during live playback
- FFT size: 2048 (good balance of resolution and performance)
- Video bitrate: 5 Mbps
- Memory usage scales with audio file length

---

## **Browser Compatibility**

✅ **Chrome/Edge** - Full support  
✅ **Firefox** - Full support  
✅ **Safari** - Full support (may need user interaction for audio)  
❌ **IE** - Not supported

---

## **Known Limitations**

- No localStorage/sessionStorage support in Claude.ai artifacts
- All state is in-memory only (resets on refresh)
- Recording only works when audio is playing
- Cannot access local filesystem directly (must use file input)
- Font loading requires external CDN or user upload

---

## **Future Enhancement Ideas**

- More animation presets
- Particle systems
- Post-processing effects (bloom, chromatic aberration)
- MIDI controller support
- Real-time microphone input
- Multiple export formats (MP4, GIF)
- Preset saving/loading
- Beat detection for automated sections
- Lyrics overlay system

---

**Version:** 15 (Timeline-based with Recording)  
**Last Updated:** constantly  
**License:** IDK 
**Author:** YoriSounai01
