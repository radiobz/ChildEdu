# ChildEdu 西安学区地图

面向西安家长的学校信息聚合地图：学区划分、升学路径、学区房源、学费排名、避坑点，一图打尽。

## 技术栈

- 前端：纯 HTML/CSS/JS + 高德地图 JS API 2.0
- 后端：Vercel Serverless Functions（Node.js）
- AI：预留接口，接入免费/付费大模型 API
- 部署：Vercel（前端静态 + 后端函数一体）

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
node api/dev-server.js

# 打开浏览器
http://localhost:8080
```

测试搜索：输入「仁厚庄小学」或「翠华路小学」

## 部署到 Vercel

1. 推送到 GitHub 仓库
2. Vercel 导入仓库 → 自动部署
3. 环境变量配置：
   - `AI_API_KEY`：你的 AI 模型 API Key
   - `AI_API_BASE`：AI 接口地址（如 DeepSeek）

## 目录结构

```
├── frontend/          # 前端静态文件
│   ├── index.html
│   ├── css/
│   └── js/
├── api/               # Vercel Serverless Functions
│   ├── school.js      # 学校详情聚合 API
│   └── dev-server.js  # 本地开发服务器
├── data/              # 静态基线数据
│   └── schools.json
├── vercel.json        # Vercel 部署配置
└── package.json
```

## 合规说明

- 所有数据标注来源与年份
- 排名标注「非官方，仅供参考」
- 升学路径标注「非官方直升表」
- 房源仅提供贝壳/链家搜索深链，不爬取私有数据
- 学区数据以教育局当年公布为准
