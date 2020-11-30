var fork = require('child_process').fork
const cpus = require('os').cpus()
const path = require('path')
const server = require('net').createServer()
const { isTooFrequently } = require('./helper')

const workers = {}
function createWorker() {
    // 首先判断当前是否创建过于频繁
    if (isTooFrequently()) {
        // 此处进行严重告警 或者 调用第三方工具通知开发者
        logger.error('restart is too frequently, please pay attention...')
        process.emit('giveup')
        return
    }

    const worker = fork(path.resolve(__dirname, 'worker.js'))
    worker.on('message', ({action}) => {
        // 发现子进程准备挂了，所以补充创建一个worker
        if (action === 'SUICIDE') {
            createWorker() // 重新创建一个worker
        }
    })

    worker.on('exit', () => {
        delete workers[worker.pid]  // 删除worker记录
    })


    workers[worker.pid] = worker // 记录管理worker

    // 发送服务器给子进程
    worker.send({
        server: server,
        message: 'server'
    }) 
    server.close() // 句柄发送给子进程后，主进程便停止监听，避免父子进程混杂处理
}

for (let i = 0; i < cpus.length; i++) {
    createWorker()
}


// 档主进程退出时，也让所有的自的子进程都全部退出
process.on('exit', () => {
    for (let pid in workers) {
        workers[pid].kill()
    }
})


// ps aux | grep woeker.js

/**
 * ps
 * process status
 */

/**
 * grep
 * global search regular expression and print out the line
 * 全面搜索正则表达式并把行打印出来
 */

/**
 * aux
 * a =显示所有用户的进程
 * u =显示进程的用户/所有者
 * x =还显示未连接到终端的进程
 */


