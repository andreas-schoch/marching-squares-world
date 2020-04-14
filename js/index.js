class World {
    constructor(tileSize = 24, numTilesX= 10, numTilesY = 20) {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d', );
        this.canvas.width = tileSize * numTilesX;
        this.canvas.height = tileSize * numTilesY;

        this.canvasCache = document.createElement('canvas');
        this.canvasCache.width = this.canvas.width;
        this.canvasCache.height = this.canvas.height;
        this.ctxCache = this.canvasCache.getContext('2d');

        this.tileSize = tileSize;
        this.numTilesX = numTilesX;
        this.numTilesY = numTilesY;
        this.disableWater = false;

        this.tileDensityMax = 32;
        this.tileDensityThreshold = (this.tileDensityMax / 2);

        // this.verticesBuffer = new ArrayBuffer(numTilesX * numTilesY);
        // this.verticesView = new Uint8Array(this.verticesBuffer);
        // console.log('test',this.verticesView[0].setInt);
        // console.log('Terrain vertices size', this.verticesBuffer.byteLength / 1024, 'MB');

        this.verticesMaterial = [];
        this.materialColor = ['black', 'blue', 'green', 'red'];
        this.vertices = [];
        this.verticesWater = [];

        this.vertMap = [this.vertices, this.verticesWater];

        this.waterTest = []; // todo try using a hashmap with indices as hash to make it "sparse"
        this.hashedPaths = {};
        this.renderQueue = [
            {x: 0, y: 0, numTilesX: this.numTilesX, numTilesY: this.numTilesY, materialIndex: null},
        ];
        this.TileManager = new TileLookupManager(tileSize, this.tileDensityThreshold);
        this.input = new InputComponent(); // TODO move this to a player class;
        this.input.initListeners(document);
        this.sculpComponent = new SculptComponent(this, 3, 3);  // TODO move this to a player class;
    }

    _generateVertices(noiseFunction) {
        // this.vertices = [];
        // this.verticesMaterial = [];
        for (let y = 0; y <= this.numTilesY; y++) {
            const row = [];
            const rowWater = [];
            for (let x = 0; x <= this.numTilesX; x++) {
                const value = noiseFunction.call(this, x, y);
                row.push(value);
                rowWater.push(value === this.tileDensityMax ? 0 : this.tileDensityMax);
            }
            this.vertices.push(row);
            this.verticesWater.push(rowWater);
        }
    }

    _getTileEdges(x, y, materialIndex) {
        try {
            // const [edge1Mat, edge2Mat, edge3Mat, edge4Mat] = this._getTileEdgesColor(x, y);
            const verts = this.vertMap[materialIndex];
            const edge1 = verts[y][x];
            const edge2 = verts[y][x+1];
            const edge3 = verts[y+1][x+1];
            const edge4 = verts[y+1][x];
            return [edge1, edge2, edge3, edge4];
        } catch(e) {
            return false;
        }
    }

    // _getTileEdgesColor(x, y) {
    //     try {
    //         const edge1 = this.verticesMaterial[y][x];
    //         const edge2 = this.verticesMaterial[y][x+1];
    //         const edge3 = this.verticesMaterial[y+1][x+1];
    //         const edge4 = this.verticesMaterial[y+1][x];
    //         return [edge1, edge2, edge3, edge4];
    //     } catch(e) {
    //         return false;
    //     }
    // }

    renderTileAt(x, y, edgesOverwrite = null, materialIndex = 0) {
        const edges = edgesOverwrite || this._getTileEdges(x, y, materialIndex);
        if (edges) {
            const path2D = this.TileManager.getTilePath2D(edges, this.tileDensityThreshold, this.tileSize);
            if (path2D) {
                const position = util.vector.multiplyBy([x, y], this.tileSize);
                this.ctx.translate(position[0], position[1]);
                // const materialIndex = this.verticesMaterial[y][x];
                this.ctx.fillStyle = this.materialColor[materialIndex];
                this.ctx.fill(path2D);
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            }
        }
    }

    _updateWorld = () => {
      if ( this.input._mappings.leftMouseButton.active) {
          this.sculpComponent.sculpt(this.input.lastMouseMoveEvent)
      }
    };

    _renderWorld = () => {
        this.ctx.fillStyle = 'grey';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.drawImage(this.canvasCache, 0, 0);
        if (this.renderQueue.length) {
            this.renderQueue.forEach((bounds) => {
                this.ctx.clearRect(bounds.x * this.tileSize, bounds.y * this.tileSize, bounds.numTilesX * this.tileSize, bounds.numTilesY * this.tileSize);
                for (let y = bounds.y; y < (bounds.y + bounds.numTilesY); y++) {
                    for (let x = bounds.x; x < bounds.x + bounds.numTilesX; x++) {
                        if (x < 0 || y < 0 || x > this.numTilesX || y > this.numTilesY) { continue }

                        if (bounds.materialIndex) {
                            this.renderTileAt(x, y, null, bounds.materialIndex);
                        } else {
                            this.renderTileAt(x, y, null, 1);
                            if ( this.disableWater === false) {
                                this.renderTileAt(x, y, null, 0);
                            }
                        }
                    }
                }
                if (bounds.materialIndex ==='water-update') {
                    this.moveWaterTest();
                }
            });

            this.renderQueue.length = 0;
            this.ctxCache.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctxCache.drawImage(this.canvas, 0, 0);
            // Object.entries(this.TileManager.hashedPaths).forEach(([key, val]) => console.log(key, 'num hashed: ', Object.values(val).length, val))
        }

        // util.debug.renderDebugGrid(this);
        // util.debug.renderDebugEdgeDensity(this, 1);
    };

    moveWaterTest() {
        for (let y = this.numTilesY - 2; y >= 0; y--) {
            for (let left = 0, right = this.numTilesX; left < right; left++, right--) {
                const currentValueLeft = this.verticesWater[y][left];
                const currentValueRight = this.verticesWater[y][right];

                if (this.vertices[y+1][left] === 0 && this.verticesWater[y+1][left] === 0)  {
                    console.log('move down left');
                    this.verticesWater[y+1][left] = currentValueLeft;
                    this.verticesWater[y][left] = 0;
                }

                if (this.vertices[y+1][right] === 0 && this.verticesWater[y+1][right] === 0) {
                    console.log('move down right');
                    this.verticesWater[y+1][right] = currentValueRight;
                    this.verticesWater[y][right] = 0;
                }
            }
        }
        this.renderQueue.push(
            {x: 0, y: 0, numTilesX: this.numTilesX, numTilesY: this.numTilesY, materialIndex: 'water-update'},

        );
    }

    main = () => {
        this._updateWorld();
        this._renderWorld();
        requestAnimationFrame(this.main);
    };
}

