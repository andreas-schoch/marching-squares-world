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
  lineCircle(x1, y1, x2, y2, cx, cy, r) {

    // is either end INSIDE the circle?
    // if so, return true immediately
    const inside1 = this.pointCircle(x1, y1, cx, cy, r);
    const inside2 = this.pointCircle(x2, y2, cx, cy, r);
    if (inside1 || inside2) return true;

    // get length of the line
    let distX = x1 - x2;
    let distY = y1 - y2;
    const len = Math.sqrt((distX * distX) + (distY * distY));

    // get dot product of the line and circle
    const dot = (((cx - x1) * (x2 - x1)) + ((cy - y1) * (y2 - y1))) / Math.pow(len, 2);

    // find the closest point on the line
    const closestX = x1 + (dot * (x2 - x1));
    const closestY = y1 + (dot * (y2 - y1));

    // is this point actually on the line segment?
    // if so keep going, but if not, return false
    const onSegment = this.linePoint(x1, y1, x2, y2, closestX, closestY);
    if (!onSegment) return false;

    // // optionally, draw a circle at the closest
    // // point on the line
    // fill(255, 0, 0);
    // noStroke();
    // ellipse(closestX, closestY, 20, 20);

    // get distance to closest point
    distX = closestX - cx;
    distY = closestY - cy;
    const distance = Math.sqrt((distX * distX) + (distY * distY));

    return distance <= r;

  }

  pointCircle = (px, py, cx, cy, r) => {
    // get distance between the point and circle's center
    // using the Pythagorean Theorem
    const distX = px - cx;
    const distY = py - cy;
    const distance = Math.sqrt((distX * distX) + (distY * distY));

    // if the distance is less than the circle's
    // radius the point is inside!
    return distance <= r;
  }

  linePoint(x1, y1, x2, y2, px, py) {

    // get distance from the point to the two ends of the line
    const d1 = this.distance([px, py], [x1, y1]);
    const d2 = this.distance([px, py], [x2, y2]);

    // get the length of the line
    const lineLen = this.distance([x1, y1], [x2, y2]);

    // since floats are so minutely accurate, add
    // a little buffer zone that will give collision
    const buffer = 0.1;    // higher # = less accurate

    // if the two distances are equal to the line's
    // length, the point is on the line!
    // note we use the buffer here to give a range,
    // rather than one #
    return d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer;
  }

}
