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

export function amax(arr:number[] | null) {
    return Math.max.apply(Math, arr);
}

export function amin(arr:number[] | null) {
    return Math.min.apply(Math, arr);
}

export function get(url: string): Promise<any> {
    return new Promise<any>(
        function (resolve, reject) {
            const request = new XMLHttpRequest();
            request.onload = function () {
            if (this.status === 200) {
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
