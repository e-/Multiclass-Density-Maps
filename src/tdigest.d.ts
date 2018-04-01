declare module "tdigest" {

    interface Centroid {
        mean: number;
        n: number;
    }

    class TDigest {
        constructor(delta?:number|false, K?: number, CX?: number);
        
        reset(): void;
        size(): number;
        toArray(): Centroid[];
        summary(): string;
        push(x: number):void;
        push(x: number[], n?: number):void;
        push_centroid(c:Centroid|Centroid[]):void;
        find_nearest(x:number): Centroid;
        bound_mean(x: number): [number, number];
        p_rank(x: number): number;
        p_rank(x: number[]): number[];
        bound_mean_cumn(cumn:number): [number, number];
        percentile(p:number):number;
        percentile(p:number[]):number[];
        compress():void;

    }

    interface Config {
        mode?: 'auto'|'disc'|'cont';
        delta?: number;
        ratio?: number;
        thresh?: number;
    }

    class Digest extends TDigest {
        constructor(config?:Config);
        push(x: number):void;
        push(x: number[], n?: number):void;
        check_continuous(): boolean;
    }

}
