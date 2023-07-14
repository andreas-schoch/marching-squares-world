import { Entity } from "./entity";
import { VectorUtils } from "./utils/vector";
import { World } from "./world";
import { createNoise2D } from 'simplex-noise';

const world = new World(15, 90, 48);

const noise = createNoise2D(Math.random);
world._generateVertices((x, y) => {
  const n1 = (noise(x / 8, y / 8) * world.tileDensityMax) * 0.3;
  const n2 = (noise(x / 16, y / 16) * world.tileDensityMax) * 0.5;
  const n3 = (noise(x / 36, y / 36) * world.tileDensityMax) * 1.25;
  const n = (n1 + n2 + n3) / 3;

  const bias = ((y) / world.numTilesY);
  return Math.max(Math.round(n + (world.tileDensityMax * bias)), 0);
});

document.getElementById('btn-save')!.onclick = (evt) => localStorage.setItem('vertMap', JSON.stringify(world.vertMap));
document.getElementById('btn-load')!.onclick = (evt) => {
  const storedVertMap: World['vertMap'] | null = JSON.parse(localStorage.getItem('vertMap') || 'null');
  if (storedVertMap) {
    world.vertMap = storedVertMap;
    world.vertices = storedVertMap[0];
    world.verticesWater = storedVertMap[1];
    world.renderQueue.push({startX: 0, startY: 0, numTilesX: world.numTilesX, numTilesY: world.numTilesY, terrain: true, water: true});
  }
}

document.getElementById('btn-render')!.onclick = evt => {
  world.renderQueue.push({startX: 0, startY: 0, numTilesX: world.numTilesX, numTilesY: world.numTilesY, terrain: true, water: true});
}

document.getElementById('btn-debug')!.onclick = evt => {
  world.debug = !world.debug;
  world.renderQueue.push({startX: 0, startY: 0, numTilesX: world.numTilesX, numTilesY: world.numTilesY, terrain: true, water: true});
}

const entity = new Entity(world, [0, 0], [world.tileSize * (world.numTilesX / 4), 0], [0, 0]);
const entity2 = new Entity(world, [0, 0], [world.numTilesX * world.tileSize - (world.tileSize * (world.numTilesX / 5)), 0], [0, 0]);
world.entities.push(entity);
world.entities.push(entity2);

// TODO figure out why adding a second entity influences air control of first one
// const entity2 = new Entity(world.ctx, [0, 0], [1000, 150], [-12, -7]);
// world.entities.push(entity2);

world.input.register('moveLeft',
  () => entity.input = VectorUtils.add(entity.input, world.input._mappings['moveLeft'].direction!),
  () => entity.input = VectorUtils.subtract(entity.input, world.input._mappings['moveLeft'].direction!)
)

world.input.register('moveRight',
  () => entity.input = VectorUtils.add(entity.input, world.input._mappings['moveRight'].direction!),
  () => entity.input = VectorUtils.subtract(entity.input, world.input._mappings['moveRight'].direction!)
)

world.input.register('q', () => entity.mode = entity.mode === 'dig' ? 'normal' : 'dig');

// world.input.register('moveUp',
//   () => entity.input = VectorUtils.add(entity.input, world.input._mappings['moveUp'].direction),
//   () => entity.input = VectorUtils.subtract(entity.input, world.input._mappings['moveUp'].direction)
// )
//

world.input.register('arrowUp',
  () => world.sculpComponent.activeMaterialIndex = 1
);

world.input.register('arrowDown',
  () => world.sculpComponent.activeMaterialIndex = 0
);


// TODO create projectile class based on Entity which explodes when colliding
// world.input.register('leftMouseButton',
//   () => {
//   const proj = new Entity(world.ctx, [0, 0], entity.pos, [20, -10]);
//   world.entities.push(proj);
//   },
//   () => {
//
//   });

requestAnimationFrame(world.main);

// TODO - Introduce world space and screen space coordinates to be able to pan around the world beyond what the canvas shows at any moment in time
//        As well as zooming to increase or decrease the distance to the "z" axis. Helpful resource: https://www.youtube.com/watch?v=ZQ8qtAizis4

// TODO - move all player code in Entity to Player class

// TODO - Create GameMode/Game class which handles the game state like: turns, scores, players, winning conditions, restart, reset, UI etc

// TODO - Introduce networking support for:
//  - Client-Server: Make it possible to run a headless simulation ona node server where players are connected via websocket
//  - Peer-to-Peer: Via webrtc. One player takes the role of the authority just like a normal server while the others are all clients


// TODO GAMEPLAY IDEA:
//  Instead of making a round based worms like game, make it a real time.
//  The terrain is treated as ICE that can melt and turn into WATER.
//  With this framework in mind, I can think of a few game modes:
//  - P1 is god (either flying on top of map or not visible at all to P2). P1 can drop bombs and water down on P2 who has to survive for 60 seconds.
//  - P1 is an iceSpirit and P2 is a fireSpirit. P1 can charge on water and shoot ice, P2 doesn't have to charge but needs to avoid standing in place as it will melt the ICE away.
//    P2 shoots fireballs that can kill the player and turn ice to water. P1 goobles up the water and shoots iceballs back which just increase the terrain height and freezes surounding water.
//    That results in an interesting dynamic where P1 depends on water that the fireballs create and P2 depends on iceballs that P1 creates to re-freeze the water.
//    The goal is to kill the other player by either shooting them or melting the terrain below them so they fall into the abyss.
//    P2 cannot stay in the water for too long as it will extinguish the fire spirit and P1 cannot get hit by fireballs as it will melt the ice spirit.
//    The game ends when one player dies or the terrain is completely melted and the players fall into the abyss.
//  - P1 and P2 are both the same thing. They can shoot both heatballs or coldballs at each other.
//    To shoot a coldball you take "cold" from the environment to lower your internal temperature --> causing ice to melt and water to evaporate (turning into nothingness).
//    To shoot a heatball you take "heat" from the environment to raise your internal temperature --> causing water to freeze
//    You have a "natural" internal temperature of 0. To shoot heat you need to raise your temperature above 0. To shoot cold you need to lower your temperature below 0.
//    Your temperature is indicated by the color of your player. Blue = cold, Red = hot, White = neutral.
//    The world will always try to balance out your internal temperature to 0. If above 0 it will cool you down by melting ice. If below 0 it will heat you up by freezing water.
//     

//  