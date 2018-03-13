declare module 'tdigest' {
    export class Digest {
        push(ele: number):void;
        push(ele: number[]):void;

        compress():void;

        percentile(p: number):number;
        percentile(p: number[]):number[];

        p_rank(x: number):number;
        p_rank(x: number[]):number[];
    }
}
