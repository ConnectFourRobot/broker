export function getKeyFromValue(value: any, map: Map<number, any>): number {
    let found = [...map]?.find(([key, val]) => val == value);

    if(found !== undefined) {
        return found[0];
    }

    // use 0 as fallbackvalue
    return 0;
}

export function getMatrixFromArray<T>(array: Array<T> | any, width: number): Array<Array<T>> {
    return array.reduce((rows, key, index) => (index % width == 0 ? rows.push([key]) 
      : rows[rows.length-1].push(key)) && rows, []);
}

export function getArrayFrom2DMatrix<T>(matrix: Array<Array<T>>): Array<T> {
    return matrix.reduce((prev, curr) => prev.concat(curr));
}

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
