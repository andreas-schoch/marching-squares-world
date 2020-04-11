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
        this.vertsChangedBounds = [
            {x: 0, y: 0, w: this.canvas.width, h: this.canvas.height},
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
        const path = this.TileManager.getTilePathData(...edges);

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
                this.ctx.clearRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                this.ctx.fill();
                // this.ctx.strokeStyle = 'salmon';
                // this.ctx.stroke()
            }
        }
    }

    _renderWorld = () => {
        console.time('_renderWorld time');
        this.ctx.fillStyle = 'black';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.hasCached) {
            this.ctx.drawImage(this.canvasCache, 0, 0);

            // draw cached

            // check if changed

            // clear changed and draw

            // update cache and empty changed

            // if (this.vertIndicesToUpdate.length) {
            //     // this.ctx.fillStyle = 'red';
            //     this.vertIndicesToUpdate.forEach(([x, y]) => this.renderTilesLerped(x, y));
            //     this.ctxCache.drawImage(this.canvas, 0, 0);
            //     this.vertIndicesToUpdate.length = 0;
            // }
        } else {
            for (let y = 0; y < this.numTilesY; y++) {
                for (let x = 0; x < this.numTilesX; x++) {
                    this.renderTilesLerped(x, y);
                }
            }
            this.ctxCache.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctxCache.drawImage(this.canvas, 0, 0);

            this.hasCached = true;
        }
        // this.debugManager._renderDebugEdgeDensity(this.vertices, this.ctx);
        // util.debug._renderDebugGrid(this);
        console.timeEnd('_renderWorld time');

        window.requestAnimationFrame(this._renderWorld);
    }
}

const world = new World(12, 120, 60);
noise.seed(666);
world._generateVertices((x, y) => y > 20 ? 32 : 0);
window.requestAnimationFrame(world._renderWorld);


const sculptComponent = new SculptComponent(world, 4, 1);
world.canvas.addEventListener('mousedown', function(evt) {
    sculptComponent.sculpt(evt);
    world.canvas.addEventListener('mousemove', sculptComponent.sculpt);
});

document.addEventListener('mouseup', () => {
    world.canvas.removeEventListener("mousemove", sculptComponent.sculpt);

});
