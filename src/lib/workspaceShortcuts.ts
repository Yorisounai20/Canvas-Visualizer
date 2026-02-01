/**
 * Keyboard Shortcuts for Workspace Mode
 * Blender-inspired shortcuts for intuitive 3D editing
 */

export interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: string;
}

export const WORKSPACE_SHORTCUTS: ShortcutAction[] = [
  // Object Operations
  { key: 'd', shift: true, description: 'Duplicate selected object', category: 'Object' },
  { key: 'x', description: 'Delete selected object', category: 'Object' },
  { key: 'Delete', description: 'Delete selected object', category: 'Object' },
  { key: 'h', description: 'Hide selected object', category: 'Object' },
  { key: 'h', alt: true, description: 'Unhide all objects', category: 'Object' },
  
  // Edit Operations
  { key: 'z', ctrl: true, description: 'Undo', category: 'Edit' },
  { key: 'y', ctrl: true, description: 'Redo', category: 'Edit' },
  { key: 'z', ctrl: true, shift: true, description: 'Redo (alternative)', category: 'Edit' },
  { key: 'c', ctrl: true, description: 'Copy selected object', category: 'Edit' },
  { key: 'v', ctrl: true, description: 'Paste object', category: 'Edit' },
  
  // Selection
  { key: 'a', ctrl: true, description: 'Select all objects', category: 'Selection' },
  { key: 'a', alt: true, description: 'Deselect all', category: 'Selection' },
  
  // Transform
  { key: 'g', description: 'Move (grab) mode', category: 'Transform' },
  { key: 'r', description: 'Rotate mode', category: 'Transform' },
  { key: 's', description: 'Scale mode', category: 'Transform' },
  { key: 'g', alt: true, description: 'Reset position', category: 'Transform' },
  { key: 'r', alt: true, description: 'Reset rotation', category: 'Transform' },
  { key: 's', alt: true, description: 'Reset scale', category: 'Transform' },
  
  // View
  { key: 'f', description: 'Focus on selected object', category: 'View' },
  { key: 'Home', description: 'Frame all objects', category: 'View' },
  
  // Add Objects
  { key: 'a', shift: true, description: 'Quick add menu', category: 'Add' },
  
  // Interface
  { key: '?', description: 'Show keyboard shortcuts', category: 'Interface' },
  { key: 'n', description: 'Toggle properties panel', category: 'Interface' },
];

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutAction): boolean {
  const key = event.key.toLowerCase();
  const shortcutKey = shortcut.key.toLowerCase();
  
  // Check key match
  if (key !== shortcutKey) return false;
  
  // Check modifiers
  if (shortcut.ctrl && !event.ctrlKey && !event.metaKey) return false;
  if (!shortcut.ctrl && (event.ctrlKey || event.metaKey)) return false;
  
  if (shortcut.shift && !event.shiftKey) return false;
  if (!shortcut.shift && event.shiftKey && key !== shortcutKey) return false;
  
  if (shortcut.alt && !event.altKey) return false;
  if (!shortcut.alt && event.altKey) return false;
  
  return true;
}

/**
 * Get shortcut display string (e.g., "Ctrl+Z", "Shift+D")
 */
export function getShortcutDisplay(shortcut: ShortcutAction): string {
  const parts: string[] = [];
  
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  
  // Format key name
  const keyName = shortcut.key.length === 1 
    ? shortcut.key.toUpperCase() 
    : shortcut.key;
  
  parts.push(keyName);
  
  return parts.join('+');
}

/**
 * Group shortcuts by category
 */
export function getShortcutsByCategory(): Record<string, ShortcutAction[]> {
  return WORKSPACE_SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutAction[]>);
}
