const crypto = require('crypto')
const Paloma = require('paloma')
const app = new Paloma()
const users = {}

app.route({ method: 'GET', path: '/newUser', controller (ctx) {
  const username = ctx.query.username || 'test'
  const password = ctx.query.password || 'test'

  const salt = crypto.randomBytes(128).toString('base64')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')

  users[username] = { salt, hash }

  ctx.status = 204
}})

app.route({ method: 'GET', path: '/auth', controller (ctx) {
  const username = ctx.query.username || 'test'
  const password = ctx.query.password || 'test'

  if (!users[username]) {
    ctx.throw(400)
  }
  const hash = crypto.pbkdf2Sync(password, users[username].salt, 10000, 64, 'sha512').toString('hex')

  if (users[username].hash === hash) {
    ctx.status = 204
  } else {
    ctx.throw(403)
  }
}})
 
app.listen(3000)