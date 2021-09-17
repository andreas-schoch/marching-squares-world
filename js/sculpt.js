class SculptComponent {
  constructor(world, radiusXY = 2, strength = 1) {
    this.worldRef = world;
    this.radiusXY = radiusXY;
    this.strength = strength;
    this.activeMaterialIndex = 0;
  }

  sculpt = (posRaw, materialOverride) => {
    const pos = util.vector.round(util.vector.divideBy(posRaw, this.worldRef.tileSize));
    const material = materialOverride || this.activeMaterialIndex;
    for (let offsetY = -this.radiusXY; offsetY <= this.radiusXY; offsetY++) {
      for (let offsetX = -this.radiusXY; offsetX <= this.radiusXY; offsetX++) {
        const currentX = pos[0] + offsetX;
        const currentY = pos[1] + offsetY;

        const dist = util.vector.distance(pos, [currentX, currentY]);
        // if (Math.round(dist) > this.radiusXY || currentX < 0 || currentY < 0 || currentX > this.worldRef.numTilesX || currentY > this.worldRef.numTilesY) continue;
        if (currentX < 0 || currentY < 0 || currentX > this.worldRef.numTilesX || currentY > this.worldRef.numTilesY) continue;

        const falloff = Math.max(Math.min((dist / -(this.radiusXY)) + 1, 1), 0);
        const densityChange = this.strength * falloff;
        const currentDensity = this.worldRef.vertMap[material][currentY][currentX];
        const newDensityRaw = Math.min(Math.max(0, currentDensity + densityChange), this.worldRef.tileDensityMax);
        if (Math.abs(currentDensity - newDensityRaw) <= 0.05) continue;

        // TODO cleanup code below. Behaviour is hardcoded based on material. Can cross-material interactions
        //  Be defined somewhere else? Maybe have a material class where the logic is defined?
        if (material === 1) {
          const currentDensityTerrain = this.worldRef.vertMap[0][currentY][currentX];
          if (currentDensityTerrain >= this.worldRef.tileDensityThreshold) continue;
        }

        this.worldRef.vertMap[material][currentY][currentX] = newDensityRaw;

        if (material === 0 && newDensityRaw < this.worldRef.tileDensityThreshold) {
          this.worldRef.vertMap[1][currentY][currentX] = 0;
        } else if (material === 0 && newDensityRaw >= this.worldRef.tileDensityThreshold) {
          this.worldRef.vertMap[1][currentY][currentX] = this.worldRef.tileDensityMax - newDensityRaw;
        }
      }
    }

    const startX = Math.min(Math.max(pos[0] - this.radiusXY, 0), this.worldRef.numTilesX);
    const startY = Math.min(Math.max(pos[1] - this.radiusXY, 0), this.worldRef.numTilesY);
    const numTilesX = Math.min(this.radiusXY * 2, this.worldRef.numTilesX);
    const numTilesY = Math.min(this.radiusXY * 2, this.worldRef.numTilesY);
    this.worldRef.renderQueue.push({x: startX - 1, y: startY - 1, numTilesX: numTilesX + 2, numTilesY: numTilesY + 2, materialIndex: material});
  };
}
