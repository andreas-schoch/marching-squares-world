import { Entity } from "./entity";
import { InputComponent } from "./input";
import { SculptComponent } from "./sculpt";
import { Edges, TileLookupManager } from "./tile-lookup-manager";
import { DebugUtils } from "./utils/debug";
import { Vector2, VectorUtils } from "./utils/vector";


interface Bounds {
  startX: number;
  startY: number;
  numTilesX: number;
  numTilesY: number;
  terrain: boolean;
  water: boolean;
}

export class World {
  tileSize: number;
  numTilesX: number;
  numTilesY: number;
  tileDensityMax: number = 128;
  tileDensityThreshold: number;
  private materialColor: (CanvasGradient|string)[] = [];
  vertices: number[][] = [];
  verticesWater: number[][] = [];
  vertMap: number[][][];
  entities: Entity[] = [];
  renderQueue: Bounds[] = [];
  debug: boolean;
  private gradientSky: CanvasGradient;
  private gradientground: CanvasGradient;
  private canvasBackground: HTMLCanvasElement;
  private ctxBackground: CanvasRenderingContext2D;
  private canvasWater: HTMLCanvasElement;
  private ctxWater: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private canvasCache: HTMLCanvasElement;
  private ctxCache: CanvasRenderingContext2D;
  private canvasEntity: HTMLCanvasElement;
  private ctxEntity: CanvasRenderingContext2D;
  TileManager: TileLookupManager;
  input: InputComponent;
  sculpComponent: SculptComponent;
  private last?: number;
  spacialHashSize: number;
  spacialHash: Record<string, Bounds> = {};
  

  constructor(options: {tileSize: number, numTilesX?: number, numTilesY?: number, spacialHashSize?: number, fitWindow?: boolean}) {
    let {tileSize, numTilesX, numTilesY, spacialHashSize, fitWindow} = options;
    tileSize = tileSize || 32;
    numTilesX = fitWindow ? Math.floor(window.innerWidth / tileSize) -2 : numTilesX || 32;
    numTilesY = fitWindow ? Math.floor(window.innerHeight / tileSize) - 2 : numTilesY || 32;
    spacialHashSize = spacialHashSize || 3;

    this.numTilesX = numTilesX;
    this.numTilesY = numTilesY;

    // if (numTilesX  % spacialHashSize !== 0) throw new Error('numTilesX must be divisible by spacialHashSize');
    // if (numTilesY % spacialHashSize !== 0) throw new Error('numTilesY must be divisible by spacialHashSize');
    
    this.spacialHashSize = spacialHashSize;
    for (let x = 0; x <= numTilesX; x += spacialHashSize) {
      for (let y = 0; y <= numTilesY; y += spacialHashSize) {
        // const isEndX = x > this.numTilesX ? this.numTilesX : x;
        // const isEndY = y > this.numTilesY ? this.numTilesY : y;

        this.spacialHash[`${x}-${y}`] = {startX: x - 1, startY: y - 1, numTilesX: spacialHashSize + 2, numTilesY: spacialHashSize + 2, water: false, terrain: false};
      }
    }

        // Calculate number of tiles that fit into the viewport

    
    this.debug = false;
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) throw new Error('No canvas container found');
    // Canvas for background
    this.canvasBackground = document.createElement('canvas');
    this.canvasBackground.classList.add('canvas-background');
    this.canvasBackground.width = tileSize * this.numTilesX;
    this.canvasBackground.height = tileSize * this.numTilesY;
    this.canvasBackground.style.zIndex = '0';
    this.ctxBackground = this.canvasBackground.getContext('2d') as CanvasRenderingContext2D;
    canvasContainer.appendChild(this.canvasBackground);

    // Canvas for Water
    this.canvasWater = document.createElement('canvas');
    this.canvasWater.classList.add('canvas-Water');
    this.canvasWater.width = tileSize * this.numTilesX;
    this.canvasWater.height = tileSize * this.numTilesY;
    this.canvasWater.style.zIndex = '2';
    this.ctxWater = this.canvasWater.getContext('2d') as CanvasRenderingContext2D; 
    canvasContainer.appendChild(this.canvasWater);

