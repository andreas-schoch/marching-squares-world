class World {
    constructor(tileSize = 24, numTilesX= 10, numTilesY = 20) {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d', );
        this.canvas.width = tileSize * numTilesX;
        this.canvas.height = tileSize * numTilesY;

        this.canvasCache = document.createElement('canvas');
        this.canvasCache.width = this.canvas.width;
        this.canvasCache.height = this.canvas.height;
        this.hasCached = false;
        this.ctxCache = this.canvasCache.getContext('2d');

        this.tileSize = tileSize;
        this.numTilesX = numTilesX;
        this.numTilesY = numTilesY;

        this.tileDensityThreshold = 16;
        this.tileDensityMax = 100;

        this.vertices = [];
        this.TileManager = new TileLookupManager(tileSize, this.tileDensityThreshold);
        this.debugManager = new Debug(numTilesX, numTilesY, tileSize);
        

    //     this.pathTemplates = this._createPathsFromLookupTable();
    //     this.imageTemplates = this._createImagesFromPathTemplates();
    //     this.canvasSprites = this._createCanvasSprites();
    }

    _generateVertices(noiseFunction) {
        this.vertices = [];
        for (let y = 0; y <= this.numTilesY; y++) {
            const row = [];
            for (let x = 0; x <= this.numTilesX; x++) {
                const value = noiseFunction.call(this, x, y);
                row.push(value);
            }
            this.vertices.push(row);
        }
    }

    _getTileEdges(x, y) {
        const edge1 = this.vertices[y][x];
        const edge2 = this.vertices[y][x+1];
        const edge3 = this.vertices[y+1][x+1];
        const edge4 = this.vertices[y+1][x];
        return [edge1, edge2, edge3, edge4];
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

    // _renderCube(x, y, lookupIndex) {
    //     const path = this.marchingSquaresLookupTable[lookupIndex];
    //     let isDrawing = false;
    //     for (let i = 0, n = path.length; i < n; i++) {
    //         const raw = path[i];
    //         if (raw) {
    //             const offsetX = this.tileSize * x;
    //             const offsetY = this.tileSize * y;
    //             const position = [raw[0] * this.tileSize + offsetX, raw[1] * this.tileSize + offsetY];
    //             if (isDrawing) {
    //                 this.ctx.lineTo(position[0], position[1]);
    //             } else {
    //                 this.ctx.beginPath();
    //                 this.ctx.moveTo(position[0], position[1]);
    //                 isDrawing = true;
    //             }
    //         } else {
    //             this.ctx.closePath();
    //             isDrawing = false;
    //         }
    //         this.ctx.fill();
    //     }
    // }

    _renderTileFromPath(x, y, path) {
        // const path = this.marchingSquaresLookupTable[lookupIndex];
        let isDrawing = false;
        for (let i = 0, n = path.length; i < n; i++) {
            const raw = path[i];
            if (raw) {
                const offsetX = this.tileSize * x;
                const offsetY = this.tileSize * y;
                const position = [raw[0] * this.tileSize + offsetX, raw[1] * this.tileSize + offsetY];
                if (isDrawing) {
                    this.ctx.lineTo(position[0], position[1]);
                } else {
                    this.ctx.beginPath();
                    this.ctx.moveTo(position[0], position[1]);
                    isDrawing = true;
                }
            } else {
                this.ctx.fill();
                this.ctx.closePath();
                isDrawing = false;
            }
        }
    }

    renderTilesLerped(x, y, edgesOverwrite = null) {
        const edges = edgesOverwrite ? edgesOverwrite : this._getTileEdges(x, y);
        const lookupIndex = this._getTileLookupIndex(edges);
        // console.log("lookup index", lookupIndex);
        const path = this.TileManager.getTilePathData(...edges)[lookupIndex]; // todo refactor to prevent lerps when not needed

        const offsetX = this.tileSize * x;
        const offsetY = this.tileSize * y;

        let isDrawing = false;
        for (let i = 0, n = path.length; i < n; i++) {
            if (path[i]) {
                const position = [path[i][0] * this.tileSize + offsetX, path[i][1] * this.tileSize + offsetY];
                if (isDrawing) {
                    this.ctx.lineTo(position[0], position[1]);
                } else {
                    this.ctx.beginPath();
                    this.ctx.moveTo(position[0], position[1]);
                    isDrawing = true;
                }
            } else {
                this.ctx.closePath();
                isDrawing = false;
                this.ctx.fill();
            }
        }
    }

    _createImagesFromPathTemplates() {
        const canvasTemp = document.createElement('canvas');  // TODO in the future maybe cache and reuse canvas elements in case needed for more things
        const ctxTemp = canvasTemp.getContext('2d');
        canvasTemp.width = this.cubeSize;
        canvasTemp.height = this.cubeSize;

        return this.pathTemplates.map((paths) => {
            const img = new Image();
            ctxTemp.clearRect(0, 0, this.cubeSize, this.cubeSize);
            paths.forEach(path => ctxTemp.fill(path));
            img.src = canvasTemp.toDataURL();
            return img;
        });
    }

    // _renderCubeFromPathTemplate(x, y, lookupIndex) {
    //     const position = [this.tileSize * x, this.tileSize * y];
    //     this.ctx.translate(position[0], position[1]);
    //     this.pathTemplates[lookupIndex].forEach(path => this.ctx.fill(path));
    //     this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    // }

    // _renderCubeFromImageTemplate(x, y, lookupIndex) {
    //     const position = [this.tileSize * x, this.tileSize * y];
    //     this.ctx.translate(position[0], position[1]);
    //     const img = this.imageTemplates[lookupIndex];
    //     this.ctx.drawImage(img, 0, 0, this.tileSize, this.tileSize);
    //     this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    // }

    // _renderCubeFromCanvasSprites(x, y, lookupIndex) {
    //     const tileSize = this.tileSize;
    //     const sourcePosition = [lookupIndex * tileSize, 0];
    //     const destinationPosition = [x * tileSize, y * tileSize];
    //     this.ctx.drawImage(
    //         this.canvasSprites,
    //         sourcePosition[0],
    //         sourcePosition[1],
    //         tileSize,
    //         tileSize,
    //         destinationPosition[0],
    //         destinationPosition[1],
    //         tileSize,
    //         tileSize,
    //     )
    // }

    // _createPathsFromLookupTable() {
    //     return this.marchingSquaresLookupTable.map((pathData) => {
    //         const paths = [];
    //         const path = new Path2D();
    //         let isDrawing = false;
    //         for (let i = 0, n = pathData.length; i < n; i++) {
    //             const normalizedPosition = pathData[i];
    //             if (normalizedPosition) {
    //                 const position = [normalizedPosition[0] * this.tileSize, normalizedPosition[1] * this.tileSize];
    //                 if (isDrawing) {
    //                     path.lineTo(position[0], position[1]);
    //                 } else {
    //                     path.moveTo(position[0], position[1]);
    //                     isDrawing = true;
    //                 }
    //             } else {
    //                 path.closePath();
    //                 paths.push(path);
    //                 isDrawing = false;
    //             }
    //         }
    //         return paths;
    //     });
    // }

    // _createImagesFromPathTemplates() {
    //     const canvasTemp = document.createElement('canvas');  // TODO in the future maybe cache and reuse canvas elements in case needed for more things
    //     const ctxTemp = canvasTemp.getContext('2d');
    //     canvasTemp.width = this.tileSize;
    //     canvasTemp.height = this.tileSize;
    //
    //     return this.pathTemplates.map((paths) => {
    //         const img = new Image();
    //         ctxTemp.clearRect(0, 0, this.tileSize, this.tileSize);
    //         paths.forEach(path => ctxTemp.fill(path));
    //         img.src = canvasTemp.toDataURL();
    //         return img;
    //     });
    // }

    // _createCanvasSprites(gap = 0) {
    //     const canvasSprites = document.createElement('canvas');
    //     const ctxSprites = canvasSprites.getContext('2d');
    //     canvasSprites.width = (this.tileSize + gap) * this.marchingSquaresLookupTable.length - gap;
    //     canvasSprites.height = this.tileSize;
    //
    //     this.pathTemplates.forEach((paths) => {
    //         paths.forEach(path => ctxSprites.fill(path));
    //         ctxSprites.translate(this.tileSize + gap, 0);
    //     });
    //
    //     ctxSprites.setTransform(1, 0, 0, 1, 0, 0);
    //     canvasSprites.ctx = ctxSprites;
    //     canvasSprites.gap = gap;
    //     return canvasSprites;
    // }

    _renderWorld = () => {


        this.ctx.fillStyle = 'black';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.hasCached) {
            this.ctx.drawImage(this.canvasCache, 0, 0);
        } else {
            for (let y = 0; y < this.numTilesY; y++) {
                for (let x = 0; x < this.numTilesX; x++) {
                    // this._renderCubeFromPathTemplate(x, y, this._findLookupIndexAt(x, y));
                    // this._renderCubeFromCanvasSprites(x, y, this._findLookupIndexAt(x, y));
                    this.renderTilesLerped(x, y);
                }
            }
            this.ctxCache.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctxCache.drawImage(this.canvas, 0, 0);

            this.hasCached = true;
        }
        // this.debugManager._renderDebugEdgeDensity(this.vertices, this.ctx);
        // this.debugManager._renderDebugGrid(this.ctx);

        window.requestAnimationFrame(this._renderWorld);
    }
}

const world = new World(50, 10, 10);
noise.seed(666);
// world._generateVertices((x, y) => {
//     const nx = x/10 - 0.5,
//           ny = y/10 - 0.5;
//      return  (noise.simplex2(nx * 20, ny * 20 ) + 1) / 2;
// });
world._generateVertices((x, y) => y > 20 ? 32 : 0);
window.requestAnimationFrame(world._renderWorld);


const sculptComponent = new SculptComponent(world.canvas, 4, 1);
world.canvas.addEventListener('mousedown', function(evt) {
    sculptComponent.sculpt(evt);
    world.canvas.addEventListener('mousemove', sculptComponent.sculpt);
});

document.addEventListener('mouseup', () => {
    world.canvas.removeEventListener("mousemove", sculptComponent.sculpt);

});


// function distance(vector1, vector2) {
//     const relativeVector = [vector1[0] - vector2[0], vector1[1] - vector2[1]];
//     return Math.hypot(relativeVector[0], relativeVector[1])
// }
