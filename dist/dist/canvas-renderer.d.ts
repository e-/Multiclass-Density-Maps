import Image from './image';
import Mask from './mask';
export declare enum BlendingMode {
    Normal = 0,
    Alpha = 1,
}
export default class CanvasRenderer {
    static BlendingMode: typeof BlendingMode;
    static renderAll(images: Image[], canvas: string | HTMLCanvasElement, order?: number[], options?: {
        blur?: number;
        blendingMode?: BlendingMode;
        noResetDims?: boolean;
        rows?: number;
        cols?: number;
        interval?: number;
    }): CanvasRenderingContext2D;
    static render(image: Image, id: string | HTMLCanvasElement, options?: {
        blur?: number;
        blendingMode?: BlendingMode;
        noResetDims?: boolean;
    }): CanvasRenderingContext2D;
    static render2(image: Image, id: string | HTMLCanvasElement, options?: {
        blur?: number;
    }): CanvasRenderingContext2D;
    static renderToImageData(image: Image, imageData: ImageData): void;
    static renderAlphaBlending(image: Image, imageData: ImageData): void;
    static strokeVectorMask(mask: Mask | undefined, id: string | HTMLCanvasElement, options?: {
        color?: string;
        lineWidth?: number;
    }): void;
    static renderTimeMultiplexing(images: Image[], id: string, interval: number): CanvasRenderingContext2D;
    static renderMultiples(images: Image[], id: string | HTMLCanvasElement, order?: number[], options?: {
        rows?: number;
        cols?: number;
    }): CanvasRenderingContext2D;
}
