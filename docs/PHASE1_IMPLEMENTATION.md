# Phase 1: Blender-Like Workspace Features

## Overview

Transforming the workspace from "just a shape builder" to a Blender-like intuitive 3D editor with professional workflow features.

---

## Implementation Status

### ✅ COMPLETED (Part 1):

#### UI Components
- **WorkspaceActions.tsx** - Action buttons panel
- **KeyboardShortcutsHelp.tsx** - Shortcuts reference modal
- **undoRedo.ts** - Undo/Redo manager (infrastructure)
- **workspaceShortcuts.ts** - Shortcuts definitions

#### Features (UI Ready)
- ✅ Undo/Redo buttons
- ✅ Duplicate button
- ✅ Delete button
- ✅ Select All / Deselect buttons
- ✅ Toggle Visibility button
- ✅ Shortcuts Help modal (?)
- ✅ Keyboard shortcut definitions
- ✅ Smart button states
- ✅ Professional UI design
- ✅ Quick tips display

---

### 🔄 IN PROGRESS (Part 2):

#### Event Handler Integration
- [ ] Wire keyboard events to visualizer
- [ ] Implement duplicate functionality
- [ ] Implement delete functionality
- [ ] Integrate undo/redo manager
- [ ] Add selection state tracking
- [ ] Copy/paste functionality

---

## Features Breakdown

### 1. Undo/Redo System

**Infrastructure:** `src/lib/undoRedo.ts`

```typescript
class UndoRedoManager {
  - pushState(objects, selectedId)  // Save state
  - undo()                          // Go back
  - redo()                          // Go forward
  - canUndo()                       // Check availability
  - canRedo()                       // Check availability
  - clear()                         // Reset history
  - getCurrentState()               // Get current
}
```

**Features:**
- 50-state history limit
- Deep copy of objects
- Timestamp tracking
- Current index tracking

**Shortcuts:**
- Ctrl+Z - Undo
- Ctrl+Y - Redo
- Ctrl+Shift+Z - Redo (alternative)

---

### 2. Duplicate Objects

**What it does:**
- Creates exact copy of selected object
- Increments name (e.g., "Box 1" → "Box 2")
- Offsets position slightly
- Maintains all properties

**Shortcuts:**
- Shift+D - Duplicate selected
- Ctrl+D - Duplicate (alternative)

**Implementation:**
```typescript
function duplicateObject(object: WorkspaceObject) {
  const newId = generateId();
  const newName = incrementName(object.name);
  const newObject = {
    ...object,
    id: newId,
    name: newName,
    position: {
      x: object.position.x + 2,  // Offset
      y: object.position.y,
      z: object.position.z
    }
  };
  return newObject;
}
```

---

### 3. Delete Objects

**What it does:**
- Removes selected object
- Disposes THREE.js mesh
- Updates scene
- Adds to undo history

**Shortcuts:**
- X - Delete selected
- Delete - Delete selected

**Safety:**
- Confirmation for last object (optional)
- Undo available
- Clean disposal

---

### 4. Selection System

**Current State:**
- Single selection only
- Track selectedObjectId
- Visual feedback in SceneExplorer

**Future (Phase 1 Part 2):**
- Multi-select with Shift+Click
- Box select with B key
- Select by type
- Select all/none

**Shortcuts:**
- Ctrl+A - Select all
- Alt+A / Esc - Deselect all
- (Future) B - Box select
- (Future) Shift+Click - Multi-select

---

### 5. Copy/Paste System

**What it does:**
- Copy selected to clipboard
- Paste creates duplicate
- Works across sessions (localStorage)

**Shortcuts:**
- Ctrl+C - Copy
- Ctrl+V - Paste

**Implementation:**
```typescript
let clipboard: WorkspaceObject | null = null;

function copyObject(object: WorkspaceObject) {
  clipboard = JSON.parse(JSON.stringify(object));
  // Optional: localStorage for persistence
}

function pasteObject() {
  if (clipboard) {
    return duplicateObject(clipboard);
  }
}
```

