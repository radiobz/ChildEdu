// 本地开发服务器（仅用于云电脑本地预览）
// 用法: node api/dev-server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');
const DATA = path.join(ROOT, 'data');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

async function handleAPI(req, res, url) {
  const { searchParams } = url;
  const name = searchParams.get('name');

  // 模拟 school API
  const mod = await import('./school.js');
  const fakeReq = { method: 'GET', query: Object.fromEntries(searchParams) };
  const fakeRes = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(obj) {
      res.writeHead(this.statusCode, { 'Content-Type': 'application/json; charset=utf-8', ...this.headers });
      res.end(JSON.stringify(obj));
    },
    end() { res.end(); }
  };
  await mod.default(fakeReq, fakeRes);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);

  // API 路由
  if (pathname.startsWith('/api/')) {
    return handleAPI(req, res, url);
  }

  // 静态文件
  let filePath;
  if (pathname.startsWith('/data/')) {
    // 数据文件从 data 目录找
    filePath = path.join(DATA, pathname.replace('/data/', ''));
  } else {
    // 其他静态文件从 frontend 目录找
    filePath = path.join(FRONTEND, pathname);
    if (pathname === '/' || pathname === '/index.html') {
      filePath = path.join(FRONTEND, 'index.html');
    }
  }

  // 检查文件是否存在
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch (e) {
    // 尝试 data 目录
    filePath = path.join(DATA, pathname);
    try {
      fs.statSync(filePath);
    } catch (e2) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Internal Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ ChildEdu 开发服务器已启动`);
  console.log(`   本地预览: http://localhost:${PORT}`);
  console.log(`\n   搜索测试: 输入 "仁厚庄小学" 或 "翠华路小学"\n`);
});
