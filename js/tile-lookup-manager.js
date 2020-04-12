class TileLookupManager {
    constructor(tileSize, tileDensityThreshold) {
        // this.tileSize = tileSize;
        this.tileDensityThreshold = tileDensityThreshold;
        // this.numIncrements = 100;
        this.hashedPaths = {};
    }

    _getHashKey = (e1, e2, e3, e4) => {
        return `${parseInt(e1)}-${parseInt(e2)}-${parseInt(e3)}-${parseInt(e4)}`;
    };

    getTilePathData(e1, e2, e3, e4) {
        // const hash = this._getHashKey(e1, e2, e3, e4);
        // if (this.hashedPaths[hash]) {
        //     return this.hashedPaths[hash];
        // }
        const lerp = this._lerp;
        const lookupIndex = this._getTileLookupIndex([e1, e2, e3, e4]);
        const lookupTable =  [
            [],
            [[0, lerp(e1, e4)], [lerp(e4, e3), 1], [0, 1], false],
            [[lerp(e4, e3), 1], [1, lerp(e2, e3)], [1, 1], false],
            [[0, lerp(e1, e4)], [1, lerp(e2, e3)], [1, 1], [0, 1], false],
            [[1, lerp(e2, e3)], [lerp(e1, e2), 0], [1, 0], false],
            [[0, lerp(e1, e4)], [lerp(e4, e3), 1], [0, 1], false, [1, lerp(e2, e3)], [lerp(e1, e2), 0], [1, 0], false],
            [[lerp(e4, e3), 1], [lerp(e1, e2), 0], [1, 0], [1, 1], false],
            [[lerp(e1, e2), 0], [1, 0], [1, 1], [0, 1], [0, lerp(e1, e4)], false],
            [[lerp(e1, e2), 0], [0, lerp(e1, e4)], [0, 0], false],
            [[lerp(e1, e2), 0], [lerp(e4, e3), 1], [0, 1], [0, 0], false],
            [[0, 0], [lerp(e1, e2), 0], [1, lerp(e2, e3)], [1, 1], [lerp(e4, e3), 1], [0, lerp(e1, e4)], false],
            [[0, 0], [lerp(e1, e2), 0], [1, lerp(e2, e3)], [1, 1], [0, 1], false],
            [[0, 0], [1, 0], [1, lerp(e2, e3)], [0, lerp(e1, e4)], false],
            [[0, 0], [1, 0], [1, lerp(e2, e3)], [lerp(e4, e3), 1], [0, 1], false],
            [[0, 0], [1, 0], [1, 1], [lerp(e4, e3), 1], [0, lerp(e1, e4)], false],
            [[0, 0], [1, 0], [1, 1], [0, 1], false]
        ];

        const path = lookupTable[lookupIndex];
        // this.hashedPaths[hash] = path;
        return path;
    }

    _getTileLookupIndex(edges) {
        const threshold = this.tileDensityThreshold;
        const [ e1, e2, e3, e4 ] = edges;
        const val1 = e1 >= threshold ? 8 : 0;
        const val2 = e2 >= threshold ? 4 : 0;
        const val3 = e3 >= threshold ? 2 : 0;
        const val4 = e4 >= threshold ? 1 : 0;
        return  val1 + val2 + val3 + val4;
    }

    _lerp = (eA, eB) => {
        const val = (this.tileDensityThreshold - eA) / (eB - eA);
        // return Math.round(val * this.numIncrements) / this.numIncrements;
        return val;
    };
}
