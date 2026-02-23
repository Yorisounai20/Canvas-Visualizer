# Document Organization Rules

This guide ensures documentation is organized consistently and easy to find.

## Directory Structure

```
Canvas-Visualizer/
├── README.md                              # Main project overview (always at root)
├── .github/
│   ├── copilot-instructions.md           # Copilot AI guidelines
│   └── DOCUMENT_ORGANIZATION.md          # This file
├── docs/                                  # Comprehensive guides
│   ├── FEATURE_*.md                      # Feature documentation
│   ├── ARCHITECTURE_*.md                 # Architecture and design
│   ├── API_*.md                          # API references
│   └── GUIDE_*.md                        # How-to guides
└── [Feature documentation organized by purpose]
```

## Document Placement Rules

### Root Level (Must Stay)
- **README.md** - Project overview, quick start, features
- **LICENSE** - License file

### .github/ Directory
- **copilot-instructions.md** - AI assistant guidelines
- **DOCUMENT_ORGANIZATION.md** - This organizational guide

### docs/ Directory
Use for comprehensive, reference-style documentation:

**Pattern:** `docs/[CATEGORY]_[TOPIC].md`

**Categories:**
- `ARCHITECTURE_` - System design, component structure, data flow
- `GUIDE_` - How-to guides, tutorials, step-by-step instructions  
- `FEATURE_` - Individual feature documentation
- `API_` - API references, function signatures
- `PERFORMANCE_` - Performance tuning, optimization guides
- `DEPLOYMENT_` - Deployment, build, release procedures
- `TESTING_` - Testing strategies, test guides
- `ROADMAP_` - Future plans, implementation roadmaps, architecture proposals
- `ARCHIVE_` - Historical fixes, past implementations, reference materials

**Examples:**
- `docs/ARCHITECTURE_ANIMATION_LOOP.md` - How the animation system works
- `docs/GUIDE_ADDING_NEW_PRESET.md` - Tutorial for creating animation presets
- `docs/FEATURE_CAMERA_RIG_SYSTEM.md` - Camera rig system documentation
- `docs/API_AUDIO_PROCESSING.md` - Audio API reference
- `docs/PERFORMANCE_EXPORT_OPTIMIZATION.md` - Export performance tips
- `docs/ROADMAP_NEON_AUTH_PLAN.md` - Authentication system implementation plan
- `docs/ARCHIVE_EXPORT_FIX_SUMMARY.md` - Historical fix documentation for reference

### Temporary/WIP Documentation
- Place in **root with clear naming:** `[STATUS]_[TOPIC].md`
- Patterns: `WIP_`, `DRAFT_`, `TEMPORARY_`
- Example: `DRAFT_FRAME_BY_FRAME_EXPORT.md`
- Move to `docs/` once finalized

### Implementation Documentation
- Implementation guides created during development should move to `docs/GUIDE_*` after completion
- Example: "Frame-by-Frame Export Implementation" → `docs/GUIDE_FRAME_BY_FRAME_EXPORT.md`

## Naming Conventions

### Do
- Use UPPERCASE for category prefix: `GUIDE_`, `FEATURE_`, `ARCHITECTURE_`
- Use descriptive, specific names: `GUIDE_CREATING_CUSTOM_PRESETS.md`
- Use underscores for spaces: `NEW_ANIMATION_PRESETS.md` (not `new animation presets.md`)
- Include date if tracking versions: `IMPLEMENTATION_2026_02_23.md`

### Don't
- Mixed case prefixes: `Guide_`, `guide_`, `Guide/` (use `GUIDE_`)
- Overly generic names: `DOCUMENTATION.md`, `NOTES.md` (be specific)
- Spaces in filenames: `My Guide.md` (use underscores)
- Numbers first (unless version tracking): `1_getting_started.md`

## Migration Checklist

When moving documentation to `docs/`:

- [ ] Choose appropriate category prefix
- [ ] Rename to `[CATEGORY]_[TOPIC].md` format
- [ ] Update any internal links (README, other docs)
- [ ] Add table of contents if >5 sections
- [ ] Ensure file is complete/finalized
- [ ] Remove from root once moved (don't duplicate)

## Examples of Properly Organized Documents

✅ **Good:**
- `docs/GUIDE_KEYFRAME_ANIMATION.md` - How to create keyframe animations
- `docs/ARCHITECTURE_EXPORT_PIPELINE.md` - Export system design
- `docs/FEATURE_TEXT_ANIMATOR.md` - Text animator feature reference
- `docs/ROADMAP_EDITOR_PREVIEW_MODE.md` - Future editor preview feature plan
- `docs/ARCHIVE_TIMELINE_RESTORATION.md` - Historical timeline restoration work
- `DRAFT_NEW_UI_REDESIGN.md` - In-progress documentation at root (temporary only)

❌ **Poor:**
- `keyframe_guide.md` - Missing category prefix
- `DOCS_KEYFRAMES.md` - Vague prefix
- `docs/keyframes.md` - Missing category
- `docs/Keyframe Animation Guide.md` - Mixed case, spaces
- Old system: Hundreds of docs at root level without organization

## Review Criteria

Before considering documentation complete:

- [ ] Placed in correct directory
- [ ] Named with appropriate category prefix
- [ ] All sections logically organized
- [ ] References to other docs use relative links
- [ ] Code examples are up-to-date

---

## Implementation Status

### ✅ Organization Complete (February 23, 2026)

**Current Structure:**
- ✅ README.md at root (main project overview)
- ✅ .github/DOCUMENT_ORGANIZATION.md (guidelines)
- ✅ .github/copilot-instructions.md (AI guidelines)
- ✅ 85 organized documents in docs/ directory with proper prefixes:
  - 20 GUIDE_ documents (tutorials, how-tos, implementation guides)
  - 8 ARCHITECTURE_ documents (system design)
  - 8 PERFORMANCE_ documents (optimization guides)
  - 6 DEPLOYMENT_ documents (deployment/setup)
  - 5 TESTING_ documents (testing guides)
  - 5 ROADMAP_ documents (future planning)
  - 2 FEATURE_ documents (feature documentation)
  - 30+ ARCHIVE_ documents (historical/reference)

**Root Directory Clean:** ✅
- Only README.md at root (required)
- All temporary/WIP docs moved to docs/ with ARCHIVE_ prefix
- No orphaned markdown files

### Future Maintenance

When adding new documentation:
1. Use appropriate category prefix
2. Place in docs/ directory (or root if truly temporary with DRAFT_/WIP_ prefix)
3. Follow naming conventions (UPPERCASE categories, underscores for spaces)
4. Add to appropriate section once complete
- [ ] No duplicate information elsewhere
- [ ] Accessible to intended audience (developers vs. users)

## Questions?

Refer to existing documentation in `docs/` for examples of properly organized guides.
