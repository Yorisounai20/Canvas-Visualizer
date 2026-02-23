# Projects Page with Autosave & Version History - Feature Specification

## Overview

Implement a CapCut-style projects gallery page that displays all user projects in reverse chronological order (most recent first) with thumbnail previews, metadata, and quick actions. Include automatic project versioning/autosave functionality with history restoration capabilities.

---

## User Stories

**As a user, I want to:**
- See all my projects in a visual grid layout sorted by most recently opened
- Quickly identify and open recent projects without searching
- See when I last worked on each project
- Preview project thumbnails before opening
- Access project actions (open, rename, duplicate, delete) easily
- Have my work automatically saved at regular intervals
- Restore previous versions of my projects if needed
- Search and filter my projects by name
- See which projects have unsaved autosave data

---

## 1. Projects Page UI

### Layout & Design

**Page Structure:**
- Full-screen page (replaces current modal-based approach)
- Header with title "Projects" and action buttons
- Search/filter bar below header
- Grid of project cards (responsive: 2-4 columns based on screen width)
- Empty state message when no projects exist
- Loading skeleton during initial load

**Header Section:**
```
┌─────────────────────────────────────────────────────────────┐
│  Projects                          🔍 Search    + New Project │
│  ──────────────────────────────────────────────────────────  │
│  Sort: Recent ▼   Filter: All ▼                             │
└─────────────────────────────────────────────────────────────┘
```

**Project Card Grid:**
```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Thumbnail│  │ Thumbnail│  │ Thumbnail│  │ Thumbnail│
│          │  │          │  │          │  │          │
│ ──────── │  │ ──────── │  │ ──────── │  │ ──────── │
│ Title    │  │ Title    │  │ Title    │  │ Title    │
│ 2h ago   │  │ 5h ago   │  │ 1d ago   │  │ 3d ago   │
│ ⋮        │  │ ⋮        │  │ ⋮        │  │ ⋮        │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### Project Card Design

**Card Components:**
- **Thumbnail**: 16:9 aspect ratio preview image (320x180px)
  - Generated from canvas capture at last save
  - Fallback: Dark gradient with project name initial
- **Project Name**: Bold, 16px font, truncated with ellipsis
- **Last Modified**: Relative time (e.g., "2 hours ago", "3 days ago")
- **Autosave Indicator**: Small badge if unsaved autosave exists
- **Context Menu Button**: Three-dot menu (⋮) in top-right corner
- **Hover State**: Slight scale/elevation, show "Open" overlay button

**Card States:**
- Default: Gray border, subtle shadow
- Hover: Purple border, elevated shadow, show overlay
- Selected: Purple background tint (for multi-select future enhancement)

**Context Menu Options:**
- 📂 Open
- ✏️ Rename
- 📋 Duplicate
- 🕐 Version History
- 🗑️ Delete

### Sorting & Filtering

**Sort Options:**
- Recent (default) - by `lastOpenedAt` DESC
- Name (A-Z) - alphabetical
- Name (Z-A) - reverse alphabetical
- Created - by `createdAt` DESC
- Modified - by `updatedAt` DESC

**Filter Options:**
- All Projects (default)
- Recent (opened in last 7 days)
- This Week
- This Month
- Favorites (future: pinned projects)

**Search:**
- Real-time search by project name
- Debounced input (300ms)
- Clear button when text present
- Case-insensitive matching

### Empty States

**No Projects:**
```
     🎨
  No projects yet
  
  Create your first audio-reactive
  visualization project
  
  [ + New Project ]
```

**No Search Results:**
```
     🔍
  No projects found
  
  Try different search terms
  
  [ Clear Search ]
