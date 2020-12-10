export function getKeyFromValue(value: object, map: Map<number, object>): number {
    let found = [...map]?.find(([key, val]) => val === value);

    if(found !== undefined) {
        return found[0];
    }

    // use 0 as fallbackvalue
    return 0;
}