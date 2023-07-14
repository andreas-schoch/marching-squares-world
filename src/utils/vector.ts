// https://evanw.github.io/lightgl.js/docs/vector.html

export type Vector2 = [number, number];
export type Vector3 = [number, number, number];

export class VectorUtils {
  static add = (v1: Vector2, v2: Vector2): Vector2 => [v1[0] + v2[0], v1[1] + v2[1]];
  static subtract = (v1: Vector2, v2: Vector2): Vector2 => [v1[0] - v2[0], v1[1] - v2[1]];
  static multiply = (v1: Vector2, v2: Vector2): Vector2 => [v1[0] * v2[0], v1[1] * v2[1]];
  static divide = (v1: Vector2, v2: Vector2): Vector2 => [v1[0] / v2[0], v1[1] / v2[1]];
  static multiplyBy = (vector: Vector2, multiplier: number): Vector2 => [vector[0] * multiplier, vector[1] * multiplier];
  static divideBy = (v1: Vector2, divisor: number): Vector2 => [v1[0] / divisor, v1[1] / divisor];
  static addAll = (...vectors: Vector2[]): Vector2 => vectors.reduce((acc, v): Vector2 => VectorUtils.add(acc, v), [0, 0]);
  static multiplyAll = (...vectors: Vector2[]): Vector2 => vectors.reduce((acc, v): Vector2 => [acc[0] * v[0], acc[1] * v[1]], [1, 1]);
  static relativeVector = (v1: Vector2, v2: Vector2): Vector2 => [v1[0] - v2[0], v1[1] - v2[1]];
  static negate = (vector: Vector2): Vector2 => [-vector[0], -vector[1]];
  static interp = (v1: Vector2, v2: Vector2, frac: number): Vector2 => [v1[0] + (v2[0] - v1[0]) * frac, v1[1] + (v2[1] - v1[1]) * frac];
  static floor = (v: Vector2): Vector2 => [Math.floor(v[0]), Math.floor(v[1])];
  static round = (v: Vector2): Vector2 => [Math.round(v[0]), Math.round(v[1])];

  static distance = (v1: Vector2, v2: Vector2): number => {
    const rel = VectorUtils.relativeVector(v1, v2);
    return Math.hypot(rel[0], rel[1]); // new ES6 way
    // return Math.sqrt(Math.pow(rel[0], 2) + Math.pow(rel[1], 2)); old ES5 way
  };

  static normalize = (vector: Vector2): Vector2 => {
    const magnitude = Math.hypot(vector[0], vector[1]);
    // const magnitude = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);  // alternative
    if (!magnitude) return vector;
    return [vector[0] / magnitude, vector[1] / magnitude];
  };

  static rotate = (vec: Vector2, ang: number): Vector2 => {
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
  static dot = (v1: Vector2, v2: Vector2): number => v1[0] * v2[0] + v1[1] * v2[1];

  static cross = (v1: Vector3, v2: Vector3): Vector3 => {
    // Not meant for 2d vectors but maybe useful
    v1[2] = 0;
    v2[2] = 0;

    return [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0]
    ];
  }

  static equals = (v1: Vector2, v2: Vector2): boolean => v1[0] === v2[0] && v1[1] === v2[1];

  static len = (vector: Vector2): number => Math.sqrt(VectorUtils.dot(vector, vector));

  static min = (v1: Vector2, v2: Vector2): Vector2 => {
    const x = Math.min(v1[0], v2[0]);
    const y = Math.min(v1[1], v2[1]);
    return [x, y];
  };

  static max = (v1: Vector2, v2: Vector2): Vector2 => {
    const x = Math.max(v1[0], v1[0]);
    const y = Math.max(v1[1], v2[1]);
    return [x, y];
  };

  static lookAtDirection = (from: Vector2, to: Vector2): Vector2 => VectorUtils.normalize(VectorUtils.relativeVector(from, to));

  static perpendicular = (v: Vector2): Vector2 => [v[0], -v[1]];

