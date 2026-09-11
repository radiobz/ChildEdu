// Vercel Serverless Function: GET /api/school?name=学校名
// 功能：根据学校名，调用 AI 聚合学区/升学/房源/学费/排名/避坑点等信息

// ===== 简易内存缓存（Serverless 冷启动后会重置，够用） =====
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

// ===== Mock 数据（先跑通架构，后续接入真实 AI API） =====
const MOCK_DATA = {
  '仁厚庄小学': {
    name: '仁厚庄小学',
    district: '碑林区',
    school_type: '公办',
    level: 'primary',
    tuition: '公办免学费，代收书本费约200元/学期',
    year: 2026,
    location: { lng: 108.965, lat: 34.258 },
    quality: {
      tier: '碑林区第二梯队公办小学，原企办校，口碑中上',
      teaching: '师资稳定，管理偏传统，抓常规作业，教研活动一般，无明显教学特色招牌',
      students: '以仁厚庄家属院学区生源为主，附近单位子弟+部分社会生源，生源结构普通',
      admission: '对口市三中初中部，小学初中一体化，不用摇号',
      class_type: '平行班为主，无明显重点班，班额约45人',
      facilities: '老校园，设施够用但偏旧，操场较小，课后服务有基础社团',
      verdict: '合格的家门口公办小学，稳妥但不拔尖，优势是对口三中确定性高',
      suitable: '适合：求稳、重视升学确定性、预算有限的家庭；不适合：追求名校师资/素质教育特色的家庭'
    },
    pathways: {
      primary: '仁厚庄小学',
      junior: ['西安市第三中学（初中部）'],
      high: ['西安市第三中学'],
      notes: '按学区空间对应整理，非官方直升表，以教育局当年公布为准'
    },
    zone: {
      communities: ['仁厚庄小区', '景观城', '星币传说', '云峰大厦'],
      roads: '咸宁路以南、东二环以西',
      source: '碑林区教育局2026年',
      coords: [
        [108.958, 34.252], [108.972, 34.252],
        [108.972, 34.264], [108.958, 34.264]
      ]
    },
    houses: [
      { community: '仁厚庄小区', price: '约9000-12000元/㎡', year: '1998年', location: { lng: 108.962, lat: 34.259 }, url: 'https://xian.ke.com/xiaoqu/rs仁厚庄小区/' },
      { community: '景观城', price: '约13000-16000元/㎡', year: '2008年', location: { lng: 108.968, lat: 34.257 }, url: 'https://xian.ke.com/xiaoqu/rs景观城/' }
    ],
    pitfalls: [
      '老小区学位紧张，落户需提前1-2年',
      '部分楼栋无电梯，老人接送不便',
      '学区内二手房房龄偏老，贷款年限受限'
    ],
    confidence: 'medium'
  },
  '翠华路小学': {
    name: '翠华路小学',
    district: '雁塔区',
    school_type: '公办',
    level: 'primary',
    tuition: '公办免学费',
    year: 2026,
    location: { lng: 108.958, lat: 34.228 },
    quality: {
      tier: '雁塔区热门公办小学，区一级示范，曲江片区头部',
      teaching: '师资较强，活动多，英语/素质教育有特色，作业量偏大，管理严格',
      students: '翠华路周边公务员/事业单位子弟为主，生源质量在雁塔区属中上',
      admission: '对口市85中初中部，也有部分分流其他初中，摇号民办可选唐南等',
      class_type: '班额偏大（约50人），有隐性分层，英语特色班',
      facilities: '校园硬件较好，曲江片区配套新，近大雁塔/陕博',
      verdict: '雁塔区热门校，硬件师资都不错，但学区房贵、班额大',
      suitable: '适合：预算充足、重视综合素质、接受大班额的家庭；不适合：追求小班教学、预算有限的家庭'
    },
    pathways: {
      primary: '翠华路小学',
      junior: ['西安市第八十五中学（初中部）'],
      high: ['西安市第八十五中学'],
      notes: '按学区空间对应整理，非官方直升表'
    },
    zone: {
      communities: ['翠华路小区', '佳和中心', '曲江六号', '皇家公馆'],
      roads: '翠华路两侧、雁南路以北',
      source: '雁塔区教育局2026年',
      coords: [
        [108.950, 34.222], [108.966, 34.222],
        [108.966, 34.234], [108.950, 34.234]
      ]
    },
    houses: [
      { community: '翠华路小区', price: '约15000-20000元/㎡', year: '2000年', location: { lng: 108.956, lat: 34.229 }, url: 'https://xian.ke.com/xiaoqu/rs翠华路小区/' },
      { community: '曲江六号', price: '约25000-35000元/㎡', year: '2010年', location: { lng: 108.963, lat: 34.226 }, url: 'https://xian.ke.com/xiaoqu/rs曲江六号/' }
    ],
    pitfalls: [
      '学区房价格高，预算需充足',
      '落户年限要求严格，热门年份可能要求满3年',
      '班级人数较多，关注是否有大班额问题'
    ],
    confidence: 'medium'
  }
};

