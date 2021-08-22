// https://evanw.github.io/lightgl.js/docs/vector.html

class VectorUtils {
  add = (v1, v2) => [v1[0] + v2[0], v1[1] + v2[1]];

  subtract = (v1, v2) => [v1[0] - v2[0], v1[1] - v2[1]];

  multiply = (v1, v2) => [v1[0] * v2[0], v1[1] * v2[1]];

  divide = (v1, v2) => [v1[0] / v2[0], v1[1] / v2[1]];

  multiplyBy = (vector, multiplier) => [vector[0] * multiplier, vector[1] * multiplier];

  divideBy = (v1, divisor) => [v1[0] / divisor, v1[1] / divisor];

  addAll = (...vectors) => vectors.reduce((acc, v) => [acc[0] + v[0], acc[1] + v[1]], [1, 1]);

  multiplyAll = (...vectors) => vectors.reduce((acc, v) => [acc[0] * v[0], acc[1] * v[1]], [1, 1]);

  relativeVector = (v1, v2) => [v1[0] - v2[0], v1[1] - v2[1]];

  negate = (vector) => [-vector[0], -vector[1]];

  distance = (v1, v2) => {
    const rel = this.relativeVector(v1, v2);

    return Math.hypot(rel[0], rel[1]); // new ES6 way
    // return Math.sqrt(Math.pow(rel[0], 2) + Math.pow(rel[1], 2)); old ES5 way
  };

  normalize = (vector) => {
    const magnitude = Math.hypot(vector[0], vector[1]);
    // const magnitude = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);  // alternative
    return [vector[0] / magnitude, vector[1] / magnitude];
  };

  rotate = (vec, ang) => {
    ang = -ang * (Math.PI / 180); // degrees to radians
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);

    return [
      Math.round(10000 * (vec[0] * cos - vec[1] * sin)) / 10000,
      Math.round(10000 * (vec[0] * sin + vec[1] * cos)) / 10000
    ];
  };

  /**
   * used to find the angle between two vectors in any dimensional space
   * The dot product is a measure of how parallel two vectors are, scaled by their lengths
   * https://betterexplained.com/articles/vector-calculus-understanding-the-dot-product/
   */
  dot = (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1];

  // Not meant for 2d vectors but maybe useful
  // cross = (v1, v2) => {
  //   v1[2] = 0;
  //   v2[2] = 0;
  //
  //   return [
  //     v1[1] * v2[2] - v1[2] * v2[1],
  //     v1[2] * v2[0] - v1[0] * v2[2],
  //     v1[0] * v2[1] - v1[1] * v2[0]
  //   ];
  // }

  equals = (v1, v2) => v1[0] === v2[0] && v1[1] === v2[1];

  length = (vector) => Math.sqrt(this.dot(vector, vector));

  min = (v1, v2) => {
    const x = Math.min(v1[0], v2[0]);
    const y = Math.min(v1[1], v2[1]);
    return [x, y];
  };

  max = (v1, v2) => {
    const x = Math.max(v1[0], v1[0]);
    const y = Math.max(v1[1], v2[1]);
    return [x, y];
  };

  lookAtDirection = (from, to) => this.normalize(this.relativeVector(from, to));

  // Collision detection copied from here for now: https://www.jeffreythompson.org/collision-detection/line-circle.php
  // Will eventually switch to "Separating Axis Theorem" based approach if this naive approach does not work out
  lineCircle([fromX, fromY], [toX, toY], [cx, cy], r) {

    // is either end INSIDE the circle? if so, return true immediately
    const inside1 = this.pointCircle([fromX, fromY], [cx, cy], r);
    if (inside1) return [true, [cx, fromY]];

    const inside2 = this.pointCircle([toX, toY], [cx, cy], r);
    if (inside2) return [true, [cx, toY]];

    // get length of the line
    const rel = this.relativeVector([fromX, fromY], [toX, toY]);
    const len = this.length(rel);

    // get dot product of the line and circle
    const dot = (((cx - fromX) * (toX - fromX)) + ((cy - fromY) * (toY - fromY))) / Math.pow(len, 2);
    // const dot2 = this.dot([cx - fromX, cy - fromY], [toX - fromX, toY - fromY]) / Math.pow(len, 2);

    // find the closest point on the line
    const closestX = fromX + (dot * (toX - fromX));
    const closestY = fromY + (dot * (toY - fromY));

    // is this point actually on the line segment?
    // if so keep going, but if not, return false
    const onSegment = this.linePoint([fromX, fromY], [toX, toY], [closestX, closestY]);
    if (!onSegment) return [false];

    // // optionally, draw a circle at the closest
    util.canvas.renderCircle(world.ctx, [closestX, closestY], 5, 'red');
    util.canvas.renderLine(world.ctx, [closestX, closestY], [cx, cy], 'red', 1);
    // console.log('cross', this.cross([cx, cy], [closestX, closestY]));
    // ellipse(closestX, closestY, 20, 20);

    // get distance to closest point
    const [distX, distY] = this.relativeVector([closestX, closestY], [cx, cy]);
    const distance = Math.sqrt((distX * distX) + (distY * distY));

    return [distance <= r, [closestX, closestY]];

  }

  pointCircle = ([px, py], [cx, cy], r) => {
    // get distance between the point and circle's center using the Pythagorean Theorem
    const distX = px - cx;
    const distY = py - cy;
    const distance = Math.sqrt((distX * distX) + (distY * distY));

    // if the distance is less than the circle's radius, the point is inside!
    return distance <= r;
  }

  linePoint([fromX, fromY], [toX, toY], [px, py]) {
    // get distance from the point to the two ends of the line
    const d1 = this.distance([px, py], [fromX, fromY]);
    const d2 = this.distance([px, py], [toX, toY]);

    // get the length of the line
    const lineLen = this.distance([fromX, fromY], [toX, toY]);

    // since floats are so minutely accurate, add a little buffer zone that will give collision
    const buffer = 0.1;    // higher # = less accurate

    // if the two distances are equal to the line's length, the point is on the line!
    // note we use the buffer here to give a range, rather than one #
    return d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer;
  }

}
