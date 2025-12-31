# 🎵 3D Music Visualizer Editor - README

## **What Is This?**

A **professional music video editor** with an **After Effects-style interface** that creates 3D animated visualizations synced to audio. Features a modular panel-based UI with layers, timeline, properties inspector, and real-time 3D preview. Upload a song, compose sections with different animations, customize every detail, and export high-quality videos.

---

## **Core Features**

### 🎨 **After Effects-Style Interface**
- **Top Bar** - Playback controls, current section info, export button, undo/redo (coming soon)
- **Left Panel (Layers)** - Section/layer management with:
  - Visibility toggles (eye icon)
  - Lock/unlock layers
  - Drag-and-drop reordering
  - Delete layers
  - Color tags (coming soon)
- **Center Canvas** - 3D visualization preview (960x540, 16:9 aspect ratio)
- **Right Panel (Properties)** - Context-sensitive controls for selected layer:
  - Animation preset picker
  - Start/end time editing
  - Color controls (bass, mids, highs)
  - Camera settings
  - Visual effects
  - Lighting controls
- **Bottom Timeline** - Visual timeline with:
  - Section bars showing duration
  - Drag to move sections
  - Resize handles for trimming
  - Click to scrub/seek
  - Playhead indicator
  - Add section button

### 🎬 **Timeline-Based Animation System**
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
- **Animated Letterbox System** - Create cinematic curtain-like effects
  - Timeline-based keyframe animation
  - Smooth or instant animation modes
  - Adjustable size (0-100px)
  - **Invert mode** - Toggle between "curtain opening" (start closed→open) and "curtain closing" (start open→closed)
  - Perfect for video intros/outros with dramatic black bar animations
- HUD toggle (show/hide time, title, seekbar)

### 🎤 **3D Song Name Overlay**
- Custom text that appears in 3D space
- Each letter bounces to music frequencies
- Uses custom fonts (.typeface.json format)
- Falls back to default Helvetiker font
- Letters color-coded by frequency (bass/mids/highs)

### 🎥 **Recording System**
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

### **Letterbox Animation System:**
Timeline-based keyframe system for cinematic curtain effects:
- **Keyframes** - Define target sizes at specific timestamps
- **Animation Modes:**
  - **Smooth** - Eased animations with easeInOutQuad interpolation
  - **Instant** - Immediate jumps to target size
- **Timing** - Animations finish AT keyframe times (not after)
- **Invert Toggle:**
  - **OFF (default)**: Size value = bar height in pixels (0=no bars, 100=100px bars)
  - **ON**: Size value inverted for curtain metaphor (100=fully closed/black, 0=fully open)
- **Use Cases:**
  - Opening curtain effect for video intros
  - Closing curtain effect for video outros
  - Mid-song dramatic transitions

---

## **Technical Stack**

- **React 18** - UI and component-based architecture
- **TypeScript** - Type safety and better development experience
- **Three.js** (0.182.0) - 3D graphics rendering via WebGL
- **Web Audio API** - Audio loading and real-time frequency analysis
- **MediaRecorder API** - Video recording and export
- **Tailwind CSS** - Utility-first styling framework
- **Lucide React** - Icon library
- **Vite** - Build tool and development server

---

## **Architecture**

### **Component Structure:**
```
src/
├── components/
│   ├── Canvas/
│   │   └── CanvasWrapper.tsx       # 3D preview wrapper
│   ├── Controls/
│   │   ├── TopBar.tsx              # Top control bar
│   │   └── ExportModal.tsx         # Video export dialog
│   ├── Panels/
│   │   ├── LeftPanel.tsx           # Layers/Sections panel
│   │   └── RightPanel.tsx          # Properties/Effects panel
│   └── Timeline/
│       └── Timeline.tsx            # Bottom timeline
├── types/
│   └── index.ts                    # TypeScript type definitions
├── VisualizerEditor.tsx            # Main editor component
└── App.tsx                         # Application entry point
```

### **Design System:**
- **Dark Theme:**
  - Main background: `#1E1E1E`
  - Panels: `#2B2B2B`
  - Borders: `#374151` (gray-700)
  - Active layer highlight: `#4A90E2` (blue)
  - Accent purple: `#9333EA` for buttons
  - Cyan accents: `#06B6D4` for interactive elements

