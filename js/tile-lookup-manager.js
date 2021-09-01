class TileLookupManager {
  constructor(tileSize, cachingEnabled = true) {
    this.cachingEnabled = cachingEnabled;
    this.cachedPaths = new Map();
  }

  getTilePath2D = (edges, threshold, tilesize) => {
    if (this.cachingEnabled) {
      const lookupIndex = this._getTileLookupIndex(edges, threshold);

      if (lookupIndex === 0) {
        return [false, false]
      }

      const hash = lookupIndex === 15 ? 'full-tile' : this._getHashKey(edges);
      if (this.cachedPaths.has(hash)) {
        return this.cachedPaths.get(hash);
      } else {
        const pathRaw = this._lookupTilePathData(edges, threshold);
        const paths = this._createTileSVGPath2D(pathRaw, threshold, tilesize);
        this.cachedPaths.set(hash, paths);
        return paths;
      }
    } else {
      const pathRaw = this._lookupTilePathData(edges, threshold);
      return this._createTileSVGPath2D(pathRaw, threshold, tilesize);
    }
  };

    // _getHashKey = edges => `${Math.round(edges[0])}-${Math.round(edges[1])}-${Math.round(edges[2])}-${Math.round(edges[3])}`;
  _getHashKey = edges => `${parseInt(edges[0])}-${parseInt(edges[1])}-${parseInt(edges[2])}-${parseInt(edges[3])}`;

  _lookupTilePathData(edges, threshold) {
    const [e1, e2, e3, e4] = edges;
    const lerpedLeft = this.inverseLerp(e1, e4, threshold);
    const lerpedRight = this.inverseLerp(e2, e3, threshold);
    const lerpedTop = this.inverseLerp(e1, e2, threshold);
    const lerpedBottom = this.inverseLerp(e4, e3, threshold);

    // TODO experimental iso line support on top of existing lookups. There are some visual issues that need to be fixed
    const lookupTable = [
      [],
      [[0, lerpedLeft, 'iso-start'], [lerpedBottom, 1], [0, 1], false],
      [[lerpedBottom, 1, 'iso-start'], [1, lerpedRight], [1, 1], false],
      [[0, lerpedLeft, 'iso-start'], [1, lerpedRight], [1, 1], [0, 1], false],

      [[1, lerpedRight, 'iso-start'], [lerpedTop, 0], [1, 0], false],
      [[0, lerpedLeft, 'iso-start'], [lerpedBottom, 1], [0, 1], false, [1, lerpedRight, 'iso-start'], [lerpedTop, 0], [1, 0], false],
      [[lerpedBottom, 1, 'iso-start'], [lerpedTop, 0], [1, 0], [1, 1], false],
      [[lerpedTop, 0, 'iso-start'], [0, lerpedLeft], [0, 1], [1, 1], [1, 0], false],

      [[lerpedTop, 0, 'iso-start'], [0, lerpedLeft], [0, 0], false],
      [[lerpedTop, 0, 'iso-start'], [lerpedBottom, 1], [0, 1], [0, 0], false],
      [[0, 0], [lerpedTop, 0, 'iso-start'], [1, lerpedRight], [1, 1], [lerpedBottom, 1, 'iso-start'], [0, lerpedLeft], false],
      [[0, 0], [lerpedTop, 0, 'iso-start'], [1, lerpedRight], [1, 1], [0, 1], false],

      [[0, 0], [1, 0], [1, lerpedRight, 'iso-start'], [0, lerpedLeft], false],
      [[0, 0], [1, 0], [1, lerpedRight, 'iso-start'], [lerpedBottom, 1], [0, 1], false],
      [[0, 0], [1, 0], [1, 1], [lerpedBottom, 1, 'iso-start'], [0, lerpedLeft], false],
      [[0, 0], [1, 0], [1, 1], [0, 1], false],

      // alternatives for index 5 and 10
      // [[0, lerpedLeft], [lerpedBottom, 1], [0, 1], false, [1, lerpedRight], [lerpedTop, 0], [1, 0], false],  // 5 hollow
      // [[0, 0], [lerpedTop, 0], [1, lerpedRight], [1, 1], [lerpedBottom, 1], [0, lerpedLeft], false],
      [[0, lerpedLeft], [0, 0], [lerpedTop, 0], false, [1, lerpedRight], [1, 1], [lerpedBottom, 1], false],
      [[0, 1], [0, lerpedLeft], [lerpedTop, 0], [1, 0], [1, lerpedRight], [lerpedBottom, 1], false],
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
          path2D.lineTo(Math.round(position[0]), Math.round(position[1]));
        } else {
          path2D.moveTo(Math.round(position[0]), Math.round(position[1]));
          isDrawing = true;
        }
      } else {
        isDrawing = false;
      }
    }
    path2D.closePath();
    return path2D;
  };

  _createTileSVGPath2D = (pathRaw, threshold, tileSize) => {
    let svgData = '';
    let svgDataIso = '';

    let isDrawing = false;
    let isDrawingIso = false;
    for (let i = 0, n = pathRaw.length; i < n; i++) {
      if (pathRaw[i]) {
        const position = util.vector.multiplyBy(pathRaw[i], tileSize);

        if (isDrawingIso) {
          // console.log('iso end');
          svgDataIso += ` L ${Math.round(position[0])} ${Math.round(position[1])} Z `;
          isDrawingIso = false;
        } else if (pathRaw[i][2] === 'iso-start'){
          // console.log('iso start');
          svgDataIso += `M ${Math.round(position[0])} ${Math.round(position[1])}`;
          isDrawingIso = true;
        }

        if (isDrawing) {
          svgData += ` L ${Math.round(position[0])} ${Math.round(position[1])} `;
        } else {
          svgData += `M ${Math.round(position[0])} ${Math.round(position[1])}`;
          isDrawing = true;
        }
      } else {
        svgData += 'Z';
        isDrawing = false;
      }
    }

    return [new Path2D(svgData), new Path2D(svgDataIso)];
  };


  _getTileLookupIndex(edges, threshold) {
    const [e1, e2, e3, e4] = edges;
    const val1 = e1 >= threshold ? 8 : 0;
    const val2 = e2 >= threshold ? 4 : 0;
    const val3 = e3 >= threshold ? 2 : 0;
    const val4 = e4 >= threshold ? 1 : 0;
    const index = val1 + val2 + val3 + val4;

    const avg = (e1 + e2 + e3 + e4) / 4;
    // if (index === 5) return avg >= threshold ? 17 : 5;
    // if (index === 10) return avg >= threshold ? 16 : 10; // TODO experiment switching index based on density

    return index;
  }

  inverseLerp = (eA, eB, threshold) => {
    return (threshold - eA) / (eB - eA);
  };
}


// TODO interesting idea with "hermite data" to preserve sharp edges using normals.
//  https://catlikecoding.com/unity/tutorials/marching-squares-3/
//  https://web.archive.org/web/20201108091033/https://catlikecoding.com/unity/tutorials/marching-squares-3/
//  Requires us to store 2 more verts per datapoint but increases approximation by quite a lot
//  I think this might be how "dual contouring" works