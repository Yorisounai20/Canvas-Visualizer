# 🎵 Canvas Visualizer - 3D Music Video Creator

## **Development Status**

**Version 2.5 - Camera Rig Polish & Enhancements**
**Version 2.4 - Camera Rig Path Visualization**
**Version 2.4 - Advanced Skybox & Material System (Software Mode)**

Professional music video creation tool with **two workflow modes**: A comprehensive **Editor Mode** with After Effects-style interface, Blender-like workspace, Scene Explorer, timeline-based animation, and keyframe systems; plus a streamlined **Software Mode** for quick, simple visualizations with advanced skybox backgrounds and professional material controls.

**Dual-Mode Architecture:**
- 🎬 **Editor Mode** - Professional interface with layers, timeline, workspace, and advanced controls
- ⚡ **Software Mode** - Simple, streamlined interface for quick visualizations
- 🎨 Main Dashboard for mode selection at startup

**Editor Mode Features:**
- ✅ Professional panel-based layout (Top Bar, Scene Explorer, Canvas, Properties, Timeline)
- ✅ Scene Explorer - Blender-style object hierarchy panel
- ✅ Extended object types - Support for cameras and lights as workspace objects
- ✅ Layer management (select, reorder, lock, delete, duplicate, visibility toggle)
- ✅ Timeline editing with multiple tabs (Sections, Presets, Camera, Text)
- ✅ Complete keyframe systems (Presets, Camera, Text)
- ✅ Blender-like 3D workspace (toggle with `W` key)
- ✅ Keyboard shortcuts modal, undo/redo functionality
- ✅ Parameter-driven presets (density, speed, intensity, spread)

**Software Mode Features:**
- ✅ Simple, streamlined interface for quick setup
- ✅ Direct audio upload and instant preview
- ✅ Animated letterbox with keyframe system
- ✅ Camera shake events and visual effects
- ✅ Parameter events (background flash, vignette pulse, saturation burst)
- ✅ Multiple audio track support with mixing
- ✅ Scrolling and static waveform visualization modes
- ✅ **6 skybox/background modes**: Solid Color, Gradient, Image/Skybox, Stars, Galaxy, Nebula
- ✅ **Professional material system**: 4 material types (Basic, Standard PBR, Phong, Lambert) with per-shape controls
- ✅ **PBR rendering**: Metalness and roughness controls for physically-based materials