// ===== AI 调用函数（预留，后续接入真实 API） =====
async function callAI(name) {
  // TODO: 接入真实 AI API
  // const apiKey = process.env.AI_API_KEY;
  // const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     model: 'deepseek-chat',
  //     messages: [{ role: 'user', content: buildPrompt(name) }],
  //     response_format: { type: 'json_object' }
  //   })
  // });
  // const data = await response.json();
  // return JSON.parse(data.choices[0].message.content);

  // 目前返回 mock 数据
  await new Promise(r => setTimeout(r, 800)); // 模拟网络延迟
  const key = Object.keys(MOCK_DATA).find(k => name.includes(k) || k.includes(name));
  if (key) return MOCK_DATA[key];
  return null;
}

function buildPrompt(name) {
  return `你是西安教育数据分析师。请查询"${name}"的以下信息，以严格JSON格式返回：
{
  "name": "学校全称",
  "district": "所在区",
  "school_type": "公办/民办",
  "level": "primary/junior/high/kindergarten",
  "tuition": "学费信息",
  "year": 2026,
  "location": {"lng": 经度, "lat": 纬度},
  "quality": {
    "tier": "梯队定位：在区内第几梯队、什么级别（省示范/市一级等）",
    "teaching": "师资教学：师资水平、教学风格、管理严格度、作业量、教研特色",
    "students": "生源结构：学生来源、生源质量、是否筛选",
    "admission": "升学情况：对口学校、普高率/重点率（初中高中填）",
    "class_type": "班型教学：班额、是否有重点班、教学模式",
    "facilities": "硬件地段：校园条件、位置、周边配套",
    "verdict": "一句话总结：这所学校的核心优劣势",
    "suitable": "适合谁/不适合谁：分场景建议"
  },
  "pathways": {"primary": "", "junior": [], "high": [], "notes": ""},
  "zone": {"communities": [], "roads": "", "source": "", "coords": [[lng,lat]]},
  "houses": [{"community": "", "price": "", "year": "", "location": {"lng":0,"lat":0}, "url": ""}],
  "pitfalls": [],
  "confidence": "high/medium/low"
}
要求：
- 不确定的字段填null，不要编造
- quality各字段要具体、有信息量，不要空话
- 升学标注"非官方直升"
- 所有评价标注"非官方，仅供参考"`;
}

// ===== 主 Handler =====
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ success: false, error: '缺少学校名参数 name' });
  }

  // 查缓存
  const cacheKey = name.trim();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return res.json({ success: true, data: cached.data, fromCache: true });
  }

  // 调 AI
  try {
    const result = await callAI(cacheKey);
    if (!result) {
      return res.json({ success: false, error: `未找到"${name}"的信息` });
    }

    // 存缓存
    cache.set(cacheKey, { time: Date.now(), data: result });

    return res.json({ success: true, data: result, fromCache: false });
  } catch (e) {
    console.error('AI 调用失败:', e);
    return res.status(500).json({ success: false, error: '服务暂时不可用，请稍后重试' });
  }
}
