declare module 'webm-writer' {
  export interface WebMWriterOptions {
    quality?: number;
    fileWriter?: any;
    verbose?: boolean;
  }

  class WebMWriter {
    constructor(options: WebMWriterOptions);
    addFrame(canvas: HTMLCanvasElement | ImageBitmap, duration?: number): void;
    render(): Promise<Blob>;
    static isSupported: boolean;
  }

  export default WebMWriter;
}
