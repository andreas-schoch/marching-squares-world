class Entity {

  constructor(ctx, input, pos, initialVelocity = [0, 0]) {
    this.ctx = ctx;
    this.input = input;
    this.prevVelocity = [0, 0];

    this.pos = pos;
    this.velocity = initialVelocity;
    this.maxVelocityLength = 35;
    this.size = [50, 50];
    this.isFalling = true;
    this.airControl = 0.3;
    this.elasticity = 0.05;
    this.gravityVector = [0, 0.8];
    this.airDrag = 0.97;
    this.groundFriction = 0.92;
  }

  getCoordinates(world, pos) {
    const x = Math.floor((pos[0]) / world.tileSize);
    const y = Math.floor((pos[1]) / world.tileSize);
    return [x, y];
  }

  render = () => {
    util.canvas.renderCircle(this.ctx, this.pos, 20, util.vector.length(this.velocity) ? 'yellow' : 'red');

    if (this.isFalling) {
      util.canvas.renderCircle(this.ctx, this.pos, 10, 'blue');
    }

    const [x, y] = this.getCoordinates(world, this.pos);
    util.canvas.renderCircle(this.ctx, [x * world.tileSize + world.tileSize/2, y * world.tileSize + world.tileSize/2], 5, 'green');
  }

  update = () => {
    this.velocity[0] *= this.airDrag;
    this.velocity[1] *= this.airDrag;
    this.velocity[0] += this.gravityVector[0];
    this.velocity[1] += this.gravityVector[1];

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

    this.collision();
    this.addInput();
  }


  collision() {
    const [x, y] = this.getCoordinates(world, this.pos);
    const edges = world._getTileEdges(x, y, 0);
    let tileIndex = -1;
    let tileIsoLines = [];

    if (edges) {
      tileIndex = world.TileManager._getTileLookupIndex(edges, world.tileDensityThreshold);

      if (tileIndex !== 0) {
        const pathData = world.TileManager._lookupTilePathData(edges, world.tileDensityThreshold);
        let didCollide = false;
        tileIsoLines = pathData.reduce((acc, cur, i, arr) => {
          if (cur && cur[2] === 'iso-start') acc.push([cur, arr[i + 1]]);
          return acc;
        }, []);


        tileIsoLines.forEach(line => {
          const [from, to] = line;
          const fromActual = util.vector.add(util.vector.multiplyBy([x, y], world.tileSize), util.vector.multiplyBy(from, world.tileSize));
          const toActual = util.vector.add(util.vector.multiplyBy([x, y], world.tileSize), util.vector.multiplyBy(to, world.tileSize));

          const [collides, point, normal] = util.vector.lineCircle(fromActual, toActual, this.pos, 20);
            util.canvas.renderLine(world.ctx, fromActual, toActual, collides && point && normal ? 'red' : 'green', 5);
          if (collides && point && normal) {
            didCollide = true;

            // util.canvas.renderLine(world.ctx, fromActual, toActual, 'red', 5);

            this.pos = util.vector.subtract(point, util.vector.multiplyBy(normal, 20));

            if (Math.abs(this.velocity[1] * this.elasticity) > 1.5) {
              console.log('bounce', this.velocity);
              this.velocity[1] = -(this.velocity[1] * this.elasticity);
            } else {
              this.velocity[1] = 0;
            }

            util.canvas.renderCircle(world.ctx, point, 6, 'green')
          }
        });

        this.isFalling = !didCollide;
        if (!this.isFalling) {
          this.velocity[0] = this.velocity[0] * this.groundFriction;
        }
      }
    }

  }

  addInput() {
    const brake = this.isFalling ? this.airControl : 0.75;

    try {
      this.velocity[0] += this.input[0] * brake;
      this.velocity[1] += this.input[1] * brake;
    } catch (e) {
      console.log('error', this.input);
    }
    //this.velocity.y += this.input.y * brake;


  }
}
