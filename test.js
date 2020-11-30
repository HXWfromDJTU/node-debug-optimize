const arr = [1, 2, 3]

const res = arr.reduce((accumulator, currNum) => {
    return accumulator + currNum
}, 0)


arr.reduce((prePromise, currNum) => {
    return prePromise.then(() => {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(currNum)
                resolve()
            }, 1000)
        })
    })
}, Promise.resolve())

console.log(res)

Promise.resolve().then(() => {
   return new Promise((resolve) => {
        setTimeout(() => {
            console.log(1)
            resolve()
        }, 1000)
    })
}).then(() => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(2)
            resolve()
        }, 1000)
    })
}).then(() => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(3)
            resolve()
        }, 1000)
    })
})