const http = require('http')
const path = require('path')

const compose = require('./utils/compose')
const defaultConf = require('./config')

// middleware
const error = require('./middlewares/error')
const serve = require('./middlewares/serve')
const cache = require('./middlewares/cache')
const compress = require('./middlewares/compress')

class StaticServer {
  constructor(options = {}) {
    this.config = Object.assign(defaultConf, options)
  }

  start() {
    const {port, root} = this.config
    this.server = http.createServer((req, res) => {
      const {url} = req
      const ctx = {
        req,
        res,
        filePath: path.join(root, url),
        config: this.config
      }
      compose([error, serve, compress, cache])(ctx)
    }).listen(port, () => {
      console.log(`Static server started at port ${port}.`)
    })
  }

  stop() {
    this.server.close(() => {
      console.log('Static server closed.')
    })
  }
}

module.exports = StaticServer
