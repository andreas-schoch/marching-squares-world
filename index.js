class World {
    constructor(cubeSize = 50, numCubesX= 10, numCubesY = 20) {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.cubeSize = cubeSize;
        this.numCubesX = numCubesX;
        this.numCubesY = numCubesY;
        this.numCubesXY = numCubesX * numCubesY;

        this.worldHeight = this.cubeSize * this.numCubesY;
        this.worldWidth = this.cubeSize * this.numCubesX;

        this.canvas.width = this.cubeSize * this.numCubesX;
        this.canvas.height = this.cubeSize * this.numCubesY;
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
                const color = this.vertices[y][x] ? '#222' : '#bbb';
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

    // _renderTriangle = (vertex1, vertex2, vertex3) => {
    //     this.ctx.beginPath();
    //     this.ctx.moveTo(vertex1[0], vertex1[1]);
    //     this.ctx.lineTo(vertex2[0], vertex2[1]);
    //     this.ctx.lineTo(vertex3[0], vertex3[1]);
    //     this.ctx.closePath();
    //     this.ctx.fillStyle = 'black';
    //     this.ctx.fill();
    // };

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
                    this.ctx.moveTo(...position);
                    isDrawing = true;
                }
            } else {
                this.ctx.closePath();
                this.ctx.fill();
                isDrawing = false;
            }
        }
    }

    _renderWorld() {
        for (let y = 0; y < this.numCubesY; y++) {
            for (let x = 0; x < this.numCubesX; x++) {
                const index = this._findLookupIndexAt(x, y);
                this._renderCube(x, y, index);
            }
        }
    }
}

const world = new World(25, 40, 20);

noise.seed(Math.random());
world._generateVertices((x, y) => Math.round(noise.simplex2(x / 5, y / 5) * 0.5 + 0.5));

world._renderDebugGrid();
world._renderDebugEdgeDensity();
world._renderDebugLookupIndices();


world._renderWorld();
