const net = require('net');
const server = net.createServer((client) => {
    // 'connection' 监听器。
    console.log('客户端已连接');
    client.on('end', () => {
        console.log('客户端已断开连接');
    });
    client.write('你好\r\n');
    client.pipe(client);
});

server.on('error', (err) => {
    throw err;
});
server.listen(8124, () => {
    console.log('服务器已启动');
});

process.on('uncaughtException', function(err) {
    console.log(err.stack);
    console.log('NOT exit...');
});