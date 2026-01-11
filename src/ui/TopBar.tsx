/**
 * TopBar - Main navigation and mode switcher for Canvas Visualizer
 * 
 * Provides workspace view switching (Author, Stage, Effects, Preview, Export)
 * and will contain primary actions like Save, Load, Export.
 */

interface TopBarProps {
  mode: 'author' | 'stage' | 'effects' | 'preview' | 'export';
  onModeChange: (mode: 'author' | 'stage' | 'effects' | 'preview' | 'export') => void;
}

export default function TopBar({ mode, onModeChange }: TopBarProps) {
  const modes = [
    { id: 'author' as const, label: 'Author' },
    { id: 'stage' as const, label: 'Stage' },
    { id: 'effects' as const, label: 'Effects' },
    { id: 'preview' as const, label: 'Preview' },
    { id: 'export' as const, label: 'Export' },
  ];

  return (
    <div className="h-12 bg-gray-800 text-white flex items-center px-4 border-b border-gray-700">
      <div className="font-semibold text-lg">CanvasVisualizer</div>
      <div className="ml-6 flex space-x-1">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`px-4 py-1 rounded ${
              mode === m.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="ml-auto flex space-x-2">
        <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">
          Save
        </button>
        <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">
          Load
        </button>
      </div>
    </div>
  );
}
