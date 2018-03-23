export declare type Point = [number, number];
export declare class Path {
    x0?: number;
    y0?: number;
    x1?: number;
    y1?: number;
    codes: string;
    pts: Point[];
    moveTo(x: number, y: number): void;
    closePath(): void;
    lineTo(x: number, y: number): void;
    quadraticCurveTo(x1: number, y1: number, x: number, y: number): void;
    bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void;
    arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void;
    arc(x: number, y: number, r: number, a0: number, a1: number, ccw?: boolean): void;
    rect(x: number, y: number, w: number, h: number): void;
    send(canvas: CanvasPathMethods): void;
}
