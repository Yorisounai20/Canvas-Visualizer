# 🎵 3D Music Visualizer Editor - README

## **✅ Development Status**

**Version 2.0 - After Effects-Style UI (Phase 10 Complete)**

Professional music video editor with a complete After Effects-style interface featuring timeline-based animation, keyframe systems, 3D text overlays, and comprehensive visual controls.

**Core Features:**
- ✅ Professional panel-based layout (Top Bar, Layers, Canvas, Properties, Timeline)
- ✅ Layer management (select, reorder, lock, delete, duplicate, visibility toggle)
- ✅ Timeline editing with multiple tabs (Sections, Presets, Camera, Text)
- ✅ Complete keyframe systems (Presets, Camera, Text)
- ✅ 3D scene rendering with audio-reactive animations
- ✅ 3D text overlay with font loading
- ✅ Waveform visualization in timeline
- ✅ Debug console (toggle with `` ` `` key)
- ✅ Right-click context menus
- ✅ Manual control mode for non-audio-reactive animations
- ✅ Color pickers and camera controls
- ✅ Export modal with resolution selection

**Latest Additions (Phase 10):**
- ✨ Keyframe-based preset automation
- ✨ Camera animation system with easing
- ✨ Text visibility keyframes
- ✨ Debug console with backtick key toggle
- ✨ Manual mode for epilepsy-safe animations
- ✨ Waveform background in timeline

---

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
  - Duplicate layers (right-click menu)
  - Right-click context menu
- **Center Canvas** - 3D visualization preview (960x540, 16:9 aspect ratio)
- **Right Panel (Properties)** - Tabbed interface with Layer and Canvas tabs:
  - **Layer Tab:** Animation preset picker, start/end time editing, color controls (bass, mids, highs)
  - **Canvas Tab:** Background & border, lighting, camera controls, letterbox, 3D text overlay, manual mode
- **Bottom Timeline** - Multi-tab timeline system:
  - **Sections Tab:** Section bars with waveform background, drag to move, resize handles
  - **Presets Tab:** Keyframe markers for automated preset changes
  - **Camera Tab:** Keyframe markers for camera animation
  - **Text Tab:** Keyframe markers for text visibility
  - Click timeline to add keyframes, hover for details, click markers to seek

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
- ⚠️ *Note: Color reactivity to audio not yet implemented in new UI*

**Camera Controls:**
- Zoom distance (5-50 units)
- Height offset (-10 to +10)
- Rotation offset (0-360°)
- Auto-rotate toggle (orbits around scene automatically)

**Visual Effects:**
- Background color customization
- Border color customization
- Letterbox toggle (basic on/off)
- Ambient and directional lighting controls

### ✨ **Advanced Features**

**Keyframe System:**
- **Preset Keyframes** - Automated animation changes at specific times with smooth transitions
- **Camera Keyframes** - Animated camera movement with distance, height, and rotation control
- **Text Keyframes** - Show/hide 3D text at specific moments
- Visual markers on timeline (cyan for presets, purple for camera, green/red for text)
- Click timeline to add, hover for details, delete with × button

**3D Text Overlay:**
- Custom 3D text with bevel effects
- Font loading from CDN (Helvetiker font)
- Text color follows bass frequency color
- Show/hide toggle and custom text input

**Debug Console:**
- Toggle with `` ` `` (backtick) key
- Color-coded log entries (info/success/error)
- Last 10 messages displayed
- Keyboard shortcuts (Escape to close)

**Manual Control Mode:**
- Non-audio-reactive animation option
- Epilepsy-safe control for precise timing
- Keyframe-based animations instead of frequency-reactive
- Visual warning when active

### 🎥 **Video Export System**
- Export modal with format and resolution selection
- Supports WebM format (VP9 video + Opus audio)
- MP4 support (if browser supports it)
- **Selectable export resolution:**
  - 960x540 (SD) - compact file size
  - 1280x720 (HD 720p) - good quality
  - 1920x1080 (Full HD 1080p) - highest quality
- Canvas displays at 960x540 for optimal performance
- ⚠️ *Note: Full export functionality requires animation playback to be completed*

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

⚠️ **Current Status:** Animation presets are defined and objects are rendered, but the animation playback logic is not yet integrated into the new UI. Objects appear static. This is a priority for the next development phase.

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
│   ├── Common/
│   │   └── ContextMenu.tsx         # Reusable context menu
│   ├── Controls/
│   │   ├── TopBar.tsx              # Top control bar
│   │   └── ExportModal.tsx         # Video export dialog
│   ├── Debug/
│   │   └── DebugConsole.tsx        # Debug console panel
│   ├── Panels/
│   │   ├── LeftPanel.tsx           # Layers/Sections panel
│   │   └── RightPanel.tsx          # Properties/Effects panel (tabbed)
│   └── Timeline/
│       ├── Timeline.tsx            # Multi-tab timeline
│       └── WaveformVisualizer.tsx  # Audio waveform renderer
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
- Section definitions (timeline data with visibility/lock state)
- Visual settings (colors, camera, effects, lighting)
- UI state (selected layer, export modal status)
- Layer management (selection, reordering, add/delete)

### **Debug Console:**
- Toggle with `` ` `` (backtick) key - no floating button needed
- Shows font loading, audio loading, text creation, keyframe operations
- Color-coded by type (info/success/error)
- Last 10 messages displayed
- Timestamped entries
- Visual hint in footer showing toggle key

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

### **Target Performance:**
- 30 FPS during video recording
- 60 FPS during live playback (when animation implemented)
- FFT size: 2048 (good balance of resolution and performance)
- Video bitrate: 5 Mbps
- Memory usage scales with audio file length

### **Current Status:**
- Scene renders at 60 FPS (idle rendering loop active)
- Audio analysis infrastructure in place
- Animation loop not yet connected to visualization

---

## **Browser Compatibility**

✅ **Chrome/Edge** - Full support  
✅ **Firefox** - Full support  
✅ **Safari** - Full support (may need user interaction for audio)  
❌ **IE** - Not supported

---

## **Known Limitations**

### **Browser/Environment:**
- No localStorage/sessionStorage support (environment limitation)
- All state is in-memory only (resets on refresh)
- Cannot access local filesystem directly (must use file input)

### **Known Issues:**
- Undo/redo buttons present but not wired up yet
- Letterbox keyframe animations not yet implemented (basic letterbox works)

---

## **Future Enhancement Ideas**

### **Priority:**
- **Undo/Redo System** - Full history management for all edits
- **Letterbox Keyframe Animations** - Animated letterbox with curtain effects
- **More Animation Presets** - Expand the visual library
- **Color Tags** - Organize layers with color labels
- **Camera Shake Events** - Impact effects at specific timestamps

### **Next Phase:**
- **Enhanced Keyboard Shortcuts** - Extended hotkey system for faster workflow
- **Collapsible Panels** - Maximize canvas by hiding panels
- **More Easing Functions** - Additional easing options for camera keyframes
- **Preset Transition Controls** - Customize blend time between presets
- **Multi-select Keyframes** - Select and edit multiple keyframes at once

### **Long-term:**
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

**Version:** 2.0 (Phase 10 Complete)  
**Last Updated:** 01/01/2026  
**License:** MIT  
**Author:** Yorisounai20
