#!/usr/bin/env python3
"""本地接收服务器：接收浏览器POST回来的坐标解析结果"""
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import os

DATA_DIR = '/home/user/Doubao/chats/38440640968808450/ChildEdu/data'
OUTPUT = os.path.join(DATA_DIR, 'geo_fill_result.json')

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8')
        try:
            data = json.loads(body)
            with open(OUTPUT, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            # 追加日志
            with open(OUTPUT + '.log', 'a', encoding='utf-8') as f:
                f.write(f'{len(data)}条 {os.path.basename(body[:50])}\n')
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
            print(f'收到并保存 {len(data)} 条坐标结果')
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())
            print('ERR', e)
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.end_headers()
        self.wfile.write(b'geo receiver running')
    def log_message(self, *a):
        pass

print(f'接收服务器运行中，输出到 {OUTPUT}')
HTTPServer(('127.0.0.1', 8899), Handler).serve_forever()
