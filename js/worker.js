console.log('inside worker.js');

self.addEventListener('sync', function(event) {
  if (event.tag === 'myFirstSync') {
    event.waitUntil(doSomeStuff());
  }
});

function doSomeStuff() {
    console.log('task running');
}


// in the service worker
addEventListener('message', (event) => {
    console.log(`The client sent me a message: ${event.data}`);
});
