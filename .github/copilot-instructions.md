
# Might be helpful for GitHub Copilot to understand the project and provide better code suggestions. This file describes the architecture, coding conventions, and best practices for the Canvas Visualizer project. May be updated over time as the project evolves. Use this as a reference when contributing code or making changes to ensure consistency across the codebase. Most likely outdated, but may still contain useful information about the overall structure and design decisions of the project.

# Canvas Visualizer - GitHub Copilot Instructions

## Project Overview

This is a **3D music video editor** that creates real-time audio-reactive visualizations using Three.js and React. The application analyzes audio frequencies and creates synchronized 3D animations with a timeline-based system.

## Tech Stack

- **React 18** - UI framework with hooks
- **TypeScript** - Strongly typed JavaScript
- **Three.js (0.182.0)** - 3D graphics rendering via WebGL
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Web Audio API** - Audio loading and frequency analysis
- **MediaRecorder API** - Video recording functionality
- **Note:** Three.js types are provided by the library itself (no separate @types/three package needed)

## Architecture

### Core Components
- **App.tsx** - Main application entry point
- **visualizer-software.tsx** - Primary visualization component with all 3D logic
- Scene contains: 8 cubes, 30+ octahedrons, 30 tetrahedrons, 1 sphere
- 9 animation presets: Orbital Dance, Explosion, Tunnel Rush, Wave Motion, Spiral Galaxy, Chill Vibes, Pulse Grid, Vortex Storm, Azure Dragon

### State Management
- Use React hooks for state management
- useRef for Three.js objects and audio contexts (never use useState for these)
- useState for UI state, user settings, and playback status
- All state is in-memory only (no localStorage/sessionStorage due to environment constraints)

### Audio Processing
- FFT size: 2048
- Frequency bands: Bass (0-10), Mids (10-100), Highs (100-200)
- Audio context and analyser stored in refs, not state
- Buffer source recreated on each play/resume

## Coding Conventions

### React Components
- Use functional components with hooks exclusively
- Prefer arrow functions for component definitions
- Use TypeScript for all new code
- Keep components in single files unless they become too large

### TypeScript
- Enable strict type checking
- Avoid using `any` type
- Define interfaces for complex objects
- Use proper typing for Three.js objects

### Three.js Specific
- Store Three.js objects (scene, camera, renderer) in refs, never in state
- Clean up Three.js resources in useEffect cleanup functions
- Use wireframe rendering for geometric shapes
- Maintain 960x540 canvas resolution (16:9 aspect ratio)
- Use fog effects for depth perception

### Code Style
- Use single quotes for strings in JavaScript/TypeScript
- Use 2-space indentation
- Use camelCase for variables and functions
- Use PascalCase for React components
- Follow ESLint configuration (eslint.config.js)

### Audio Handling
- Always check if audioContext exists before using
- Resume audio context on user interaction (browser requirement)
- Properly disconnect and stop audio sources when pausing
- Use audioBuffer refs to store loaded audio data

### Animation System
- Timeline-based sections with start/end times
- Smooth transitions between animation presets
- All animations react to frequency data
- Camera controls: distance (5-50), height (-10 to +10), rotation (0-360°)

## Development Workflow

### Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run preview` - Preview production build

### File Structure
```
src/
  ├── App.tsx - Main app component
  ├── visualizer-software.tsx - 3D visualizer component
  ├── main.tsx - React entry point
  └── index.css - Global styles with Tailwind
```

### Testing
- No existing test infrastructure
- Manual testing required for all changes
- Test in Chrome/Edge, Firefox, and Safari when possible

## Best Practices

### Performance
- Target 30 FPS during recording, 60 FPS during playback
- Minimize object creation in animation loops
- Reuse geometry and materials when possible
- Use object pooling for particles

### Security
- Validate file inputs (audio files, font files)
- Handle JSON parsing errors gracefully
- Sanitize user-provided text for 3D text rendering

### Error Handling
- Use try-catch blocks for file operations
- Provide user feedback through the debug console
- Log errors with timestamps and type classification (info/success/error)

### UI/UX
- Provide visual feedback for all user actions
- Disable controls when audio isn't loaded
- Show loading states during font/audio loading
- Keep last 10 log messages in debug console

## Constraints and Limitations

- Recording only works when audio is playing
- Cannot access local filesystem directly (must use file inputs)
- Font loading requires external CDN or user upload
- All processing happens client-side

## Common Patterns

### Adding New Animation Preset
1. Define animation logic in the render loop section
2. Update camera position/rotation based on time
3. Modify object positions/rotations using frequency data
4. Apply colors from user-selected palette (bassColor, midsColor, highsColor)
5. Add smooth transition support from other presets

### Adding New Features
1. Add UI controls in the appropriate tab section
2. Create state variables with useState
3. Connect controls to Three.js objects via refs
4. Update render loop if needed
5. Test with different audio files and presets

### Working with Colors
- Accept hex color strings from UI (#RRGGBB)
- Convert to THREE.Color for rendering
- Apply frequency-based brightness modulation
- Use consistent color coding: Bass = primary objects, Mids = medium objects, Highs = particles

## Documentation
- Keep README.md updated with feature changes
- Use inline comments sparingly, only for complex logic
- Prefer self-documenting code with clear variable names
- Document breaking changes or API changes

## Commit Messages
- Use emoji prefixes when appropriate (✨ for features, 🐛 for fixes)
- Keep messages concise and descriptive
- Reference issue numbers when applicable
