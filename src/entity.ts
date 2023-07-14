import { CanvasUtils } from "./utils/canvas";
import { Vector2, VectorUtils } from "./utils/vector";
import { World } from "./world";

export class Entity {
  ctx: CanvasRenderingContext2D;
  input: Vector2;
  prevInput: Vector2;
  lastActualInput: Vector2;
  prevVelocity: Vector2;
  face: string;
  angle: number;
  pos: Vector2;
  radius: number;
  velocity: Vector2;
  maxVelocityLength: number;
  inputVelocityLength: number;
  isFalling: boolean;
  numFramesFalling: number;
  airControl: number;
  elasticity: number;
  gravityVector: Vector2;
  airDrag: number;
  groundFriction: number;
  queue: Array<(ctx: CanvasRenderingContext2D) => void>;
  mode: string;
  collisionPoint: Vector2 | null;
  collisionNormal: Vector2 | null;
  gradientBody: CanvasGradient;
  world: World;

  constructor(world: World, input: Vector2, pos: Vector2, initialVelocity: Vector2 = [0, 0]) {
    this.ctx = world.ctx;
    this.world = world;
    this.input = input;
    this.prevInput = input;
    this.lastActualInput = input;
    this.prevVelocity = [0, 0];
    this.face = 'left';
    this.angle = 0;
    this.pos = pos;
    this.radius = 20;
    this.velocity = initialVelocity;
    this.maxVelocityLength = 35;
    this.inputVelocityLength = 30;
    this.isFalling = true;
    this.numFramesFalling = 0;
    this.airControl = 0.3;
    this.elasticity = 0.4;
    this.gravityVector = [0, 30];
    this.airDrag = 0.98;
    this.groundFriction = 0.92;
    this.queue = []; // TODO temp
    this.mode = 'normal';

    this.collisionPoint = null;
    this.collisionNormal = null;

    // body gradient
    this.gradientBody = world.ctx.createRadialGradient(5, this.radius / -3, 2, 0, 0, this.radius - 5);
    this.gradientBody.addColorStop(0, "khaki");
    this.gradientBody.addColorStop(1, "lightblue");
  }

  getCoordinates(): Vector2 {
    const x = Math.floor((this.pos[0]) / this.world.tileSize);
    const y = Math.floor((this.pos[1]) / this.world.tileSize);
    return [x, y];
  }

  render = (ctx: CanvasRenderingContext2D) => {
    if (this.world.input._mappings['jump'].active && this.mode !== 'dig') {
      const exhaustEnd = VectorUtils.add(this.pos, [this.input[0] * -5, Math.min(Math.max(this.radius + this.velocity[1] * -5, 25), 35)])
      CanvasUtils.renderLine(ctx, VectorUtils.add(this.pos, [0, this.radius]), exhaustEnd, 'red', 7);
    }

    ctx.translate(this.pos[0], this.pos[1]);
    CanvasUtils.renderCircle(ctx, [0, 0], this.radius, this.gradientBody);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (this.isFalling) {
      // CanvasUtils.renderCircle(ctx, this.pos, this.radius / 2, 'red')
    }

    const dot = VectorUtils.dot(VectorUtils.normalize(this.input), VectorUtils.normalize(this.prevInput));
    if (dot <= 0 && VectorUtils.len(this.input)) {
      console.log('turn around', dot);
      this.face = this.input[0] > 0 ? 'right' : 'left';
      this.prevInput = this.input;
    }

    const rotatedOffset = VectorUtils.rotate([this.face === 'left' ? -this.radius : this.radius, 0], this.face === 'left' ? this.angle : -this.angle);
    const facePos = VectorUtils.add(this.pos, VectorUtils.multiplyBy(rotatedOffset, 1));
    if (this.mode === 'dig') {
      CanvasUtils.renderCircle(ctx, facePos, 5, this.world.input._mappings['jump'].active ? 'red' : 'salmon');
    } else {
      CanvasUtils.renderCircle(ctx, facePos, 5, 'wheat');
    }

    this.queue.forEach((fn) => fn(ctx));
    this.queue = [];
  }

