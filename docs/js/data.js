// 数据加载层（GitHub Pages 纯静态版本，mock 数据内嵌）
const DataLoader = (() => {
  let schoolsCache = null;

  // Mock 学校详情数据（和后端 api/school.js 保持一致）
  const MOCK_DETAIL = {
    '仁厚庄小学': {
      name: '仁厚庄小学',
      district: '碑林区',
      school_type: '公办',
      level: 'primary',
      tuition: '公办免学费，代收书本费约200元/学期',
      year: 2026,
      location: { lng: 108.965, lat: 34.258 },
      // 分维度办学质量评价
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
    },
    '西安市第三中学': {
      name: '西安市第三中学',
      district: '碑林区',
      school_type: '公办',
      level: 'high',
      tuition: '公办高中学费约800元/学期',
      year: 2026,
      location: { lng: 108.970, lat: 34.265 },
      quality: {
        tier: '碑林区公办第二梯队高中，省重点，有初中部',
        teaching: '师资稳定，管理严格，高中部成绩在碑林属中上，初中部对口仁厚庄',
        students: '生源以对口小学+中考录取为主，生源层次中等',
        admission: '普高率约80%，一本上线率约30%（非官方），有定向生名额',
        class_type: '高中有重点班/平行班，初中部平行班',
        facilities: '校园中等，长乐西路地段，交通便利',
        verdict: '口碑不错的区属重点，中等生加工能力强，适合成绩中等偏上学生',
        suitable: '适合：成绩中等偏上、求稳的学生；不适合：冲五大名校尖子生'
      },
      pathways: {
        primary: [],
        junior: ['西安市第三中学（初中部）'],
        high: ['西安市第三中学'],
        notes: '高中按中考分数线录取，无学区'
      },
      zone: null,
      houses: [],
      pitfalls: [
        '高中按分数线录取，买房不能直接上',
        '高考成绩与五大名校有差距'
      ],
      confidence: 'medium'
    },
    '西安市第八十五中学': {
      name: '西安市第八十五中学',
      district: '雁塔区',
      school_type: '公办',
      level: 'high',
      tuition: '公办高中学费约800元/学期',
      year: 2026,
      location: { lng: 108.956, lat: 34.235 },
      quality: {
        tier: '雁塔区公办头部高中，省示范，有初中部',
        teaching: '师资较强，管理严格，高考成绩在雁塔区属前列',
        students: '生源以翠华路等小学对口+中考录取，生源质量较好',
        admission: '普高率约85%，一本上线率约40%（非官方），有航天实验班',
        class_type: '高中有航天实验班/重点班，初中部对口翠华路小学',
        facilities: '校园较大，翠华路地段好，近大雁塔',
        verdict: '雁塔区热门公办完中，初中对口翠华路，高中成绩稳步提升',
        suitable: '适合：成绩中上、居住曲江/翠华路片区的学生；不适合：冲五大名校'
      },
      pathways: {
        primary: ['翠华路小学'],
        junior: ['西安市第八十五中学（初中部）'],
        high: ['西安市第八十五中学'],
        notes: '高中按中考分数线录取，无学区'
      },
      zone: null,
      houses: [],
      pitfalls: [
        '高中按分数线录取，买房不能直接上',
        '航天实验班竞争激烈'
      ],
      confidence: 'medium'
    }
  };

  async function loadJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn(`加载 ${url} 失败:`, e.message);
      return [];
    }
  }

  return {
    async getSchools() {
      if (schoolsCache) return schoolsCache;
      // GitHub Pages 路径需要加 base
      const base = window.APP_CONFIG.BASE_PATH || '';
      schoolsCache = await loadJSON(`${base}/data/schools.json`);
      return schoolsCache;
    },
    // 调后端 API 获取学校详情（AI 聚合）
    async querySchoolDetail(name) {
      // 先试后端 API（Vercel 部署时可用）
      try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE}/school?name=${encodeURIComponent(name)}`);
        if (res.ok) return await res.json();
      } catch (e) {
        // API 不可用，fallback 到 mock
      }
      // Mock fallback
      await new Promise(r => setTimeout(r, 500));
      const key = Object.keys(MOCK_DETAIL).find(k => name.includes(k) || k.includes(name));
      if (key) {
        return { success: true, data: MOCK_DETAIL[key] };
      }
      return { success: false, error: '未找到' };
    }
  };
})();
