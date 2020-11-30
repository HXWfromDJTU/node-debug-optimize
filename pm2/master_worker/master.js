var fork = require('child_process').fork
var cpus = require('os').cpus()
var path = require('path')

const children = []

for (let i = 0; i < cpus.length; i++) {
    const cp = fork(path.resolve(__dirname, 'worker.js'))
    children.push(cp)
}

children.forEach(cp => {
    // cp.send({ key: 12312 }) // targetProcess.send(msg) // 容易混淆的是，cp是被接受消息的
    // cp.on('message', data => {
    //     console.log(`===== process ${cp.pid} receive message =====master.js`, data)
    // })
})

process.on('message', data => {
    console.log(`===== master process ${process.pid} receive message =====master.js`, data)
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


