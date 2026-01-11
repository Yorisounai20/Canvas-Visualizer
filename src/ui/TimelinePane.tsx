/**
 * TimelinePane - Timeline and automation editor
 * 
 * Will contain:
 * - Playback controls (play, pause, scrub)
 * - Timeline ruler with time markers
 * - Automation lanes (one per parameter)
 * - Keyframe editing
 * - Event markers
 * 
 * Currently a placeholder for follow-up implementation.
 */

export default function TimelinePane() {
  return (
    <div className="h-48 bg-gray-800 border-t border-gray-700 p-4">
      <div className="text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm uppercase text-gray-400">Timeline</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">
              ▶ Play
            </button>
            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">
              ⏸ Pause
            </button>
            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">
              ⏹ Stop
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded p-3 h-24 relative">
          <div className="text-xs text-gray-500 mb-2">
            Time: 0:00 / 0:30
          </div>
          <div className="h-12 bg-gray-800 rounded relative">
            {/* TODO: Timeline ruler and automation lanes */}
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
              Timeline (TODO: Implement scrubbing and automation lanes)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
