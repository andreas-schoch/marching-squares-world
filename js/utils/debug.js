class DebugUtils {
    constructor(numTilesX, numTilesY, tileSize) {
        // this.numTilesX = numTilesX;
        // this.numTilesY = numTilesY;
        // this.tileSize = tileSize;
    }

    renderDebugGrid(world) {
        // horizontal
        const terrainWidth = world.tileSize * world.numTilesX;
        for (let y = 0; y <= world.numTilesY; y++) {
            const yCoord = y * world.tileSize;
            const from = [0, yCoord];
            const to = [terrainWidth, yCoord];
            util.canvas.renderLine(world.ctx, from, to);
        }

        // vertical
        const terrainHeight = world.tileSize * world.numTilesY;
            for (let x = 0; x <= world.numTilesX; x++) {
            const xCoord = x * world.tileSize;
            const from = [xCoord, 0];
            const to = [xCoord, terrainHeight];
            util.canvas.renderLine(world.ctx, from, to);
        }
    }

    renderDebugEdgeDensity(world) {
        for (let y = 0; y <= world.numTilesY; y++) {
            for (let x = 0; x <= world.numTilesX; x++) {
                const offset = 0;
                const position = [x * world.tileSize + offset, y * world.tileSize + offset];
                const density = world.vertices[y][x];
                util.canvas.renderText(world.ctx, density.toFixed(2), position);
            }
        }
    }
}
