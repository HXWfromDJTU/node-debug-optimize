const { worker } = require('cluster')
var http = require('http')
http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Hello World\n')
})

let workerServer = null

process.on('message', ({ message, server }) => {
    if (message === 'server') {
        workerServer = server
        workerServer.on('connection', socket => {
            workerServer.emit('connection', socket)
        })
    }
})

process.on('uncaughtException', err => {
    logger.error(err)   // 使用日志组件记录日志

    // 遇到错误，主动告知父进程自己准备停止接接收请求了
    process.send({
        action: 'SUICIDE'
    })

    // 停止接受新的连接
    workerServer.close(() => {
        process.exit(1) // 所有的已有链接断开后，退出进程
    })

    // 为进程退出设置一个最大时限
    setTimeout(() => {
        process.exit(1)
    }, 5000)
})