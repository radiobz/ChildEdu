// 数据加载层
const DataLoader = (() => {
  let schoolsCache = null;
  let pathwaysCache = null;

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
      schoolsCache = await loadJSON('/data/schools.json');
      return schoolsCache;
    },
    async getPathways() {
      if (pathwaysCache) return pathwaysCache;
      pathwaysCache = await loadJSON('/data/pathways.json');
      return pathwaysCache;
    },
    // 调后端 API 获取学校详情（AI 聚合）
    async querySchoolDetail(name) {
      try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE}/school?name=${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        console.error('API 请求失败:', e);
        return null;
      }
    }
  };
})();