```

---

## 2. Autosave System

### Autosave Behavior

**When to Autosave:**
- Every N minutes (configurable, default: 3 minutes)
- Triggered by significant state changes (optional debounced approach)
- Only when project has unsaved changes
- Paused when user is idle for 10+ minutes

**What to Save:**
- Complete project state (same as manual save)
- All settings, keyframes, workspace objects
- Mark with `isAutosave: true` flag
- Add timestamp and version number

**User Feedback:**
- Subtle "Saving..." indicator in top bar
- "Auto-saved at [time]" message (5 seconds)
- No modal interruptions
- Silent background operation

### Version History

**Version Retention:**
- Keep last 20 autosave versions per project
- Keep all manual saves indefinitely
- Cleanup oldest autosaves when limit exceeded
- Delete all versions when project deleted

**Version Metadata:**
- Version ID (UUID)
- Timestamp (ISO 8601)
- Type: "manual" | "autosave"
- Parent project ID
- Optional: User-provided description (for manual saves)

**Version Display Format:**
```
Manual Save - Today at 2:45 PM
Autosave - Today at 2:42 PM
Autosave - Today at 2:39 PM
Manual Save - Yesterday at 4:30 PM
```

---

## 3. Version History UI

### Version History Modal

**Triggered by:** Context menu → "Version History"

**Modal Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Version History - Project Name               ✕     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ● Manual Save                                │  │
│  │   Today at 2:45 PM                          │  │
│  │   [Current Version]                   Restore│  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ○ Autosave                                   │  │
│  │   Today at 2:42 PM                          │  │
│  │                                      Restore│  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ○ Autosave                                   │  │
│  │   Today at 2:39 PM                          │  │
│  │                                      Restore│  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ● Manual Save                                │  │
│  │   Yesterday at 4:30 PM                      │  │
│  │   "Before major changes"             Restore│  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  [ Load 10 more versions... ]                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Version Item Components:**
- Icon: ● for manual saves, ○ for autosaves
- Type label: "Manual Save" or "Autosave"
- Timestamp: Relative or absolute time
- Optional description (manual saves only)
- Current version indicator
- Restore button

**Restore Confirmation:**
```
┌─────────────────────────────────────────┐
│  Restore Version?                  ✕    │
├─────────────────────────────────────────┤
│                                          │
│  Restoring this version will replace    │
│  your current project state.            │
│                                          │
│  Version: Manual Save                   │
│  From: Yesterday at 4:30 PM             │
│                                          │
│  Your current state will be saved as    │
│  an autosave before restoring.          │
│                                          │
│  [ Cancel ]         [ Restore Version ] │
│                                          │
└─────────────────────────────────────────┘
```

---

## 4. Settings Integration

### Autosave Settings Panel

**Location:** Settings modal → New "Autosave" tab

**Settings Options:**
```
┌─────────────────────────────────────────────────────┐
│  ⚙️ Autosave Settings                                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Enable Autosave                           [✓]      │
│                                                      │
│  Autosave Interval                                  │
│  ◯ 1 minute   ◉ 3 minutes   ◯ 5 minutes            │
│  ◯ 10 minutes   ◯ 15 minutes                        │
│                                                      │
│  Maximum Versions to Keep                           │
│  [20] ───────────────●─────────── (1-50)           │
│                                                      │
│  Delete Autosaves Older Than                        │
│  ◯ 7 days   ◉ 30 days   ◯ Never                     │
│                                                      │
│  [ Save Settings ]                                  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Default Settings:**
- Enable Autosave: ✓ (enabled)
- Interval: 3 minutes
- Max Versions: 20
- Delete After: 30 days

---

## 5. Database Schema Changes

### New Tables

**`project_versions` Table:**
```sql
CREATE TABLE project_versions (
  id TEXT PRIMARY KEY,              -- UUID
  project_id TEXT NOT NULL,         -- Foreign key to projects
  version_number INTEGER NOT NULL,  -- Sequential version number
  data TEXT NOT NULL,               -- JSON project state
  created_at TEXT NOT NULL,         -- ISO 8601 timestamp
  is_autosave BOOLEAN NOT NULL,     -- true = autosave, false = manual
  description TEXT,                 -- Optional description (manual saves)
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_versions_project ON project_versions(project_id);
CREATE INDEX idx_versions_created ON project_versions(created_at DESC);
```

### Modified Tables

**`projects` Table - Add Fields:**
```sql
ALTER TABLE projects ADD COLUMN last_opened_at TEXT;  -- ISO 8601
ALTER TABLE projects ADD COLUMN thumbnail_url TEXT;    -- Base64 or URL
ALTER TABLE projects ADD COLUMN created_at TEXT;       -- ISO 8601
ALTER TABLE projects ADD COLUMN has_unsaved_autosave BOOLEAN DEFAULT 0;
```

**Migration Strategy:**
- Set `last_opened_at` = `updated_at` for existing projects
- Set `created_at` = current timestamp for existing projects
- Generate placeholder thumbnails for existing projects

---

## 6. Technical Implementation

### Core Components