const world = new World(50, 30, 15);
noise.seed(666);
world._generateVertices((x, y) => y > world.numTilesY / 2 ? world.tileDensityMax : 0);
window.requestAnimationFrame(world.main);


const corner3 = 22;
const corner4 = 28;

// const corner3Inverse = 10;
// const corner4Inverse = 10;
// world.renderTileAt(0, 0, [32, 0, 0, 0], 0); // black
// world.renderTileAt(0, 0, [0, 32, 0, 0], 1); // BLUE
// world.renderTileAt(0, 0, [0, 32, 32, 0], 2); // GREEN
// world.renderTileAt(0, 0, [0, 0, 0, 22], 3); // RED



document.addEventListener('keydown', (evt) => {
   if (evt.key === '1') {
       world.sculpComponent.activeMaterialIndex = 0;
   }

   if (evt.key === '2') {
       world.sculpComponent.activeMaterialIndex = 1;
   }

   if( evt.key === '0') {
       world.disableWater = !world.disableWater;
       world.renderQueue.push(
           {x: 0, y: 0, numTilesX: world.numTilesX, numTilesY: world.numTilesY, materialIndex: null},
       )
   }
});


// function getInverseTest(cornerValue) {
//     const
//     const inverseCornerValue =
//     return inverseCornerValue;
// }
// TODO Think about how to handle collisions. Test fixed partitioning first then test with a quadtree
// TODO Figure out how to bounce a ball relative to the terrain surface normal (compare edge1 with edge2 of surface and use dot product with direction vector of ball with some magic)


// TODO blending materials: A single tile can contain two different materials. This is necessary to have smooth outlines.
//      An edge can have a single material, so technically a tile can have 4 different materials. Marching squares cannot easily support 4 materials without gaps.
//      Per tile there can be 2 materials at max, which have to be "synced" with one another. Meaning that two relevant corner cannot have a value higher than maxDensityAmount.
//      Lets say maxDensity = 32 and the tile has 32-32-0-0 edge densities with material 1. If now the same tile has 0-0-32-32 densities with material 2...
//      ...if now tile with mat 1 becomes 32-32-5-10, the corners of mat 2 need to adjust to 0-0-27-22. Lerped opposite corners density cannot be over maxDensity.