  update = (delta: number) => {
    if (delta) {
      this.queue.push(ctx => CanvasUtils.renderText(ctx, `fps: ${(1 / delta).toFixed(1)}`, [20, 20], 'left', 18));
    }

    if (this.world.input._mappings['moveUp'].active) {
      this.angle = Math.min(Math.max(this.angle - 150 * delta, -90), 90)
    } else if (this.world.input._mappings['moveDown'].active) {
      this.angle = Math.min(Math.max(this.angle + 150 * delta, -90), 90)
    }

    if (this.world.input._mappings['jump'].active) {
      if (this.mode === 'dig') {
        this.world.sculpComponent.strength = (this.world.input._mappings['shift'].active ? 75 : -75) * delta;
        this.world.sculpComponent.radiusXY = 3;
        const rotatedOffset = VectorUtils.rotate([this.face === 'left' ? -this.radius : this.radius, 0], this.face === 'left' ? this.angle : -this.angle);
        const digPos = VectorUtils.add(this.pos, VectorUtils.multiplyBy(rotatedOffset, 2));
        this.world.sculpComponent.sculpt(digPos);
      } else {
        const brake = this.velocity[1] <= -2.5;
        this.velocity = VectorUtils.add(this.velocity, [0, -this.gravityVector[1] * (brake ? 1.2 : 1.8) * delta])
      }
    }

    this.velocity[0] *= this.airDrag;
    this.velocity[1] *= this.airDrag;
    this.velocity[0] += this.gravityVector[0] * delta;
    this.velocity[1] += this.gravityVector[1] * delta;

    let velocityLength = VectorUtils.len(this.velocity);
    let velocityLengthExcludeGravity = VectorUtils.len(VectorUtils.subtract(this.velocity, this.gravityVector));
    let prevVelocityLengthExcludeGravity = VectorUtils.len(VectorUtils.subtract(this.prevVelocity, this.gravityVector));
    const factor = velocityLength / this.maxVelocityLength;

    if (factor > 1) {
      console.log('velocity length too large. Clamped to max value...', velocityLength);
      this.velocity = VectorUtils.divideBy(this.velocity, factor);
    } else if (prevVelocityLengthExcludeGravity > 1 && Math.abs(velocityLengthExcludeGravity) <= 0.05 && Math.abs(VectorUtils.distance(this.prevVelocity, this.velocity)) <= 0.001) {
      console.log('velocity too small, setting to zero...', velocityLengthExcludeGravity);
      this.velocity = [0, 0];
    }
    
    this.pos[0] += this.velocity[0];
    this.pos[1] += this.velocity[1];

    this.prevVelocity = this.velocity;

    this.addInput(delta);
    this.collision();
  }