---

## **Key Components**

### **UI Panels:**
- **TopBar** - Global controls, playback, export
- **LeftPanel** - Layer management and organization  
- **RightPanel** - Properties inspector for selected layer
- **Timeline** - Visual timeline with draggable section bars
- **CanvasWrapper** - 3D scene container with overlays

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

1. **Music Video Creation** - Professional visualizers for your songs with AE-style editing
2. **Live Performance Visuals** - Real-time reactive visuals for DJs/musicians
3. **Audio Analysis** - Visualize frequency content of tracks with precision
4. **Creative Experimentation** - Test different visual styles with instant preview
5. **Social Media Content** - Export videos for YouTube, Instagram, TikTok
6. **Video Production** - Create intros/outros with animated letterbox effects
7. **Learning Tool** - Understand audio frequencies through visual representation

---

## **Getting Started**

### **UI Overview:**

The interface is divided into 5 main areas, inspired by professional video editing software:

1. **Top Bar (Purple/Dark):**
   - Title and current section indicator
   - Time display
   - Play/Stop button
   - Undo/Redo buttons (coming soon)
   - Export button (purple, top-right)

2. **Left Panel - Layers/Sections (Dark Gray):**
   - List of all animation sections
   - Each layer shows: icon, name, time range, duration
   - Controls: visibility (eye), lock, delete (trash)
   - Drag layers to reorder
   - Selected layer highlighted in blue

3. **Center Canvas (Black Background):**
   - 960x540 3D visualization preview
   - Real-time rendering of your composition
   - Optional border (can be toggled)
   - Letterbox overlays when enabled
   - Filename overlay (top-left when audio loaded)

4. **Right Panel - Properties/Effects (Dark Gray):**
   - Shows when a layer is selected
   - **Layer Properties:** preset, start/end time
   - **Colors:** bass, mids, highs color pickers
   - **Camera:** auto-rotate, distance, height, rotation
   - **Effects:** letterbox, background, border
   - **Lighting:** ambient and directional intensity

5. **Bottom Timeline (Dark Gray):**
   - Visual representation of all sections
   - Horizontal bars for each section
   - Drag bars to move sections
   - Resize handles on edges to adjust duration
   - Red playhead shows current time
   - Click anywhere to seek
   - Time ruler at top
   - "Add Section" button (purple, top-right)

### **Development:**
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Run TypeScript type checking
npm run lint         # Run ESLint
```

### **Basic Workflow:**
1. **Upload Audio** - Click "Choose File" in bottom-right to load an audio file
2. **Select Layer** - Click on a layer in the left panel to edit its properties
3. **Edit Properties** - Adjust animation preset, colors, camera, effects in right panel
4. **Arrange Timeline** - Drag section bars to move them, use resize handles to adjust duration
5. **Preview** - Click Play button in top bar to preview your composition
6. **Export** - Click Export button to render and download the final video

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

- No localStorage/sessionStorage support
- All state is in-memory only (resets on refresh)
- Cannot access local filesystem directly (must use file input)
- Font loading requires external CDN or user upload

---

## **Future Enhancement Ideas**

- **Keyboard Shortcuts** - Play/pause (Space), undo/redo (Ctrl+Z/Y), layer navigation
- **Undo/Redo System** - Full history management for all edits
- **Collapsible Panels** - Maximize canvas by hiding panels
- **Resizable Panels** - Drag panel edges to resize
- **More Animation Presets** - Expand the visual library
- **Keyframe System** - Per-property keyframe animation
- **Color Tags** - Organize layers with color labels
- **Particle Systems** - Additional visual effects
- **Post-Processing** - Bloom, chromatic aberration, vignette
- **MIDI Controller Support** - Hardware control integration
- **Real-time Microphone Input** - Live audio visualization
- **Multiple Export Formats** - MP4, GIF, image sequences
- **Preset Saving/Loading** - Save compositions as templates
- **Beat Detection** - Automated section creation
- **Lyrics Overlay System** - Synchronized text display
- **Layer Grouping** - Organize complex compositions
- **Effect Stack** - Multiple effects per layer

---

**Version:** 2.0 (After Effects-Style UI)  
**Last Updated:** 12/31/2024  
**License:** MIT (To be determined)  
**Author:** YoriSounai01