**File Structure:**
```
src/
  pages/
    ProjectsPage.tsx              -- Main projects page
  components/
    Projects/
      ProjectCard.tsx             -- Individual project card
      ProjectGrid.tsx             -- Responsive grid layout
      VersionHistoryModal.tsx     -- Version history UI
      RestoreConfirmModal.tsx     -- Restore confirmation
      ProjectContextMenu.tsx      -- Right-click/... menu
      SearchBar.tsx               -- Search input
      SortFilterBar.tsx           -- Sort & filter controls
  hooks/
    useAutosave.ts                -- Autosave logic hook
    useProjects.ts                -- Projects data management
    useVersionHistory.ts          -- Version history logic
  services/
    autosaveService.ts            -- Autosave background service
    projectService.ts             -- Project CRUD operations
    versionService.ts             -- Version management
    thumbnailService.ts           -- Thumbnail generation
  utils/
    relativeTime.ts               -- Format timestamps
```

### State Management

**Projects Page State:**
```typescript
interface ProjectsPageState {
  projects: Project[];
  loading: boolean;
  searchQuery: string;
  sortBy: 'recent' | 'name-asc' | 'name-desc' | 'created' | 'modified';
  filterBy: 'all' | 'recent' | 'week' | 'month';
  selectedProject: string | null;
}
```

**Project Interface (Extended):**
```typescript
interface Project {
  id: string;
  name: string;
  data: ProjectData;  // Existing project state
  created_at: string;
  updated_at: string;
  last_opened_at: string;
  thumbnail_url?: string;
  has_unsaved_autosave: boolean;
}
```

**Project Version Interface:**
```typescript
interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: number;
  data: ProjectData;
  created_at: string;
  is_autosave: boolean;
  description?: string;
}
```

### Autosave Service

**Core Logic:**
```typescript
class AutosaveService {
  private interval: NodeJS.Timeout | null = null;
  private enabled: boolean = true;
  private intervalMs: number = 3 * 60 * 1000; // 3 minutes
  
  start(projectId: string, getState: () => ProjectData) {
    this.interval = setInterval(() => {
      if (this.hasChanges() && !this.isUserIdle()) {
        this.save(projectId, getState());
      }
    }, this.intervalMs);
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  
  async save(projectId: string, data: ProjectData) {
    // Save as version with is_autosave=true
    // Update project's updated_at timestamp
    // Set has_unsaved_autosave flag
    // Cleanup old autosaves if needed
  }
  
  private hasChanges(): boolean {
    // Compare current state hash with last saved hash
  }
  
  private isUserIdle(): boolean {
    // Check last user interaction timestamp
  }
}
```

### Thumbnail Generation

**Canvas Capture:**
```typescript
async function generateThumbnail(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      // Option 1: Convert to base64 and store in DB
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
      
      // Option 2: Upload to storage service and store URL
      // uploadToStorage(blob).then(url => resolve(url));
    }, 'image/jpeg', 0.8);
  });
}
```

---

## 7. User Flows

### Flow 1: Opening Projects Page

```
1. User clicks "Back to Dashboard" or "Canvas Visualizer" → "Projects"
2. Navigate to /projects route
3. Show loading skeletons
4. Fetch all projects from database
5. Sort by last_opened_at DESC
6. Generate project cards with thumbnails
7. Display in responsive grid
```

### Flow 2: Opening a Project

```
1. User clicks project card or "Open" in context menu
2. Load project data from database
3. Check for unsaved autosave versions
4. If autosave exists:
   - Show "Restore autosave?" prompt with timestamp
   - Options: "Restore" | "Discard" | "Cancel"
5. Navigate to /visualizer with project data
6. Update last_opened_at timestamp
7. Start autosave service
```

### Flow 3: Autosave Trigger

```
1. Timer reaches interval (e.g., 3 minutes)
2. Check if state has changed (hash comparison)
3. Check if user is active (not idle)
4. Create new version entry with is_autosave=true
5. Increment version_number
6. Store project state JSON
7. Update project's updated_at timestamp
8. Set has_unsaved_autosave flag
9. Show brief "Auto-saved" indicator
10. Cleanup: Delete oldest autosave if > max versions
```

### Flow 4: Restoring a Version

```
1. User opens "Version History" from context menu
2. Fetch all versions for project (paginated, 20 at a time)
3. Display in modal with current version highlighted
4. User clicks "Restore" on a version
5. Show confirmation dialog
6. If confirmed:
   - Save current state as new autosave version
   - Load selected version data
   - Navigate to visualizer with restored data
   - Clear has_unsaved_autosave flag
   - Update last_opened_at timestamp
```

### Flow 5: Searching Projects

