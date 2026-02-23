# Projects Page Implementation Guide

## Overview

The Projects Page provides a CapCut-style gallery interface for managing audio visualization projects with autosave and version history capabilities.

## Features Implemented

### 🎨 Projects Gallery
- **Responsive Grid Layout**: Automatically adjusts from 1-4 columns based on screen size
- **Project Cards**: Display thumbnails, metadata (resolution, sections, last modified)
- **Real-time Search**: Debounced search by project name (300ms delay)
- **Multiple Sort Options**: Recent, Name (A-Z/Z-A), Created Date, Modified Date
- **Smart Filtering**: All Projects, Recent (7 days), This Week, This Month
- **Empty States**: Custom UI for no projects or no search results

### 🔧 Project Management
- **Create**: NewProjectModal integration for configuring new projects
- **Open**: Load project and navigate to visualizer
- **Rename**: In-place project renaming
- **Duplicate**: Create a copy of existing project
- **Delete**: Remove project with confirmation
- **Context Menu**: Quick access to all actions via right-click or ⋮ button

### 💾 Database Integration
- **PostgreSQL Schema**: Extended projects table with new metadata fields
- **Version History Table**: Stores autosave and manual save versions
- **Optimized Indexes**: Fast sorting and filtering queries
- **Thumbnail Storage**: Base64 image data stored directly in database

### 🛠️ Core Services

#### AutosaveService
```typescript
import { autosaveService } from './lib/autosaveService';

// Start autosaving
autosaveService.start(projectId, getProjectState, userId, onSaveCallback);

// Configure settings
autosaveService.updateSettings({
  enabled: true,
  intervalMs: 3 * 60 * 1000, // 3 minutes
  maxVersions: 20
});

// Stop autosaving
autosaveService.stop();
```

#### Thumbnail Generation
```typescript
import { generateThumbnail, generatePlaceholderThumbnail } from './lib/thumbnailService';

// Generate from canvas
const thumbnailUrl = await generateThumbnail(canvasElement);

// Generate placeholder
const placeholderUrl = generatePlaceholderThumbnail('My Project');
```

#### Time Formatting
```typescript
import { formatRelativeTime, formatDateTime } from './lib/relativeTime';

formatRelativeTime('2024-01-20T10:00:00Z'); // "2 hours ago"
formatDateTime('2024-01-20T10:00:00Z');     // "Today at 10:00 AM"
```

## Database Schema

### Projects Table (Extended)
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  project_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_opened_at TIMESTAMP,           -- NEW
  thumbnail_url TEXT,                  -- NEW
  has_unsaved_autosave BOOLEAN DEFAULT FALSE  -- NEW
);
```

### Project Versions Table (New)
```sql
CREATE TABLE project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_autosave BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT
);
```

## API Reference

### Database Functions

#### Project Management
```typescript
// Rename a project
await renameProject(projectId, newName, userId?);

// Duplicate a project
const newProject = await duplicateProject(projectId, newName, userId?);

// Update last opened timestamp
await updateLastOpenedAt(projectId, userId?);

// Update thumbnail
await updateThumbnail(projectId, thumbnailDataUrl, userId?);
```

#### Version Management
```typescript
// Create a new version
const version = await createVersion(projectId, projectData, isAutosave, description?);

// Get versions for a project
const versions = await getVersions(projectId, limit?, offset?);

// Get a specific version
const version = await getVersion(versionId);

