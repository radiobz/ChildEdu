// 数据加载层（GitHub Pages 纯静态版本）
const DataLoader = (() => {
  let schoolsCache = null;
  let pathwaysCache = null;
  let zonesCache = null;
  let communitiesCache = null;

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

  // 学段名映射
  function stageToLevel(stage) {
    const map = { '幼儿园': 'kindergarten', '小学': 'primary', '初中': 'junior', '高中': 'high' };
    return map[stage] || 'other';
  }

  // 从schools.json格式转成地图用的格式
  function normalizeSchool(s) {
    return {
      id: s.id,
      name: s.name,
      shortName: s.name,
      level: stageToLevel(s.stage),
      district: s.district,
      address: s.address || '',
      phone: s.tel || '',
      location: s.location ? { lng: s.location[0], lat: s.location[1] } : null,
      tags: s.tags || [],
      score: s.score,
      quality: s.quality,
      qualityDetail: s.qualityDetail,
      facility: s.facility,
      tuition: s.tuition,
      intro: s.intro,
      teachers: s.teachers,
      achievements: s.achievements,
      type: s.type,
      year: s.sourceYear
    };
  }

  return {
    async getSchools() {
      if (schoolsCache) return schoolsCache;
      const base = window.APP_CONFIG.BASE_PATH || '';
      const raw = await loadJSON(`${base}/data/schools.json?v=27`);
      schoolsCache = raw.map(normalizeSchool);
      return schoolsCache;
    },

    async getPathways() {
      if (pathwaysCache) return pathwaysCache;
      const base = window.APP_CONFIG.BASE_PATH || '';
      pathwaysCache = await loadJSON(`${base}/data/pathways.json`);
      return pathwaysCache;
    },

    async getZones() {
      if (zonesCache) return zonesCache;
      const base = window.APP_CONFIG.BASE_PATH || '';
      zonesCache = await loadJSON(`${base}/data/school_zones.json`);
      return zonesCache;
    },

    // 小区坐标库：{小区名: {name, location:[lng,lat], district, address, source}}
    async getCommunities() {
      if (communitiesCache) return communitiesCache;
      const base = window.APP_CONFIG.BASE_PATH || '';
      communitiesCache = await loadJSON(`${base}/data/communities.json?v=27`);
      return communitiesCache;
    },

    // 根据学校名查询完整详情
    async querySchoolDetail(name) {
      const [schools, pathways, zones, communities] = await Promise.all([
        this.getSchools(),
        this.getPathways(),
        this.getZones(),
        this.getCommunities()
      ]);

      // 找学校（排除空名，避免 includes('') 永远匹配）
      const school = schools.find(s => s.name && (s.name === name || s.name.includes(name) || name.includes(s.name)));
      if (!school) return { success: false, error: '未找到' };

      // 找升学路径
      const pathway = pathways.find(p =>
        p.primarySchool === school.name ||
        school.name.includes(p.primarySchool) ||
        p.primarySchool.includes(school.name)
      );

      // 找学区
      const zone = zones.find(z =>
        z.schoolName === school.name ||
        school.name.includes(z.schoolName) ||
        z.schoolName.includes(school.name)
      );

      // 组装详情
      const qd = school.qualityDetail || {};
      const detail = {
        name: school.name,
        district: school.district,
        school_type: school.type,
        level: school.level,
        tuition: school.tuition || '公办免学费（具体以学校公示为准）',
        year: 2026,
        location: school.location,
        quality: {
          tier: qd.tier || school.intro || '暂无公开梯队信息',
          teaching: qd.teaching || school.teachers || '暂无公开师资详情',
          homework: qd.homework || '',
          cafeteria: qd.cafeteria || '',
          afterSchool: qd.afterSchool || '',
          students: qd.students || '暂无生源信息',
          admission: pathway ? pathway.notes : (qd.admission || '暂无公开升学数据'),
          lottery: qd.lottery || '',
          choiceAdvice: qd.choiceAdvice || '',
          housePrice: qd.housePrice || '',
          class_type: qd.class_type || '暂无班型信息',
          facilities: qd.facilities || (school.facility ? `硬件评分：${school.facility}/100（非官方）` : '暂无硬件信息'),
          contact: qd.contact || school.phone || '',
          verdict: qd.verdict || (school.score ? `综合评分：${school.score}/100（非官方，仅供参考）` : '暂无评分数据'),
          suitable: qd.suitable || ''
        },
        pathways: {
          primary: pathway ? pathway.primarySchool : school.name,
          junior: pathway ? pathway.middleSchools : [],
          high: [],
          notes: pathway ? pathway.notes : '暂无公开升学数据'
        },
        zone: zone ? {
          communities: zone.communities || [],
          communityDetails: (zone.communities || []).map(cmName => {
            const info = communities && communities[cmName];
            return info ? {
              name: cmName,
              location: info.location || null,
              district: info.district || '',
              address: info.address || '',
              source: info.source || ''
            } : { name: cmName, location: null };
          }).filter(c => c.location),
          roads: (zone.roads || []).join('；'),
          roadNames: zone.roadNames || [],
          source: zone.sourceUrl || '',
          coords: zone.coords || null
        } : null,
        houses: [],
        pitfalls: [],
        confidence: 'medium'
      };

      return { success: true, data: detail };
    }
  };
})();