---

### 6. Visibility Toggle

**What it does:**
- Hide selected object
- Show hidden object
- Useful for complex scenes

**Shortcuts:**
- H - Hide selected
- Alt+H - Unhide all

**Visual Feedback:**
- Eye/EyeOff icon
- Grayed out in SceneExplorer
- Mesh.visible = false

---

### 7. Keyboard Shortcuts

**Full List:** (from workspaceShortcuts.ts)

#### Object Operations
- Shift+D - Duplicate
- X / Delete - Delete
- H - Hide
- Alt+H - Unhide all

#### Edit Operations
- Ctrl+Z - Undo
- Ctrl+Y - Redo
- Ctrl+Shift+Z - Redo
- Ctrl+C - Copy
- Ctrl+V - Paste

#### Selection
- Ctrl+A - Select all
- Alt+A - Deselect
- Esc - Deselect (alternative)

#### Transform (Future)
- G - Move mode
- R - Rotate mode
- S - Scale mode
- Alt+G - Reset position
- Alt+R - Reset rotation
- Alt+S - Reset scale
- X/Y/Z - Axis lock (during transform)

#### View (Future)
- F - Focus on selected
- Home - Frame all

#### Add (Future)
- Shift+A - Quick add menu

#### Interface
- ? - Show shortcuts
- N - Toggle properties (future)

---

## UI Components Details

### WorkspaceActions Component

**Location:** Top of workspace panel

**Layout:**
```
┌─────────────────────────┐
│ Actions                 │
├─────────────────────────┤
│ [Undo] [Redo]          │  ← Gray/enabled
│ [Duplicate] [Delete]    │  ← Blue/red
│ [Select All] [Deselect]│  ← Gray
│ [Hide/Show]            │  ← Context-aware
│ [⚙️ Shortcuts (?)]     │  ← Purple
│                         │
│ 💡 Shift+D duplicate    │
│ 💡 X or Del to delete   │
│ 💡 Ctrl+Z/Y undo/redo   │
└─────────────────────────┘
```

**Features:**
- Smart disable states
- Color coding
- Icon + text labels
- Tooltips with shortcuts
- Quick tips

---

### KeyboardShortcutsHelp Modal

**Trigger:** Click "Shortcuts (?)" or press ?

**Layout:**
```
┌────────────────────────────┐
│ ⌨️ Keyboard Shortcuts  [X] │
├────────────────────────────┤
│ Object                     │
│ Duplicate       [Shift+D]  │
│ Delete          [X]        │
│ Hide            [H]        │
│                            │
│ Edit                       │
│ Undo            [Ctrl+Z]   │
│ Redo            [Ctrl+Y]   │
│ Copy            [Ctrl+C]   │
│ Paste           [Ctrl+V]   │
│                            │
│ Selection                  │
│ Select all      [Ctrl+A]   │
│ Deselect        [Alt+A]    │
│                            │
│ Transform                  │
│ Move (grab)     [G]        │
│ Rotate          [R]        │
│ Scale           [S]        │
│                            │
│ 💡 Pro Tips                │
│ • Shift+D for quick dupe   │
│ • Esc to deselect          │
│ • Ctrl+Z/Y for undo/redo   │
└────────────────────────────┘
```

**Features:**
- Category organization
- Keyboard badge styling
- Pro tips section
- Click X or Esc to close
- Dark theme

---

## Integration Architecture

### Component Hierarchy

```
visualizer-software.tsx
  ↓
WorkspaceControls
  ↓
  ├─ WorkspaceActions (NEW)
  │    ├─ Undo/Redo buttons
  │    ├─ Duplicate/Delete buttons
  │    ├─ Select All/Deselect buttons
  │    ├─ Visibility toggle
  │    └─ Shortcuts button
  │
  ├─ KeyboardShortcutsHelp (NEW)
  │    └─ Modal overlay
  │
  ├─ Visualization Source toggle
  ├─ Grid/Axes toggles
  ├─ Pose Controls
  ├─ Authoring Mode (PR 5)
  ├─ Preset Parameters (PR 6)
  └─ Export Controls (PR 8)
```

