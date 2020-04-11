class TileLookupManager {
    constructor(tileSize, tileDensityThreshold) {
        this.tileSize = tileSize;
        this.tileDensityThreshold = tileDensityThreshold;
        this.numIncrements = 10;
    }

    getTilePathData(e1, e2, e3, e4) {
        const lerp = this._lerp;
        // todo refactor to only lerp when necessary not for all variations
        return [
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
    }

    _lerp = (eA, eB) => {
        const threshold = this.tileDensityThreshold;
        // let edgeA = eA < threshold ? eA * 2 : eA;
        // let edgeB = eB < threshold ? eB * 2 : eB;
        // // edgeA = eA >= threshold ? Math.min(eA, threshold) : edgeA;
        // // edgeB = eB >= threshold ? Math.min(eB, threshold) : edgeB;

        // const combinedStrength = (edgeA + edgeB) * -1;
        // const rawValue = (edgeA / combinedStrength) + 1;
        // return rawValue;

        const val = (threshold - eA) / (eB - eA);
        return val;
    };
}
