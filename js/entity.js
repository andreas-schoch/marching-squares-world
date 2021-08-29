class Entity {

  constructor(ctx, input, pos, initialVelocity = [0, 0]) {
    this.ctx = ctx;
    this.input = input;
    this.prevVelocity = [0, 0];

    this.pos = pos;
    this.radius = 20;
    this.velocity = initialVelocity;
    this.maxVelocityLength = 35;
    this.inputVelocityLength = 45;
    this.isFalling = true;
    this.airControl = 0.3;
    this.elasticity = 0.3;
    this.gravityVector = [0, 40];
    this.airDrag = 0.98;
    this.groundFriction = 0.92;
    this.queue = []; // TODO temp

    // body gradient
    this.gradientBody = ctx.createRadialGradient(5, this.radius/ -3, 2, 0, 0, this.radius - 5);
    this.gradientBody.addColorStop(0, "khaki");
    this.gradientBody.addColorStop(1, "darkkhaki");
  }

  getCoordinates(world, pos) {
    const x = Math.floor((pos[0]) / world.tileSize);
    const y = Math.floor((pos[1]) / world.tileSize);
    return [x, y];
  }

  render = () => {
    world.ctx.translate(this.pos[0], this.pos[1]);
    util.canvas.renderCircle(this.ctx, [0, 0], this.radius, this.gradientBody);
    world.ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (this.isFalling) {
      util.canvas.renderCircle(this.ctx, this.pos, this.radius / 4, 'khaki');
    }

    const [x, y] = this.getCoordinates(world, this.pos);
    // util.canvas.renderCircle(this.ctx, [x * world.tileSize + world.tileSize / 2, y * world.tileSize + world.tileSize / 2], this.radius / 4, 'green');

    this.queue.forEach((fn) => fn());
    this.queue = [];
  }

  update = (delta) => {
    if (world.input._mappings['jump'].active) {
      // if (!entity.isFalling) {
      // TODO make it possible to add impulses by passing the velocity scaled to a second
      entity.velocity = util.vector.add(this.velocity, [0, -85 * delta])
      // }
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
        // this.queue.push(() => util.canvas.renderLine(world.ctx, from, to, collides ? 'red' : 'green', 4));
      } catch (e) {
        console.log('err', e)
      }
    }

    // resolve collision with nearest collided point
    if (collideData.length) {
      const distances = collideData.map(c => util.vector.distance(this.pos, c[0]));
      const nearestIndex = distances.indexOf(Math.min(...distances));
      let [point, normal] = collideData[nearestIndex];

      if (collideData.length >= 2) {
        // const pointAvg = util.vector.divideBy(util.vector.addAll(...collideData.map(c => c[0])), collideData.length);
        // const normalAvg = util.vector.divideBy(util.vector.addAll(...collideData.map(c => c[1])), collideData.length);
        // point = pointAvg;
        // normal = normalAvg;

        distances.splice(nearestIndex, 1)
        collideData.splice(nearestIndex, 1)
        const secondNearestIndex = distances.indexOf(Math.min(...distances));
        const [point2, normal2] = collideData[secondNearestIndex];
        point = util.vector.divideBy(util.vector.add(point, point2), 2);
        normal = util.vector.divideBy(util.vector.add(normal, normal2), 2);
      }

      const correctedPos = util.vector.subtract(point, util.vector.multiplyBy(normal, this.radius));
      // this.pos[0] = this.isFalling ? correctedPos[0] : this.pos[0]; // TODO prevents sliding but still not 100% correct
      this.pos[0] = correctedPos[0];
      this.pos[1] = correctedPos[1];

      if (this.isFalling && Math.abs(util.vector.length(this.velocity) * this.elasticity) > 1.5) {
        // formula: Reflection = velocity − 2 * normal * (dot(velocity, normal))
        // Source: https://math.stackexchange.com/questions/36292/why-does-the-formula-for-calculating-a-reflection-vector-work
        const reflect = util.vector.subtract(this.velocity, util.vector.multiplyBy(normal, 2 * util.vector.dot(this.velocity, normal)));
        this.velocity = util.vector.multiplyBy(reflect, this.elasticity);
        console.log('bounce', this.velocity);
      } else {
        // TODO maybe only reduce velocity based on collision direction
        //  E.g. if colliding straight down to a horizontal line --> velocity[1] = 0 otherwise rotated accordingly
        this.velocity[1] = 0;
        // this.velocity = [0, 0];
      }
    }

    this.isFalling = !collideData.length;
    if (!this.isFalling) {
      this.velocity[0] = this.velocity[0] * this.groundFriction;
    }
  }

  addInput(delta) {
    const brake = this.isFalling ? this.airControl : 1;

    try {
      this.velocity[0] += this.input[0] * this.inputVelocityLength * brake * delta;
      this.velocity[1] += this.input[1] * this.inputVelocityLength * brake * delta;
    } catch (e) {
      console.log('error', this.input);
    }
  }
}
