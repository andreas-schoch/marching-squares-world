const world = new World(8, 150, 70);

noise.seed(Math.random() * 1000);
// noise.seed(666);

world._generateVertices((x, y) => {
  const n1 = noise.simplex2(x / 15, y / 15) * world.tileDensityMax / 6;
  const n2 = noise.simplex2(x / 30, y / 30) * world.tileDensityMax / 3;
  const n3 = noise.simplex2(x / 60, y / 60) * world.tileDensityMax;
  const n = n1 + n2 + n3 / 3;

  const bias = ((y) / world.numTilesY);
  return n + (65 * bias);
});

window.requestAnimationFrame(world.main);


const btnSave = document.getElementById('btn-save');
const btnLoad = document.getElementById('btn-load');

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
