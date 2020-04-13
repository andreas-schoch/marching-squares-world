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

        this.tileDensityMax = 32;
        this.tileDensityThreshold = this.tileDensityMax / 2;

        this.buffer = new ArrayBuffer(numTilesX * numTilesY);


        this.vertices = [];
        this.waterTest = []; // todo try using a hashmap with indices as hash to make it "sparse"
        this.hashedPaths = {};
        this.renderQueue = [
            {x: 0, y: 0, numTilesX: this.numTilesX, numTilesY: this.numTilesY},
        ];
        this.TileManager = new TileLookupManager(tileSize, this.tileDensityThreshold);
        this.input = new InputComponent(); // TODO move this to a player class;
        this.input.initListeners(document);
        this.sculpComponent = new SculptComponent(this, 10, this.tileDensityThreshold * 0.25);  // TODO move this to a player class;
    }

    _generateVertices(noiseFunction) {
        this.vertices = [];
        this.waterTest = [];
        for (let y = 0; y <= this.numTilesY; y++) {
            const row = [];
            // const rowWater = [];
            for (let x = 0; x <= this.numTilesX; x++) {
                const value = noiseFunction.call(this, x, y);
                // console.log(value);
                row.push(value);
                // rowWater.push(0);
            }
            this.vertices.push(row);
            // this.waterTest.push(rowWater);
        }
    }

    _getTileEdges(x, y) {
        try {
            const edge1 = this.vertices[y][x];
            const edge2 = this.vertices[y][x+1];
            const edge3 = this.vertices[y+1][x+1];
            const edge4 = this.vertices[y+1][x];
            return [edge1, edge2, edge3, edge4];
        } catch(e) {
            return false;
        }
    }

    renderTileAt(x, y, edgesOverwrite = null) {
        const edges = edgesOverwrite || this._getTileEdges(x, y);
        if (edges) {
            const path2D = this.TileManager.getTilePath2D(edges, this.tileDensityThreshold, this.tileSize);
            if (path2D) {
                const position = util.vector.multiplyBy([x, y], this.tileSize);
                this.ctx.translate(position[0], position[1]);
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
                        this.renderTileAt(x, y);
                    }
                }
            });

            this.renderQueue.length = 0;
            this.ctxCache.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctxCache.drawImage(this.canvas, 0, 0);
            // Object.entries(this.TileManager.hashedPaths).forEach(([key, val]) => console.log(key, 'num hashed: ', Object.values(val).length, val))
        }
        // util.debug.renderDebugGrid(this);
        // util.debug.renderDebugEdgeDensity(this);
    };

    main = () => {
        this._updateWorld();
        this._renderWorld();
        requestAnimationFrame(this.main);
    };
}

const world = new World(20, 100, 45);
noise.seed(666);
world._generateVertices((x, y) => y > world.numTilesY / 2 ? world.tileDensityMax : 0);
window.requestAnimationFrame(world.main);

// world.renderTileAt(0, 0, [0, 32, 0, 32]);
// world.renderTileAt(1, 0, [32, 0, 32, 0]);


// TODO Think about how to handle collisions. Test fixed partitioning first then test with a quadtree
// TODO Figure out how to bounce a ball relative to the terrain surface normal (compare edge1 with edge2 of surface and use dot product with direction vector of ball with some magic)
