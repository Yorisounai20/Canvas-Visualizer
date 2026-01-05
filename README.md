# 🎵 Canvas Visualizer - 3D Music Video Creator

## **Development Status**

**Current Version:** 2.5 - Camera Rig Polish & Enhancements

Professional music video creation tool with **two workflow modes**: A comprehensive **Editor Mode** with After Effects-style interface, Blender-like workspace, Scene Explorer, timeline-based animation, and keyframe systems; plus a streamlined **Software Mode** for quick, simple visualizations with advanced skybox backgrounds and professional material controls.

**Dual-Mode Architecture:**
- 🎬 **Editor Mode** - Professional interface with layers, timeline, workspace, and advanced controls
- ⚡ **Software Mode** - Simple, streamlined interface for quick visualizations
- 🎨 Main Dashboard for mode selection at startup

---

## **What Is This?**

**Canvas Visualizer** is a web-based 3D music video creation tool with two workflow modes:

- **🎬 Editor Mode** - A professional music video editor with an After Effects-style interface featuring layers, timeline, properties inspector, workspace mode, and real-time 3D preview. Perfect for complex projects with precise control over every detail.

- **⚡ Software Mode** - A streamlined, simplified visualizer for quick music visualizations. Upload audio, choose a preset, customize colors, and export. Ideal for rapid prototyping and simple projects.

Both modes create audio-reactive 3D animations synchronized to music, with support for 25 animation presets, custom colors, camera controls, and high-quality video export.

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

- **Parameter Events** - Background flash, vignette pulse, saturation burst, color tint flash
- **Multi-Track Audio** - Mix multiple audio files with independent volume control
- **Animated Letterbox** - Keyframe-based curtain effects
- **Camera Shake Events** - Time-triggered shake with adjustable intensity

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

### **2. Editor Mode Workflow:**

1. **Configure Project** - Select resolution preset (720p-4K, Instagram formats) and set FPS
2. **Upload Audio** - Load your audio file (optional during project creation)
3. **Create Sections** - Split your song into timeline sections
4. **Assign Presets** - Choose animation presets for each section
5. **Customize** - Adjust colors, camera, effects in the Properties panel
6. **Add Keyframes** - Create preset, camera, or text keyframes on the timeline
7. **Preview** - Click Play to preview your composition
8. **Export** - Click Export to render the final video at project resolution

### **3. Software Mode Workflow:**

1. **Upload Audio** - Navigate to the Waveforms tab and click "Add Track"
2. **Choose Preset** - Switch to the Presets tab and select an animation preset
3. **Customize** - Use the Controls tab to adjust frequency gains and shape materials
4. **Configure Camera** - Set up camera position or create camera rigs
5. **Add Effects** - Go to the Effects tab to set up skybox, letterbox, or shake events
6. **Preview** - Click Play in the waveform section to watch your visualization
7. **Export** - Click Export button to select resolution and render the final video

### **Development:**
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Run TypeScript type checking
npm run lint         # Run ESLint
```

### **Database Setup (Optional - For Save/Load Functionality):**

Canvas Visualizer supports saving and loading projects to a Neon PostgreSQL database. This is **optional** - the application works perfectly fine without it.

#### **Setup Steps:**

1. **Create a Neon Database:**
   - Visit [neon.tech](https://neon.tech) and create a free account
   - Create a new project and database
   - Copy your connection string (it will look like: `postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require`)

2. **Configure Environment Variable:**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your Neon connection string:
     ```
     VITE_DATABASE_URL=postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
     ```

3. **Initialize Database:**
   - The database schema is automatically created when you first launch the app
   - A `projects` table will be created to store your saved projects

4. **Using Save/Load:**
   - **Save Project:** Click the "Save" button in the top bar or press `Ctrl+S` (Cmd+S on Mac)
   - **Open Project:** Click the "Open" button in the top bar or press `Ctrl+O` (Cmd+O on Mac)
   - **Projects are saved with:**
     - All timeline sections and keyframes (Editor mode)
     - Camera settings and animations
     - Color schemes and visual settings
     - Environment and effect configurations
   - **Note:** Audio files are NOT saved - you'll need to re-upload them when loading a project

#### **Database Schema:**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  project_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

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
| | Ctrl/Cmd + S | Save project |
| | Ctrl/Cmd + O | Open/Load project |
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
| Ctrl/Cmd + S | Save project |
| Ctrl/Cmd + O | Open/Load project |

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

## **Recent Changes & Improvements**

### **Version 2.5 - Camera Rig Polish & Enhancements (Latest):**
- ✨ Rig transitions with smooth interpolation and easing curves
- ✨ Framing controls (look-at offset, framing lock, rule of thirds)
- ✨ Camera FX layer (shake intensity, handheld drift, FOV ramping)
- ✨ Six cinematic shot presets (Close-Up, Wide Shot, Overhead, Low Angle, Dutch Angle, Tracking)
- ✨ **Database persistence with Neon PostgreSQL**
- ✨ **Save/Load project functionality for both Editor and Software modes**

### **Version 2.4:**
- ✨ 3D path visualization for camera rigs with color-coded trajectories
- ✨ Fixed Dolly Rig behavior for proper tracking shots
- ✨ 6 skybox/background modes (Solid, Gradient, Image, Stars, Galaxy, Nebula)
- ✨ Professional material system with 4 types (Basic, Standard PBR, Phong, Lambert)
- ✨ Per-shape material controls with metalness and roughness

### **Version 2.3:**
- ✨ Keyboard shortcuts modal and camera rig visual hints
- ✨ Keyframe-based camera rotation and parameter events
- ✨ Comprehensive camera rig documentation

### **Version 2.2:**
- ✨ Dual-mode architecture (Editor + Software modes)
- ✨ Main dashboard for mode selection
- ✨ Multiple audio track support with mixing
- ✨ Animated letterbox and camera shake events
- ✨ Enhanced audio system with validation
- ✨ Timeline as single source of truth

---

## **Documentation**

### **Core Documentation:**
- **[README.md](README.md)** - Project overview and getting started guide
- **[Camera Rig System](CAMERA_RIG_DOCUMENTATION.md)** - Complete camera rig documentation
- **[Camera Rig Quick Reference](docs/CAMERA_RIG_QUICK_REFERENCE.md)** - Quick reference for developers

---

**Version:** 2.5 (Camera Rig Polish & Enhancements)  
**Last Updated:** January 2026  
**License:** MIT  
**Author:** Yorisounai20

---

## **Development Roadmap**

### **✅ Completed:**
- Version 2.5: Camera Rig Polish & Enhancements + Database Persistence
- Version 2.4: Camera Rig Path Visualization & Advanced Skybox/Material System
- Version 2.3: UI/UX Enhancements & Keyframe Architecture
- Version 2.2: Dual-mode architecture (Editor + Software modes)
- Version 2.1: Scene Explorer & extended object types
- Core features: Timeline system, 25 animation presets, workspace mode, project system, keyboard shortcuts, undo/redo
- **Database persistence with Neon PostgreSQL**
- **Save/Load project functionality (both Editor and Software modes)**

### **📋 Planned:**

**Priority:**
- More animation presets
- Enhanced post-processing (bloom, chromatic aberration)
- Color tags for layer organization

**Next Phase:**
- Collapsible panels to maximize canvas
- More easing functions for keyframes
- Preset transition controls
- Multi-select keyframes

**Long-term:**
- Particle systems and additional visual effects
- MIDI controller support
- Real-time microphone input
- Multiple export formats (MP4, GIF, image sequences)
- Beat detection for automated section creation
- Lyrics overlay system
- Layer grouping and effect stacks
