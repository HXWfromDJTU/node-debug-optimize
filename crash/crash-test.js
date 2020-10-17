const heapdump = require('heapdump')

const save = function () {
  gc();
  heapdump.writeSnapshot('./' + Date.now() + '.heapsnapshot');
}

let arr = [];
while(true)
  arr.push(1);
