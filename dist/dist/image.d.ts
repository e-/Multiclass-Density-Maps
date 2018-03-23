import Point from './point';
import Color from './color';
import Mask from './mask';
import Tile from './tile';
import Rect from './rect';
export default class Image {
    width: number;
    height: number;
    pixels: Color[][];
    imageCanvas?: HTMLCanvasElement;
    constructor(width: number, height: number, pixels?: Color[][]);
    render(color: Color, rect: Rect): void;
    render(canvas: HTMLCanvasElement, at: Point, options?: any): void;
    render(color: Color, tile: Tile, mask?: Mask): void;
    private fillColorByTile(color, tile, mask?);
    private checkOrCreate();
    private drawTileAtPosition(canvas, point, options?);
    private fillColorByRect(color, rect);
    fillMask(mask: Mask | undefined): void;
}
