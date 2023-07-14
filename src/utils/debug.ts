import { World } from "../world";
import { CanvasUtils } from "./canvas";
import { Vector2 } from "./vector";

export class DebugUtils {
  static renderDebugGrid(world: World) {
    // horizontal
    const terrainWidth = world.tileSize * world.numTilesX;
    for (let y = 0; y <= world.numTilesY; y++) {
      const yCoord = y * world.tileSize;
      const from: Vector2 = [0, yCoord];
      const to: Vector2 = [terrainWidth, yCoord];
      world.ctx.strokeStyle = 'grey';
      world.ctx.fillStyle = 'grey';
      world.ctx.lineWidth = 0.5;
      CanvasUtils.renderLine(world.ctx, from, to);
    }

    // vertical
    const terrainHeight = world.tileSize * world.numTilesY;
    for (let x = 0; x <= world.numTilesX; x++) {
      const xCoord = x * world.tileSize;
      const from: Vector2 = [xCoord, 0];
      const to: Vector2 = [xCoord, terrainHeight];
      CanvasUtils.renderLine(world.ctx, from, to);
    }
  }

  static renderDebugEdgeDensity(world: World, materialIndex: number) {
    const verts = materialIndex === 1 ? world.vertices : world.verticesWater;
    const color = materialIndex === 1 ? 'brown' : 'DodgerBlue';
    for (let y = 0; y <= world.numTilesY; y++) {
      for (let x = 0; x <= world.numTilesX; x++) {
        const offset = 0;
        const position: Vector2 = [x * world.tileSize + offset + (materialIndex ? -2 : 2), y * world.tileSize + offset];
        const density = verts[y][x];
        // const materialIndex = world.verticesMaterial[y][x];
        CanvasUtils.renderText(world.ctx, density.toFixed(0), position, materialIndex ? 'right' : 'left', 9, color);
      }
    }
  }
}
