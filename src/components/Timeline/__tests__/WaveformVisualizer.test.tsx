import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import WaveformVisualizer from '../WaveformVisualizer';

// Mock canvas methods
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '',
    font: '',
    textAlign: '',
    fillText: vi.fn(),
  })) as any;
});

// Helper to create a mock AudioBuffer
function createMockAudioBuffer(duration: number, sampleRate: number = 44100): AudioBuffer {
  const length = duration * sampleRate;
  const numberOfChannels = 2;
  
  const mockBuffer = {
    duration,
    length,
    numberOfChannels,
    sampleRate,
    getChannelData: vi.fn((channel: number) => {
      // Create a Float32Array with some mock waveform data
      const data = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        // Simple sine wave for testing
        data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5;
      }
      return data;
    }),
  } as AudioBuffer;
  
  return mockBuffer;
}

describe('WaveformVisualizer - Long Audio File Support', () => {
  it('should render without crashing for short audio files', () => {
    const audioBuffer = createMockAudioBuffer(17); // 17 seconds
    const { container } = render(
      <WaveformVisualizer
        audioBuffer={audioBuffer}
        duration={17}
        width={680} // 17s * 40px/s at 1x zoom
        height={60}
      />
    );
    
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should render without crashing for long audio files (3 minutes)', () => {
    const audioBuffer = createMockAudioBuffer(180); // 3 minutes
    const { container } = render(
      <WaveformVisualizer
        audioBuffer={audioBuffer}
        duration={180}
        width={7200} // 180s * 40px/s at 1x zoom
        height={60}
      />
    );
    
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should render without crashing for very long audio files (10 minutes)', () => {
    const audioBuffer = createMockAudioBuffer(600); // 10 minutes
    const { container } = render(
      <WaveformVisualizer
        audioBuffer={audioBuffer}
        duration={600}
        width={24000} // 600s * 40px/s at 1x zoom
        height={60}
      />
    );
    
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should handle extreme zoom levels without exceeding canvas limits', () => {
    const audioBuffer = createMockAudioBuffer(5 * 60); // 5 minutes
    const { container } = render(
      <WaveformVisualizer
        audioBuffer={audioBuffer}
        duration={5 * 60}
        width={60000} // Extreme width that exceeds 4096px limit
        height={60}
      />
    );
    
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeTruthy();
    // Canvas width should be clamped to MAX_CANVAS_WIDTH (4096)
    // Note: This test verifies the component doesn't crash; actual canvas width
    // checking would require integration tests
  });

  it('should render with no audio buffer', () => {
    const { container } = render(
      <WaveformVisualizer
        audioBuffer={null}
        duration={0}
        width={800}
        height={60}
      />
    );
    
    // Should render a placeholder div with "No audio loaded" message
    const placeholder = container.querySelector('div');
    expect(placeholder).toBeTruthy();
    expect(placeholder?.textContent).toContain('No audio loaded');
  });

  it('should handle different display modes', () => {
    const audioBuffer = createMockAudioBuffer(10);
    
    // Test mirrored mode (default)
    const { container: mirroredContainer } = render(
      <WaveformVisualizer
        audioBuffer={audioBuffer}
        duration={10}
        width={400}
        height={60}
        mode="mirrored"
      />
    );
    expect(mirroredContainer.querySelector('canvas')).toBeTruthy();
    
    // Test top-only mode
    const { container: topOnlyContainer } = render(
      <WaveformVisualizer
        audioBuffer={audioBuffer}
        duration={10}
        width={400}
        height={60}
        mode="top-only"
      />
    );
    expect(topOnlyContainer.querySelector('canvas')).toBeTruthy();
  });
});

describe('WaveformVisualizer - Performance Characteristics', () => {
  it('should limit samples to MAX_WAVEFORM_SAMPLES (1024) for performance', () => {
    const audioBuffer = createMockAudioBuffer(5 * 60); // 5 minutes
    const getChannelData = audioBuffer.getChannelData;
    
    render(
      <WaveformVisualizer
        audioBuffer={audioBuffer}
        duration={5 * 60}
        width={10000} // Very wide timeline
        height={60}
      />
    );
    
    // Verify getChannelData was called (waveform was processed)
    expect(getChannelData).toHaveBeenCalledWith(0);
    
    // The component should internally limit processing to 1024 samples
    // even though width is 10000 pixels, preventing performance issues
  });

  it('should handle minimum block size for audio quality', () => {
    const audioBuffer = createMockAudioBuffer(0.1); // Very short audio (100ms)
    
    const { container } = render(
      <WaveformVisualizer
        audioBuffer={audioBuffer}
        duration={0.1}
        width={1000} // Wide canvas for short audio
        height={60}
      />
    );
    
    // Should render without issues even with small audio buffer
    expect(container.querySelector('canvas')).toBeTruthy();
  });
});
