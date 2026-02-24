declare module '@ffmpeg/ffmpeg' {
	export class FFmpeg {
		constructor(opts?: any);
		load(opts?: any): Promise<void>;
		writeFile(path: string, data: Uint8Array | ArrayBuffer | string): Promise<void>;
		readFile(path: string): Promise<Uint8Array>;
		deleteFile(path: string): Promise<void>;
		exec(args: string[]): Promise<any>;
		on(event: string, cb: (...args: any[]) => void): void;
	}
	export function createFFmpeg(opts?: any): FFmpeg;
}

declare module '@ffmpeg/util' {
	export function fetchFile(input: Blob | ArrayBuffer | string): Promise<Uint8Array> | Uint8Array;
	export function toBlobURL(path: string, type?: string): Promise<string>;
}

declare module 'webm-writer' {
	interface WebMWriterOptions {
		quality?: number;
		fileWriter?: any;
		frameRate?: number;
		codec?: string;
	}
	export default class WebMWriter {
		constructor(opts: WebMWriterOptions);
		addFrame(canvas: HTMLCanvasElement | ImageBitmap | Uint8Array): void;
		complete(): Promise<Blob>;
	}
}
