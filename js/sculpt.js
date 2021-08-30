class SculptComponent {
  constructor(world, radiusXY = 2, strength = 1) {
    this.worldRef = world;
    this.radiusXY = radiusXY;
    this.strength = strength;
    this.activeMaterialIndex = 0;
  }

  sculpt = (posRaw) => {
    const pos = util.vector.round(util.vector.divideBy(posRaw, this.worldRef.tileSize));
    for (let offsetY = -this.radiusXY; offsetY <= this.radiusXY; offsetY++) {
      for (let offsetX = -this.radiusXY; offsetX <= this.radiusXY; offsetX++) {
        const currentX = pos[0] + offsetX;
        const currentY = pos[1] + offsetY;

        const dist = util.vector.distance(pos, [currentX, currentY]);
        // if (Math.round(dist) > this.radiusXY || currentX < 0 || currentY < 0 || currentX > this.worldRef.numTilesX || currentY > this.worldRef.numTilesY) continue;
        if (currentX < 0 || currentY < 0 || currentX > this.worldRef.numTilesX || currentY > this.worldRef.numTilesY) continue;

        const falloff = Math.max(Math.min((dist / -(this.radiusXY)) + 1, 1), 0);
        const densityChange = this.strength * falloff;
        const currentDensity = this.worldRef.vertMap[this.activeMaterialIndex][currentY][currentX];
        const newDensityRaw = Math.min(Math.max(0, currentDensity + densityChange), this.worldRef.tileDensityMax);
        this.worldRef.vertMap[this.activeMaterialIndex][currentY][currentX] = newDensityRaw;
      }
    }

    const startX = Math.min(Math.max(pos[0] - this.radiusXY, 0), this.worldRef.numTilesX);
    const startY = Math.min(Math.max(pos[1] - this.radiusXY, 0), this.worldRef.numTilesY);
    const numTilesX = Math.min(this.radiusXY * 2, this.worldRef.numTilesX);
    const numTilesY = Math.min(this.radiusXY * 2, this.worldRef.numTilesY);
    this.worldRef.renderQueue.push({x: startX, y: startY, numTilesX: numTilesX, numTilesY: numTilesY, materialIndex: null});
  };
}
