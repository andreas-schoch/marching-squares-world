class World {
  constructor(tileSize = 24, numTilesX = 10, numTilesY = 20) {
    this.debug = false;

    // To render terrain
    const canvasContainer = document.querySelector('.canvas-container');
    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('canvas-terrain');
    this.ctx = this.canvas.getContext('2d',);
    this.canvas.width = tileSize * numTilesX;
    this.canvas.height = tileSize * numTilesY;
    canvasContainer.appendChild(this.canvas);

    // Performance optimization for terrain canvas by saving
    // what was drawn last frame and using that as a base
    // for the next render. Then only rerender the sections in renderQueue
    this.canvasCache = document.createElement('canvas');
    this.canvasCache.width = this.canvas.width;
    this.canvasCache.height = this.canvas.height;
    this.ctxCache = this.canvasCache.getContext('2d');

    // Canvas for moving entities
    this.canvasEntity = document.createElement('canvas');
    this.canvasEntity.width = this.canvas.width;
    this.canvasEntity.height = this.canvas.height;
    this.ctxEntity = this.canvasEntity.getContext('2d');
    canvasContainer.appendChild(this.canvasEntity);

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

    this.tileDensityMax = 128;
    this.tileDensityThreshold = (this.tileDensityMax / 2);

    this.materialColor = [this.gradientground, 'blue', 'green', 'red'];
    this.vertices = [];
    this.verticesWater = [];
    this.vertMap = [this.vertices, this.verticesWater];

    this.entities = [];

    this.renderQueue = [{x: 0, y: 0, numTilesX: this.numTilesX, numTilesY: this.numTilesY, materialIndex: null}];
    this.TileManager = new TileLookupManager(tileSize);
    this.input = new InputComponent(); // TODO move this to a player class;
    this.input.initListeners(document);
    this.sculpComponent = new SculptComponent(this, 2, 1.5);  // TODO move this to a player class;
  }

  _generateVertices(noiseFunction) {
    for (let y = 0; y <= this.numTilesY; y++) {
      const row = [];
      const rowWater = [];
      for (let x = 0; x <= this.numTilesX; x++) {
        row.push(noiseFunction.call(this, x, y));
        rowWater.push(0);
      }
      this.vertices.push(row);
      this.verticesWater(rowWater);
    }
  }

  _getTileEdges(x, y, materialIndex) {
    try {
      const verts = this.vertMap[materialIndex];
      // Note: Internally edge values are still stored as floats but get transformed into integers to rendering the map
      // We use integers mainly to limit the num of cached Path2D objects and to simplify serialization for networking
      // Stored as floats so when sculpting the terrain fractional changes still get applied when far from center
      const edge1 = parseInt(verts[y][x]);
      const edge2 = parseInt(verts[y][x + 1]);
      const edge3 = parseInt(verts[y + 1][x + 1]);
      const edge4 = parseInt(verts[y + 1][x]);
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

  // rain() {
  //   if (Math.random() * 100 < 85) return
  //   // const drops = 1;
  //
  //   // for (let i = 0; i <= drops; i++) {
  //   const spawnX = Math.floor(Math.random() * this.canvas.width);
  //   const spawnPos = [spawnX, 0];
  //   world.sculpComponent.strength = this.tileDensityThreshold * 1.3;
  //   world.sculpComponent.radiusXY = 1
  //   world.sculpComponent.sculpt(spawnPos);
  //   // }
  // }

  flow(delta) {
    for (let y = this.numTilesY - 1; y >= 0; y--) {
      const row = this.vertices[y];
      const rowBelow = this.vertices[y + 1];
      for (let x1 = 0; x1 <= this.numTilesX; x1++) {
        let x = y % 2 === 0 ? this.numTilesX - x1 : x1; // Alternate horizontal scan direction
        // Try to flow down // TODO also try left and right if some density is left
        let remainingDensity = row[x];
        if (remainingDensity <= 0) continue;
        const availableDensityBelow = rowBelow[x] !== undefined ? this.tileDensityMax - rowBelow[x] : 0;
        if (availableDensityBelow) {
          const flow = Math.min(remainingDensity, availableDensityBelow);
          rowBelow[x] += flow;
          row[x] -= flow;
        }

        // If it cannot flow down, try flowing left and right in equal amounts
        remainingDensity = row[x];
        if (remainingDensity <= 0) continue;
        const availableDensityLeft = this.tileDensityMax - row[x - 1];
        const availableDensityRight = this.tileDensityMax - row[x + 1];
        const canFlowLeft = availableDensityLeft && row[x - 1] < remainingDensity;
        const canFlowRight = availableDensityRight && row[x + 1] < remainingDensity;

        if (canFlowLeft && canFlowRight) {
          const average = (remainingDensity + row[x - 1] + row[x + 1]) / 3;
          // TODO try moving -3 and +3 tiles left and right instead of just -1 and +1
          //  The water spreads too slowly causing pyramids
          // row.splice(x-1, 3, average, average, average)
          row[x - 1] = average;
          row[x + 1] = average;
          row[x] = average;
        } else if (canFlowLeft) {
          const average = (remainingDensity + row[x - 1]) / 2;
          row[x - 1] = average;
          row[x] = average;
        } else if (canFlowRight) {
          const average = (remainingDensity + row[x + 1]) / 2;
          row[x + 1] = average;
          row[x] = average;
        }
      }
    }

    this.renderQueue.push({x: 0, y: 0, numTilesX: this.numTilesX, numTilesY: this.numTilesY, materialIndex: null});
  }

  update(delta) {
    this.flow(delta);

    if (world.input._mappings['leftMouseButton'].active) {
      const offset = this.canvas.getBoundingClientRect(); // offset of canvas to topleft
      const sculptPos = [this.input.lastMouseMoveEvent.clientX - offset.x, this.input.lastMouseMoveEvent.clientY - offset.y];
      world.sculpComponent.strength = (world.input._mappings.shift.active ? -this.tileDensityThreshold : this.tileDensityThreshold) * 1.25;
      world.sculpComponent.radiusXY = 1
      world.sculpComponent.sculpt(sculptPos);
    }

    this.entities.forEach(e => e.update(delta));
  }

  render() {
    this.ctx.fillStyle = this.gradientSky;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctxEntity.clearRect(0, 0, this.ctxEntity.canvas.width, this.ctxEntity.canvas.height);

    // TODO to add support for panning around this needs to account for the local-space offset change since last update
    //  Also the not yet cached parts due to moving need to be added to the renderQueue.
    //  What happens when player pans to coordinates not stored in vertices?
    //  - We shouldn't simply store density values in the vertices array but get the "base" density via noise and just store the diff over time.
    //    So if one point has a initial density of 50 and the player is sculpting the terrain we would just store for example -10 in a Map with the coords as key
    //    So when we need density of e.g. [5, 5] we do something like:
    //      const density = noise([5, 5]) + diff.has([5,5]) ? diff.get([5,5]) : 0
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
    this.entities.forEach(e => e.render(this.ctxEntity));
  }

  main = (now) => {
    const delta = this.last ? (now - this.last) / 1000 : 0;
    this.last = now;
    this.update(delta);
    this.render(delta);
    window.requestAnimationFrame(this.main);
  };
}

// TODO re-introduce water simulation with rainfall. How will it work?
//  Rain particles will fall down until they hit the terrain. They will flow towards the lower point of the hit line.
//  When that happens it will accumulate in a separate density matrix (just like this.vertices currently) at the same index coords
//  Water will be drawn in the exact same way as the terrain (marching squares) but with the twist that it won't be stationary.
//  Water will generally flow towards the gravity vector and then to surrounding points on the same elevation with less density.
//  Updating the water will be very expensive and should be moved within a webworker if possible
