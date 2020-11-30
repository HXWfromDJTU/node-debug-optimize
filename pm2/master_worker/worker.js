var http = require('http')
http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Hello World\n')
}).listen(Math.round((1 + Math.random()) * 1000), '127.0.0.1')

process.on('message', data => {
    console.log(`===== process ${process.pid} receive message =====`, data)
})

parent.send({key: 'from worker.js'})