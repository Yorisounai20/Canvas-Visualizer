/**
 * InspectorPane - Property inspector and parameter controls
 * 
 * Will contain:
 * - Selected object properties
 * - Camera controls
 * - Preset parameters
 * - Audio-reactive settings
 * - Color pickers
 * 
 * Currently a placeholder for follow-up implementation.
 */

export default function InspectorPane() {
  return (
    <div className="h-full bg-gray-800 p-4 overflow-y-auto">
      <div className="text-white">
        <h3 className="font-semibold mb-3 text-sm uppercase text-gray-400">Inspector</h3>

        <div className="mb-6">
          <h4 className="font-medium mb-2 text-sm">Camera</h4>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400">Distance</label>
              <input
                type="range"
                min="5"
                max="50"
                defaultValue="15"
                className="w-full"
                disabled
              />
              <div className="text-xs text-gray-500">15</div>
            </div>
            <div>
              <label className="text-xs text-gray-400">Height</label>
              <input
                type="range"
                min="-10"
                max="10"
                defaultValue="2"
                className="w-full"
                disabled
              />
              <div className="text-xs text-gray-500">2</div>
            </div>
            <div>
              <label className="text-xs text-gray-400">Rotation</label>
              <input
                type="range"
                min="0"
                max="360"
                defaultValue="0"
                className="w-full"
                disabled
              />
              <div className="text-xs text-gray-500">0°</div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-medium mb-2 text-sm">Preset Parameters</h4>
          <div className="text-xs text-gray-500">
            No preset loaded
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-8">
          TODO: Implement parameter editing and real-time updates
        </div>
      </div>
    </div>
  );
}
