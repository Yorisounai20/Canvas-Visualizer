import { WAVEFORM_SAMPLES } from '../types';

/**
 * Generate waveform data from an audio buffer for visualization
 */
export const generateWaveformData = (buffer: AudioBuffer, samples = WAVEFORM_SAMPLES): number[] => {
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
};
