class World {
  constructor(tileSize = 24, numTilesX = 10, numTilesY = 20) {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d',);
    this.canvas.width = tileSize * numTilesX;
    this.canvas.height = tileSize * numTilesY;

    this.canvasCache = document.createElement('canvas');
    this.canvasCache.width = this.canvas.width;
    this.canvasCache.height = this.canvas.height;
    this.ctxCache = this.canvasCache.getContext('2d');

    this.tileSize = tileSize;
    this.numTilesX = numTilesX;
    this.numTilesY = numTilesY;

    this.tileDensityMax = 64;
    this.tileDensityThreshold = (this.tileDensityMax / 2);

    this.materialColor = ['black', 'blue', 'green', 'red'];
    this.vertices = [];
    this.verticesWater = [];

    this.vertMap = [this.vertices, this.verticesWater];

    this.renderQueue = [
      {x: 0, y: 0, numTilesX: this.numTilesX, numTilesY: this.numTilesY, materialIndex: null},
    ];
    this.TileManager = new TileLookupManager(tileSize);
    this.input = new InputComponent(); // TODO move this to a player class;
    this.input.initListeners(document);
    this.sculpComponent = new SculptComponent(this, 20, 25);  // TODO move this to a player class;
  }

  _generateVertices(noiseFunction) {
    for (let y = 0; y <= this.numTilesY; y++) {
      const row = [];
      // const rowWater = [];
      for (let x = 0; x <= this.numTilesX; x++) {
        const value = noiseFunction.call(this, x, y);
        row.push(value);
        // rowWater.push(value === this.tileDensityMax ? 0 : this.tileDensityMax);
      }
      this.vertices.push(row);
      // this.verticesWater.push(rowWater);
    }
  }

  _getTileEdges(x, y, materialIndex) {
    try {
      const verts = this.vertMap[materialIndex];
      const edge1 = verts[y][x];
      const edge2 = verts[y][x + 1];
      const edge3 = verts[y + 1][x + 1];
      const edge4 = verts[y + 1][x];
      return [edge1, edge2, edge3, edge4];
    } catch (e) {
      return false;
    }
  }

  renderTileAt(x, y, edgesOverwrite = null, materialIndex = 0) {
    const edges = edgesOverwrite || this._getTileEdges(x, y, materialIndex);
    if (edges) {
      const path2D = this.TileManager.getTilePath2D(edges, this.tileDensityThreshold, this.tileSize);
      if (path2D) {
        const position = util.vector.multiplyBy([x, y], this.tileSize);
        this.ctx.translate(position[0], position[1]);
        this.ctx.fillStyle = this.materialColor[materialIndex];
        this.ctx.fill(path2D);
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
  }

  _updateWorld = () => {
    // console.log('-------- update');
    if (this.input._mappings.leftMouseButton.active) {
      this.sculpComponent.sculpt(this.input.lastMouseMoveEvent)
    }

    // this.renderQueue.push(
    //   {x: 0, y: 0, numTilesX: this.numTilesX, numTilesY: this.numTilesY, materialIndex: null},
    // );
    //
    // for (let y = 1; y < this.numTilesY - 1; y++) {
    //   for (let x = 1; x < this.numTilesX; x++) {
    //     try {
    //       const cur = this.vertMap[0][y][x];
    //
    //       // if (cur >= this.tileDensityThreshold) {
    //       if (cur > 0.5) {
    //         const below = this.vertMap[0][y - 1][x];
    //         const belowLeft = this.vertMap[0][y - 1][x-1];
    //         const belowRight = this.vertMap[0][y - 1][x+1];
    //
    //         // if (below)
    //
    //         if (below <= this.tileDensityMax - 0.5) {
    //           const flow = (this.tileDensityMax - below) / 60;
    //           this.vertMap[0][y][x] -= flow;
    //           this.vertMap[0][y + 1][x] += below;
    //         } else if (belowLeft <= this.tileDensityMax - 0.5) {
    //           const flow = (this.tileDensityMax - belowLeft) / 60;
    //           this.vertMap[0][y][x] -= flow;
    //           this.vertMap[0][y + 1][x-1] += flow;
    //         } else if (belowLeft <= this.tileDensityMax - 0.5) {
    //           const flow = (this.tileDensityMax - belowRight) / 60;
    //           this.vertMap[0][y][x] -= flow;
    //           this.vertMap[0][y + 1][x+1] += flow;
    //         }
    //
    //       }
    //     } catch (e) {
    //       // console.log('out of range')
    //     }
    //   }
    // }
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
            if (x < 0 || y < 0 || x > this.numTilesX || y > this.numTilesY) {
              continue
            }
            this.renderTileAt(x, y, null, 0);
          }
        }
      });

      this.renderQueue.length = 0;
      this.ctxCache.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctxCache.drawImage(this.canvas, 0, 0);
    }

    // util.debug.renderDebugGrid(this);
    // util.debug.renderDebugEdgeDensity(this, 0);
  };

  main = () => {
    // console.time('main');
    this._updateWorld();
    this._renderWorld();
    requestAnimationFrame(this.main);
    // console.timeEnd('main');
  };
}
