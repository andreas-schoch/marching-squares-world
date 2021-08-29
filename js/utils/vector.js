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

  floor = (v) => [Math.floor(v[0]), Math.floor(v[1])];
  round = (v) => [Math.round(v[0]), Math.round(v[1])];

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
   * https://www.youtube.com/watch?v=DPfxjQ6sqrc (around 24:00)
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

  lineCircle(lineFrom, lineTo, circle, r) {
    // Collision detection mostly based on: https://www.jeffreythompson.org/collision-detection/line-circle.php
    // TODO move collision helpers to standalone util class

    // get length of the line
    const rel = this.relativeVector(lineFrom, lineTo);
    const len = this.length(rel);

    // get dot product of the line and circle // TODO refactor to use available dot helper method
    const dot = (((circle[0] - lineFrom[0]) * (lineTo[0] - lineFrom[0])) + ((circle[1] - lineFrom[1]) * (lineTo[1] - lineFrom[1]))) / Math.pow(len, 2);

    // find a point on the line which is closest to the circle
    const closestPoint = [
      lineFrom[0] + (dot * (lineTo[0] - lineFrom[0])),
      lineFrom[1] + (dot * (lineTo[1] - lineFrom[1]))
    ];

    // is this point actually on the line segment? if so keep going, but if not, return false
    const onSegment = this.linePoint(lineFrom, lineTo, closestPoint);
    if (!onSegment) return [false]
    else {
      util.canvas.renderCircle(world.ctx, closestPoint, 5, 'red');
      util.canvas.renderLine(world.ctx, closestPoint, circle, 'red', 1);
    }

    const didCollide = this.distance(closestPoint, circle) <= r;

    if (!didCollide) {
      // TODO still problematic. Can keep entity from jumping up and normal doesn't seem right when averaging multiple
      // if (this.pointCircle(lineFrom, circle, r + 1)) {
      //   return [true, lineFrom, this.lookAtDirection(lineFrom, circle)];
      // }
      // if (this.pointCircle(lineTo, circle, r + 1)) {
      //   return [true, lineTo, this.lookAtDirection(lineTo, circle)];
      // }
    }
    return [didCollide, closestPoint, this.lookAtDirection(closestPoint, circle)];
  }

  /**
   * Check collision between a single point in space and the center of a circle
   * @param p point position
   * @param c circle position
   * @param r circle radius
   * @returns {boolean} true if a collision occurred
   */
  pointCircle = (p, c, r) => {
    // get distance between the point and circle's center using the Pythagorean Theorem
    // if the distance is less than the circle's radius, the point is inside!
    return util.vector.distance(p, c) <= r;
  }

  linePoint(lineFrom, lineTo, point) {
    // get distance from the point to the two ends of the line
    const d1 = this.distance(point, lineFrom);
    const d2 = this.distance(point, lineTo);

    // get the length of the line
    const lineLen = this.distance(lineFrom, lineTo);

    // if the two distances are equal to the line's length, the point is on the line!
    // note we use the buffer here to give a range, rather than one value.
    const buffer = 5;    // higher value === less accurate but more forgiving
    return d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer;
  }

}
