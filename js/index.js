const world = new World(20, 75, 32);

noise.seed(Math.random());
world._generateVertices((x, y) => {
  const n1 = noise.simplex2(x / 8, y / 8) * world.tileDensityMax / 1.5;
  const n2 = noise.simplex2(x / 16, y / 16) * world.tileDensityMax / 2;
  const n3 = noise.simplex2(x / 36, y / 36) * world.tileDensityMax;
  const n = (n1 + n2 + n3) / 3;
  // const n = noise.simplex2(x / 5, y / 5) * world.tileDensityMax;

  const bias = ((y) / world.numTilesY);
  return Math.round(n + (65 * bias));
});

const btnSave = document.getElementById('btn-save');
const btnLoad = document.getElementById('btn-load');
const btnRender = document.getElementById('btn-render');
const btnDebug = document.getElementById('btn-debug');

btnSave.onclick = (evt) => {
  localStorage.setItem('vertMap', JSON.stringify(world.vertMap));
}

btnLoad.onclick = (evt) => {
  const storedVertMap = JSON.parse(localStorage.getItem('vertMap'));
  if (storedVertMap) {
    world.vertMap = storedVertMap;
    world.renderQueue.push({x: 0, y: 0, numTilesX: world.numTilesX, numTilesY: world.numTilesY, materialIndex: null});
  }
}

btnRender.onclick = evt => {
  world.renderQueue.push({x: 0, y: 0, numTilesX: world.numTilesX, numTilesY: world.numTilesY, materialIndex: null});
}

btnDebug.onclick = evt => {
  world.debug = !world.debug;
  world.renderQueue.push({x: 0, y: 0, numTilesX: world.numTilesX, numTilesY: world.numTilesY, materialIndex: null});
}

const entity = new Entity(world.ctx, [0, 0], [((world.numTilesX / 2) * world.tileSize) - 20, 150], [0, 0]);
world.entities.push(entity);

// TODO figure out why adding a second entity influences air control of first one
// const entity2 = new Entity(world.ctx, [0, 0], [1000, 150], [-12, -7]);
// world.entities.push(entity2);

world.input.register('moveLeft',
  () => entity.input = util.vector.add(entity.input, world.input._mappings['moveLeft'].direction),
  () => entity.input = util.vector.subtract(entity.input, world.input._mappings['moveLeft'].direction)
)

world.input.register('moveRight',
  () => entity.input = util.vector.add(entity.input, world.input._mappings['moveRight'].direction),
  () => entity.input = util.vector.subtract(entity.input, world.input._mappings['moveRight'].direction)
)

world.input.register('moveUp',
  () => entity.input = util.vector.add(entity.input, world.input._mappings['moveUp'].direction),
  () => entity.input = util.vector.subtract(entity.input, world.input._mappings['moveUp'].direction)
)

world.input.register('moveDown',
  () => entity.input = util.vector.add(entity.input, world.input._mappings['moveDown'].direction),
  () => entity.input = util.vector.subtract(entity.input, world.input._mappings['moveDown'].direction)
)

requestAnimationFrame(world.main);

// TODO - Introduce world space and screen space coordinates to be able to pan around the world beyond what the canvas shows at any moment in time
//        As well as zooming to increase or decrease the distance to the "z" axis. Helpful resource: https://www.youtube.com/watch?v=ZQ8qtAizis4
