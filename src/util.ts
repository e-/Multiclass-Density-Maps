export function positive(x:number) { return x > 0; }

export function create2D<T>(width:number, height:number, value:T) {
    let arr:T[][] = [];
    for(let i = 0; i < height; ++i) {
      arr.push(new Array(width));
      for(let j = 0; j < width; ++j) {
        arr[i][j] = value;
      }
    }

    return arr;
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

let cache:any = {};

export function get(url: string): Promise<any> {
    if(cache[url]) return Promise.resolve(cache[url]);
    return new Promise<any>(
        function (resolve, reject) {
            const request = new XMLHttpRequest();
            request.onload = function () {
            if (this.status === 200) {
                cache[url] = this.response;
                resolve(this.response);
            } else {
                reject(new Error(this.statusText));
            }
        };
        request.onerror = function () {
            reject(new Error('XMLHttpRequest Error: ' + this.statusText));
        };
        request.open('GET', url);
        request.send();
    });
}
