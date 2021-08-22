// const world = new World(20, 70, 32); // no issue
const world = new World(100, 10, 5);

noise.seed(Math.random() * 100000);
world._generateVertices((x, y) => {
  const n1 = noise.simplex2(x / 15, y / 15) * world.tileDensityMax / 6;
  const n2 = noise.simplex2(x / 30, y / 30) * world.tileDensityMax / 3;
  const n3 = noise.simplex2(x / 60, y / 60) * world.tileDensityMax;
  const n = n1 + n2 + n3 / 3;

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

const entity = new Entity(world.ctx, [0, 0], [0, 80], [25, -5]);
entity.render();

const input = new InputComponent();
input.initListeners(document);

window.requestAnimationFrame(function test() {
  world.ctx.clearRect(0, 0, world.canvas.width, world.canvas.height);
  // world.main();

  if (input._mappings['jump'].active) {
    // if (!entity.isFalling) {
      entity.velocity = util.vector.add(entity.velocity, [0, -1.6])
    // }
  }

  entity.update();
  entity.render();
  window.requestAnimationFrame(test);
});

input.register('moveLeft',
  () => entity.input = util.vector.add(entity.input, input._mappings['moveLeft'].direction),
  () => entity.input = util.vector.subtract(entity.input, input._mappings['moveLeft'].direction)
)

input.register('moveRight',
  () => entity.input = util.vector.add(entity.input, input._mappings['moveRight'].direction),
  () => entity.input = util.vector.subtract(entity.input, input._mappings['moveRight'].direction)
)
