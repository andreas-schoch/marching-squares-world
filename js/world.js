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

    // Create sky gradient
    this.gradientSky = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    this.gradientSky.addColorStop(0, "lightblue");
    this.gradientSky.addColorStop(1, "aliceblue");

    // Create ground gradient
    this.gradientground = this.ctx.createLinearGradient(0, 0, 0, tileSize);
    this.gradientground.addColorStop(0, "sandybrown");
    this.gradientground.addColorStop(0.5, "peru");
    this.gradientground.addColorStop(1, "sandybrown");

    this.tileSize = tileSize;
    this.numTilesX = numTilesX;
    this.numTilesY = numTilesY;

    this.tileDensityMax = 64;
    this.tileDensityThreshold = (this.tileDensityMax / 2);

    this.materialColor = [this.gradientground, 'blue', 'green', 'red'];
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
    this.sculpComponent = new SculptComponent(this, 2, 1.5);  // TODO move this to a player class;
  }

  _generateVertices(noiseFunction) {
    for (let y = 0; y <= this.numTilesY; y++) {
      const row = [];
      for (let x = 0; x <= this.numTilesX; x++) {
        row.push(noiseFunction.call(this, x, y));
      }
      this.vertices.push(row);
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
    if (world.input._mappings['leftMouseButton'].active) {
      const offset = this.canvas.getBoundingClientRect(); // offset of canvas to topleft
      const sculptPos = [this.input.lastMouseMoveEvent.clientX - offset.x, this.input.lastMouseMoveEvent.clientY - offset.y];
      world.sculpComponent.strength = (world.input._mappings.shift.active ? -180 : 180) * delta;
      world.sculpComponent.radiusXY = 5
      world.sculpComponent.sculpt(sculptPos);
    }

    this.entities.forEach(e => e.update(delta));
  }

  render() {
    this.ctx.fillStyle = this.gradientSky;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.drawImage(this.canvasCache, 0, 0);
    if (this.renderQueue.length) {
      this.renderQueue.forEach((bounds) => {
        this.ctx.fillStyle = this.gradientSky;
        this.ctx.fillRect(bounds.x * this.tileSize, bounds.y * this.tileSize, bounds.numTilesX * this.tileSize, bounds.numTilesY * this.tileSize);
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
