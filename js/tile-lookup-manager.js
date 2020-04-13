class TileLookupManager {
    constructor(tileSize, tileDensityThreshold, cachingEnabled = true) {
        this.tileDensityThreshold = tileDensityThreshold;
        this.cachingEnabled = cachingEnabled;
        this.cachedPaths = {};
    }

    getTilePath2D = (edges, threshold, tilesize) => {
        if (this.cachingEnabled) {
            const lookupIndex = this._getTileLookupIndex(edges, threshold);

            if (lookupIndex === 0 ) { return false }

            const hash = lookupIndex === 15 ? 'full-tile' : this._getHashKey(edges);
            if (this.cachedPaths[hash]) {
                return this.cachedPaths[hash]
            } else {
                const path2D =  this._createTilePath2D(edges, threshold, tilesize);
                this.cachedPaths[hash] = path2D;
                return path2D;
            }
        } else {
            return this._createTilePath2D(edges, threshold, tilesize);
        }
    };

    _getHashKey = edges => `${parseInt(edges[0])}-${parseInt(edges[1])}-${parseInt(edges[2])}-${parseInt(edges[3])}`;

    _lookupTilePathData(edges, threshold) {
        const [e1, e2, e3, e4] = edges;
        const lerpedLeft = this._lerp(e1, e4, threshold);
        const lerpedRight = this._lerp(e2, e3, threshold);
        const lerpedTop = this._lerp(e1, e2, threshold);
        const lerpedBottom = this._lerp(e4, e3, threshold);

        const lookupTable =  [
            [],
            [[0, lerpedLeft], [lerpedBottom, 1], [0, 1], false],
            [[lerpedBottom, 1], [1, lerpedRight], [1, 1], false],
            [[0, lerpedLeft], [1, lerpedRight], [1, 1], [0, 1], false],
            [[1, lerpedRight], [lerpedTop, 0], [1, 0], false],
            [[0, lerpedLeft], [lerpedBottom, 1], [0, 1], false, [1, lerpedRight], [lerpedTop, 0], [1, 0], false],
            [[lerpedBottom, 1], [lerpedTop, 0], [1, 0], [1, 1], false],
            [[lerpedTop, 0], [1, 0], [1, 1], [0, 1], [0, lerpedLeft], false],
            [[lerpedTop, 0], [0, lerpedLeft], [0, 0], false],
            [[lerpedTop, 0], [lerpedBottom, 1], [0, 1], [0, 0], false],
            [[0, 0], [lerpedTop, 0], [1, lerpedRight], [1, 1], [lerpedBottom, 1], [0, lerpedLeft], false],
            [[0, 0], [lerpedTop, 0], [1, lerpedRight], [1, 1], [0, 1], false],
            [[0, 0], [1, 0], [1, lerpedRight], [0, lerpedLeft], false],
            [[0, 0], [1, 0], [1, lerpedRight], [lerpedBottom, 1], [0, 1], false],
            [[0, 0], [1, 0], [1, 1], [lerpedBottom, 1], [0, lerpedLeft], false],
            [[0, 0], [1, 0], [1, 1], [0, 1], false]
        ];

        const lookupIndex = this._getTileLookupIndex([e1, e2, e3, e4], threshold);
        return lookupTable[lookupIndex];
    }

    _createTilePath2D = (edges, threshold, tileSize) => {
        const pathRaw = this._lookupTilePathData(edges, threshold);
        const path2D = new Path2D();

        let isDrawing = false;
        for (let i = 0, n = pathRaw.length; i < n; i++) {
            if (pathRaw[i]) {
                const position = util.vector.multiplyBy(pathRaw[i], tileSize);
                if (isDrawing) {
                    path2D.lineTo(position[0], position[1]);
                } else {
                    path2D.moveTo(position[0], position[1]);
                    isDrawing = true;
                }
            } else {
                isDrawing = false;
            }
        }
        path2D.closePath();
        return path2D;
    };

    _getTileLookupIndex(edges, threshold) {
        const [ e1, e2, e3, e4 ] = edges;
        const val1 = e1 >= threshold ? 8 : 0;
        const val2 = e2 >= threshold ? 4 : 0;
        const val3 = e3 >= threshold ? 2 : 0;
        const val4 = e4 >= threshold ? 1 : 0;
        return  val1 + val2 + val3 + val4;
    }

    _lerp = (eA, eB, threshold) => {
        return (threshold - eA) / (eB - eA);
    };
}