    // To render terrain
    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('canvas-terrain');
    this.ctx = this.canvas.getContext('2d',) as CanvasRenderingContext2D;
    this.canvas.width = tileSize * this.numTilesX;
    this.canvas.height = tileSize * this.numTilesY;
    this.canvas.style.zIndex = '3';
    canvasContainer.appendChild(this.canvas);

    // Performance optimization for terrain canvas by saving
    // what was drawn last frame and using that as a base
    // for the next render. Then only rerender the sections in renderQueue
    this.canvasCache = document.createElement('canvas');
    this.canvasCache.width = this.canvas.width;
    this.canvasCache.height = this.canvas.height;
    this.ctxCache = this.canvasCache.getContext('2d') as CanvasRenderingContext2D;

    // Canvas for moving entities
    this.canvasEntity = document.createElement('canvas');
    this.canvasEntity.width = tileSize * this.numTilesX;
    this.canvasEntity.height = tileSize * this.numTilesY;
    this.canvasEntity.style.zIndex = '1';
    this.ctxEntity = this.canvasEntity.getContext('2d') as CanvasRenderingContext2D;
    canvasContainer.appendChild(this.canvasEntity);

    // Create sky gradient
    this.gradientSky = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    this.gradientSky.addColorStop(0, "lightblue");
    this.gradientSky.addColorStop(1, "aliceblue");
    this.ctxBackground.fillStyle = this.gradientSky;
    this.ctxBackground.fillRect(0, 0, this.canvasBackground.width, this.canvasBackground.height);

    // Create ground gradient
    this.gradientground = this.ctx.createLinearGradient(0, 0, 0, tileSize);
    this.gradientground.addColorStop(0, "white");
    this.gradientground.addColorStop(0.5, "lightblue");
    this.gradientground.addColorStop(1, "white");

    this.tileSize = tileSize;
    this.numTilesX = numTilesX;
    this.numTilesY = numTilesY;

    this.tileDensityMax = 128;
    this.tileDensityThreshold = (this.tileDensityMax / 2);

    this.materialColor = [this.gradientground, 'rgb(30, 144, 255, 0.5)', 'green', 'red'];
    this.vertices = [];
    this.verticesWater = [];
    this.vertMap = [this.vertices, this.verticesWater];

    this.entities = [];

