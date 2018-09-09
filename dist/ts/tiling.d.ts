import Tile from './tile';
export declare function pixelTiling(width: number, height: number): Tile[];
export declare function topojsonTiling(width: number, height: number, wholetopojson: any, feature: any, projectionName?: string, latitudes?: [number, number], longitudes?: [number, number], debug?: boolean): Tile[];
export declare function voronoiTiling(width: number, height: number, nbsites?: number, sites?: [number, number][]): Tile[];
export declare function rectangularTiling(width: number, height: number, tileWidth: number, tileHeight: number): Tile[];
