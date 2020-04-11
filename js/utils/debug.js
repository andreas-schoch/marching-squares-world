class Debug {
    constructor(numTilesX, numTilesY, tileSize) {
        this.numTilesX = numTilesX;
        this.numTilesY = numTilesY;
        this.tileSize = tileSize;
    }

    _renderDebugGrid(ctx) {
        // horizontal
        const terrainWidth = this.tileSize * this.numTilesX;
        for (let y = 0; y <= this.numTilesY; y++) {
            const yCoord = y * this.tileSize;
            const from = [0, yCoord];
            const to = [terrainWidth, yCoord];
            this.renderLine(ctx, from, to);
        }

        // vertical
        const terrainHeight = this.tileSize * this.numTilesY;
            for (let x = 0; x <= this.numTilesX; x++) {
            const xCoord = x * this.tileSize;
            const from = [xCoord, 0];
            const to = [xCoord, terrainHeight];
            this.renderLine(ctx, from, to);
        }
    }

    _renderDebugEdgeDensity(vertices, ctx) {
        for (let y = 0; y <= this.numTilesY; y++) {
            for (let x = 0; x <= this.numTilesX; x++) {
                // const offset = this.tileSize / 2;
                const offset = 0;
                const position = [x * this.tileSize + offset, y * this.tileSize + offset];
                const density = vertices[y][x];
                // this._renderCircle(position, 2, color);
                this._renderText(density.toFixed(2), position, ctx);

            }
        }
    }

    _renderDebugLookupIndices() {
        for (let y = 0; y < this.numTilesY; y++) {
            for (let x = 0; x < this.numTilesX; x++) {
                const offset = this.tileSize / 2;
                const position = [x * this.tileSize + offset, y * this.tileSize + offset];

                const index = this._findLookupIndexAt(x, y);
                this._renderText(`${index}`, position);
            }
        }
    }

    renderLine(ctx, vertex1, vertex2, color= '#ddd', width= 1) {
        ctx.beginPath();
        ctx.moveTo(vertex1[0], vertex1[1]);
        ctx.lineTo(vertex2[0], vertex2[1]);
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    _renderCircle(vertex, radius, color) {
        this.ctx.beginPath();
        this.ctx.arc(vertex[0], vertex[1], radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    _renderText(text, position, ctx) {
        ctx.font = `${20}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = "middle";
        ctx.fillStyle = 'red';
        ctx.fillText(text, position[0], position[1]);
    }
}
