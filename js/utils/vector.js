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
        // const rel = this.relativeVector(v1, v2);
        const rel = [v1[0] - v2[0], v1[1] - v2[1]];

        return Math.hypot(rel[0], rel[1]); // new ES6 way
        // return Math.sqrt(Math.pow(rel[0], 2) + Math.pow(rel[1], 2)); old ES5 way
    };

    normalize = (vector) => {
        const magnitude = Math.hypot(vector[0], vector[1]);
        // const magnitude = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);  // alternative
        return [vector[0] / magnitude, vector[0] / magnitude];
    };

    dot = (v1, v2) => v1[0] * v2[0] + v1[1] * v2[1];

    equals = (v1, v2) => v1[0] === v2[0] && v1[1] === v2[1];

    lookAtDirection = (from, to) => this.normalize(this.relativeVector(from, to));
}
