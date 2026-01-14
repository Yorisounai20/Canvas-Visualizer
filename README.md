# 🎵 Canvas Visualizer

A web-based 3D music video creation tool that creates audio-reactive visualizations synchronized to your music.

## 🚀 Try It Now

**[Launch Canvas Visualizer](https://canvas-visualizer.vercel.app)** - Start creating music videos instantly, no installation required!

## Features

**Two Workflow Modes:**
- **🎬 Editor Mode** - Professional interface with After Effects-style layers, timeline, and advanced controls
- **⚡ Software Mode** - Streamlined interface for quick visualizations

**Core Capabilities:**
- 43 animation presets (Orbital Dance, Explosion, Tunnel Rush, Wave Motion, Spiral Galaxy, and many more)
- Real-time audio frequency analysis (bass, mids, highs)
- Timeline-based animation with smooth transitions
- Camera rig system with 7 rig types and cinematic shot presets
- Skybox backgrounds (solid, gradient, image, stars, galaxy, nebula)
- Professional material system (Basic, Standard PBR, Phong, Lambert)
- Video export (WebM/MP4 at 720p-1080p)
- Project save/load with Neon PostgreSQL

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

**Editor Mode Workflow:**
1. Configure project resolution (720p-4K) and FPS
2. Upload audio file
3. Create timeline sections and assign presets
4. Customize colors, camera, and effects
5. Add keyframes for animations
6. Export final video

**Software Mode Workflow:**
1. Upload audio in Waveforms tab
2. Select animation preset
3. Adjust colors and materials
4. Configure camera or create camera rigs
5. Add effects (skybox, letterbox, shake)
6. Export video

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

## Key Features Detail

**43 Animation Presets:**
Orbital Dance, Explosion, Tunnel Rush, Wave Motion, Spiral Galaxy, Chill Vibes, Pulse Grid, Vortex Storm, Azure Dragon, Kaleidoscope, Meteor Shower, DNA Helix, Fireworks, Matrix Rain, Ripple Wave, Constellation, Pendulum, Blooming Flower, Tornado, Hypercube, Fractal Tree, Binary Stars, Ribbon Dance, Hourglass, Snowflake, Hammerhead Shark, Cosmic Rings, Cityscape, Ocean Waves, Forest Scene, Portal Network, Disco Ball, Wind Turbines, Clock Mechanism, Neon Tunnel, Atom Model, Carousel, Solar System, Data Stream, Ferris Wheel, Tornado Vortex, Stadium, Kaleidoscope Plus

**Camera Rig System:**
- 7 rig types: Orbit, Rotation, Dolly, Pan, Crane, Zoom, Custom
- Keyframe animation with easing functions
- 3D path visualization
- Shot presets: Close-Up, Wide Shot, Overhead, Low Angle, Dutch Angle, Tracking
- Camera FX: shake, handheld drift, FOV ramping
- Framing controls with rule of thirds

**Skybox/Background Modes:**
- Solid Color
- Gradient (customizable top/bottom)
- Image/Skybox (equirectangular, HDRI support)
- Stars (procedural, 1k-10k stars)
- Galaxy (spiral with color tint)
- Nebula (shader-based gas clouds)

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

## Feature Flags

Canvas Visualizer supports runtime feature flags for testing new features:

**Scrollable Timeline (TimelineV2):**
The new scrollable per-track timeline is available behind a feature flag:

```javascript
// Quick enable/disable in browser console:
window.enableNewTimeline()   // Enable new timeline
window.disableNewTimeline()  // Revert to legacy timeline
window.checkTimelineMode()   // Check current mode

// Or use localStorage directly:
localStorage.setItem('cv_use_scrollable_timeline', 'true');   // Enable
localStorage.setItem('cv_use_scrollable_timeline', 'false');  // Disable

// Or set via environment variable:
REACT_APP_CV_USE_SCROLLABLE_TIMELINE=true
```

Reload the page after changing the flag. The new timeline includes:
- Horizontal and vertical scrolling
- Per-track waveforms
- Smooth RAF-throttled interactions
- Snap-to-grid and keyboard navigation
- Context menu and marquee selection
- Resizable keyframe bars

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

**Software Mode:**
- Space - Play/Pause
- G - Toggle camera rig visual hints
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

## Performance

- Target 30 FPS during recording, 60 FPS during playback
- FFT size: 2048
- Video bitrate: 5 Mbps
- Memory scales with audio file length

## Documentation

- **[Camera Rig System](CAMERA_RIG_DOCUMENTATION.md)** - Complete camera rig guide
- **[Camera Rig Quick Reference](docs/CAMERA_RIG_QUICK_REFERENCE.md)** - Developer reference

## License & Info

**License:** MIT  
**Author:** Yorisounai20  
**Repository:** [github.com/Yorisounai20/Canvas-Visualizer](https://github.com/Yorisounai20/Canvas-Visualizer)
