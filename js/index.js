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

        this.vertices = [];
        this.vertsChangedBounds = [
            {x: 0, y: 0, numTilesX: this.numTilesX, numTilesY: this.numTilesY},
        ];
        this.TileManager = new TileLookupManager(tileSize, this.tileDensityThreshold);
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

    renderTilesLerped(x, y, edgesOverwrite = null) {
        const [e1, e2, e3, e4] = edgesOverwrite ? edgesOverwrite : this._getTileEdges(x, y);
        const path = this.TileManager.getTilePathData(e1, e2, e3, e4);

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
                // this.ctx.strokeStyle = 'salmon';
                // this.ctx.stroke()
            }
        }
    }

    _renderWorld = () => {
        // console.time('_renderWorld time');
        this.ctx.fillStyle = 'black';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.vertsChangedBounds.length === 0) {
            this.ctx.drawImage(this.canvasCache, 0, 0);
            // console.log('from cache')
        } else {
            this.ctx.drawImage(this.canvasCache, 0, 0);

            this.vertsChangedBounds.forEach((bounds) => {
                this.ctx.clearRect(bounds.x * this.tileSize, bounds.y * this.tileSize, bounds.numTilesX * this.tileSize, bounds.numTilesY * this.tileSize);
                for (let y = bounds.y; y < (bounds.y + bounds.numTilesY); y++) {
                    for (let x = bounds.x; x < bounds.x + bounds.numTilesX; x++) {
                        if (x < 0 || y < 0 || x > this.numTilesX || y > this.numTilesY) { continue }
                        this.renderTilesLerped(x, y);
                    }
                }

            });

            this.vertsChangedBounds.length = 0;
            this.ctxCache.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctxCache.drawImage(this.canvas, 0, 0);
            console.log('num hashed', Object.keys(this.TileManager.hashedPaths).length);


        }

        // util.debug.renderDebugGrid(this);
        // util.debug.renderDebugEdgeDensity(this);
        // console.timeEnd('_renderWorld time');

        window.requestAnimationFrame(this._renderWorld);
    }
}

const world = new World(20, 60, 20);
noise.seed(666);
world._generateVertices((x, y) => y > world.numTilesY / 2 ? world.tileDensityMax : 0);
window.requestAnimationFrame(world._renderWorld);


const sculptComponent = new SculptComponent(world, 3, 2);
world.canvas.addEventListener('mousedown', function(evt) {
    sculptComponent.sculpt(evt);
    world.canvas.addEventListener('mousemove', sculptComponent.sculpt);
});

document.addEventListener('mouseup', () => {
    world.canvas.removeEventListener("mousemove", sculptComponent.sculpt);

});
