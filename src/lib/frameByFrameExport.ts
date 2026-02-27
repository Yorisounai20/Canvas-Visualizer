/**
 * Frame-by-frame export system for Canvas Visualizer
 * 
 * This system renders video frame-by-frame instead of live capture,
 * eliminating performance issues on weak hardware.
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

/**
 * Memory monitoring utilities
 */
export const memoryMonitor = {
  getMemoryUsage(): number {
    const perfAny = performance as any;
    if (perfAny && perfAny.memory) {
      return perfAny.memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  },
  
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },
  
  checkMemoryWarning(frameCount: number, estimatedBytesPerFrame: number = 1000000): { warning: boolean; suggestion: string } {
    const estimatedMB = (frameCount * estimatedBytesPerFrame) / (1024 * 1024);
    if (estimatedMB > 1500) {
      return {
        warning: true,
        suggestion: `Estimated frame data: ${this.formatBytes(frameCount * estimatedBytesPerFrame)}. Consider lower resolution or shorter duration.`
      };
    }
    return { warning: false, suggestion: '' };
  }
};

export interface FrameExportOptions {
  width: number;
  height: number;
  framerate: number;
  duration: number;
  bitrate: string;
  onProgress?: (progress: number, status: string) => void;
  onLog?: (message: string, type: 'info' | 'success' | 'error') => void;
}

export interface AudioFrameData {
  bass: number;
  mids: number;
  highs: number;
}

/**
 * Perform a full sweep of the audio buffer and return an array of frequency
 * data objects, one entry for each frame at the supplied frame rate.  This is
 * used by the "test audio analysis" feature and by the export pipeline to
 * avoid re‑calculating FFT data during rendering.
 *
 * The implementation is intentionally simple: it just samples the buffer at
 * regular intervals and calls `calculateAudioFrequencyAtTime` for each.
 *
 * @param audioBuffer - decoded audio data
 * @param fps - frames per second to analyse at (default 30)
 */
export async function analyzeAudioForExport(
  audioBuffer: AudioBuffer,
  fps: number = 30
): Promise<AudioFrameData[]> {
  const duration = audioBuffer.duration;
  const totalFrames = Math.ceil(duration * fps);
  const result: AudioFrameData[] = [];

  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps;
    result.push(calculateAudioFrequencyAtTime(audioBuffer, time));
  }

  return result;
}

/**
 * Calculate audio frequency data for a specific frame timestamp
 * without needing real-time playback
 */
export function calculateAudioFrequencyAtTime(
  audioBuffer: AudioBuffer,
  time: number,
  fftSize: number = 2048,
  bassGain: number = 1.0,
  midsGain: number = 1.0,
  highsGain: number = 1.0
): AudioFrameData {
  // Get sample data at the specified time
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(time * sampleRate);
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  
  // Extract FFT window worth of samples
  const windowSize = Math.min(fftSize, channelData.length - startSample);
  const samples = new Float32Array(windowSize);
  
  for (let i = 0; i < windowSize; i++) {
    const sampleIndex = startSample + i;
    if (sampleIndex < channelData.length) {
      samples[i] = channelData[sampleIndex];
    }
  }
  
  // Perform basic FFT-like frequency analysis
  // For simplicity, we'll use a basic frequency band calculation
  const frequencyData = performBasicFFT(samples, sampleRate);
  
  // Extract frequency bands (matching the getFreq function in visualizer-software.tsx)
  const bass = (frequencyData.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255) * bassGain;
  const mids = (frequencyData.slice(10, 100).reduce((a, b) => a + b, 0) / 90 / 255) * midsGain;
  const highs = (frequencyData.slice(100, 200).reduce((a, b) => a + b, 0) / 100 / 255) * highsGain;
  
  return { bass, mids, highs };
}

/**
 * Perform basic FFT-like analysis on audio samples
 * Returns frequency magnitude data similar to AnalyserNode.getByteFrequencyData
 */
function performBasicFFT(samples: Float32Array, sampleRate: number): Uint8Array {
  const fftSize = samples.length;
  const frequencyBinCount = fftSize / 2;
  const frequencyData = new Uint8Array(frequencyBinCount);
  
  // Simple frequency analysis using windowing and magnitude calculation
  for (let i = 0; i < frequencyBinCount; i++) {
    let magnitude = 0;
    const frequency = (i * sampleRate) / fftSize;
    
    // Calculate magnitude for this frequency bin
    for (let j = 0; j < samples.length; j++) {
      const angle = (2 * Math.PI * frequency * j) / sampleRate;
      magnitude += Math.abs(samples[j] * Math.cos(angle));
    }
    
    // Normalize to 0-255 range
    frequencyData[i] = Math.min(255, Math.floor((magnitude / samples.length) * 255 * 2));
  }
  
  return frequencyData;
}

