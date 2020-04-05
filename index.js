class World {
    constructor(cubeSize = 50, numCubesX= 10, numCubesY = 20) {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d', );
        this.canvas.width = cubeSize * numCubesX;
        this.canvas.height = cubeSize * numCubesY;

        this.canvas.cache = document.createElement('canvas');
        this.canvas.cache.width = this.canvas.width;
        this.canvas.cache.height = this.canvas.height;
        this.canvas.cache.hasCached = false;
        this.canvas.cache.ctx = this.canvas.cache.getContext('2d');

        this.cubeSize = cubeSize;
        this.numCubesX = numCubesX;
        this.numCubesY = numCubesY;

        this.tileDensityThreshold = 50;
        this.tileDensityMax = 100;

        this.vertices = [];
        this.marchingSquaresLookupTable = [
            [],
            [[0, 0.5], [0.5, 1], [0, 1], false],
            [[0.5, 1], [1, 0.5], [1, 1], false],
            [[0, 0.5], [1, 0.5], [1, 1], [0, 1], false],
            [[1, 0.5], [0.5, 0], [1, 0], false],
            [[0, 0.5], [0.5, 1], [0, 1], false, [1, 0.5], [0.5, 0], [1, 0], false],
            [[0.5, 1], [0.5, 0], [1, 0], [1, 1], false],
            [[0.5, 0], [1, 0], [1, 1], [0, 1], [0, 0.5], false],
            [[0.5, 0], [0, 0.5], [0, 0], false],
            [[0.5, 0], [0.5, 1], [0, 1], [0, 0], false],
            [[0, 0], [0.5, 0], [1, 0.5], [1, 1], [0.5, 1], [0, 0.5], false],
            [[0, 0], [0.5, 0], [1, 0.5], [1, 1], [0, 1], false],
            [[0, 0], [1, 0], [1, 0.5], [0, 0.5], false],
            [[0, 0], [1, 0], [1, 0.5], [0.5, 1], [0, 1], false],
            [[0, 0], [1, 0], [1, 1], [0.5, 1], [0, 0.5], false],
            [[0, 0], [1, 0], [1, 1], [0, 1], false]
        ];



        this.pathTemplates = this._createPathsFromLookupTable();
        this.imageTemplates = this._createImagesFromPathTemplates();
        this.canvasSprites = this._createCanvasSprites();
    }

    _renderDebugGrid() {
        // horizontal
        const terrainWidth = this.cubeSize * this.numCubesX;
        for (let y = 0; y <= this.numCubesY; y++) {
            const yCoord = y * this.cubeSize;
            const from = [0, yCoord];
            const to = [terrainWidth, yCoord];
            this._renderLine(from, to);
        }

        // vertical
        const terrainHeight = this.cubeSize * this.numCubesY;
            for (let x = 0; x <= this.numCubesX; x++) {
            const xCoord = x * this.cubeSize;
            const from = [xCoord, 0];
            const to = [xCoord, terrainHeight];
            this._renderLine(from, to);
        }
    }

    _renderDebugEdgeDensity() {
        for (let y = 0; y <= this.numCubesY; y++) {
            for (let x = 0; x <= this.numCubesX; x++) {
                // const offset = this.cubeSize / 2;
                const offset = 0;
                const position = [x * this.cubeSize + offset, y * this.cubeSize + offset];
                const color = this.vertices[y][x] ? 'red' : '#bbb';
                this._renderCircle(position, 2, color);
            }
        }
    }

    _renderDebugLookupIndices() {
        for (let y = 0; y < this.numCubesY; y++) {
            for (let x = 0; x < this.numCubesX; x++) {
                const offset = this.cubeSize / 2;
                const position = [x * this.cubeSize + offset, y * this.cubeSize + offset];

                const index = this._findLookupIndexAt(x, y);
                this._renderText(`${index}`, position);
            }
        }
    }

    _generateVertices(noiseFunction) {
        this.vertices = [];
        for (let y = 0; y <= this.numCubesY; y++) {
            const row = [];
            for (let x = 0; x <= this.numCubesX; x++) {
                const value = noiseFunction(x, y);
                row.push(value);
            }
            this.vertices.push(row);
        }
    }

    _findLookupIndexAt(x, y) {
        const edge1 = this.vertices[y][x];
        const edge2 = this.vertices[y][x+1];
        const edge3 = this.vertices[y+1][x+1];
        const edge4 = this.vertices[y+1][x];
        return parseInt(`${edge1}${edge2}${edge3}${edge4}`, 2);
    }

    _renderLine(vertex1, vertex2, color= '#ddd', width= 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(vertex1[0], vertex1[1]);
        this.ctx.lineTo(vertex2[0], vertex2[1]);
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    _renderCircle(vertex, radius, color) {
        this.ctx.beginPath();
        this.ctx.arc(vertex[0], vertex[1], radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    _renderText(text, position, alignment = 'center', fontSize = 12) {
        this.ctx.font = `${fontSize}px sans-serif`;
        this.ctx.textAlign = alignment;
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(text, position[0], position[1]);
    }

    _renderCube(x, y, lookupIndex) {
        const path = this.marchingSquaresLookupTable[lookupIndex];
        let isDrawing = false;
        for (let i = 0, n = path.length; i < n; i++) {
            const raw = path[i];
            if (raw) {
                const offsetX = this.cubeSize * x;
                const offsetY = this.cubeSize * y;
                const position = [raw[0] * this.cubeSize + offsetX, raw[1] * this.cubeSize + offsetY];
                if (isDrawing) {
                    this.ctx.lineTo(position[0], position[1]);
                } else {
                    this.ctx.beginPath();
                    this.ctx.moveTo(position[0], position[1]);
                    isDrawing = true;
                }
            } else {
                this.ctx.closePath();
                isDrawing = false;
            }
            this.ctx.fill();
        }
    }

    _renderCubeFromPathTemplate(x, y, lookupIndex) {
        const position = [this.cubeSize * x, this.cubeSize * y];
        this.ctx.translate(position[0], position[1]);
        this.pathTemplates[lookupIndex].forEach(path => this.ctx.fill(path));
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    _renderCubeFromImageTemplate(x, y, lookupIndex) {
        const position = [this.cubeSize * x, this.cubeSize * y];
        this.ctx.translate(position[0], position[1]);
        const img = this.imageTemplates[lookupIndex];
        this.ctx.drawImage(img, 0, 0, this.cubeSize, this.cubeSize);
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    _renderCubeFromCanvasSprites(x, y, lookupIndex) {
        const tileSize = this.cubeSize;
        const sourcePosition = [lookupIndex * tileSize, 0];
        const destinationPosition = [x * tileSize, y * tileSize];
        this.ctx.drawImage(
            this.canvasSprites,
            sourcePosition[0],
            sourcePosition[1],
            tileSize,
            tileSize,
            destinationPosition[0],
            destinationPosition[1],
            tileSize,
            tileSize,
        )
    }

    _createPathsFromLookupTable() {
        return this.marchingSquaresLookupTable.map((pathData) => {
            const paths = [];
            const path = new Path2D();
            let isDrawing = false;
            for (let i = 0, n = pathData.length; i < n; i++) {
                const normalizedPosition = pathData[i];
                if (normalizedPosition) {
                    const position = [normalizedPosition[0] * this.cubeSize, normalizedPosition[1] * this.cubeSize];
                    if (isDrawing) {
                        path.lineTo(position[0], position[1]);
                    } else {
                        path.moveTo(position[0], position[1]);
                        isDrawing = true;
                    }
                } else {
                    path.closePath();
                    paths.push(path);
                    isDrawing = false;
                }
            }
            return paths;
        });
    }

    _createImagesFromPathTemplates() {
        const canvasTemp = document.createElement('canvas');  // TODO in the future maybe cache and reuse canvas elements in case needed for more things
        const ctxTemp = canvasTemp.getContext('2d');
        canvasTemp.width = this.cubeSize;
        canvasTemp.height = this.cubeSize;

        return this.pathTemplates.map((paths) => {
            const img = new Image();
            ctxTemp.clearRect(0, 0, this.cubeSize, this.cubeSize);
            paths.forEach(path => ctxTemp.fill(path));
            img.src = canvasTemp.toDataURL();
            return img;
        });
    }

    _createCanvasSprites(gap = 0) {
        const canvasSprites = document.createElement('canvas');
        const ctxSprites = canvasSprites.getContext('2d');
        canvasSprites.width = (this.cubeSize + gap) * this.marchingSquaresLookupTable.length - gap;
        canvasSprites.height = this.cubeSize;
        // ctxTemplates.translate(0, this.cubeSize * 10);

        this.pathTemplates.forEach((paths) => {
            paths.forEach(path => ctxSprites.fill(path));
            ctxSprites.translate(this.cubeSize + gap, 0);

        });

        ctxSprites.setTransform(1, 0, 0, 1, 0, 0);
        canvasSprites.ctx = ctxSprites;
        canvasSprites.gap = gap;

        return canvasSprites;
    }

    _renderWorld = () => {
        this.ctx.fillStyle = 'black';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.canvas.cache.hasCached) {
            this.ctx.drawImage(this.canvas.cache, 0, 0);
        } else {
            for (let y = 0; y < this.numCubesY; y++) {
                for (let x = 0; x < this.numCubesX; x++) {
                    // this._renderCubeFromPathTemplate(x, y, this._findLookupIndexAt(x, y));
                    this._renderCubeFromCanvasSprites(x, y, this._findLookupIndexAt(x, y));
                }
            }
            this.canvas.cache.ctx.drawImage(this.canvas, 0, 0);
            // this.canvas.cache.hasCached = true;
        }
        window.requestAnimationFrame(this._renderWorld);
    }
}

const world = new World(15, 80, 45);

noise.seed(Math.random());
world._generateVertices((x, y) => Math.round(noise.simplex2(x / 5, y / 5) * 0.5 + 0.5));
// world._renderDebugGrid();

// world._renderCubeFromImageTemplate(0, 0, 0);
// world._renderCubeFromImageTemplate(2, 0, 1);
// world._renderCubeFromImageTemplate(4, 0, 2);
// world._renderCubeFromImageTemplate(6, 0, 3);
// world._renderCubeFromImageTemplate(8, 0, 4);
// world._renderCubeFromImageTemplate(10, 0, 5);
// world._renderCubeFromImageTemplate(12, 0, 6);
// world._renderCubeFromImageTemplate(14, 0, 7);
// world._renderCubeFromImageTemplate(16, 0, 8);
// world._renderCubeFromImageTemplate(18, 0, 9);
// world._renderCubeFromImageTemplate(20, 0, 10);
// world._renderCubeFromImageTemplate(22, 0, 11);
// world._renderCubeFromImageTemplate(24, 0, 12);
// world._renderCubeFromImageTemplate(26, 0, 13);
// world._renderCubeFromImageTemplate(28, 0, 14);
// world._renderCubeFromImageTemplate(30, 0, 15);

world._renderCubeFromPathTemplate(0, 2, 0);
world._renderCubeFromPathTemplate(2, 2, 1);
world._renderCubeFromPathTemplate(4, 2, 2);
world._renderCubeFromPathTemplate(6, 2, 3);
world._renderCubeFromPathTemplate(8, 2, 4);
world._renderCubeFromPathTemplate(10, 2, 5);
world._renderCubeFromPathTemplate(12, 2, 6);
world._renderCubeFromPathTemplate(14, 2, 7);
world._renderCubeFromPathTemplate(16, 2, 8);
world._renderCubeFromPathTemplate(18, 2, 9);
world._renderCubeFromPathTemplate(20, 2, 10);
world._renderCubeFromPathTemplate(22, 2, 11);
world._renderCubeFromPathTemplate(24, 2, 12);
world._renderCubeFromPathTemplate(26, 2, 13);
world._renderCubeFromPathTemplate(28, 2, 14);
world._renderCubeFromPathTemplate(30, 2, 15);

// world._renderCubeFromCanvasTemplate(0, 4, 0);
// world._renderCubeFromCanvasTemplate(2, 4, 1);
// world._renderCubeFromCanvasTemplate(4, 4, 2);
// world._renderCubeFromCanvasTemplate(6, 4, 3);
// world._renderCubeFromCanvasTemplate(8, 4, 4);
// world._renderCubeFromCanvasTemplate(10, 4, 5);
// world._renderCubeFromCanvasTemplate(12, 4, 6);
// world._renderCubeFromCanvasTemplate(14, 4, 7);
// world._renderCubeFromCanvasTemplate(16, 4, 8);
// world._renderCubeFromCanvasTemplate(18, 4, 9);
// world._renderCubeFromCanvasTemplate(20, 4, 10);
// world._renderCubeFromCanvasTemplate(22, 4, 11);
// world._renderCubeFromCanvasTemplate(24, 4, 12);
// world._renderCubeFromCanvasTemplate(26, 4, 13);
// world._renderCubeFromCanvasTemplate(28, 4, 14);
// world._renderCubeFromCanvasSprites(10, 10, 5);

// world._renderDebugGrid();

// world.ctx.drawImage(world.canvasSprites, 0, 0);

window.requestAnimationFrame(world._renderWorld);



// function findVertex(edge1, edge2, edge3, edge4) {
//     return [
//         [0, lerp(edge4, edge1, this.cubeSize)],
//         [lerp(edge3, edge4), 1],
//         [0, 1],
//         false
//     ];
// }
//
//
// function lerp(edgeA, edgeB, max) {
//     const combinedStrength = (edgeA + edgeB) * -1;
//     return Math.round(((edgeA / combinedStrength) + 1) * max);
// }