// Cleanup old autosaves
const deletedCount = await cleanupOldAutosaves(projectId, keepCount);
```

## Usage Guide

### 1. Navigation
- Click "My Projects" on the home page
- Or navigate directly to `/projects`
- Click back arrow to return to home

### 2. Creating a New Project
1. Click "+ New Project" button
2. Configure project settings in modal:
   - Project name
   - Resolution (preset or custom)
   - Frame rate (24/30/60 FPS)
   - Background color
   - Audio file (optional)
3. Click "Create Project"
4. Automatically navigates to visualizer

### 3. Managing Projects
- **Open**: Click on project card
- **Search**: Type in search bar
- **Sort**: Use "Sort:" dropdown
- **Filter**: Use "Filter:" dropdown
- **Actions**: Click ⋮ or right-click on card
  - Rename
  - Duplicate
  - Version History (coming soon)
  - Delete

### 4. Project Cards
- **Thumbnail**: 16:9 preview image
- **Name**: Project title
- **Time**: Last modified/opened
- **Metadata**: Resolution and section count
- **Hover**: Shows "Open" overlay button

## Component Architecture

```
src/
├── pages/
│   └── ProjectsPage.tsx              # Main page component
├── components/
│   └── Projects/
│       ├── ProjectCard.tsx           # Individual project card
│       ├── ProjectGrid.tsx           # Responsive grid layout
│       ├── SearchBar.tsx             # Debounced search input
│       ├── SortFilterBar.tsx         # Sort and filter controls
│       └── ProjectContextMenu.tsx    # Right-click menu
├── hooks/
│   └── useProjects.ts                # Projects state management
├── lib/
│   ├── database.ts                   # Database operations (extended)
│   ├── autosaveService.ts            # Autosave background service
│   ├── thumbnailService.ts           # Thumbnail generation
│   └── relativeTime.ts               # Time formatting utilities
```

## Keyboard Shortcuts (Planned)

- `Ctrl/Cmd + N`: New Project
- `Ctrl/Cmd + F`: Focus Search
- `Enter`: Open selected project
- `Delete`: Delete selected project
- `Escape`: Close modals
- `Arrow Keys`: Navigate project grid

## Responsive Design

### Desktop (1920px+)
- 4 columns
- Full controls visible
- Large thumbnails

### Tablet (768px - 1919px)
- 2-3 columns
- Compact controls
- Medium thumbnails

### Mobile (< 768px)
- 1-2 columns
- Stacked controls
- Small thumbnails

## Environment Variables

```env
VITE_DATABASE_URL=postgresql://user:password@host:port/database
```

## Future Enhancements

### Version History (Planned)
- View all versions in modal
- Restore previous versions
- Compare version differences
- Delete specific versions

### Autosave Integration (Planned)
- Background autosaving every N minutes
- Visual autosave indicator
- Autosave settings panel
- Conflict resolution

### Additional Features (Planned)
- Bulk operations (select multiple)
- Project folders/collections
- Project tags
- Favorites/pinned projects
- Export/import projects
- Project templates

## Performance Considerations

- **Pagination**: Currently loads all projects, future: implement pagination
- **Thumbnails**: Lazy loading as cards enter viewport
- **Search**: Debounced to prevent excessive re-renders
- **Database**: Indexed queries for fast sorting/filtering
- **Version Cleanup**: Automatic cleanup of old autosaves

## Error Handling

- Database connection errors
- Missing thumbnails (fallback to placeholder)
- Failed project operations (user notification)
- Graceful degradation when database unavailable

## Testing Checklist

- [ ] Create new project
- [ ] Open existing project
- [ ] Rename project
- [ ] Duplicate project
- [ ] Delete project
- [ ] Search projects
- [ ] Sort by all options
- [ ] Filter by all options
- [ ] Responsive design on all screen sizes
- [ ] Error states display correctly
- [ ] Empty states display correctly
- [ ] Keyboard navigation works
- [ ] Context menu positioning
- [ ] Thumbnail generation
- [ ] Database operations with real data

## Troubleshooting

### Database not configured error
- Ensure `VITE_DATABASE_URL` is set in `.env` file
- Verify PostgreSQL connection is working
- Check that database has been initialized

### Thumbnails not showing
- Check browser console for errors
- Verify canvas element is accessible
- Fall back to placeholder thumbnails

### Projects not loading
- Check network tab for failed requests
- Verify user authentication (if enabled)
- Check database connection

## Contributing

When adding new features to the Projects Page:

1. Update the spec document if behavior changes
2. Add proper TypeScript types
3. Include error handling
4. Add loading states
5. Test responsive design
6. Update this documentation
7. Add screenshots for UI changes

## License

Same as main project license.
