import { WAVEFORM_SAMPLES } from '../types';

/**
 * Generate waveform data from an audio buffer for visualization
 */
export const generateWaveformData = (buffer: AudioBuffer, samples = WAVEFORM_SAMPLES): number[] => {
  // Validate buffer
  if (!buffer || buffer.numberOfChannels === 0 || buffer.length === 0) {
    console.warn('Invalid audio buffer - returning empty waveform');
    return new Array(samples).fill(0);
  }
  
  try {
    const rawData = buffer.getChannelData(0); // Get mono or first channel
    const blockSize = Math.floor(rawData.length / samples);
    const waveform: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      let blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j]);
      }
      waveform.push(sum / blockSize);
    }
    
    return waveform;
  } catch (error) {
    console.error('Error generating waveform:', error);
    return new Array(samples).fill(0);
  }
};
