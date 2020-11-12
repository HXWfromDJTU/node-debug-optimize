const fs = require('fs')
const path = require('path')


// 分析出文件夹中所有的文件
const readDir = (entry) => {
  const dirInfo = fs.readdirSync(entry)

  dirInfo.forEach(item => {
    const location = path.join(entry, item)
    const dirStat = fs.statSync(location)

    if (dirStat.isDirectory()) {
      readDir(location) // 递归的思维
    } else {
      console.log(`file: ${location}`)
    }
  })
}

readDir(__dirname)
