const http = require('http')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')
const handlebars = require('handlebars')
const compare = require('natural-compare')
// natural-compare 用于文件排序
// Standard sorting:   Natural order sorting:
// img1.png            img1.png
// img10.png           img2.png
// img12.png           img10.png
// img2.png            img12.png


const defaultConf = require('./config')

const htmlTpl = fs.readFileSync(path.join(__dirname, './template/directory.hbs'))
const template = handlebars.compile(htmlTpl.toString())

class StaticServer {
  constructor(options = {}) {
    this.config = Object.assign(defaultConf, options)
  }

  start() {
    const {port, root} = this.config
    this.server = http.createServer((req, res) => {
      // req.url 就是请求的相对地址
      const {url, method} = req
      if (method !== 'GET') {
        res.writeHead(404, {
          'content-type': 'text/html; charset=utf-8'
        })
        res.end('请使用 GET 方法访问文件！')
        return false
      }

      const filePath = path.join(root, url)
      fs.access(filePath, fs.constants.R_OK, err => {
        if (err) {
          res.writeHead(404, {
            'content-type': 'text/html; charset=utf-8'
          })
          res.end('文件不存在！')
        } else {
          // 返回一个 Stats 对象，其中包含文件路径的详细信息
          const stats = fs.statSync(filePath)
          const list = []
          // 判断 filePath 是否为文件夹
          if (stats.isDirectory()) {

            // 打开 filePath 这个文件夹
            const dir = fs.opendirSync(filePath)
            // 读取 filePath 文件夹中的第一个文件
            let dirent = dir.readSync()
            while (dirent) {
              list.push({
                name: dirent.name,
                path: path.join(url, dirent.name),
                type: dirent.isDirectory() ? 'folder' : 'file'
              })
              // 读取当前文件夹的下一个文件
              dirent = dir.readSync()
            }
            dir.close()
            res.writeHead(200, {
              'content-type': mime.contentType(path.extname(url))
            })

            list.sort((x, y) => {
              if (x.type > y.type) {
                // 'folder' > 'file'， 返回 -1，folder 在 file 之前
                return -1
              } else if (x.type === y.type) {
                return compare(x.name.toLowerCase(), y.name.toLowerCase())
              } else {
                return 1
              }
            })
            // 使用 headlebars 模板引擎，生成目录页面 html
            const html = template({list})
            res.end(html)
          } else {
            res.writeHead(200, {
              // mime.contentType() 方法可以根据传入的 后缀名 返回对应的 content-type
              'content-type': mime.contentType(path.extname(url))
            })
            fs.createReadStream(filePath).pipe(res)
          }
        }
      })
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
