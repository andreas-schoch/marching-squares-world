const world = new World(6, 160, 80);
// noise.seed(666);
noise.seed(Math.random() * 1000);
world._generateVertices((x, y) => {
  const n1 = noise.simplex2(x / 10, y / 10) * world.tileDensityMax;
  const n2 = noise.simplex2(x / 6, y / 6) * (world.tileDensityMax / 4);
  const n3 = noise.simplex2(x / 25, y / 25) * world.tileDensityMax;

  const n = n1 + n2 + n3 / 3;

  const bias = (y / world.numTilesY);

  return (n + 100) * bias;

  return y > world.numTilesY / 1.25
    ? Math.max(Math.min(n + 85, 64), 0)
    : Math.max(Math.min(n + 15, 64), 0);
});
// world._generateVertices((x, y) => y > world.numTilesY / 2 ? world.tileDensityMax : 0);
window.requestAnimationFrame(world.main);

// document.addEventListener('wheel', (evt) => {
//   const change = evt.deltaY / 100;
//   world.sculpComponent.radiusXY = Math.min(Math.max(world.sculpComponent.radiusXY - change, 1), 12);
//   console.log(world.sculpComponent.radiusXY);
// });
