const world = new World(15, 70, 30);

noise.seed(Math.random());
world._generateVertices((x, y) => {
  const n1 = (noise.simplex2(x / 8, y / 8) * world.tileDensityMax) * 0.3;
  const n2 = (noise.simplex2(x / 16, y / 16) * world.tileDensityMax) * 0.5;
  const n3 = (noise.simplex2(x / 36, y / 36) * world.tileDensityMax) * 1.25;
  const n = (n1 + n2 + n3) / 3;

  const bias = ((y) / world.numTilesY);
  return Math.round(n + (world.tileDensityMax * bias));
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
  () => {
    entity.input = util.vector.add(entity.input, world.input._mappings['moveLeft'].direction);
    // entity.face = 'left';
  },
  () => entity.input = util.vector.subtract(entity.input, world.input._mappings['moveLeft'].direction)
)

world.input.register('moveRight',
  () => {
    entity.input = util.vector.add(entity.input, world.input._mappings['moveRight'].direction);
    // entity.face = 'right';

  },
  () => entity.input = util.vector.subtract(entity.input, world.input._mappings['moveRight'].direction)
)

world.input.register('q', () => entity.mode = entity.mode === 'dig' ? 'normal' : 'dig');

// world.input.register('moveUp',
//   () => entity.input = util.vector.add(entity.input, world.input._mappings['moveUp'].direction),
//   () => entity.input = util.vector.subtract(entity.input, world.input._mappings['moveUp'].direction)
// )
//
// world.input.register('moveDown',
//   () => entity.input = util.vector.add(entity.input, world.input._mappings['moveDown'].direction),
//   () => entity.input = util.vector.subtract(entity.input, world.input._mappings['moveDown'].direction)
// )

// TODO create projectile class based on Entity which explodes when colliding
// world.input.register('leftMouseButton',
//   () => {
//   const proj = new Entity(world.ctx, [0, 0], entity.pos, [20, -10]);
//   world.entities.push(proj);
//   },
//   () => {
//
//   });

// world.input.register('dig',
//   () => { console.log('dig pressed')},
//   () => this.sculpComponent._lastSculpt = null);

requestAnimationFrame(world.main);

// TODO - Introduce world space and screen space coordinates to be able to pan around the world beyond what the canvas shows at any moment in time
//        As well as zooming to increase or decrease the distance to the "z" axis. Helpful resource: https://www.youtube.com/watch?v=ZQ8qtAizis4

// TODO - move all player code in Entity to Player class

// TODO - Create GameMode/Game class which handles the game state like: turns, scores, players, winning conditions, restart, reset, UI etc

// TODO - Introduce networking support for:
//  - Client-Server: Make it possible to run a headless simulation ona node server where players are connected via websocket
//  - Peer-to-Peer: Via webrtc. One player takes the role of the authority just like a normal server while the others are all clients

// TODO - Once experimental phase is nearing its end, rewrite everything in typescript and make it an npm package (before introducing networking)
//  At this stage also separate all components into standalone npm packages (e.g util.vector, InputComponent marching squares stuff)