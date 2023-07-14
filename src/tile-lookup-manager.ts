import { Vector2, VectorUtils } from "./utils/vector";

export type Edges = [number, number, number, number];
export type TilePathData = ([number, number, string] | Vector2 | false)[];

export interface ILine {
  from: Vector2;
  to: Vector2;
}
export interface IIsoPathData {
  lines: ILine;
  direction: Vector2; // Can also be derived with relative vector between from and to positions
}

export class TileLookupManager {
  cachingEnabled: boolean;
  cachedPaths: Map<string, [Path2D, Path2D]>;
  
  constructor(tileSize: number, cachingEnabled = true) {
    this.cachingEnabled = cachingEnabled;
    this.cachedPaths = new Map();
  }

  getTilePath2D = (edges: Edges, threshold: number, tilesize: number): [Path2D, Path2D, ] | undefined => {
    if (this.cachingEnabled) {
      const lookupIndex = this._getTileLookupIndex(edges, threshold);

      if (lookupIndex === 0) return;

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
    // TODO why was parseInt used here before?
  _getHashKey = (edges: Edges) => `${Math.floor(edges[0])}-${Math.floor(edges[1])}-${Math.floor(edges[2])}-${Math.floor(edges[3])}`;

  _lookupTilePathData(edges: Edges, threshold: number): TilePathData {
    const [e1, e2, e3, e4] = edges;
    const lerpedLeft = this.inverseLerp(e1, e4, threshold);
    const lerpedRight = this.inverseLerp(e2, e3, threshold);
    const lerpedTop = this.inverseLerp(e1, e2, threshold);
    const lerpedBottom = this.inverseLerp(e4, e3, threshold);

    // TODO experimental iso line support on top of existing lookups. There are some visual issues that need to be fixed
    const lookupTable: TilePathData[] = [
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

  _createTilePath2D = (edges: Edges, threshold: number, tileSize: number) => {
    const pathRaw: TilePathData = this._lookupTilePathData(edges, threshold);
    const path2D = new Path2D();

    let isDrawing = false;
    for (let i = 0, n = pathRaw.length; i < n; i++) {
      if (pathRaw[i]) {
        const position = VectorUtils.multiplyBy(pathRaw[i] as Vector2, tileSize);
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

  _createTileSVGPath2D = (pathRaw: TilePathData, threshold: number, tileSize: number): [Path2D, Path2D] => {
    let svgData = '';
    let svgDataIso = '';
    let from: Vector2 | undefined;
    let to: Vector2 | undefined;

    let isDrawing = false;
    let isDrawingIso = false;
    for (const p of pathRaw) {
      if (p) {
        const position = VectorUtils.multiplyBy(p as Vector2, tileSize);
        
        if (isDrawingIso) {
          // console.log('iso end');
          to = [position[0], position[1]];
          svgDataIso += ` L ${Math.round(position[0])} ${Math.round(position[1])} Z `;
          isDrawingIso = false;
        } else if (Array.isArray(p) && p[2] === 'iso-start') {
          from = [position[0], position[1]];
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


  _getTileLookupIndex(edges: Edges, threshold: number) {
    const [e1, e2, e3, e4] = edges;
    const val1 = e1 >= threshold ? 8 : 0;
    const val2 = e2 >= threshold ? 4 : 0;
    const val3 = e3 >= threshold ? 2 : 0;
    const val4 = e4 >= threshold ? 1 : 0;
    const index = val1 + val2 + val3 + val4;

    // const avg = (e1 + e2 + e3 + e4) / 4;
    // if (index === 5) return avg >= threshold ? 17 : 5;
    // if (index === 10) return avg >= threshold ? 16 : 10; // TODO experiment switching index based on density

    return index;
  }

  inverseLerp = (eA: number, eB: number, threshold: number) => {
    return (threshold - eA) / (eB - eA);
  };
}


// TODO interesting idea with "hermite data" to preserve sharp edges using normals.
//  https://catlikecoding.com/unity/tutorials/marching-squares-3/
//  https://web.archive.org/web/20201108091033/https://catlikecoding.com/unity/tutorials/marching-squares-3/
//  Requires us to store 2 more verts per datapoint but increases approximation by quite a lot
//  I think this might be how "dual contouring" works