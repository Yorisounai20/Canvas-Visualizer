/**
 * Format seconds to MM:SS format
 */
export const formatTime = (s: number): string => 
  `${Math.floor(s/60)}:${(Math.floor(s%60)).toString().padStart(2,'0')}`;

/**
 * Format seconds to MM:SS format (alternate implementation)
 */
export const formatTimeInput = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Parse MM:SS format to seconds
 */
export const parseTime = (t: string): number => {
  const [m, s] = t.split(':').map(Number);
  return m * 60 + s;
};

/**
 * Parse MM:SS format to seconds (alternate implementation)
 */
export const parseTimeInput = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0]) || 0;
    const secs = parseInt(parts[1]) || 0;
    return mins * 60 + secs;
  }
  return 0;
};
