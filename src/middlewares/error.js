const fs = require('fs')

async function error(ctx, next) {
  const {req, res, filePath} = ctx
  const {method, url} = req

  if (method !== 'GET') {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end('请使用 GET 方法访问文件！')
  } else {
    try {
      fs.accessSync(filePath, fs.constants.R_OK)
      await next()
    } catch (e) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      console.log(e.message)
      res.end(`${url} 文件不存在`)
    }
  }
}

module.exports = error