  collision() {
    // TODO add an additional check to verify whether entity passed through the terrain line with high speed.
    //  Take currentPos of entity with projectedPos and call a lineLine(this.pos, projectedPos) collision check.
    const lines: [Vector2, Vector2][] = [];

    // Get all near lines
    const centerCoords = this.getCoordinates();
    const offsetSize = 2;
    for (let offsetX = -offsetSize; offsetX <= offsetSize; offsetX++) {
      for (let offsetY = -offsetSize; offsetY <= offsetSize; offsetY++) {
        const [x, y] = VectorUtils.add(centerCoords, [offsetX, offsetY]);
        const edges = this.world._getTileEdges(x, y, 0);
        if (edges) {
          if (this.world.TileManager._getTileLookupIndex(edges, this.world.tileDensityThreshold) === 0) continue;
          const pathData = this.world.TileManager._lookupTilePathData(edges, this.world.tileDensityThreshold);
          const tileLines = pathData.reduce<[Vector2, Vector2][]>((acc, cur, i, arr) => {
            if (cur && cur[2] === 'iso-start') {
              const fromActual = VectorUtils.add(VectorUtils.multiplyBy([x, y], this.world.tileSize), VectorUtils.multiplyBy(arr[i] as Vector2, this.world.tileSize));
              const toActual = VectorUtils.add(VectorUtils.multiplyBy([x, y], this.world.tileSize), VectorUtils.multiplyBy(arr[i + 1] as Vector2, this.world.tileSize));
              acc.push([fromActual, toActual]);
            }
            return acc;
          }, []);
          lines.push(...tileLines);
        }
      }
    }

    // Check all nearby lines for collisions
    const collideData: [Vector2, Vector2][] = [];
    for (const [from, to] of lines) {
      try {
        const [collides, point, normal] = VectorUtils.lineCircle(from, to, this.pos, this.radius);
        if (collides) collideData.push([point, normal]);
        this.queue.push((ctx) => CanvasUtils.renderLine(ctx, from, to, collides ? 'red' : 'green', 6));
      } catch (e) {
        console.log('err', e)
      }
    }

    // resolve collision with nearest two collided points
    if (collideData.length) {
      const distances = collideData.map((c, i) => [i, VectorUtils.distance(this.pos, c[0])]);
      const sortedDistances = distances.sort((t1, t2) => t1[1] - t2[1]);
      const nearestTwo = sortedDistances.slice(0, 2).map(([i, d]) => collideData[i]);

      this.collisionPoint = VectorUtils.divideBy(VectorUtils.addAll(...nearestTwo.map(c => c[0])), nearestTwo.length);
      this.collisionNormal = VectorUtils.divideBy(VectorUtils.addAll(...nearestTwo.map(c => c[1])), nearestTwo.length);
      this.queue.push((ctx) => CanvasUtils.renderCircle(ctx, [...this.collisionPoint!], 3, 'green'));
      
      const correctedPos = VectorUtils.subtract(this.collisionPoint, VectorUtils.multiplyBy(this.collisionNormal, this.radius));
      this.pos[0] = correctedPos[0];
      this.pos[1] = correctedPos[1];

      if (this.isFalling && Math.abs(VectorUtils.len(this.velocity) * this.elasticity) > 1.5) {
        const impactDot = VectorUtils.dot(VectorUtils.normalize(this.velocity), this.collisionNormal);
        const strength = VectorUtils.len(this.velocity);
        this.velocity = VectorUtils.multiplyBy(VectorUtils.reflection(this.velocity, this.collisionNormal), this.elasticity);
        console.log('bounce', this.velocity, strength);


        // sculpt terrain depending on speed and "directness" of impact (as indicated by dot)
        if (strength >= 10 && impactDot >= 0.2) {
          this.world.sculpComponent.radiusXY = 3;
          const sculptStrength = -strength * 0.3 * impactDot
          console.log('----sculpt strength', sculptStrength)
          this.world.sculpComponent.strength = sculptStrength;
          this.world.sculpComponent.sculpt(this.collisionPoint);
        }
      } else {
        // TODO maybe only reduce velocity based on collision direction
        //  E.g. if colliding straight down to a horizontal line --> velocity[1] = 0 otherwise rotated accordingly
        this.velocity[1] = 0;
        // this.velocity = [0, 0];
      }
    } else {
      this.collisionNormal = null;
      this.collisionPoint = null;
    }

    // TODO numFramesFalling solution not final, only to get a feeling for it
    this.numFramesFalling = collideData.length ? 0 : this.numFramesFalling + 1;
    if (collideData.length) {
      this.numFramesFalling = 0;
      this.isFalling = false;
      this.velocity[0] = this.velocity[0] * this.groundFriction;
      this.velocity[1] = this.velocity[1] * this.groundFriction;
    } else if (this.numFramesFalling > 5) {
      this.numFramesFalling++;
      this.isFalling = true;
    }
  }

  addInput(delta: number) {
    let inputRotation = 0;
    if (this.collisionNormal) {
      const rel = VectorUtils.negate(this.collisionNormal);
      const up: Vector2 = [0, -1]; // TODO derive from gravity direction. Currently hardcoded to it
      const dot = VectorUtils.dot(up, rel);
      const cross = up[0] * rel[1] - up[1] * rel[0];
      let angle = Math.acos(dot) * (180 / Math.PI);
      inputRotation = (cross > 0 ? 360 - angle : angle);
    }

    // Rotate the input vector according to the current collision
    let finalInput = this.input;
    if (this.collisionPoint) {
      finalInput = VectorUtils.rotate(this.input, inputRotation);
      const collideAbove = this.pos[1] > this.collisionPoint[1];
      finalInput = collideAbove ? VectorUtils.negate(finalInput) : finalInput;
      finalInput = VectorUtils.interp(this.lastActualInput, finalInput, 0.125); // TODO make fps independent
    } else if (this.lastActualInput) {
      finalInput = VectorUtils.interp(this.lastActualInput, this.input, 0.125)
    }

    // const inputEnd = VectorUtils.add(this.pos, VectorUtils.multiplyBy(finalInput, 200));
    // this.queue.push((ctx) => CanvasUtils.renderLine(ctx, this.pos, inputEnd, 'red', 3));

    const brake = this.isFalling ? this.airControl : 1;
    this.velocity[0] += finalInput[0] * this.inputVelocityLength * brake * delta;
    this.velocity[1] += finalInput[1] * this.inputVelocityLength * brake * delta;

    this.lastActualInput = finalInput;
  }
}
