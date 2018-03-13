declare module "tdigest" {

    interface Centroid {
        mean: number;
        n: number;
    }

    class TDigest {
        constructor(delta?:number|false, K?: number, CX?: number);
        
        reset();
        size(): number;
        toArray(): Centroid[];
        summary(): string;
        push(x: number);
        push(x: number[], n?: number);
        push_centroid(c:Centroid|Centroid[]);
        find_nearest(x:number): Centroid;
        bound_mean(x: number): [number, number];
        p_rank(x: number): number;
        p_rank(x: number[]): number[];
        bound_mean_cumn(cumn:number): [number, number];
        percentile(p:number):number;
        percentile(p:number[]):number[];
        compress();

    }

    interface Config {
        mode?: 'auto'|'disc'|'cont';
        delta?: number;
        ratio?: number;
        thresh?: number;
    }

    class Digest extends TDigest {
        constructor(config?:Config);
        push(x: number);
        push(x: number[], n?: number);
        check_continuous(): boolean;
    }

}
