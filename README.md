# 🎵 Canvas Visualizer

A web-based 3D music video creation tool that creates audio-reactive visualizations synchronized to your music.

## 🚀 Try It Now

**[Launch Canvas Visualizer](https://canvas-visualizer.vercel.app)** - Start creating music videos instantly, no installation required!

## Features

**Core Capabilities:**
<<<<<<< HEAD
- **43+ Animation Presets** - Orbital Dance, Explosion, Tunnel Rush, Wave Motion, Spiral Galaxy, Azure Dragon, and more
- **Real-time Audio Analysis** - Frequency detection (bass, mids, highs) with audio-reactive animations
- **Advanced Timeline System** - Keyframe-based animation with smooth transitions and preset speed control
- **Camera Rig System** - 7 rig types (Orbit, Rotation, Dolly, Pan, Crane, Zoom, Custom)
- **CameraFX & Effects** - Shake events, handheld drift, FOV ramping, parameter-driven animations
- **Particle System** - Timeline-based emitters with audio-reactive behavior
- **Skybox Backgrounds** - Solid color, gradient, images, procedural stars/galaxy/nebula
- **Material System** - Basic (unlit), Standard PBR, Phong, Lambert with per-shape customization
- **Text Animation** - Dynamic text with character staggering and animation effects
- **Letterbox & Overlays** - Animated overlay effects with smooth transitions
- **Post-Processing** - Vignette, color correction, saturation, contrast, gamma, tint
- **Frame-by-Frame Export** - Captures individual frames at 30 FPS for high-quality encoding
- **Professional Video Export** - WebM (VP8/VP9) and MP4 formats, 960×540 to 4K resolution
- **Project Save/Load** - Neon PostgreSQL with autosave (optional)
- **Undo/Redo** - Full version history support
=======
- 43 animation presets (Orbital Dance, Explosion, Tunnel Rush, Wave Motion, Spiral Galaxy, and many more)
- Real-time audio frequency analysis (bass, mids, highs)
- Timeline-based animation with smooth transitions
- Camera rig system with 7 rig types and cinematic shot presets
- Skybox backgrounds (solid, gradient, image, stars, galaxy, nebula)
- Professional material system (Basic, Standard PBR, Phong, Lambert)
- High-quality video export with resolution-based bitrate scaling (8-20 Mbps)
- Optimized UI performance with 5 FPS timeline updates for smooth interactions
- Project save/load with Neon PostgreSQL
>>>>>>> f433b9ec77394781638fc49f404b72e102c52269

## Quick Start (For Developers)

Want to run locally or contribute? Here's how:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173

3. **Choose a mode:**
   - **Editor Mode** - Configure project settings, then build your music video
   - **Software Mode** - Upload audio and start visualizing immediately

## Getting Started

**Basic Workflow:**
1. **Load Audio** - Upload MP3, WAV, OGG, M4A, or FLAC file
2. **Choose Preset** - Select from 43+ animation presets
3. **Create Timeline** - Add preset keyframes with smooth transitions
4. **Customize** - Adjust colors, camera, effects, and parameters
5. **Add Keyframes** - Create camera rig, text, and effect animations
6. **Preview** - Test with Editor view (full interface) or Preview view (canvas only)
7. **Export** - Render to WebM or MP4 at preferred resolution

**Timeline Keyframing:**
- **Preset Keyframes** - Switch animation presets with fade transitions
- **Preset Speed Keyframes** - Control animation speed over time
- **Camera Rig Keyframes** - Animate camera with position, target, FOV, easing
- **CameraFX Events** - Shake, drift, FOV ramping
- **Text Animator** - Timed text with character stagger effects
- **Letterbox Animation** - Smooth animated overlays
- **Parameter Events** - Audio-triggered effects (flashes, pulses, bursts)
- **Environment Keyframes** - Background and skybox changes

## Project Save/Load (Optional)

Canvas Visualizer can save projects to a Neon PostgreSQL database. This is **optional** - the app works without it.

**Setup:**
1. Create a free account at [neon.tech](https://neon.tech)
2. Copy `.env.example` to `.env`
3. Add your connection string: `VITE_DATABASE_URL=postgresql://...?sslmode=require`
4. Database schema created automatically on first use

**Usage:**
- Save: Ctrl+S (Cmd+S on Mac) or click Save button
- Open: Ctrl+O (Cmd+O on Mac) or click Open button
- Projects store: sections, keyframes, camera, colors, effects
- Audio files NOT saved - re-upload when loading projects

## Tech Stack

- **React 18** - UI framework with hooks
- **TypeScript** - Type safety
- **Three.js (0.182.0)** - 3D graphics via WebGL
- **Web Audio API** - Audio analysis
- **MediaRecorder API** - Video export
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Neon PostgreSQL** - Optional project storage
- **React Router DOM** - Client-side routing

## Architecture Overview

**Component Structure:**
- `visualizer-software.tsx` - Main visualization engine with animation loop and Three.js logic
- `components/` - UI components (Inspector tabs, timeline, export modal, panels)
- `lib/` - Utilities (audio processing, preset transitions, project state, database)
- `presets/` - Animation solver functions (modular preset implementations)

**Animation System:**
- 60 FPS real-time animation loop (30 FPS during frame-by-frame export)
- Web Audio API frequency analysis with 2048-point FFT
- Preset-based architecture with smooth transition blending (0.5s default)
- Keyframe system for timeline control
- 8 cubes, 30+ octahedrons, 30 tetrahedrons, 1 sphere, particle system

**Export Pipeline:**
- Frame-by-frame capture at 30 FPS
- Canvas-to-blob rendering per frame
- MediaRecorder API for video encoding
- WebM duration metadata fixing for seeking support

**Available Animation Presets:**
Orbital Dance, Explosion, Tunnel Rush, Wave Motion, Spiral Galaxy, Chill Vibes, Pulse Grid, Vortex Storm, Azure Dragon, Kaleidoscope, Meteor Shower, DNA Helix, Fireworks, Matrix Rain, Ripple Wave, Constellation, Pendulum, Blooming Flower, Tornado, Hypercube, Fractal Tree, Binary Stars, Ribbon Dance, Hourglass, Snowflake, Hammerhead Shark, Cosmic Rings, Cityscape, Ocean Waves, Forest Scene, Portal Network, Disco Ball, Wind Turbines, Clock Mechanism, Neon Tunnel, Atom Model, Carousel, Solar System, Data Stream, Ferris Wheel, Stadium, and more

**Keyframing System:**
- Preset keyframes with automatic fade transitions
- Camera rig keyframes (Orbit, Rotation, Dolly, Pan, Crane, Zoom, Custom)
- Text animator keyframes with character stagger
- Letterbox animation with smooth easing
- Parameter events for audio-triggered effects
- Timeline-based particle emitters
- Environment and skybox keyframes

**Visual Effects:**
- **Skybox Modes:** Solid color, gradient, image (HDRI), procedural stars, galaxy, nebula
- **Particle System:** Timeline-based emitters with audio-reactive properties
- **Camera Effects:** Shake, handheld drift, FOV ramping, parameter animations
- **Post-Processing:** Vignette, color correction, saturation, contrast, gamma, tint
- **Overlays:** Animated letterbox, text layers, mask system

**Material System:**
- Basic (unlit, flat)
- Standard PBR (metalness, roughness)
- Phong (specular highlights)
- Lambert (diffuse, matte)
- Per-shape customization with opacity and wireframe

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Run TypeScript checks
npm run lint         # Run ESLint
```

Since this feature flag documentation is orphaned and no longer relevant, I recommend removing it entirely. The `$SELECTION_PLACEHOLDER$` should simply be deleted rather than replaced with updated content.

If you'd like to keep a placeholder section, you could add a brief note about future development instead:

```markdown
## Coming Soon

Additional features and improvements are in active development.
```

## Keyboard Shortcuts

**Editor Mode:**
- Space - Play/Pause
- W - Toggle Workspace Mode
- ` - Toggle Debug Console
- Ctrl/Cmd+Z/Y - Undo/Redo
- Ctrl/Cmd+S - Save | Ctrl/Cmd+O - Open
- [ / ] - Previous/Next section
- ← / → - Navigate timeline
- See full list in app (? button)
- Space - Play/Pause
- G - Toggle camera rig visual hints
- Ctrl/Cmd+E - Switch to Editor view (shows panels and timeline)
- Ctrl/Cmd+Shift+P - Switch to Preview view (canvas only)
- Ctrl/Cmd+S - Save | Ctrl/Cmd+O - Open
- Esc - Close modals

## File Format Support

- **Audio:** MP3, WAV, OGG, M4A, FLAC (browser-supported formats)
- **Video Output:** WebM (VP9 + Opus), MP4 (if browser supports)
- **Font Input:** Three.js .typeface.json format

## Browser Compatibility

- ✅ Chrome/Edge - Full support
- ✅ Firefox - Full support
- ✅ Safari - Full support (user interaction required for audio)
- ❌ Internet Explorer - Not supported

<<<<<<< HEAD
=======
## Performance

- Target 30 FPS during recording, 60 FPS during playback
- FFT size: 2048
- Video bitrate: Resolution-adaptive (8 Mbps @ 540p, 12 Mbps @ 720p, 20 Mbps @ 1080p)
- Timeline updates: 5 FPS (200ms intervals) for optimal UI responsiveness
- Memory scales with audio file length
- Timeslice recording every 1 second for improved export reliability

## Recent Improvements (PR #88)

**Export System Enhancements:**
- ✅ Resolution-adaptive bitrate scaling for superior video quality
- ✅ Timeslice recording with periodic buffer flush for better reliability
- ✅ WebM duration metadata fix for proper video seeking
- ✅ Error resilience with graceful degradation

**Performance Optimizations:**
- ✅ Timeline updates reduced to 5 FPS (50% fewer React re-renders)
- ✅ Removed diagnostic logging overhead for smoother UI
- ✅ Instant button response and modal rendering
- ✅ Smooth 60 FPS playback with optimized animation loop

**Timeline Improvements:**
- ✅ Camera FX clips track fully restored in TimelineV2
- ✅ Drag, resize, and snap-to-grid functionality
- ✅ Per-track waveform visualization with RAF throttling

## Documentation

For detailed guides and technical documentation, see the `docs/` directory:
- **[Camera Rig System](CAMERA_RIG_DOCUMENTATION.md)** - Complete camera rig guide
- **[Quick Start Guide](QUICK_START.md)** - Getting started tutorial
- **[Testing Guide](docs/guides/TESTING_GUIDE.md)** - Testing instructions
- **[Database Setup](docs/guides/DATABASE_SETUP.md)** - PostgreSQL configuration
- **[More Documentation](docs/)** - Additional guides and references

>>>>>>> f433b9ec77394781638fc49f404b72e102c52269
## License & Info

**License:** MIT  
**Author:** Yorisounai20  
**Repository:** [github.com/Yorisounai20/Canvas-Visualizer](https://github.com/Yorisounai20/Canvas-Visualizer)
