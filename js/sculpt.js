class SculptComponent {
    constructor(world, radiusXY = 2, strength = 1) {
        this.worldRef = world;
        this.radiusXY = radiusXY;
        this.strength = strength;
        this.sleepDistance = 0;
        this._lastSculptPosition = null;
        this.activeMaterialIndex = 0;
    }

    sculpt = (evt) => {
        if (!evt) return;
        let offset = this.worldRef.canvas.getBoundingClientRect(); // offset of canvas to topleft
        let x = evt.clientX - offset.x;
        let y = evt.clientY - offset.y;

        if (this._lastSculptPosition) {
            const changeSinceLast = util.vector.distance([x, y], this._lastSculptPosition);
            if (changeSinceLast < this.sleepDistance) return;
        }

        this._lastSculptPosition = [x, y];

        x = Math.round(x / this.worldRef.tileSize);
        y = Math.round(y / this.worldRef.tileSize);

        const startX = Math.min(Math.max(x - this.radiusXY, 0), this.worldRef.numTilesX);
        const startY = Math.min(Math.max(y - this.radiusXY, 0), this.worldRef.numTilesY);
        const numTilesX = Math.min(this.radiusXY * 2, this.worldRef.numTilesX - 2);
        const numTilesY = Math.min(this.radiusXY * 2, this.worldRef.numTilesY - 2);
        this.worldRef.renderQueue.push(
            {x: startX, y: startY, numTilesX: numTilesX, numTilesY: numTilesY, materialIndex: null},
        );

        for (let offsetY = -this.radiusXY; offsetY <= this.radiusXY; offsetY++) {
            for (let offsetX = -this.radiusXY; offsetX <= this.radiusXY; offsetX++) {
                const currentX = x + offsetX;
                const currentY = y + offsetY;

                const dist = util.vector.distance([x, y], [currentX, currentY]);
                if (dist > this.radiusXY || currentX < 0 || currentY < 0 || currentX > this.worldRef.numTilesX || currentY > this.worldRef.numTilesY) { continue }

                const falloff = Math.max(Math.min((dist / -(this.radiusXY)) + 1, 1), 0);
                const direction = evt.shiftKey ? -1 : 1;
                const densityChange = this.strength * falloff * direction;

                // const currentMaterialIndex = this.worldRef.verticesMaterial[currentY][currentX];
                const currentDensity = this.worldRef.vertMap[this.activeMaterialIndex][currentY][currentX];
                const currentDensityOther = this.worldRef.vertMap[this.activeMaterialIndex === 0 ? 1 : 0][currentY][currentX];

                if (currentDensityOther + currentDensity >= this.worldRef.tileDensityMax + 5 && !evt.shiftKey) {
                    const newDensityRaw = Math.min(Math.max(0, currentDensityOther - densityChange), this.worldRef.tileDensityMax);
                    this.worldRef.vertMap[this.activeMaterialIndex === 0 ? 1 : 0][currentY][currentX] = newDensityRaw;
                }

                const newDensityRaw = Math.min(Math.max(0, currentDensity + densityChange), this.worldRef.tileDensityMax);
                this.worldRef.vertMap[this.activeMaterialIndex][currentY][currentX] = newDensityRaw;



                // if (currentMaterialIndex === this.activeMaterialIndex || currentDensity === 0) {
                //     const newDensityRaw = Math.min(Math.max(0, currentDensity + densityChange), this.worldRef.tileDensityMax);
                //     this.worldRef.vertices[currentY][currentX] = Math.round(newDensityRaw);
                //     this.worldRef.verticesMaterial[currentY][currentX] = this.activeMaterialIndex;
                // } else {
                //     const newDensityRaw = Math.min(Math.max(0, currentDensity + (densityChange * -1)), this.worldRef.tileDensityMax);
                //     this.worldRef.vertices[currentY][currentX] = Math.round(newDensityRaw);
                // }

                // if (newDensityRaw < this.worldRef.tileDensityThreshold) {
                //     this.worldRef.verticesMaterial[currentY][currentX] = 1;
                // }
            }
        }
    };
}


