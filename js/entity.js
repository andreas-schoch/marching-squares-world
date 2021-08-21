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
    this.elasticity = 0.1;
    this.gravityVector = [0, 0.8];
    this.airDrag = 0.97;
    this.groundFriction = 0.9;
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

    const [xLeft, yLeft] = this.getCoordinates(world, util.vector.add(this.pos, [-world.tileSize * 0.5, 0]));
    util.canvas.renderCircle(this.ctx, [xLeft * world.tileSize, yLeft * world.tileSize], 5, 'green');
    const [xRight, yRight] = this.getCoordinates(world, util.vector.add(this.pos, [world.tileSize * 0.5, 0]));
    util.canvas.renderCircle(this.ctx, [xRight * world.tileSize, yRight * world.tileSize], 5, 'green');
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

    // console.log('prev vel len', prevVelocityLengthExcludeGravity)
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
    const [x, y] = this.getCoordinates(world, this.pos);
    const edges = world._getTileEdges(x, y, 0);
    let tileIndex = -1;

    if (edges) {
      tileIndex = world.TileManager._getTileLookupIndex(edges, world.tileDensityThreshold);
      console.log('tile index at player coords', tileIndex);

    } else {
      console.log('edges invalid', edges);
    }


    // if (this.pos[1] >= 480) {
    //   this.pos[1] = 480;
    if (edges && tileIndex !== 0 && this.pos[1] >= (y * world.tileSize)) {
      this.pos[1] = (y * world.tileSize);

      this.isFalling = false;

      if (Math.abs(this.velocity[1] * this.elasticity) > 1.5) {
        console.log('bounce', this.velocity);
        this.velocity[1] = -(this.velocity[1] * this.elasticity);
      } else {
        this.velocity[1] = 0;
      }
    } else {
      this.isFalling = true;
    }

    if (!this.isFalling) {
      this.velocity[0] = this.velocity[0] * this.groundFriction;
    }
  }

  //   // right collision point
  //   var offset = new Vector(this.size.x / 2 - 2, this.size.y / 2 + grid / 2); // offset for player size and a bit extra
  //   var coords = this.getCoordinates(offset);
  //   drawCircle(this.pos.x + offset.x, this.pos.y + offset.y, 1, 'green', ctxPlayer);
  //   var type = terrain.getTile(coords);
  //
  //   // left collision point
  //   var offset2 = new Vector(-(this.size.x / 2) + 2, this.size.y / 2 + grid / 2); // offset for player size and a bit extra
  //   var coords2 = this.getCoordinates(offset2);
  //   drawCircle(this.pos.x + offset2.x, this.pos.y + offset2.y, 1, 'green', ctxPlayer);
  //   var type2 = terrain.getTile(coords2);
  //
  //   // hit floor
  //   if ((this.pos.y + this.size.y / 2 >= coords.y * grid && type === 1) || (this.pos.y + this.size.y / 2 >= coords2.y * grid && type2 === 1)) {
  //     this.pos.y = coords2.y * grid - this.size.y / 2;
  //     this.velocity.y = -(this.velocity.y * this.elasticity);
  //
  //     // debug stuff
  //     if (type == 1) {
  //       drawRect(coords.x * grid, coords.y * grid, grid, 3, 'green', ctxTerrain);
  //     }
  //     if (type2 == 1) {
  //       drawRect(coords2.x * grid, coords2.y * grid, grid, 3, 'purple', ctxTerrain);
  //     }
  //
  //     // on ground
  //     this.velocity.x *= groundFriction;
  //     this.isFalling = false;
  //   } else {
  //     this.isFalling = true;
  //   }
  // }
  //
  // collisionRoof() {
  //   // right collision point
  //   var offset = new Vector(this.size.x / 2 - 2, -(this.size.y / 2 + grid / 2)); // offset for player size and a bit extra
  //   var coords = this.getCoordinates(offset);
  //   drawCircle(this.pos.x + offset.x, this.pos.y + offset.y, 1, 'green', ctxPlayer);
  //   var type = terrain.getTile(coords);
  //
  //   // left collision point
  //   var offset2 = new Vector(-(this.size.x / 2) + 2, -(this.size.y / 2 + grid / 2)); // offset for player size and a bit extra
  //   var coords2 = this.getCoordinates(offset2);
  //   drawCircle(this.pos.x + offset2.x, this.pos.y + offset2.y, 1, 'green', ctxPlayer);
  //   var type2 = terrain.getTile(coords2);
  //
  //   // hit roof
  //   if ((this.pos.y - this.size.y / 2 >= coords.y * grid && type === 1) || (this.pos.y - this.size.y / 2 >= coords2.y * grid && type2 === 1)) {
  //     console.log('roof');
  //     this.pos.y = coords.y * grid + this.size.y + grid / 2;
  //     this.velocity.y = -(this.velocity.y * this.elasticity);
  //   }
  // }
  //
  // collisionRight() {
  //   var offset = new Vector(this.size.x / 2, 0); // offset for player size
  //   var coords = this.getCoordinates(offset);
  //
  //   var type = terrain.getTile(coords);
  //   if (type === 1 && this.pos.x + offset.x >= coords.x * grid) {
  //     this.pos.x = Math.min(coords.x * grid - offset.x, this.pos.x);
  //     this.velocity.x = 0;
  //     //this.velocity.x = -(this.velocity.x * 0.01);
  //     drawRect(coords.x * grid, coords.y * grid, 4, grid, 'red', ctxTerrain);
  //   }
  // }
  //
  // collisionLeft() {
  //   var offset = new Vector(-20, 0); // offset for player size
  //   var coords = this.getCoordinates(offset);
  //
  //   var type = terrain.getTile(coords);
  //   if (type === 1 && this.pos.x - 30 <= coords.x * grid) {
  //     this.pos.x = Math.max(coords.x * grid + 30, this.pos.x);
  //     this.velocity.x = 0;
  //     //this.velocity.x = -(this.velocity.x * 0.01);
  //     drawRect(coords.x * grid + 20 - 4, coords.y * grid, 4, grid, 'red', ctxTerrain);
  //   }
  // }

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

  //
  // fire() {
  //   var pos = this.pos.copy();
  //   var str = Math.random() * 3 + 10;
  //   var velocity = new Vector(str, -5);
  //   projectileManager.addProjectile(pos, velocity);
  // }
}
