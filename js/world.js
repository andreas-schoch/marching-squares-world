class World {
  constructor(tileSize = 24, numTilesX = 10, numTilesY = 20) {
    this.debug = false;
    this.canvas = document.getElementsByClassName('canvas')[0];
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

    this.frames = 0;
    this.lastFrame = null;

    this.tileDensityMax = 64;
    this.tileDensityThreshold = (this.tileDensityMax / 2);

    this.materialColor = ['wheat', 'blue', 'green', 'red'];
    this.vertices = [];
    this.verticesWater = [];

    this.vertMap = [this.vertices, this.verticesWater];

    this.entities = [];

    this.renderQueue = [
      {x: 0, y: 0, numTilesX: this.numTilesX, numTilesY: this.numTilesY, materialIndex: null},
    ];
    this.TileManager = new TileLookupManager(tileSize);
    this.input = new InputComponent(); // TODO move this to a player class;
    this.input.initListeners(document);
    this.sculpComponent = new SculptComponent(this, 4, 2.5);  // TODO move this to a player class;

    // TODO create a player class based on Entity which contains the inputComponent. There can only be one input component active at any time locally
    this.input.register('leftMouseButton',
      () => this.sculpComponent.sculpting = true,
      () => {
        this.sculpComponent.sculpting = false;
        this.sculpComponent._lastSculpt = null;
      });
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
      const [path2D, path2DIso] = this.TileManager.getTilePath2D(edges, this.tileDensityThreshold, this.tileSize);
      if (path2D) {
        const position = util.vector.multiplyBy([x, y], this.tileSize);
        this.ctx.translate(position[0], position[1]);
        this.ctx.fillStyle = this.materialColor[materialIndex];
        this.ctx.fill(path2D);
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      if (path2DIso) {
        const position = util.vector.multiplyBy([x, y], this.tileSize);
        this.ctx.translate(position[0], position[1]);
        this.ctx.strokeStyle = 'black';
        // this.ctx.lineCap = "round";
        this.ctx.lineCap = "butt";
        this.ctx.lineWidth = 2;
        this.ctx.stroke(path2DIso);
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      }


    }
  }

  update(delta) {
    this.sculpComponent.tick(delta);
    this.entities.forEach(e => e.update(delta));
  }

  render() {
    this.ctx.fillStyle = 'grey';
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.drawImage(this.canvasCache, 0, 0);
    if (this.renderQueue.length) {
      this.renderQueue.forEach((bounds) => {
        this.ctx.clearRect(bounds.x * this.tileSize, bounds.y * this.tileSize, bounds.numTilesX * this.tileSize, bounds.numTilesY * this.tileSize);
        for (let y = bounds.y; y < (bounds.y + bounds.numTilesY); y++) {
          for (let x = bounds.x; x < bounds.x + bounds.numTilesX; x++) {
            if (x < 0 || y < 0 || x > this.numTilesX || y > this.numTilesY) continue;
            this.renderTileAt(x, y, null, 0);
          }
        }
      });

      this.renderQueue.length = 0;
      this.ctxCache.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctxCache.drawImage(this.canvas, 0, 0);
    }

    if (this.debug) {
      util.debug.renderDebugGrid(this);
      util.debug.renderDebugEdgeDensity(this, 0);
    }

    // TODO there should be a separate canvas for rendering dynamic objects like entities
    this.entities.forEach(e => e.render());
  }

  main = (now) => {
    const delta = this.last ? (now - this.last) / 1000 : 0;
    this.last = now;
    this.update(delta);
    this.render(delta);
    window.requestAnimationFrame(this.main);
  };
}
