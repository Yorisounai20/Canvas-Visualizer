/**
 * VersionHistoryModal Component
 * Displays version history for a project with restore capability
 */

import { useState, useEffect } from 'react';
import { X, Circle, CircleDot, Clock, AlertCircle } from 'lucide-react';
import { ProjectVersion, getVersions } from '../../lib/database';
import { formatDateTime } from '../../lib/relativeTime';

interface VersionHistoryModalProps {
  projectId: string;
  projectName: string;
  currentVersionId?: string;
  onClose: () => void;
  onRestore: (version: ProjectVersion) => void;
}

export default function VersionHistoryModal({
  projectId,
  projectName,
  currentVersionId,
  onClose,
  onRestore,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedVersion, setSelectedVersion] = useState<ProjectVersion | null>(null);

  const VERSIONS_PER_PAGE = 20;

  useEffect(() => {
    loadVersions();
  }, [projectId]);

  const loadVersions = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const offset = loadMore ? (page + 1) * VERSIONS_PER_PAGE : 0;
      const newVersions = await getVersions(projectId, VERSIONS_PER_PAGE, offset);

      if (loadMore) {
        setVersions([...versions, ...newVersions]);
        setPage(page + 1);
      } else {
        setVersions(newVersions);
      }

      setHasMore(newVersions.length === VERSIONS_PER_PAGE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load version history');
      console.error('Error loading versions:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    loadVersions(true);
  };

  const handleRestoreClick = (version: ProjectVersion) => {
    setSelectedVersion(version);
  };

  const handleConfirmRestore = () => {
    if (selectedVersion) {
      onRestore(selectedVersion);
      onClose();
    }
  };

  const handleCancelRestore = () => {
    setSelectedVersion(null);
  };

  return (
    <>
      {/* Version History Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Clock className="text-cyan-400" size={24} />
              <div>
                <h2 className="text-xl font-bold text-white">Version History</h2>
                <p className="text-sm text-gray-400">{projectName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="text-center py-12 text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                Loading version history...
              </div>
            )}

            {error && (
              <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-4 text-red-300">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={20} />
                  <p className="font-semibold">Error</p>
                </div>
                <p className="text-sm">{error}</p>
                <button
                  onClick={() => loadVersions()}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && versions.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Clock size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">No version history yet</p>
                <p className="text-sm mt-2">Versions will appear here as you save your project</p>
              </div>
            )}

            {!loading && !error && versions.length > 0 && (
              <div className="space-y-3">
                {versions.map((version, index) => {
                  const isCurrentVersion = version.id === currentVersionId;
                  const isMostRecent = index === 0;

                  return (
                    <div
                      key={version.id}
                      className={`bg-gray-900 rounded-lg p-4 border transition-all ${
                        isCurrentVersion
                          ? 'border-cyan-500 bg-cyan-900 bg-opacity-20'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Icon */}
                          <div className="mt-1">
                            {version.is_autosave ? (
                              <Circle size={16} className="text-gray-400" />
                            ) : (
                              <CircleDot size={16} className="text-cyan-400" />
                            )}
                          </div>

                          {/* Version Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">
                                {version.is_autosave ? 'Autosave' : 'Manual Save'}
                              </span>
                              {isCurrentVersion && (
                                <span className="px-2 py-0.5 bg-cyan-600 text-white text-xs rounded">
                                  Current
                                </span>
                              )}
                              {isMostRecent && !isCurrentVersion && (
                                <span className="px-2 py-0.5 bg-yellow-600 text-white text-xs rounded">
                                  Latest
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              {formatDateTime(version.created_at)}
                            </p>
                            {version.description && (
                              <p className="text-sm text-gray-300 mt-2 italic">
                                "{version.description}"
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Version #{version.version_number}
                            </p>
                          </div>
                        </div>

                        {/* Restore Button */}
                        {!isCurrentVersion && (
                          <button
                            onClick={() => handleRestoreClick(version)}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg font-semibold transition-colors"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center pt-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load 10 more versions...'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">
                {versions.length} version{versions.length !== 1 ? 's' : ''} shown
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white">Restore Version?</h3>
              <button
                onClick={handleCancelRestore}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-300 mb-4">
                Restoring this version will replace your current project state.
              </p>

              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {selectedVersion.is_autosave ? (
                    <Circle size={16} className="text-gray-400" />
                  ) : (
                    <CircleDot size={16} className="text-cyan-400" />
                  )}
                  <span className="font-semibold text-white">
                    {selectedVersion.is_autosave ? 'Autosave' : 'Manual Save'}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  From: {formatDateTime(selectedVersion.created_at)}
                </p>
                {selectedVersion.description && (
                  <p className="text-sm text-gray-300 mt-2 italic">
                    "{selectedVersion.description}"
                  </p>
                )}
              </div>

              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-300">
                  Your current state will be saved as an autosave before restoring.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-gray-700">
              <button
                onClick={handleCancelRestore}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors"
              >
                Restore Version
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
