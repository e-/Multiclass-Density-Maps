export function positive(x:number) { return x > 0; }

export function translate(x:number, y:number) { return `translate(${x}, ${y})`}

export function create2D<T>(width:number, height:number, value:T) {
    let arr = new Array<T[]>(height);
    for(let i = 0; i < height; ++i)
        arr[i] = new Array<T>(width).fill(value);

    return arr;
}

export function linterp(v1:number, v2:number, t:number) {
    return v1*(1-t) + v2*t;
}

export function asum(values:number[]) {
    let n = values.length;
    var i = -1, value, sum = NaN;

    while (++i < n) { // Find the first comparable value.
        if ((value = values[i]) != null && value >= value) {
            sum = value;
            while (++i < n) { // Compare the remaining values.
                if ((value = values[i]) != null && value >= value) {
                    sum += value;
                }
            }
        }
    }
    return sum;
}

export function amax(values:number[]) {
    let n = values.length;
    var i = -1, value, max = NaN;

    while (++i < n) { // Find the first comparable value.
        if ((value = values[i]) != null && value >= value) {
            max = value;
            while (++i < n) { // Compare the remaining values.
                if ((value = values[i]) != null && value > max) {
                    max = value;
                }
            }
        }
    }
    return max;
}

export function amin(values:number[]) {
    let n = values.length;
    var i = -1, value, min = NaN;

    while (++i < n) {
        if ((value = values[i]) != null && value >= value) {
            min = value;
            while (++i < n) { // Compare the remaining values.
                if ((value = values[i]) != null && min > value) {
                    min = value;
                }
            }
        }
    }
    return min;
}

export function arange(start:number, end?:number, step?:number): number[] {
    var n = start;
    if (end == undefined) {
        end = start;
        start = 0;
    }
    else
        n = end-start;
    if (step == undefined)
        step = 1;
    else
        n = n / step;

    n = Math.floor(n);
    let array = new Array(n);
    for (let i = 0; i < n; i++) {
        array[i] = start;
        start += step;
    }
    return array;
}

let ongoing:{[url: string]: [(value?:any) => void, (value?:any) => void][]} = {};

export function get(url: string, responseType?:string): Promise<any> {
    if(!ongoing[url]) {
        ongoing[url] = [];

        const request = new XMLHttpRequest();
        request.onload = function () {

            if (this.status === 200) {
                ongoing[url].forEach(f => {
                    f[0](this.response);
                })
            } else {
                ongoing[url].forEach(f => {
                    f[1](new Error(this.statusText));
                })
            }
            delete ongoing[url];
        };

        request.onerror = function () {
            ongoing[url].forEach(f => {
                f[1](new Error('XMLHttpRequest Error: ' + this.statusText));
            })
        };
        request.open('GET', url);
        if (responseType)
            request.responseType = <any>responseType;
        request.send();
    }

    return new Promise<any>(function (resolve, reject) {
        ongoing[url].push([resolve, reject]);
    });
}


export { default as largeRectInPoly } from './largest-rect-in-poly';
