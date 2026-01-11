/**
 * LeftToolbox - Tools and asset library sidebar
 * 
 * Will contain:
 * - Preset library (load presets)
 * - Shape tools
 * - Effect tools
 * - Asset browser
 * 
 * Currently a placeholder for follow-up implementation.
 */

export default function LeftToolbox() {
  return (
    <div className="h-full bg-gray-900 p-4 overflow-y-auto">
      <div className="text-white">
        <h3 className="font-semibold mb-3 text-sm uppercase text-gray-400">Toolbox</h3>
        
        <div className="mb-6">
          <h4 className="font-medium mb-2 text-sm">Presets</h4>
          <div className="space-y-1">
            <div className="p-2 bg-gray-800 rounded text-sm cursor-pointer hover:bg-gray-700">
              Hammerhead Shark
            </div>
            <div className="p-2 bg-gray-800 rounded text-sm cursor-pointer hover:bg-gray-700">
              Orbital Dance
            </div>
            <div className="p-2 bg-gray-800 rounded text-sm cursor-pointer hover:bg-gray-700">
              Azure Dragon
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-medium mb-2 text-sm">Shapes</h4>
          <div className="space-y-1">
            <div className="p-2 bg-gray-800 rounded text-sm cursor-pointer hover:bg-gray-700">
              Cube
            </div>
            <div className="p-2 bg-gray-800 rounded text-sm cursor-pointer hover:bg-gray-700">
              Sphere
            </div>
            <div className="p-2 bg-gray-800 rounded text-sm cursor-pointer hover:bg-gray-700">
              Octahedron
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-8">
          TODO: Implement preset loading and shape creation
        </div>
      </div>
    </div>
  );
}
