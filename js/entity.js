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
    const x = Math.round((pos[0]) / world.tileSize);
    const y = Math.round((pos[1]) / world.tileSize);
    return [x, y];
  }

  render = () => {
    util.canvas.renderCircle(this.ctx, this.pos, 20, util.vector.length(this.velocity) ? 'yellow' : 'red');

    if (this.isFalling) {
      util.canvas.renderCircle(this.ctx, this.pos, 10, 'blue');
    }

    // const [xLeft, yLeft] = this.getCoordinates(world, util.vector.add(this.pos, [-world.tileSize * 0.5, 0]));
    // util.canvas.renderCircle(this.ctx, [xLeft * world.tileSize, yLeft * world.tileSize], 5, 'green');
    // const [xRight, yRight] = this.getCoordinates(world, util.vector.add(this.pos, [world.tileSize * 0.5, 0]));
    // util.canvas.renderCircle(this.ctx, [xRight * world.tileSize, yRight * world.tileSize], 5, 'green');
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
      // console.log('velocity too small, setting to zero...', velocityLengthExcludeGravity);
      this.velocity = [0, 0];
    }

    this.pos[0] += this.velocity[0];
    this.pos[1] += this.velocity[1];

    this.prevVelocity = this.velocity;

    this.collisionFloor();
    this.addInput();
  }


  collisionFloor() {
    const line1 = [[0, 400], [500, 400]];
    const line2 = [[500, 400], [600, 300]];
    const line3 = [[600, 300], [800, 300]];
    util.canvas.renderLine(world.ctx, line1[0], line1[1], 'green', 1);
    util.canvas.renderLine(world.ctx, line2[0], line2[1], 'salmon', 1);
    util.canvas.renderLine(world.ctx, line3[0], line3[1], 'yellow', 1);
    const [collides, point, normal] = util.vector.lineCircle(line1[0], line1[1], this.pos, 20)
    const [collides2, point2, normal2] = util.vector.lineCircle(line2[0], line2[1], this.pos, 20)
    const [collides3, point3, normal3] = util.vector.lineCircle(line3[0], line3[1], this.pos, 20)

    if (collides && point && normal) {
      this.pos = util.vector.subtract(point, util.vector.multiplyBy(normal, 20));
      if (Math.abs(this.velocity[1] * this.elasticity) > 1.5) {
        console.log('bounce', this.velocity);
        this.velocity[1] = -(this.velocity[1] * this.elasticity);
      } else {
        // this.velocity = [0, 0];
        this.velocity[1] = 0;
      }
    }

    if (collides2 && point2 && normal2) {
      this.pos = util.vector.subtract(point2, util.vector.multiplyBy(normal2, 20));
      if (Math.abs(this.velocity[1] * this.elasticity) > 1.5) {
        console.log('bounce', this.velocity);
        this.velocity[1] = -(this.velocity[1] * this.elasticity);
      } else {
        // this.velocity = [0, 0];
        this.velocity[1] = 0;
      }
    }

    if (collides3 && point3 && normal3) {
      this.pos = util.vector.subtract(point3, util.vector.multiplyBy(normal3, 20));
      if (Math.abs(this.velocity[1] * this.elasticity) > 1.5) {
        console.log('bounce', this.velocity);
        this.velocity[1] = -(this.velocity[1] * this.elasticity);
      } else {
        // this.velocity = [0, 0];
        this.velocity[1] = 0;
      }
    }

    this.isFalling = !collides && !collides2 && !collides3;
    if (!this.isFalling) {
      this.velocity[0] = this.velocity[0] * this.groundFriction;
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