### Data Flow

```
User Action
    ↓
Keyboard Event / Button Click
    ↓
Event Handler (visualizer)
    ↓
State Update
    ↓
UndoRedoManager (if applicable)
    ↓
WorkspaceObjects array update
    ↓
THREE.js Scene update
    ↓
Re-render
```

---

## Implementation Guide (Part 2)

### Step 1: Add State to Visualizer

```typescript
// In visualizer-software.tsx
const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
const undoRedoManager = useRef(new UndoRedoManager());
const [canUndo, setCanUndo] = useState(false);
const [canRedo, setCanRedo] = useState(false);
```

### Step 2: Implement Duplicate

```typescript
const handleDuplicateObject = useCallback(() => {
  if (!selectedObjectId) return;
  
  const object = workspaceObjects.find(obj => obj.id === selectedObjectId);
  if (!object) return;
  
  // Save state for undo
  undoRedoManager.current.pushState(workspaceObjects, selectedObjectId);
  
  // Create duplicate
  const newObject = {
    ...object,
    id: generateId(),
    name: incrementName(object.name),
    position: {
      x: object.position.x + 2,
      y: object.position.y,
      z: object.position.z
    }
  };
  
  // Add to scene
  setWorkspaceObjects([...workspaceObjects, newObject]);
  setSelectedObjectId(newObject.id);
  
  // Update undo/redo state
  setCanUndo(undoRedoManager.current.canUndo());
  setCanRedo(undoRedoManager.current.canRedo());
}, [selectedObjectId, workspaceObjects]);
```

### Step 3: Implement Delete

```typescript
const handleDeleteObject = useCallback(() => {
  if (!selectedObjectId) return;
  
  // Save state for undo
  undoRedoManager.current.pushState(workspaceObjects, selectedObjectId);
  
  // Remove object
  const newObjects = workspaceObjects.filter(obj => obj.id !== selectedObjectId);
  
  // Dispose mesh
  const object = workspaceObjects.find(obj => obj.id === selectedObjectId);
  if (object?.mesh) {
    scene.remove(object.mesh);
    object.mesh.geometry.dispose();
    if (Array.isArray(object.mesh.material)) {
      object.mesh.material.forEach(m => m.dispose());
    } else {
      object.mesh.material.dispose();
    }
  }
  
  setWorkspaceObjects(newObjects);
  setSelectedObjectId(null);
  
  // Update undo/redo state
  setCanUndo(undoRedoManager.current.canUndo());
  setCanRedo(undoRedoManager.current.canRedo());
}, [selectedObjectId, workspaceObjects, scene]);
```

### Step 4: Implement Undo/Redo

```typescript
const handleUndo = useCallback(() => {
  const state = undoRedoManager.current.undo();
  if (!state) return;
  
  // Dispose current meshes
  workspaceObjects.forEach(obj => {
    if (obj.mesh) {
      scene.remove(obj.mesh);
      obj.mesh.geometry.dispose();
      // dispose material...
    }
  });
  
  // Restore state
  setWorkspaceObjects(state.objects);
  setSelectedObjectId(state.selectedObjectId);
  
  // Recreate meshes for restored objects
  // ... (mesh creation logic)
  
  // Update undo/redo state
  setCanUndo(undoRedoManager.current.canUndo());
  setCanRedo(undoRedoManager.current.canRedo());
}, [workspaceObjects, scene]);

const handleRedo = useCallback(() => {
  // Similar to undo but calls redo()
});
```

### Step 5: Keyboard Event Handler