    this.renderQueue = [{startX: 0, startY: 0, numTilesX: this.numTilesX, numTilesY: this.numTilesY, terrain: true, water: true}];
    this.TileManager = new TileLookupManager(tileSize);
    this.input = new InputComponent(); // TODO move this to a player class;
    this.input.initListeners(document.body);
    this.sculpComponent = new SculptComponent(this, 1, 0.3);  // TODO move this to a player class;
  }

  _generateVertices(noiseFunction: (x: number, y: number) => number) {
    for (let y = 0; y <= this.numTilesY; y++) {
      const row : number[]= [];
      const rowWater: number[] = [];
      for (let x = 0; x <= this.numTilesX; x++) {
        const noise = noiseFunction.call(this, x, y);
        row.push(noise);
        // when terrain is dense enough fill remaining space with water. This simplifies computations of fluid flow
        rowWater.push(noise > this.tileDensityThreshold ? this.tileDensityMax - noise : 0);
      }
      this.vertices.push(row);
      this.verticesWater.push(rowWater);
    }
  }

  _getTileEdges(x: number, y: number, materialIndex: number): Edges | false {
    try {
      const verts = materialIndex === 0 ? this.vertices : this.verticesWater;
      // Note: Internally edge values are still stored as floats but get transformed into integers to rendering the map
      // We use integers mainly to limit the num of cached Path2D objects and to simplify serialization for networking
      // Stored as floats so when sculpting the terrain fractional changes still get applied when far from center
      // TODO why was parseInt used here before as well?
      const edge1 = Math.floor(verts[y][x]);
      const edge2 = Math.floor(verts[y][x + 1]);
      const edge3 = Math.floor(verts[y + 1][x + 1]);
      const edge4 = Math.floor(verts[y + 1][x]);
      return [edge1, edge2, edge3, edge4];
    } catch (e) {
      return false;
    }
  }

  public renderTileAt(x: number, y: number, edgesOverwrite: Edges | null = null, materialIndex: number = 0): void {
    const edges = edgesOverwrite || this._getTileEdges(x, y, materialIndex);
    if (!Array.isArray(edges)) return;
    const paths = this.TileManager.getTilePath2D(edges, this.tileDensityThreshold, this.tileSize);
    // TODO create material class and pass ctx to its constructor
    const ctx = materialIndex === 0 ? this.ctx : this.ctxWater;
    if (paths && paths[0]) {
      const position = VectorUtils.multiplyBy([x, y], this.tileSize);
      ctx.translate(position[0], position[1]);
      ctx.fillStyle = this.materialColor[materialIndex];
      ctx.fill(paths[0]);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    if (paths && paths[1]) {
      const position = VectorUtils.multiplyBy([x, y], this.tileSize);
      ctx.translate(position[0], position[1]);
      ctx.strokeStyle = 'black';
      // ctx.lineCap = "round";
      ctx.lineCap = "butt";
      ctx.lineWidth = 2;
      ctx.stroke(paths[1]);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
  }

  public rain(): void {
    // return;
    if (Math.random() * 100 < 85) return
    const spawnX = Math.floor(Math.random() * this.canvas.width);
    const spawnPos: Vector2 = [spawnX, 0];
    this.sculpComponent.strength = this.tileDensityThreshold * 1.3;
    this.sculpComponent.radiusXY = 1
    this.sculpComponent.sculpt(spawnPos, 1);
  }

  private getSpacialHashKey(x: number, y: number): string {
    return `${Math.floor(x / this.spacialHashSize) * this.spacialHashSize}-${Math.floor(y / this.spacialHashSize) * this.spacialHashSize}`;
  }   

  public flow(): void {
    // console.time('flow');
    for (let y = this.numTilesY - 1; y >= 0; y--) {
      const rowWater = this.verticesWater[y];
      const rowWaterBelow = this.verticesWater[y + 1];
      const rowTerrain = this.vertices[y];
      const rowTerrainBelow = this.vertices[y + 1];
      
      for (let x1 = 0; x1 <= this.numTilesX; x1++) {
        let x = y % 2 === 0 ? this.numTilesX - x1 : x1; // Alternate horizontal scan direction
        if (rowTerrain[x] >= this.tileDensityThreshold) continue;

        
        // Try to flow down // TODO also try left and right if some density is left
        let remainingDensity = rowWater[x];
        if (remainingDensity <= 0) continue;
        const availableDensityBelow = rowWaterBelow[x] !== undefined ? this.tileDensityMax - rowWaterBelow[x] : 0;
        if (availableDensityBelow && rowTerrainBelow[x] <= this.tileDensityThreshold) {
          const flow = Math.min(remainingDensity, availableDensityBelow);
          rowWaterBelow[x] += flow;
          rowWater[x] -= flow;
          this.spacialHash[this.getSpacialHashKey(x, y + 1)].water = true;
          this.spacialHash[this.getSpacialHashKey(x, y)].water = true;
        }
        
        // If it cannot flow down, try flowing left and right in equal amounts
        remainingDensity = rowWater[x];
        if (remainingDensity <= 0) continue;
        const availableDensityLeft = this.tileDensityMax - rowWater[x - 1];
        const canFlowLeft = availableDensityLeft && rowWater[x - 1] < remainingDensity;
        if (canFlowLeft && rowTerrain[x - 1] <= this.tileDensityThreshold) {
          const average = (remainingDensity + rowWater[x - 1]) / 2;
          rowWater[x - 1] = average;
          rowWater[x] = average;
          this.spacialHash[this.getSpacialHashKey(x - 1, y)].water = true;
          this.spacialHash[this.getSpacialHashKey(x, y)].water = true;
        }
        
        remainingDensity = rowWater[x];
        if (remainingDensity <= 10) continue;
        const availableDensityRight = this.tileDensityMax - rowWater[x + 1];
        const canFlowRight = availableDensityRight && rowWater[x + 1] < remainingDensity;
        if (canFlowRight && rowTerrain[x + 1] <= this.tileDensityThreshold) {
          const average = (remainingDensity + rowWater[x + 1]) / 2;
          rowWater[x + 1] = average;
          rowWater[x] = average;
          this.spacialHash[this.getSpacialHashKey(x + 1, y)].water = true;
          this.spacialHash[this.getSpacialHashKey(x, y)].water = true;
        }    
      }
    }

    Object.values(this.spacialHash)
    .filter(b => b.water)
    .forEach((b) => {
      this.renderQueue.push({...b, water: true});
      b.water = false;
    });
    
    // console.timeEnd('flow');
  }
  
  public update(delta: number): void {
    this.flow();
    this.rain();
    
    if (this.input._mappings['leftMouseButton'].active) { // TODO create a method on input component instead of exposing private stuff
      const offset = this.canvas.getBoundingClientRect(); // offset of canvas to topleft
      const lastEvt = this.input.lastMouseMoveEvent;
      if (!lastEvt) return;
      const sculptPos: Vector2 = [lastEvt.clientX - offset.x, lastEvt.clientY - offset.y];
      this.sculpComponent.strength = (this.input._mappings.shift.active ? -this.tileDensityThreshold : this.tileDensityThreshold) * 0.4;
      this.sculpComponent.radiusXY = 3;
      this.sculpComponent.sculpt(sculptPos);
    }

    this.entities.forEach(e => e.update(delta));
  }

  public render(): void {
    // console.time('render');  

    // this.ctx.clearRect(0, 0, this.ctxEntity.canvas.width, this.ctxEntity.canvas.height);
    // this.ctxWater.clearRect(0, 0, this.ctxWater.canvas.width, this.ctxWater.canvas.height);
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
      this.renderQueue.forEach(({startX, startY, numTilesX, numTilesY, water, terrain}) => {
        terrain && this.ctx.clearRect(startX * this.tileSize, startY * this.tileSize, numTilesX * this.tileSize, numTilesY * this.tileSize);
        water && this.ctxWater.clearRect(startX * this.tileSize, startY * this.tileSize, numTilesX * this.tileSize, numTilesY * this.tileSize);
        for (let y = startY; y < (startY + numTilesY); y++) {
          for (let x = startX; x < startX + numTilesX; x++) {
            if (x < 0 || y < 0 || x > this.numTilesX || y > this.numTilesY) continue;
            terrain && this.renderTileAt(x, y, null, 0);
            water  && this.renderTileAt(x, y, null, 1);

            // this.ctxBackground.fillStyle = 'red';
            // this.ctxBackground.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
          }
        }
      });

      // console.log('---------render queue', this.renderQueue.length);
      this.renderQueue.length = 0;
      // this.ctxCache.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // this.ctxCache.drawImage(this.canvas, 0, 0);
    }

    if (this.debug) {
      DebugUtils.renderDebugGrid(this);
      DebugUtils.renderDebugEdgeDensity(this, 0);
      DebugUtils.renderDebugEdgeDensity(this, 1);
    }

    // TODO there should be a separate canvas for rendering dynamic objects like entities
    this.entities.forEach(e => e.render(this.ctxEntity));
    // console.timeEnd('render'); 
  }

  public main = (now: number) => {
    const delta = this.last ? (now - this.last) / 1000 : 0;
    this.last = now;
    this.update(delta);
    this.render();
    window.requestAnimationFrame(this.main);
  };
}