  static reflection = (velocity: Vector2, normal: Vector2): Vector2 => {
    // formula: Reflection = velocity − 2 * normal * (dot(velocity, normal))
    // Source: https://math.stackexchange.com/questions/36292/why-does-the-formula-for-calculating-a-reflection-vector-work
    return VectorUtils.subtract(velocity, VectorUtils.multiplyBy(normal, 2 * VectorUtils.dot(velocity, normal)));
  }

  static project = (point: Vector2, from: Vector2, to: Vector2): Vector2 => {
    const line = VectorUtils.subtract(to, from);
    const pointLine = VectorUtils.subtract(point, from);
    const dot = VectorUtils.dot(pointLine, line);
    const lengthSq = VectorUtils.dot(line, line);
    const t = dot / lengthSq;
    const projected = VectorUtils.add(from, VectorUtils.multiplyBy(line, t));
    return projected;
  };

  static lineCircle(lineFrom: Vector2, lineTo: Vector2, circle: Vector2, r: number): [boolean, Vector2, Vector2] {
    // Collision detection mostly based on: https://www.jeffreythompson.org/collision-detection/line-circle.php
    // TODO move collision helpers to standalone util class

    // get length of the line
    const rel = VectorUtils.relativeVector(lineFrom, lineTo);
    const len = VectorUtils.len(rel);

    // get dot product of the line and circle // TODO refactor to use available dot helper method
    const dot = (((circle[0] - lineFrom[0]) * (lineTo[0] - lineFrom[0])) + ((circle[1] - lineFrom[1]) * (lineTo[1] - lineFrom[1]))) / Math.pow(len, 2);

    // find a point on the line which is closest to the circle
    const closestPoint: Vector2 = [
      lineFrom[0] + (dot * (lineTo[0] - lineFrom[0])),
      lineFrom[1] + (dot * (lineTo[1] - lineFrom[1]))
    ];

    // is this point actually on the line segment? if so keep going, but if not, return false
    const onSegment = VectorUtils.linePoint(lineFrom, lineTo, closestPoint);
    // if (onSegment) {
    //   util.canvas.renderCircle(world.ctx, closestPoint, 5, 'red');
    //   util.canvas.renderLine(world.ctx, closestPoint, circle, 'red', 1);
    // }

    const didCollide = VectorUtils.distance(closestPoint, circle) <= r && onSegment;

    if (!didCollide) {
      // TODO still problematic. Can keep entity from jumping up and normal doesn't seem right when averaging multiple
      if (VectorUtils.pointCircle(lineFrom, circle, r)) {
        return [true, lineFrom, VectorUtils.lookAtDirection(lineFrom, circle)];
      }
      if (VectorUtils.pointCircle(lineTo, circle, r)) {
        return [true, lineTo, VectorUtils.lookAtDirection(lineTo, circle)];
      }
    }
    return [didCollide, closestPoint, VectorUtils.lookAtDirection(closestPoint, circle)];
  }

  /**
   * Check collision between a single point in space and the center of a circle
   * @param p point position
   * @param c circle position
   * @param r circle radius
   * @returns {boolean} true if a collision occurred
   */
  static pointCircle = (p: Vector2, c: Vector2, r: number): boolean => {
    // get distance between the point and circle's center using the Pythagorean Theorem
    // if the distance is less than the circle's radius, the point is inside!
    return VectorUtils.distance(p, c) <= r;
  }

  static linePoint(lineFrom: Vector2, lineTo: Vector2, point: Vector2) {
    // get distance from the point to the two ends of the line
    const d1 = VectorUtils.distance(point, lineFrom);
    const d2 = VectorUtils.distance(point, lineTo);

    // get the length of the line
    const lineLen = VectorUtils.distance(lineFrom, lineTo);

    // if the two distances are equal to the line's length, the point is on the line!
    // note we use the buffer here to give a range, rather than one value.
    const buffer = 5;    // higher value === less accurate but more forgiving
    return d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer;
  }
}