```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Ignore if typing in input
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    // Check shortcuts
    const shortcuts = WORKSPACE_SHORTCUTS;
    for (const shortcut of shortcuts) {
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        
        // Handle shortcut
        switch(shortcut.key) {
          case 'd':
            if (shortcut.shift) handleDuplicateObject();
            break;
          case 'x':
          case 'Delete':
            handleDeleteObject();
            break;
          case 'z':
            if (shortcut.ctrl && shortcut.shift) handleRedo();
            else if (shortcut.ctrl) handleUndo();
            break;
          case 'y':
            if (shortcut.ctrl) handleRedo();
            break;
          // ... more shortcuts
        }
      }
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [/* dependencies */]);
```

### Step 6: Connect to WorkspaceControls

```typescript
<WorkspaceControls
  // Existing props...
  selectedObjectId={selectedObjectId}
  onDuplicateObject={handleDuplicateObject}
  onDeleteObject={handleDeleteObject}
  onSelectAll={handleSelectAll}
  onDeselectAll={handleDeselectAll}
  onToggleObjectVisibility={handleToggleVisibility}
  canUndo={canUndo}
  canRedo={canRedo}
  onUndo={handleUndo}
  onRedo={handleRedo}
/>
```

---

## Testing Checklist

### UI Tests
- [ ] Actions panel renders
- [ ] Buttons show correct states
- [ ] Tooltips display properly
- [ ] Shortcuts modal opens
- [ ] Modal closes with X or Esc
- [ ] All shortcuts listed

### Functionality Tests
- [ ] Duplicate creates copy
- [ ] Delete removes object
- [ ] Undo restores previous state
- [ ] Redo goes forward
- [ ] Select all selects everything
- [ ] Deselect clears selection
- [ ] Hide/show toggles visibility
- [ ] Keyboard shortcuts work
- [ ] State persists correctly

### Edge Cases
- [ ] Duplicate with no selection (disabled)
- [ ] Delete with no selection (disabled)
- [ ] Undo at start of history (disabled)
- [ ] Redo at end of history (disabled)
- [ ] Multiple rapid duplicates
- [ ] Undo after delete
- [ ] History limit (50 states)

---

## Performance Considerations

### Undo/Redo
- Deep copy objects (JSON stringify/parse)
- Limit history to 50 states
- Clear old states when limit reached
- Don't copy mesh references

### Duplicate
- Create new mesh instance
- Copy properties, not references
- Dispose old meshes properly

### Delete
- Properly dispose THREE.js resources
- Remove from scene
- Clear references

---

## Future Enhancements (Phase 2+)

### Transform Tools
- G key - Move mode with mouse
- R key - Rotate mode with mouse
- S key - Scale mode with mouse
- X/Y/Z - Axis locking
- Numeric input for precision
- Transform gizmos (visual handles)

### Advanced Selection
- Multi-select (Shift+Click)
- Box select (B key + drag)
- Circle select (C key)
- Select by type/group
- Invert selection

### Visual Tools
- Snap to grid
- Snap to other objects
- Align tools (left, center, right)
- Distribute tools (evenly space)
- Parent-child relationships

### Workflow
- Object templates
- Favorites system
- Recent objects menu
- Quick add pie menu (Shift+A)
- Properties quick access (N key)

---

## Success Metrics

### User Feedback
- "Feels like Blender!" ✨
- "So much faster to work with"
- "Keyboard shortcuts are great"
- "Can't imagine without undo now"

### Usage Stats
- 90%+ use keyboard shortcuts
- Undo used 10+ times per session
- Duplicate used 5+ times per session
- Shortcuts help viewed by new users

### Performance
- Undo/redo < 100ms
- Duplicate < 50ms
- Delete < 50ms
- No memory leaks
- Smooth 60 FPS maintained

---

## Conclusion

Phase 1 Part 1 delivers the UI foundation for Blender-like workspace features. Part 2 will wire up the event handlers and complete the transformation from "shape builder" to "professional 3D editor."

**Status:** Part 1 Complete ✅ | Part 2 In Progress 🔄

