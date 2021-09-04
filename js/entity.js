class Entity {

  constructor(ctx, input, pos, initialVelocity = [0, 0]) {
    this.ctx = ctx;
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
    this.gradientBody = ctx.createRadialGradient(5, this.radius / -3, 2, 0, 0, this.radius - 5);
    this.gradientBody.addColorStop(0, "khaki");
    this.gradientBody.addColorStop(1, "darkkhaki");
  }

  getCoordinates(world, pos) {
    const x = Math.floor((pos[0]) / world.tileSize);
    const y = Math.floor((pos[1]) / world.tileSize);
    return [x, y];
  }

  render = (ctx) => {
    if (world.input._mappings['jump'].active && this.mode !== 'dig') {
      const exhaustEnd = util.vector.add(this.pos, [this.input[0] * -5, Math.min(Math.max(this.radius + this.velocity[1] * -5, 25), 35)])
      util.canvas.renderLine(ctx, util.vector.add(this.pos, [0, this.radius]), exhaustEnd, 'red', 7);
    }

    ctx.translate(this.pos[0], this.pos[1]);
    util.canvas.renderCircle(ctx, [0, 0], this.radius, this.gradientBody);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (this.isFalling) {
      // util.canvas.renderCircle(ctx, this.pos, this.radius / 2, 'red')
    }

    const dot = util.vector.dot(util.vector.normalize(this.input), util.vector.normalize(this.prevInput));
    if (dot <= 0 && util.vector.length(this.input)) {
      console.log('turn around', dot);
      this.face = this.input[0] > 0 ? 'right' : 'left';
      this.prevInput = this.input;
    }

    const rotatedOffset = util.vector.rotate([this.face === 'left' ? -this.radius : this.radius, 0], this.face === 'left' ? this.angle : -this.angle);
    const facePos = util.vector.add(this.pos, util.vector.multiplyBy(rotatedOffset, 1));
    if (this.mode === 'dig') {
      util.canvas.renderCircle(ctx, facePos, 5, world.input._mappings['jump'].active ? 'red' : 'salmon');
    } else {
      util.canvas.renderCircle(ctx, facePos, 5, 'wheat');
    }

    this.queue.forEach((fn) => fn(ctx));
    this.queue = [];
  }

  update = (delta) => {
    if (delta) {
      this.queue.push(ctx => util.canvas.renderText(ctx, `fps: ${(1 / delta).toFixed(1)}`, [20, 20], 'left', 18));
    }

    if (world.input._mappings['moveUp'].active) {
      this.angle = Math.min(Math.max(this.angle - 150 * delta, -90), 90)
    } else if (world.input._mappings['moveDown'].active) {
      this.angle = Math.min(Math.max(this.angle + 150 * delta, -90), 90)
    }

    if (world.input._mappings['jump'].active) {
      if (this.mode === 'dig') {
        world.sculpComponent.strength = (world.input._mappings['shift'].active ? 75 : -75) * delta;
        world.sculpComponent.radiusXY = 3;
        const rotatedOffset = util.vector.rotate([this.face === 'left' ? -this.radius : this.radius, 0], this.face === 'left' ? this.angle : -this.angle);
        const digPos = util.vector.add(this.pos, util.vector.multiplyBy(rotatedOffset, 2));
        world.sculpComponent.sculpt(digPos);
      } else {
        const brake = this.velocity[1] <= -2.5;
        entity.velocity = util.vector.add(this.velocity, [0, -this.gravityVector[1] * (brake ? 1.2 : 1.8) * delta])
      }
    }

    this.velocity[0] *= this.airDrag;
    this.velocity[1] *= this.airDrag;
    this.velocity[0] += this.gravityVector[0] * delta;
    this.velocity[1] += this.gravityVector[1] * delta;

    let velocityLength = util.vector.length(this.velocity);
    let velocityLengthExcludeGravity = util.vector.length(util.vector.subtract(this.velocity, this.gravityVector));
    let prevVelocityLengthExcludeGravity = util.vector.length(util.vector.subtract(this.prevVelocity, this.gravityVector));
    const factor = velocityLength / this.maxVelocityLength;

    if (factor > 1) {
      console.log('velocity length too large. Clamped to max value...', velocityLength);
      this.velocity = util.vector.divideBy(this.velocity, factor);
    } else if (prevVelocityLengthExcludeGravity > 1 && Math.abs(velocityLengthExcludeGravity) <= 0.05 && Math.abs(util.vector.distance(this.prevVelocity, this.velocity)) <= 0.001) {
      console.log('velocity too small, setting to zero...', velocityLengthExcludeGravity);
      this.velocity = [0, 0];
    }

    this.pos[0] += this.velocity[0];
    this.pos[1] += this.velocity[1];

    this.prevVelocity = this.velocity;

    this.addInput(delta);
    this.collision(delta);
  }


  collision() {
    // TODO add an additional check to verify whether entity passed through the terrain line with high speed.
    //  Take currentPos of entity with projectedPos and call a lineLine(this.pos, projectedPos) collision check.
    const lines = [];

    // Get all near lines
    const centerCoords = this.getCoordinates(world, this.pos);
    const offsetSize = 2;
    for (let offsetX = -offsetSize; offsetX <= offsetSize; offsetX++) {
      for (let offsetY = -offsetSize; offsetY <= offsetSize; offsetY++) {
        const [x, y] = util.vector.add(centerCoords, [offsetX, offsetY]);
        const edges = world._getTileEdges(x, y, 0);
        if (edges) {
          if (world.TileManager._getTileLookupIndex(edges, world.tileDensityThreshold) === 0) continue;
          const pathData = world.TileManager._lookupTilePathData(edges, world.tileDensityThreshold);
          const tileLines = pathData.reduce((acc, cur, i, arr) => {
            if (cur && cur[2] === 'iso-start') {
              const fromActual = util.vector.add(util.vector.multiplyBy([x, y], world.tileSize), util.vector.multiplyBy(arr[i], world.tileSize));
              const toActual = util.vector.add(util.vector.multiplyBy([x, y], world.tileSize), util.vector.multiplyBy(arr[i + 1], world.tileSize));
              acc.push([fromActual, toActual]);
            }
            return acc;
          }, []);
          lines.push(...tileLines);
        }
      }
    }

    // Check all nearby lines for collisions
    const collideData = [];
    for (const [from, to] of lines) {
      try {
        const [collides, point, normal] = util.vector.lineCircle(from, to, this.pos, this.radius);
        if (collides) collideData.push([point, normal]);
        // this.queue.push((ctx) => util.canvas.renderLine(ctx, from, to, collides ? 'red' : 'green', 3));
      } catch (e) {
        console.log('err', e)
      }
    }

    // resolve collision with nearest two collided points
    if (collideData.length) {
      const distances = collideData.map((c, i) => [i, util.vector.distance(this.pos, c[0])]);
      const sortedDistances = distances.sort((t1, t2) => t1[1] - t2[1]);
      const nearestTwo = sortedDistances.slice(0, 2).map(([i, d]) => collideData[i]);

      this.collisionPoint = util.vector.divideBy(util.vector.addAll(...nearestTwo.map(c => c[0])), nearestTwo.length);
      this.collisionNormal = util.vector.divideBy(util.vector.addAll(...nearestTwo.map(c => c[1])), nearestTwo.length);

      const correctedPos = util.vector.subtract(this.collisionPoint, util.vector.multiplyBy(this.collisionNormal, this.radius));
      // this.queue.push((ctx) => util.canvas.renderCircle(ctx, [...correctedPos], 3, 'green'));
      // this.pos[0] = this.isFalling ? correctedPos[0] : this.pos[0]; // TODO prevents sliding but still not 100% correct
      this.pos[0] = correctedPos[0];
      this.pos[1] = correctedPos[1];

      if (this.isFalling && Math.abs(util.vector.length(this.velocity) * this.elasticity) > 1.5) {
        const impactDot = util.vector.dot(util.vector.normalize(this.velocity), this.collisionNormal);
        const strength = util.vector.length(this.velocity);
        this.velocity = util.vector.multiplyBy(util.vector.reflection(this.velocity, this.collisionNormal), this.elasticity);
        console.log('bounce', this.velocity, strength);

        // sculpt terrain depending on speed and "directness" of impact (as indicated by dot)
        if (strength >= 10 && impactDot >= 0.2) {
          world.sculpComponent.radiusXY = 3;
          const sculptStrength = -strength * 0.3 * impactDot
          console.log('----sculpt strength', sculptStrength)
          world.sculpComponent.strength = sculptStrength;
          world.sculpComponent.sculpt(this.collisionPoint);
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

  addInput(delta) {
    let inputRotation = 0;
    if (this.collisionNormal) {
      const rel = util.vector.negate(this.collisionNormal);
      const up = [0, -1]; // TODO derive from gravity direction. Currently hardcoded to it
      const dot = util.vector.dot(up, rel);
      const cross = up[0] * rel[1] - up[1] * rel[0];
      let angle = Math.acos(dot) * (180 / Math.PI);
      inputRotation = (cross > 0 ? 360 - angle : angle);
    }

    // Rotate the input vector according to the current collision
    let finalInput = this.input;
    if (this.collisionPoint) {
      finalInput = util.vector.rotate(this.input, inputRotation);
      const collideAbove = this.pos[1] > this.collisionPoint[1];
      finalInput = collideAbove ? util.vector.negate(finalInput) : finalInput;
      finalInput = util.vector.interp(this.lastActualInput, finalInput, 0.125); // TODO make fps independent
    } else if (this.lastActualInput) {
      finalInput = util.vector.interp(this.lastActualInput, this.input, 0.125)
    }

    // const inputEnd = util.vector.add(this.pos, util.vector.multiplyBy(finalInput, 200));
    // this.queue.push((ctx) => util.canvas.renderLine(ctx, this.pos, inputEnd, 'red', 3));

    const brake = this.isFalling ? this.airControl : 1;
    this.velocity[0] += finalInput[0] * this.inputVelocityLength * brake * delta;
    this.velocity[1] += finalInput[1] * this.inputVelocityLength * brake * delta;

    this.lastActualInput = finalInput;
  }
}