```
1. User types in search bar
2. Debounce input (300ms)
3. Filter projects array by name match
4. Re-render grid with filtered results
5. Show empty state if no matches
```

---

## 8. Error Handling

### Autosave Failures
- Retry up to 3 times with exponential backoff
- If all retries fail, show non-intrusive error notification
- Log error details for debugging
- Don't interrupt user workflow

### Version Restore Failures
- Show error modal: "Failed to restore version. Please try again."
- Keep user on current state (no data loss)
- Log error with version ID and project ID

### Database Errors
- Graceful degradation: Show cached projects if available
- Display error message: "Unable to load projects. Please refresh."
- Retry button in error state

---

## 9. Performance Considerations

### Optimization Strategies

**Thumbnail Loading:**
- Lazy load thumbnails as cards enter viewport
- Use low-quality placeholder initially
- Cache loaded thumbnails in memory
- Consider thumbnail CDN for large-scale deployment

**Version History:**
- Paginated loading (20 versions at a time)
- Virtual scrolling for large version lists
- Load on-demand, not on page load

**Autosave Efficiency:**
- Hash-based change detection (don't save if no changes)
- Compress JSON data before storing
- Batch multiple small changes into single save
- Pause autosave when user is idle

**Database Queries:**
- Index on last_opened_at for fast sorting
- Index on project_id for version lookups
- Limit initial project load (pagination if needed)
- Use SQLite's JSON functions for efficient queries

---

## 10. Accessibility

### Keyboard Navigation
- Tab through project cards in order
- Enter/Space to open project
- Context menu keyboard shortcut (Shift+F10 or Menu key)
- Escape to close modals
- Arrow keys to navigate version history list

### Screen Reader Support
- Semantic HTML (main, article, button, dialog)
- ARIA labels on interactive elements
- Announce autosave status changes
- Describe thumbnail images with alt text
- Announce filter/sort changes

### Visual Considerations
- High contrast mode support
- Focus indicators on all interactive elements
- Minimum touch target size (44x44px)
- Color is not the only indicator (icons + text)

---

## 11. Testing Checklist

### Functional Tests
- [ ] Projects load and display correctly
- [ ] Sorting works for all options
- [ ] Filtering works for all options
- [ ] Search matches project names correctly
- [ ] Project cards show accurate metadata
- [ ] Context menu actions work (rename, duplicate, delete)
- [ ] Opening project loads correct data
- [ ] Autosave creates versions at correct interval
- [ ] Autosave respects enabled/disabled setting
- [ ] Version history shows all versions
- [ ] Restoring version loads correct state
- [ ] Deleting project removes all versions
- [ ] Thumbnail generation works
- [ ] Empty states display correctly

### Edge Cases
- [ ] No projects exist (empty state)
- [ ] Single project
- [ ] 100+ projects (performance)
- [ ] Very long project names (truncation)
- [ ] Missing thumbnails (fallback)
- [ ] Corrupted project data (error handling)
- [ ] Offline scenario (IndexedDB fallback)
- [ ] Rapid autosave triggers (debouncing)
- [ ] User switches projects before autosave completes

### UI/UX Tests
- [ ] Responsive on mobile, tablet, desktop
- [ ] Smooth animations and transitions
- [ ] Loading states appear appropriately
- [ ] Error messages are clear and actionable
- [ ] Hover states work on all interactive elements
- [ ] Keyboard navigation is logical
- [ ] Screen reader announces changes correctly

---

## 12. Future Enhancements

### Phase 2 Features
- **Project Folders/Collections**: Organize projects into folders
- **Project Tags**: Add custom tags for categorization
- **Favorites/Pinned**: Pin important projects to top
- **Project Sharing**: Export/import project files
- **Collaborative Editing**: Share projects with other users
- **Cloud Sync**: Sync projects across devices
- **Project Templates**: Save and reuse project templates
- **Bulk Operations**: Select multiple projects for batch actions
- **Advanced Search**: Filter by tags, date ranges, metadata
- **Activity Feed**: See recent changes across all projects

### Phase 3 Features
- **AI-Powered Suggestions**: Recommend projects to revisit
- **Smart Thumbnails**: Generate animated thumbnail previews
- **Version Diffing**: Visual comparison between versions
- **Branching**: Create alternative versions from same base
- **Comments/Notes**: Add notes to versions for context
- **Project Analytics**: Track time spent, changes made

---

## 13. Migration Plan

### Step 1: Database Migration
1. Run SQL migration to add new columns to `projects` table
2. Create `project_versions` table
3. Create indexes for performance
4. Backfill existing projects with default values

### Step 2: Feature Flag Rollout
1. Implement feature behind feature flag
2. Enable for internal testing
3. Enable for beta users (10%)
4. Monitor for errors and performance issues
5. Gradually roll out to 50%, then 100%

### Step 3: Data Migration
1. Convert existing projects to new schema
2. Generate placeholder thumbnails
3. Create initial version for each existing project
4. Verify data integrity

### Step 4: UI Transition
1. Add "Projects" link to navigation
2. Deprecate old Projects modal
3. Update documentation and help content
4. Announce new feature to users

---

## 14. Success Metrics

### Key Performance Indicators (KPIs)
- **Adoption Rate**: % of users using projects page (target: 80%+)
- **Version Restores**: # of times users restore versions (measure usefulness)
- **Autosave Success Rate**: % of autosaves that succeed (target: 99%+)
- **Page Load Time**: Time to display projects page (target: < 2s)
- **Search Usage**: % of users using search feature
- **Project Organization**: Average # projects per user

### User Satisfaction
- Survey: "How satisfied are you with the new projects page?" (1-5 scale)
- Net Promoter Score (NPS) change after launch
- Support ticket volume related to project management

---

## 15. Documentation Requirements

### User Documentation
- **Help Article**: "Managing Your Projects"
- **Video Tutorial**: "Projects Page Overview"
- **FAQ**: Common questions about autosave and versions
- **Keyboard Shortcuts**: Reference guide

### Developer Documentation
- **API Reference**: Project and version service methods
- **Architecture Diagram**: System components and data flow
- **Database Schema**: Tables and relationships
- **Migration Guide**: For future schema changes

---

## Appendix A: Design Mockups

_Note: Actual mockups would be created by design team. This spec provides layout descriptions and wireframes._

**Desktop View (1920x1080):**
- 4 columns of project cards
- Full-width header with search and actions
- Sidebar navigation visible

**Tablet View (768x1024):**
- 2-3 columns of project cards
- Hamburger menu for navigation
- Condensed header

**Mobile View (375x667):**
- 1-2 columns of project cards
- Bottom navigation
- Full-screen modal overlays

---

## Appendix B: API Reference

### Project Operations

**`getProjects()`**
- Returns: `Promise<Project[]>`
- Fetches all projects sorted by `last_opened_at`

**`getProject(id: string)`**
- Returns: `Promise<Project>`
- Fetches single project with all metadata

**`createProject(name: string, data: ProjectData)`**
- Returns: `Promise<Project>`
- Creates new project and initial version

**`updateProject(id: string, data: Partial<Project>)`**
- Returns: `Promise<void>`
- Updates project metadata (not full state)

**`deleteProject(id: string)`**
- Returns: `Promise<void>`
- Deletes project and all versions (cascade)

**`duplicateProject(id: string, newName: string)`**
- Returns: `Promise<Project>`
- Creates copy of project with new ID

### Version Operations

**`getVersions(projectId: string, limit?: number, offset?: number)`**
- Returns: `Promise<ProjectVersion[]>`
- Fetches versions for project (paginated)

**`createVersion(projectId: string, data: ProjectData, isAutosave: boolean, description?: string)`**
- Returns: `Promise<ProjectVersion>`
- Creates new version entry

**`restoreVersion(versionId: string)`**
- Returns: `Promise<ProjectData>`
- Retrieves version data for restoration

**`deleteOldVersions(projectId: string, keepCount: number)`**
- Returns: `Promise<void>`
- Cleanup old autosave versions

---

## Appendix C: Existing Components to Reference

**Current Implementation:**
- `src/visualizer-software.tsx` - Project state structure (lines 570-615)
- `src/pages/Dashboard.tsx` - Navigation patterns
- Database service in `src/services/` (check existing implementation)
- Modal patterns in `src/components/modals/`

**Reusable Components:**
- Button styles from existing buttons
- Modal overlay from existing modals
- Input components from form elements
- Icon library: lucide-react (already in use)

---

## End of Specification

**Document Version:** 1.0  
**Last Updated:** 2026-01-23  
**Status:** Ready for Implementation  
**Estimated Effort:** 3-4 weeks (1 developer)

**Review Checklist:**
- [ ] PM Approval
- [ ] Design Approval
- [ ] Engineering Approval
- [ ] Security Review
- [ ] Database Team Review
- [ ] Documentation Team Notified
