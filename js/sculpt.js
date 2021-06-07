class SculptComponent {
  constructor(world, radiusXY = 2, strength = 1) {
    this.worldRef = world;
    this.radiusXY = radiusXY;
    this.strength = strength;
    this.sleepDistance = 0;
    this._lastSculpt = null;
    this.activeMaterialIndex = 0;
    this.sculpting = false;
  }

  tick = () => {
    if (this.sculpting) {
      this.sculpt(this.worldRef.input.lastMouseMoveEvent);
    }
  };

  sculpt = (evt) => {
    if (!evt) return;
    let offset = this.worldRef.canvas.getBoundingClientRect(); // offset of canvas to topleft
    let x = evt.clientX - offset.x;
    let y = evt.clientY - offset.y;
    const direction = this.worldRef.input._mappings.shift.active ? -1 : 1;

    if (this._lastSculpt) {
      const changeSinceLast = util.vector.distance([x, y], this._lastSculpt.position);
      if (changeSinceLast < this.sleepDistance && this._lastSculpt.direction === direction) return;
    }

    this._lastSculpt = {position: [x, y], direction: direction};

    x = Math.round(x / this.worldRef.tileSize);
    y = Math.round(y / this.worldRef.tileSize);

    const startX = Math.min(Math.max(x - this.radiusXY, 0), this.worldRef.numTilesX);
    const startY = Math.min(Math.max(y - this.radiusXY, 0), this.worldRef.numTilesY);
    const numTilesX = Math.min(this.radiusXY * 2, this.worldRef.numTilesX - 2);
    const numTilesY = Math.min(this.radiusXY * 2, this.worldRef.numTilesY - 2);

    for (let offsetY = -this.radiusXY; offsetY <= this.radiusXY; offsetY++) {
      for (let offsetX = -this.radiusXY; offsetX <= this.radiusXY; offsetX++) {
        const currentX = x + offsetX;
        const currentY = y + offsetY;

        const dist = util.vector.distance([x, y], [currentX, currentY]);
        if (Math.round(dist) > this.radiusXY || currentX < 0 || currentY < 0 || currentX > this.worldRef.numTilesX || currentY > this.worldRef.numTilesY) {
          continue
        }

        const falloff = Math.max(Math.min((dist / -(this.radiusXY)) + 1, 1), 0);
        const densityChange = this.strength * falloff * direction;
        const currentDensity = this.worldRef.vertMap[this.activeMaterialIndex][currentY][currentX];
        const newDensityRaw = Math.min(Math.max(0, currentDensity + densityChange), this.worldRef.tileDensityMax);
        this.worldRef.vertMap[this.activeMaterialIndex][currentY][currentX] = newDensityRaw;
      }
    }

    this.worldRef.renderQueue.push({x: startX, y: startY, numTilesX: numTilesX, numTilesY: numTilesY, materialIndex: null});
  };
}
