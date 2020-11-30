var cluster = require('cluster');

console.log('started master with ' + process.pid);

// 新建一个worker进程
// cluster.fork();

process.on('SIGHUP', function () {
  console.log('Reloading...');
  var new_worker = cluster.fork();
  new_worker.once('listening', function () {
    // 关闭所有其他worker进程
    for(var id in cluster.workers) {
      if (id === new_worker.id.toString()) continue;
      cluster.workers[id].kill('SIGTERM');
    }
  });
});

