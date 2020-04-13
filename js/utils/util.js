const util = {
    // relativeVector: function(a, b) {
    //     return [
    //         a.x - b.x,
    //         a.y - b.y
    //     ];
    // },
    // normalize: function(vector) {
    //     const norm = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    //     return [
    //         vector[0] / norm,
    //         vector[1] / norm
    //     ];
    // },
    // areColliding(a, b) {
    //     return a.x+a.w/2 > b.x-b.w/2
    //         && a.x-a.w/2 < b.x+b.w/2
    //         && a.y+a.h/2 > b.y-b.h/2
    //         && a.y-a.h/2 < b.y+b.h/2;
    // },
    canvas: new CanvasUtils(),
    debug: new DebugUtils(),
    vector: new VectorUtils()
};