**Shared Features (Both Modes):**
- ✅ 25 animation presets with audio-reactive 3D visuals
- ✅ 3D text overlay with font loading
- ✅ Waveform visualization
- ✅ Debug console (toggle with `` ` `` key)
- ✅ Per-shape color pickers and camera controls
- ✅ Export modal with resolution selection
- ✅ Manual control mode for non-audio-reactive animations

---

## **What Is This?**

**Canvas Visualizer** is a web-based 3D music video creation tool with two workflow modes:

- **🎬 Editor Mode** - A professional music video editor with an After Effects-style interface featuring layers, timeline, properties inspector, workspace mode, and real-time 3D preview. Perfect for complex projects with precise control over every detail.

- **⚡ Software Mode** - A streamlined, simplified visualizer for quick music visualizations. Upload audio, choose a preset, customize colors, and export. Ideal for rapid prototyping and simple projects.

Both modes create audio-reactive 3D animations synchronized to music, with support for 9 different animation presets, custom colors, camera controls, and high-quality video export.

---

## **Mode Selection**

When you launch Canvas Visualizer, you're greeted with a **Main Dashboard** where you choose your workflow:

### **🎬 Editor Mode (Advanced)**
Best for:
- Complex music video projects
- Precise timeline control with multiple sections
- Layer-based composition
- Professional editing workflow
- Keyframe animation systems
- Workspace mode for manual object editing
- Projects requiring detailed property control

Features:
- After Effects-style interface with panels
- Layer management and organization
- Multi-tab timeline (Sections, Presets, Camera, Text)
- Scene Explorer with object hierarchy
- Blender-like workspace mode (W key)
- Keyboard shortcuts and undo/redo
- Context menus and advanced controls

### **⚡ Software Mode (Simple)**
Best for:
- Quick visualizations
- Simple, direct workflow
- Rapid prototyping
- Learning the basics
- Single-preset projects
- Fast exports

Features:
- Streamlined interface with tabs
- Direct audio upload
- Animated letterbox with keyframes
- Camera shake events
- Parameter events (flashes, pulses)
- Multiple audio track mixing
- Waveform mode selection
- **6 skybox/background modes** - Solid Color, Gradient, Image/Skybox, Stars, Galaxy, Nebula
- **Professional material system** - 4 material types with per-shape controls and PBR support

### **Comparison**

| Feature | Editor Mode | Software Mode |
|---------|-------------|---------------|
| Interface | Multi-panel, professional | Tabbed interface at bottom |
| Project Setup | New Project Modal with presets | Direct start, no setup |
| Resolution | Set at project creation (720p-4K+) | Fixed 960x540 canvas, export at 960p-1080p |
| Timeline | Multiple sections, multi-tab | Single waveform display |
| Layers | Full layer management | No layers |
| Workspace | Blender-like 3D editing | N/A |
| Keyframes | Preset, Camera, Text | Camera, Letterbox, Camera Shake, Events |
| Audio Tracks | Single | Multiple with mixing |
| Camera Rigs | Yes (7 rig types) | Yes (7 rig types) |
| Learning Curve | Steep | Easy |
| Best For | Complex projects | Quick visualizations |

---

## **Core Features**

### 🎨 **Editor Mode Interface**
- **Top Bar** - Playback controls, current section info, undo/redo, keyboard shortcuts (?), export button
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

### 🌀 **25 Animation Presets**

1. **Orbital Dance** 🌀 - Solar system simulation with planets orbiting a pulsing sun
2. **Explosion** 💥 - Objects exploding outward from center with radial motion
3. **Tunnel Rush** 🚀 - Flying through a tunnel of geometric shapes
4. **Wave Motion** 🌊 - Audio waveform visualized in 3D with vectorscopes
5. **Spiral Galaxy** 🌌 - Spiraling geometric formations
6. **Chill Vibes** 🎵 - Gentle floating motion, relaxed animation
7. **Pulse Grid** ⚡ - Grid of objects pulsing in sync with music
8. **Vortex Storm** 🌪️ - Swirling vortex with dynamic rotation
9. **Azure Dragon** 🐉 - Serpentine dragon flying through mountains
10. **Kaleidoscope** 🔮 - Symmetrical patterns radiating from center with mirrored geometry
11. **Meteor Shower** ☄️ - Objects falling and shooting across the scene with trails
12. **DNA Helix** 🧬 - Double helix structure rotating with connecting strands
13. **Fireworks** 🎆 - Explosive particles bursting outward in colorful displays
14. **Matrix Rain** 💚 - Falling columns of objects inspired by digital rain
15. **Ripple Wave** 〰️ - Concentric circular waves expanding from center
16. **Constellation** ✨ - Star-like patterns with connecting lines between points
17. **Pendulum** ⏱️ - Swinging and oscillating motion patterns
18. **Blooming Flower** 🌸 - Organic petal structures blooming and pulsing with music
19. **Tornado** 🌀 - Spiraling vortex ascending with layered debris particles
20. **Hypercube** 📦 - 4D cube representation with rotating edges and vertices
21. **Fractal Tree** 🌳 - Branching organic structure with recursive patterns
22. **Binary Stars** ⭐ - Two orbiting stellar bodies with circling planets and debris
23. **Ribbon Dance** 🎀 - Flowing curved ribbon path with trailing particles
24. **Hourglass** ⏳ - Sand-like particles flowing through narrowing passage
25. **Snowflake** ❄️ - Hexagonal crystalline structure with intricate branching arms

*Available in both Editor and Software modes*

### ⚡ **Software Mode Interface**

The Software Mode features a streamlined tabbed interface at the bottom for easy access to all controls:

- **Top Bar:**
  - Title and tagline
  - Keyboard shortcuts button (?)
  - Export button (purple, top-right)
  
- **Center Canvas:**
  - 960x540 3D visualization preview
  - Optional border effects (configurable in Settings tab)
  - Letterbox overlays when enabled (configured in Effects tab)
  - Filename overlay (toggleable in Settings tab)
  - Preset display (toggleable in Settings tab)
  
- **Bottom Section (Tabbed Interface):**
  - **Waveform Display Area:**
    - Scrolling or static waveform visualization
    - Playback controls and time display
    - Current preset indicator
  
  - **Control Tabs:**
    
    - **🎵 Waveforms Tab:**
      - Add/remove audio tracks
      - Multiple audio track management
      - Volume and mute controls per track
      - Active track selection for visualization
    
    - **🎨 Controls Tab:**
      - **🎚️ Frequency Gain Controls** - Bass, mids, highs sensitivity multipliers (0-3x)
      - **🎭 Shape Material Controls** - Per-shape customization:
        - Material type dropdown (Basic, Standard PBR, Phong, Lambert)
        - Color picker for each shape (Cubes, Octahedrons, Tetrahedrons, Sphere)
        - Opacity slider (0.0-1.0)
        - Wireframe toggle
        - Metalness & Roughness sliders (Standard PBR only, 0.0-1.0)
        - Reset all materials to defaults button
    
    - **📷 Camera Settings Tab:**
      - Distance, height, rotation controls
      - Auto-rotate toggle
      - Camera keyframe system
    
    - **🎥 Camera Rig Tab:**
      - Create camera rigs (Orbit, Rotation, Dolly, Pan, Crane, Zoom, Custom)
      - Path visualization controls
      - Rig transitions (smooth interpolation with easing)
      - Framing controls (look-at offset, framing lock, rule of thirds)
      - Camera FX layer (shake, handheld drift, FOV ramping)
      - Shot presets (Close-Up, Wide Shot, Overhead, Low Angle, Dutch Angle, Tracking)
      - Camera rig keyframes
    
    - **✨ Effects Tab:**
      - **🌌 Visual Effects** - 6 skybox/background modes:
        - **Solid Color** - Traditional single-color background
        - **Gradient** - Sky-to-ground color gradient (customizable top/bottom colors)
        - **Image/Skybox** - Load equirectangular panoramic images via URL (supports HDRI)
        - **Stars** - Procedurally generated star field (1,000-10,000 stars, adjustable count)
        - **Galaxy** - Spiral galaxy with customizable color tint
        - **Nebula** - Multi-color nebula with shader-based gas clouds (dual-color customization)
      - **📽️ Animated Letterbox** - Keyframe-based curtain effects
      - **💥 Camera Shake Events** - Time-triggered shake with intensity control
      - **⚡ Parameter Events** - Background flash, vignette pulse, saturation burst, color tint flash
    
    - **🎭 Post-FX Tab:**
      - Vignette strength and softness
      - Saturation adjustment
      - Contrast control
      - Gamma correction
      - Color tint (R, G, B channels)
    
    - **⏱️ Presets Tab:**
      - Animation preset selector with 25 presets
      - Visual preset icons
    
    - **📝 Text Animator Tab:**
      - 3D text overlay with custom font loading
      - Text visibility keyframes
      - Text animation effects
    
    - **🎭 Masks Tab:**
      - Masking system for advanced compositing
      - Circle and rectangle mask types
      - Blend modes and feathering

### 🎬 **Editor Mode: Timeline-Based Animation System**
- Split your song into sections (e.g., 0:00-0:20, 0:20-0:45, etc.)
- Assign different animation presets to each section
- Smooth transitions between animation styles
- Real-time audio frequency analysis (bass, mids, highs)

### 🎨 **Customization Options (Both Modes)**

**Shape Materials (Software Mode):**
- Individual material controls for each shape type (Cubes, Octahedrons, Tetrahedrons, Sphere)
- **Material Types:**
  - **Basic (Unlit)** - Simple flat material, no lighting required, always visible
  - **Standard (PBR)** - Physically-based rendering with metalness (0.0-1.0) and roughness (0.0-1.0) controls
  - **Phong (Shiny)** - Classic shiny material with specular highlights (fixed shininess: 30)
  - **Lambert (Matte)** - Diffuse matte material for soft appearance
- Color picker per shape (independent from frequency colors)
- Opacity slider per shape (0.0-1.0)
- Wireframe toggle per shape
- PBR controls (metalness/roughness) visible only when Standard material selected
- Reset all materials to defaults button

**Frequency Gain (Software Mode):**
- Bass gain multiplier (0-3x) - Controls sensitivity of bass frequency band
- Mids gain multiplier (0-3x) - Controls sensitivity of mids frequency band
- Highs gain multiplier (0-3x) - Controls sensitivity of highs frequency band
- Reset frequency gains button

**Camera Controls:**
- Zoom distance (5-50 units)
- Height offset (-10 to +10)
- Rotation offset (0-360°)
- Auto-rotate toggle (orbits around scene automatically)

**Visual Effects:**
- **Skybox/Background (Software Mode):**
  - **Solid Color** - Single-color background (hex color picker)
  - **Gradient** - Vertical gradient with top and bottom colors
  - **Image/Skybox** - Equirectangular panoramic images (enter URL, supports CORS-enabled resources, try [Poly Haven](https://polyhaven.com/hdris))
  - **Stars** - Procedural star field with adjustable star count (1,000-10,000)
  - **Galaxy** - Procedural spiral galaxy with customizable color tint
  - **Nebula** - Procedural nebula with dual-color gas clouds and shader-based fog effects
- Border color customization
- Letterbox toggle (basic on/off in Editor mode, keyframe animation in Software mode)
- Ambient and directional lighting controls

### ✨ **Advanced Features (Editor Mode)**

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

**Keyboard Shortcuts:**
- Click **?** button in top bar to view all shortcuts
- Comprehensive reference modal with categorized shortcuts
- Includes playback, timeline, tools, editing, and workspace controls

**Undo/Redo System:**
- Full history tracking for section operations
- **Ctrl+Z** (Cmd+Z on Mac) to undo
- **Ctrl+Shift+Z** or **Ctrl+Y** (Cmd+Shift+Z or Cmd+Y on Mac) to redo
- Visual indication of undo/redo availability in top bar

### ✨ **Advanced Features (Software Mode)**

**Parameter Events System:**
- Manual or automated event triggering
- Background flash effects
- Camera shake with intensity control
- Vignette pulse effects
- Saturation bursts
- Color tint flashes
- Time-based and audio-reactive triggers

**Multi-Track Audio:**
- Support for multiple audio files simultaneously
- Independent volume control per track
- Mute/unmute individual tracks
- Select which track drives the visualization
- Mix multiple sources for complex compositions

**Animated Letterbox:**
- Keyframe-based letterbox animation
- Curtain-style opening/closing effects
- Customizable timing and transitions

**Camera Shake Events:**
- Time-triggered shake effects
- Adjustable intensity
- Impact effects synchronized to audio

### 🎥 **Video Export System**

**Editor Mode:**
- Project resolution configured at creation via New Project Modal
- Resolution presets include:
  - 720p (1280×720)
  - 1080p (1920×1080)
  - 1440p (2560×1440)
  - 4K (3840×2160)
  - Instagram Square (1080×1080)
  - Instagram Story/YouTube Shorts (1080×1920)
- Export format selection: WebM (VP9 + Opus) or MP4 (if supported)
- Canvas displays at project resolution for WYSIWYG editing

**Software Mode:**
- Export resolution selected at export time via Export Modal
- Resolution options:
  - 960x540 (SD) - compact file size
  - 1280x720 (HD 720p) - good quality
  - 1920x1080 (Full HD 1080p) - highest quality
- Export format selection: WebM (VP9 + Opus) or MP4 (if supported)
- Canvas always displays at 960x540 for optimal performance

**Both Modes:**
- Support WebM and MP4 formats
- MediaRecorder API for video recording
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
- **Material system (Software Mode):**
  - **Basic (MeshBasicMaterial)** - Unlit, flat shading, always visible
  - **Standard (MeshStandardMaterial)** - PBR with metalness and roughness, responds to lighting
  - **Phong (MeshPhongMaterial)** - Specular highlights, classic shiny materials
  - **Lambert (MeshLambertMaterial)** - Diffuse matte shading, soft appearance
- Wireframe rendering mode (per-shape toggle)
- Geometric primitives: Cubes, Octahedrons, Tetrahedrons, Spheres
- **Skybox rendering (Software Mode):**
  - Solid color backgrounds
  - Gradient backgrounds with GLSL shaders
  - Equirectangular image mapping for 360° panoramas
  - Procedural star fields, galaxies, and nebulae using THREE.Points and custom shaders

### **Animation System:**
Each preset controls:
- Camera position and movement
- Object positions, rotations, scales
- Object opacity based on audio
- Material colors from user-selected palette
- Smooth blending when switching between presets

### **Camera Rig System:**
Professional camera control with production-ready polish features:

**Core Rig Types:**
- **Seven rig types** - Orbit, Rotation, Dolly, Pan, Crane, Zoom, and Custom rigs
- **Keyframe animation** - Smooth interpolation between camera positions
- **Easing functions** - Linear, Ease In, Ease Out, Ease In-Out
- **Null object hierarchy** - Professional transform composition
- **3D Path Visualization** - Real-time visual feedback of rig trajectories
  - Color-coded paths per rig type (Orbit=Cyan, Dolly=Green, Crane=Magenta, Custom=White)
  - Sphere markers at keyframe positions with size variations based on easing
  - Toggle visibility for paths and markers independently
  - Eliminates need to constantly switch between UI and viewport during setup

**Rig Transitions:**
- **Smooth interpolation** - Configurable transition duration (0.1-5 seconds)
- **Four easing curves** - Linear, Ease In, Ease Out, Ease In-Out
- **Hard cuts toggle** - Enable/disable smooth transitions
- Position, rotation, and FOV interpolation support

**Framing Controls:**
- **Look-at offset** - Reframe shots with X/Y offset controls (±10 units)
- **Framing lock** - Keep subject centered in frame
- **Rule of thirds bias** - Dynamic composition with subtle oscillation

**Camera FX Layer (Non-Destructive):**
- **Enhanced camera shake** - Configurable intensity (0-3x) and frequency (10-100Hz)
- **Handheld drift** - Organic camera movement using multi-frequency noise (0-1 intensity)
- **FOV ramping** - Dynamic perspective changes during movement (0-20°)
- All FX applied on top of rig positioning without modifying base system

**Shot Presets:**
Six cinematic presets that modify existing rig parameters:
- **Close-Up** - Tight frame on subject (radius: 8)
- **Wide Shot** - Establish scene context (radius: 30)
- **Overhead** - Bird's eye view (height: 20, tilt: -90°)
- **Low Angle** - Dramatic upward view (height: -5, tilt: 0.3 rad)
- **Dutch Angle** - Tilted perspective (z-rotation: 0.3 rad)
- **Tracking** - Follow subject smoothly (increased speeds)

📚 **[Complete Camera Rig Documentation](CAMERA_RIG_DOCUMENTATION.md)**  
📖 **[Quick Reference Guide](docs/CAMERA_RIG_QUICK_REFERENCE.md)**

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
│   │   └── CanvasWrapper.tsx       # 3D preview wrapper (Editor mode)
│   ├── Common/
│   │   └── ContextMenu.tsx         # Reusable context menu
│   ├── Controls/
│   │   ├── TopBar.tsx              # Top control bar (Editor mode)
│   │   └── ExportModal.tsx         # Video export dialog (both modes)
│   ├── Dashboard/
│   │   └── MainDashboard.tsx       # Mode selection screen
│   ├── Debug/
│   │   └── DebugConsole.tsx        # Debug console panel
│   ├── Modals/
│   │   ├── NewProjectModal.tsx     # Project creation modal (Editor mode)
│   │   └── KeyboardShortcutsModal.tsx  # Keyboard shortcuts reference (Editor mode)
│   ├── Panels/
│   │   ├── LeftPanel.tsx           # Layers/Sections panel (Editor mode)
│   │   └── RightPanel.tsx          # Properties/Effects panel (Editor mode)
│   ├── Timeline/
│   │   ├── Timeline.tsx            # Multi-tab timeline (Editor mode)
│   │   └── WaveformVisualizer.tsx  # Audio waveform renderer
│   └── Workspace/
│       ├── WorkspaceControls.tsx   # Object creation toolbar (Editor mode)
│       ├── ObjectPropertiesPanel.tsx # Object properties editor (Editor mode)
│       └── SceneExplorer.tsx       # Blender-style object hierarchy (Editor mode)
├── types/
│   └── index.ts                    # TypeScript type definitions
├── VisualizerEditor.tsx            # Main editor component (Editor mode)
├── visualizer-software.tsx         # Simple visualizer component (Software mode)
└── App.tsx                         # Application entry point & mode router
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

### **1. Mode Selection:**

When you first launch Canvas Visualizer, you'll see the **Main Dashboard** with two options:

- **🎬 Editor Mode** - Click to launch the professional interface
  - You'll then see the **New Project Modal** to configure your project settings:
    - Choose resolution preset (720p, 1080p, 1440p, 4K, Instagram Square, Instagram Story/YouTube Shorts)
    - Set FPS (frames per second)
    - Optionally upload audio file
    - Set background color and project name
  - After configuration, the full Editor interface loads with panels and timeline
  - Canvas displays at your chosen project resolution for WYSIWYG editing
  
- **⚡ Software Mode** - Click to launch the simplified visualizer
  - Loads directly into the visualization interface
  - No project configuration needed - just start creating
  - Canvas always displays at 960x540 for optimal performance
  - Export resolution selected at export time (960x540, 1280x720, 1920x1080)

### **2. Editor Mode Overview:**

The Editor interface is divided into 5 main areas, inspired by professional video editing software:

1. **Top Bar (Purple/Dark):**
   - Title and current section indicator
   - Time display
   - Play/Stop button
   - Undo/Redo buttons (**PHASE 5:** Ctrl+Z / Ctrl+Shift+Z)
   - Keyboard shortcuts button (? icon) (**PHASE 5**)
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

### **3. Software Mode Overview:**

The Software interface is streamlined with tabbed controls at the bottom:

- **Top Section:** Title bar with export button and keyboard shortcuts
- **Center Canvas:** 960x540 3D preview with optional overlays and border effects
- **Bottom Section:** 
  - **Waveform Display** - Scrolling or static waveform visualization with playback controls and time display
  - **Tabbed Controls** - Access all features through tabs:
    - **🎵 Waveforms** - Audio track management with volume/mute controls and active track selection
    - **🎨 Controls** - Frequency gain controls and per-shape material customization
    - **📷 Camera Settings** - Distance, height, rotation, auto-rotate controls
    - **🎥 Camera Rig** - Advanced camera rig system with transitions, framing, FX, and shot presets
    - **✨ Effects** - Skybox modes, letterbox animation, camera shake events, parameter events
    - **🎭 Post-FX** - Post-processing effects (vignette, saturation, contrast, gamma, color tint)
    - **⏱️ Presets** - Animation preset selector
    - **📝 Text Animator** - 3D text overlay with custom font loading
    - **🎭 Masks** - Masking system for advanced compositing

### **Development:**
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Run TypeScript type checking
npm run lint         # Run ESLint
```

### **Basic Workflow (Editor Mode):**
1. **Select Mode** - Choose Editor Mode from the Main Dashboard
2. **Configure Project** - In the New Project Modal, select resolution preset (720p, 1080p, 4K, Instagram formats, etc.) and set FPS
3. **Upload Audio** - Click "Choose File" to load an audio file (optional during project creation)
4. **Select Layer** - Click on a layer in the left panel to edit its properties
5. **Edit Properties** - Adjust animation preset, colors, camera, effects in right panel
6. **Arrange Timeline** - Drag section bars to move them, use resize handles to adjust duration
7. **Preview** - Click Play button in top bar to preview your composition
8. **Export** - Click Export button to select format and render the final video at project resolution

### **Basic Workflow (Software Mode):**
1. **Select Mode** - Choose Software Mode from the Main Dashboard
2. **Upload Audio** - Navigate to the Waveforms tab and click "Add Track" to upload your audio file
3. **Choose Preset** - Switch to the Presets tab and select an animation preset
4. **Customize** - Use the Controls tab to adjust frequency gains and shape materials
5. **Adjust Camera** - Configure camera position in the Camera Settings tab or set up advanced rigs in the Camera Rig tab
6. **Add Effects** - Go to the Effects tab to set up skybox, letterbox, camera shakes, or parameter events
7. **Preview** - Click Play in the waveform section to watch your visualization in real-time
8. **Export** - Click Export button (top-right) to select resolution and render the final video

### **Keyboard Shortcuts:**

#### **Editor Mode:**
**Click the ? button in the top bar** to view the complete keyboard shortcuts reference.

| Category | Shortcut | Action |
|----------|----------|--------|
| **Playback** | Space | Play/Pause audio |
| **Timeline** | ← / → | Navigate timeline (1 second) |
| | Shift + ← / → | Navigate timeline (5 seconds) |
| | [ | Previous section |
| | ] | Next section |
| | Home | Go to start |
| | End | Go to end |
| **Tools & Modes** | W | Toggle Workspace Mode |
| | ` (backtick) | Toggle Debug Console |
| | Esc | Close modals/panels |
| **Editing** | Ctrl/Cmd + Z | Undo |
| | Ctrl/Cmd + Shift + Z | Redo |
| | Ctrl/Cmd + Y | Redo (alternative) |
| **Sections** | 1-9 | Change selected section preset |
| | ↑ / ↓ | Navigate sections |
| **Effects** | G | Toggle letterbox |
| | B | Toggle border |
| | R | Reset camera (when no section selected) |
| **Workspace (W Mode)** | Left Click | Select object |
| | Left Drag | Rotate camera |
| | Right Drag | Pan camera |
| | Scroll | Zoom camera |
| | T | Translate mode |
| | R | Rotate mode |
| | S | Scale mode |

#### **Software Mode:**
**Click the ? button next to Export** to view available keyboard shortcuts.

| Shortcut | Action |
|----------|--------|
| Space | Play/Pause audio |
| Esc | Close modals/dialogs |
| G | Toggle camera rig visual hints |

*Software Mode has a streamlined set of shortcuts focused on essential playback and camera controls.*

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

### **In Development (Final Architecture Refactor):**
- Scene Explorer integration into main layout (created, not yet integrated)
- Canvas resize based on timeline height (planned)
- Camera settings migration to object properties (planned)
- Preset menu relocation to workspace controls (planned)
- Multiple camera implementation (type system ready)
- Form field ID additions for accessibility (planned)

---

## **Recent Changes & Improvements**

### **Version 2.5 - Camera Rig Polish & Enhancements (Latest):**
- ✨ **Rig Transitions** - Smooth interpolation between camera states with configurable duration and easing
  - Position, rotation, and FOV interpolation over 0.1-5 second duration
  - Four easing curves: Linear, Ease In, Ease Out, Ease In-Out
  - Toggle for hard cuts vs smooth transitions
  - UI controls for future state tracking implementation
- ✨ **Framing Controls** - Professional framing and composition tools
  - Look-at offset X/Y sliders (±10 units) for reframing shots
  - Framing lock checkbox to keep subject centered
  - Rule of thirds bias toggle with dynamic composition
- ✨ **Camera FX Layer** - Non-destructive camera effects applied post-rig transformation
  - Configurable shake intensity multiplier (0-3x) for existing shake events
  - Adjustable shake frequency (10-100Hz) for different shake effects
  - Handheld drift using multi-frequency noise synthesis (0-1 intensity)
  - FOV ramping based on camera velocity (0-20°) for dynamic perspective
- ✨ **Shot Presets** - Six cinematic presets that modify existing rig parameters
  - Close-Up, Wide Shot, Overhead, Low Angle, Dutch Angle, Tracking
  - Presets adjust radius, position, rotation, and speed without creating new rig instances
  - Visual selection UI with active state highlighting
- 🎯 **Focus on Polish** - Enhanced usability without modifying core architecture
  - All controls integrated into existing Camera Rig tab
  - No new UI panels added
  - Performance and stability maintained
  - Zero security vulnerabilities (CodeQL scan passed)

### **Version 2.4 - Camera Rig Path Visualization:**
- ✨ **3D Path Visualization** - Real-time visual feedback of camera rig trajectories in the viewport
  - Color-coded paths: Orbit (Cyan), Dolly (Green), Crane (Magenta), Custom (White)
  - Sphere markers at keyframe positions with size variations based on easing type
  - "Show Paths" and "Show Keyframe Markers" toggles in Camera Rig tab
  - Paths update in real-time as rig parameters change
  - Automatic path sampling (2-60 samples per rig for optimal performance)
  - Proper memory management with geometry disposal on updates
- 🐛 **Fixed Dolly Rig Behavior** - Camera now correctly looks at scene center instead of following the rig position
  - Creates proper tracking shots while keeping the scene in view
  - Dolly rig now useful for forward/backward, lateral, and vertical camera movements

### **Version 2.4 - Advanced Skybox & Material System:**
- ✨ **6 Skybox/Background Modes (Software Mode)** - Solid Color, Gradient, Image/Skybox, Stars, Galaxy, Nebula
  - **Gradient Skybox** - Vertical color gradients with custom GLSL shaders (top/bottom color control)
  - **Image/Skybox** - Load equirectangular panoramic images via URL (supports HDRI from Poly Haven)
  - **Procedural Stars** - 1,000-10,000 randomly distributed stars with adjustable count
  - **Procedural Galaxy** - Spiral galaxy visualization with customizable color tint
  - **Procedural Nebula** - Multi-color gas clouds with dual-color customization and shader-based fog effects
- ✨ **Professional Material System (Software Mode)** - Per-shape material controls
  - **4 Material Types** - Basic (Unlit), Standard (PBR), Phong (Shiny), Lambert (Matte)
  - **PBR Support** - Metalness and roughness sliders for Standard materials (0.0-1.0 range)
  - **Per-Shape Controls** - Independent material, color, opacity, and wireframe settings for Cubes, Octahedrons, Tetrahedrons, and Sphere
  - **Reset Functionality** - One-click reset to default material values
- 🔧 **Removed Redundant UI** - Removed "🎨 Colors" section from Software Mode (replaced by per-shape material controls)
- 🎨 **Enhanced Visual Fidelity** - Physically-based rendering for realistic material appearance with scene lighting

### **Version 2.3 - UI/UX Enhancements & Keyframe Architecture:**
- ✨ **Keyboard Shortcuts Modal** - Software Mode now has ? button to show available shortcuts
- ✨ **Camera Rig Visual Hints** - Toggleable position markers, target indicators, path preview, reference grid
- ✨ **Keyframe-Based Camera Rotation** - Removed global rotation slider, now exclusively keyframe-controlled
- ✨ **Keyframe-Based Parameter Events** - Changed from time+duration to startTime+endTime model
- ✨ **Camera Rig Documentation** - Comprehensive documentation (1,377 lines) covering all rig systems
- ✨ **Frequency Gain Controls** - Restored bass/mids/highs gain multipliers (0-3x range)
- 🐛 **Audio Duplication Fix** - Fixed bug where dragging time slider during playback caused audio duplication
- 🐛 **Post-FX Tab Fix** - Fixed ReferenceError crash, documented unimplemented features
- 📝 **Enhanced README** - Added detailed keyboard shortcuts for both modes, organized by category

### **Version 2.2 - Dual-Mode Architecture:**
- ✨ **Main Dashboard** - Mode selection screen for Editor vs Software modes
- ✨ **Software Mode** - Complete streamlined visualizer with tabbed interface
- ✨ **Multiple Audio Tracks** - Software mode supports mixing multiple audio files
- ✨ **Parameter Events System** - Advanced effects in Software mode
- ✨ **Animated Letterbox** - Keyframe-based letterbox in Software mode
- ✨ **Camera Shake Events** - Time-triggered shake effects
- ✨ **Dual Workflow** - Professional and simple modes for different use cases

### **Version 2.1 - Architecture Refactor:**
- ✨ Scene Explorer Component - Blender-style object hierarchy panel
- ✨ Extended WorkspaceObject Types - Support for camera and light objects
- ✨ Camera Object Properties - Type system for camera-specific settings
- ✨ Multiple Cameras Foundation - Architecture supports camera animation

### **Phase 5 - UI Structure:**
- ✨ Keyboard shortcuts modal with comprehensive reference
- ✨ Undo/Redo functionality with full history tracking
- ✨ After Effects-style layout refinements
- ✨ Professional keyboard shortcut system

### **Phase 4 - Preset Rework:**
- ✨ Parameter-driven presets (density, speed, intensity, spread)
- ✨ Real-time parameter editing with live preview
- ✨ No hardcoded geometry or camera
- ✨ Presets as starting configurations

### **Phase 3 - Workspace:**
- ✨ Blender-like 3D workspace mode (toggle with W key)
- ✨ OrbitControls for camera navigation
- ✨ TransformControls with visual gizmos
- ✨ Manual object creation and editing

### **Phase 2 - Project System:**
- ✨ New Project modal before editor loads
- ✨ Project settings schema for save/load
- ✨ Resolution presets and FPS configuration

### **Phase 1 - Core Stability:**
- ✨ Single unified render loop
- ✨ Stabilized Three.js lifecycle
- ✨ Enhanced audio system with validation
- ✨ Timeline as single source of truth

---

## **Future Enhancement Ideas**

### **Priority:**
- **Database Persistence** - Save/load projects with Neon
- **More Animation Presets** - Expand the visual library
- **Color Tags** - Organize layers with color labels (Editor mode)
- **Enhanced Post-Processing** - Bloom, chromatic aberration effects

### **Next Phase:**
- **Enhanced Keyboard Shortcuts** - Extended hotkey system for faster workflow
- **Collapsible Panels** - Maximize canvas by hiding panels (Editor mode)
- **More Easing Functions** - Additional easing options for camera keyframes
- **Preset Transition Controls** - Customize blend time between presets
- **Multi-select Keyframes** - Select and edit multiple keyframes at once

### **Long-term:**
- **Particle Systems** - Additional visual effects
- **MIDI Controller Support** - Hardware control integration
- **Real-time Microphone Input** - Live audio visualization
- **Multiple Export Formats** - MP4, GIF, image sequences
- **Preset Saving/Loading** - Save compositions as templates
- **Beat Detection** - Automated section creation
- **Lyrics Overlay System** - Synchronized text display
- **Layer Grouping** - Organize complex compositions (Editor mode)
- **Effect Stack** - Multiple effects per layer

---

## **Documentation**

### **Core Documentation:**
- **[README.md](README.md)** - Project overview and getting started guide
- **[Camera Rig System](CAMERA_RIG_DOCUMENTATION.md)** - Complete camera rig documentation
- **[Camera Rig Quick Reference](docs/CAMERA_RIG_QUICK_REFERENCE.md)** - Quick reference for developers

### **Technical Guides:**
- Camera keyframe animation with smooth interpolation
- Four camera rig types (Orbit, Dolly, Crane, Custom)
- Easing functions and motion curves
- Camera shake system for impact effects
- Audio-reactive camera positioning

---

**Version:** 2.5 (Camera Rig Polish & Enhancements)  
**Version:** 2.4 (Camera Rig Path Visualization)  
**Version:** 2.4 (Advanced Skybox & Material System)  
**Last Updated:** 01/03/2026  
**License:** MIT  
**Author:** Yorisounai20

---

## **Development Roadmap**

### **✅ Completed:**
- Version 2.5: Camera Rig Polish & Enhancements (Rig Transitions, Framing Controls, Camera FX Layer, Shot Presets)
- Version 2.4: Camera Rig Path Visualization, Dolly Rig Fix
- Version 2.4: Advanced Skybox & Material System (6 skybox modes, 4 material types, PBR support)
- Version 2.3: UI/UX Enhancements, Keyframe Architecture, Camera Rig Documentation
- Version 2.2: Dual-mode architecture (Main Dashboard, Editor + Software modes)
- Version 2.1: Scene Explorer, extended object types, camera/light support
- Phase 10: All 9 features (waveform, 3D text, keyframes, debug console, etc.)
- Phase 1: Core Stability (unified render loop, stabilized lifecycle)
- Phase 2: Project System (new project modal, settings schema)
- Phase 3: Workspace (Blender-like viewport, object creation, transform controls)
- Phase 4: Preset Rework (parameter-driven templates)
- Phase 5: UI Structure (keyboard shortcuts, undo/redo)
- Final Refactor: Scene Explorer component, extended object types

### **🔨 In Progress:**
- Scene Explorer integration into main layout
- Canvas resize based on timeline height
- Camera settings migration to object properties
- Preset menu relocation to workspace controls
- Multiple camera implementation
- Form field accessibility improvements

### **📋 Planned:**
- Database persistence with Neon
- Save/Load project functionality
- Advanced camera animation system
- Enhanced lighting controls
- More animation presets
