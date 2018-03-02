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