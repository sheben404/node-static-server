const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const compare = require('natural-compare');
const mime = require('mime-types');

const htmlTpl = fs.readFileSync(path.join(__dirname, '../template/directory.hbs'));
const template = handlebars.compile(htmlTpl.toString());

async function serve(ctx, next) {
  const {req, res, filePath} = ctx;
  const {url} = req;

  await next();

  if (res.statusCode === 304) {
    res.end('')
    return
  }

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
      'Content-Type': mime.contentType(path.extname(url))
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
    const contentType = mime.contentType(path.extname(url));
    res.setHeader('Content-Type', contentType);
    if (typeof ctx.body === 'string') {
      res.end(ctx.body);
    } else {
      ctx.body.pipe(res);
    }
  }
}

module.exports = serve
