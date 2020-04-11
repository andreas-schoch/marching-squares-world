class SculptComponent {
    constructor(world, radiusXY = 2, strength = 1) {
        this.worldRef = world;
        this.radiusXY = radiusXY;
        this.strength = strength;
        this.sleepDistance = 100;
        this._lastSculptPosition = null;
    }

    sculpt = (evt) => {
        let offset = this.worldRef.canvas.getBoundingClientRect(); // offset of canvas to topleft
        let x = evt.clientX - offset.x;
        let y = evt.clientY - offset.y;

        if (this._lastSculptPosition) {
            const changeSinceLast = this._distance([x, y], this._lastSculptPosition);
            console.log('change', changeSinceLast)
        }
        //
        this._lastSculptPosition = [x, y];


        x = Math.round(x / this.worldRef.tileSize);
        y = Math.round(y / this.worldRef.tileSize);

        this.worldRef.hasCached = false;
        for (let offsetY = -this.radiusXY; offsetY <= this.radiusXY; offsetY++) {
            for (let offsetX = -this.radiusXY; offsetX <= this.radiusXY; offsetX++) {
                const currentX = x + offsetX;
                const currentY = y + offsetY;

                if (currentX < 0 || currentY < 0 || currentX > this.worldRef.numTilesX || currentY > this.worldRef.numTilesY) { continue }


                const dist = this._distance([x, y], [currentX, currentY]);
                if (dist > this.radiusXY ) { continue }

                const falloff = Math.max(Math.min((dist / -this.radiusXY) + 1, 1), 0);
                const direction = evt.shiftKey ? -1 : 1;
                const densityChange = this.strength * falloff * direction;

                const currentDensity = this.worldRef.vertices[currentY][currentX];
                this.worldRef.vertices[currentY][currentX] = Math.min(Math.max(0, currentDensity + densityChange), 32);
            }
        }
    };

    _distance = (vector1, vector2) => {
        const relativeVector = [vector1[0] - vector2[0], vector1[1] - vector2[1]];
        return Math.hypot(relativeVector[0], relativeVector[1])
    }

}
