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
      rank: '碑林区中上水平（非官方，仅供参考）',
      rating: '家长评价：校风严谨，作业量适中，注重素质教育',
      year: 2026,
      location: { lng: 108.965, lat: 34.258 },
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
      rank: '雁塔区热门名校（非官方，仅供参考）',
      rating: '家长评价：师资强，活动多，但作业量较大',
      year: 2026,
      location: { lng: 108.958, lat: 34.228 },
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
