import { Vector2, VectorUtils } from "./utils/vector";
import { World } from "./world";

export class SculptComponent {
  worldRef: World;
  radiusXY: number;
  strength: number;
  activeMaterialIndex: number;

  constructor(world: World, radiusXY = 2, strength = 1) {
    this.worldRef = world;
    this.radiusXY = radiusXY;
    this.strength = strength;
    this.activeMaterialIndex = 0;
  }

  sculpt = (posRaw: Vector2, materialOverride?: number) => {
    const pos = VectorUtils.round(VectorUtils.divideBy(posRaw, this.worldRef.tileSize));
    const material = materialOverride === undefined ? this.activeMaterialIndex : materialOverride;
    for (let offsetY = -this.radiusXY; offsetY <= this.radiusXY; offsetY++) {
      for (let offsetX = -this.radiusXY; offsetX <= this.radiusXY; offsetX++) {
        const currentX = pos[0] + offsetX;
        const currentY = pos[1] + offsetY;

        // const SpacialHashX = Math.floor(posRaw[0] / this.worldRef.spacialHashSize);
        // const SpacialHashY = Math.floor(posRaw[1] / this.worldRef.spacialHashSize);
        // const SpacialHashKey = `${SpacialHashX}-${SpacialHashY}`;
        // this.worldRef.spacialHash[SpacialHashKey] = true;

        const dist = VectorUtils.distance(pos, [currentX, currentY]);
        // if (Math.round(dist) > this.radiusXY || currentX < 0 || currentY < 0 || currentX > this.worldRef.numTilesX || currentY > this.worldRef.numTilesY) continue;
        if (currentX < 0 || currentY < 0 || currentX > this.worldRef.numTilesX || currentY > this.worldRef.numTilesY) continue;

        const falloff = Math.max(Math.min((dist / -(this.radiusXY)) + 1, 1), 0);
        const densityChange = this.strength * falloff;
        const verts = material === 0 ? this.worldRef.vertices : this.worldRef.verticesWater;
        const currentDensity = verts[currentY][currentX];
        const newDensity = Math.min(Math.max(0, currentDensity + densityChange), this.worldRef.tileDensityMax);
        if (Math.abs(currentDensity - newDensity) <= 0.05) continue;

        // When sculpting terrain...
        if (material === 0) {
          const previousDensity = verts[currentY][currentX];
          const {tileDensityThreshold, tileDensityMax} = this.worldRef;
          this.worldRef.vertices[currentY][currentX] = newDensity;
          if (densityChange > 0) {
            // ...if it is dense and increasing in density --> water is added to match the amount of terrain (imagine like a water reservoir)
            const freeDensity = tileDensityMax - newDensity;
            if (previousDensity > tileDensityThreshold) this.worldRef.verticesWater[currentY][currentX] = currentDensity;
            //  ...if it is sparse and increasing in density --> water remains the same ???
          } else {
            // ...if it is dense and losing density --> make sure water is never more than terrain density
            if (newDensity > tileDensityThreshold) this.worldRef.verticesWater[currentY][currentX] = newDensity;
            // If it is dense and about to become sparse --> make water full
            if (previousDensity > tileDensityThreshold && newDensity <= tileDensityThreshold) this.worldRef.verticesWater[currentY][currentX] = tileDensityThreshold * 1.5;
          }
        } 

        // When sculpting water we only change cells where terrain is sparse
        if (material === 1 && this.worldRef.vertices[currentY][currentX] <= this.worldRef.tileDensityThreshold) {
          this.worldRef.verticesWater[currentY][currentX] = newDensity;
        }
      }
    }

    const startX = Math.min(Math.max(pos[0] - this.radiusXY, 0), this.worldRef.numTilesX) - 1;
    const startY = Math.min(Math.max(pos[1] - this.radiusXY, 0), this.worldRef.numTilesY) - 1;
    const numTilesX = Math.min(this.radiusXY * 2, this.worldRef.numTilesX) + 2;
    const numTilesY = Math.min(this.radiusXY * 2, this.worldRef.numTilesY) + 2;
    this.worldRef.renderQueue.push({startX, startY, numTilesX, numTilesY, terrain: true, water: true});
  };
}


// REMEMBER
// - When Terrain layer is DENSE the water will take up just as much space as the terrain
// - When Terrain layer is SPARSE the water can take up only the free space (OR ALL???)
// - When Terrain layer is added the water will increase by the same amount as the terrain
// - When Terrain layer is removed the water will NOT decrease by the same amount as the terrain (imagine it being released instead)