/**
 * Frame-by-frame export manager
 */
export class FrameByFrameExporter {
  private ffmpeg: FFmpeg | null = null;
  private loaded: boolean = false;
  
  constructor() {
    this.ffmpeg = new FFmpeg();
  }
  
  /**
   * Load FFmpeg WASM (call once before first export)
   */
  async load(onLog?: (message: string) => void): Promise<void> {
    if (this.loaded || !this.ffmpeg) return;
    
    try {
      // Load FFmpeg with CDN fallback
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      
      this.ffmpeg.on('log', ({ message }) => {
        onLog?.(message);
        console.log('[FFmpeg]', message);
      });
      
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      this.loaded = true;
      onLog?.('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error(`FFmpeg load failed: ${error}`);
    }
  }
  
  /**
   * Export frames to video file
   */
  async exportFramesToVideo(
    frames: Blob[],
    audioBlob: Blob,
    options: FrameExportOptions
  ): Promise<Blob> {
    if (!this.loaded || !this.ffmpeg) {
      throw new Error('FFmpeg not loaded. Call load() first.');
    }
    
    const { width, height, framerate, bitrate, onProgress, onLog } = options;
    
    try {
      onLog?.('Starting video assembly...', 'info');
      onProgress?.(0, 'Writing frames to FFmpeg...');
      
      // Write frames as individual image files
      for (let i = 0; i < frames.length; i++) {
        const frameData = await fetchFile(frames[i]);
        await this.ffmpeg.writeFile(`frame${String(i).padStart(6, '0')}.png`, frameData);
        
        if (i % 30 === 0) {
          onProgress?.((i / frames.length) * 50, `Writing frame ${i}/${frames.length}...`);
        }
      }
      
      onProgress?.(50, 'Writing audio...');
      
      // Write audio file
      const audioData = await fetchFile(audioBlob);
      await this.ffmpeg.writeFile('audio.webm', audioData);
      
      onProgress?.(60, 'Encoding video...');
      onLog?.('Encoding video with FFmpeg...', 'info');
      
      // Run FFmpeg to combine frames and audio
      // Using H.264 for better compatibility
      await this.ffmpeg.exec([
        '-framerate', framerate.toString(),
        '-i', 'frame%06d.png',
        '-i', 'audio.webm',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        '-y',
        'output.mp4'
      ]);
      
      onProgress?.(90, 'Reading output...');
      
      // Read the output file (returns Uint8Array)
      const data = await this.ffmpeg.readFile('output.mp4');
      const outputUint8 = data as Uint8Array;
      // Make a copy to ensure an ArrayBuffer-backed view (avoids SharedArrayBuffer typing)
      const outputCopy = outputUint8.slice();
      const videoBlob = new Blob([outputCopy.buffer], { type: 'video/mp4' });
      
      onProgress?.(100, 'Complete!');
      onLog?.('Video export complete!', 'success');
      
      // Cleanup
      await this.cleanup(frames.length);
      
      return videoBlob;
    } catch (error) {
      onLog?.(`Export failed: ${error}`, 'error');
      throw error;
    }
  }
  
  /**
   * Cleanup temporary files
   */
  private async cleanup(frameCount: number): Promise<void> {
    if (!this.ffmpeg) return;
    
    try {
      // Delete frame files
      for (let i = 0; i < frameCount; i++) {
        try {
          await this.ffmpeg.deleteFile(`frame${String(i).padStart(6, '0')}.png`);
        } catch (e) {
          // Ignore errors
        }
      }
      
      // Delete audio and output files
      try {
        await this.ffmpeg.deleteFile('audio.webm');
        await this.ffmpeg.deleteFile('output.mp4');
      } catch (e) {
        // Ignore errors
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

/**
 * Render a single frame to canvas and capture as blob
 */
export async function captureFrameAsBlob(
  canvas: HTMLCanvasElement,
  quality: number = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to capture frame'));
        }
      },
      'image/png',
      quality
    );
  });
}

/**
 * Create audio blob from AudioBuffer for FFmpeg
 */
export async function createAudioBlob(audioBuffer: AudioBuffer): Promise<Blob> {
  // Create offline audio context to render audio to WAV
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  
  const renderedBuffer = await offlineContext.startRendering();
  
  // Convert to WAV blob
  const wavBlob = audioBufferToWav(renderedBuffer);
  return wavBlob;
}

/**
 * Convert AudioBuffer to WAV blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;
  
  const data = new Float32Array(buffer.length * numberOfChannels);
  
  // Interleave channels
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      data[i * numberOfChannels + channel] = buffer.getChannelData(channel)[i];
    }
  }
  
  const dataLength = data.length * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);
  
  // Write WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);
  
  // Write audio data
  const volume = 0.8;
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i])) * volume;
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
