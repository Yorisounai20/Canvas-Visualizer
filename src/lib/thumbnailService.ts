/**
 * Thumbnail generation service
 * Handles canvas capture and thumbnail creation
 */

/**
 * Generate a thumbnail from a canvas element
 * @param canvas - The canvas element to capture
 * @param width - Desired thumbnail width (default: 320)
 * @param height - Desired thumbnail height (default: 180)
 * @returns Base64-encoded JPEG data URL
 */
export async function generateThumbnail(
  canvas: HTMLCanvasElement,
  width: number = 320,
  height: number = 180
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary canvas for resizing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const ctx = tempCanvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get 2D context'));
        return;
      }
      
      // Draw the original canvas scaled down
      ctx.drawImage(canvas, 0, 0, width, height);
      
      // Convert to blob and then to base64
      tempCanvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read blob'));
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.8);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a placeholder thumbnail with the project name initial
 * @param projectName - Name of the project
 * @param width - Desired thumbnail width (default: 320)
 * @param height - Desired thumbnail height (default: 180)
 * @returns Base64-encoded PNG data URL
 */
export function generatePlaceholderThumbnail(
  projectName: string,
  width: number = 320,
  height: number = 180
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Draw initial
  const initial = projectName.charAt(0).toUpperCase();
  ctx.fillStyle = '#00d4ff';
  ctx.font = `bold ${width / 3}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initial, width / 2, height / 2);
  
  return canvas.toDataURL('image/png');
}

/**
 * Check if a canvas is valid for thumbnail generation
 * @param canvas - Canvas element to check
 * @returns True if canvas is valid
 */
export function isCanvasValid(canvas: HTMLCanvasElement | null): boolean {
  return !!(canvas && canvas.width > 0 && canvas.height > 0);
}
