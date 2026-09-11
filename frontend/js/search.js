// 搜索与筛选逻辑
const SearchManager = (() => {
  let currentDistrict = 'all';
  let currentLevel = 'all';

  function init() {
    // 搜索按钮
    document.getElementById('searchBtn').addEventListener('click', doSearch);
    document.getElementById('searchInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') doSearch();
    });

    // 区域筛选
    document.querySelectorAll('#districtChips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#districtChips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentDistrict = chip.dataset.district;
        applyFilters();
      });
    });

    // 学段筛选
    document.querySelectorAll('.level-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.level-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentLevel = chip.dataset.level;
        applyFilters();
      });
    });
  }

  async function doSearch() {
    const input = document.getElementById('searchInput');
    const name = input.value.trim();
    if (!name) return;

    showLoading('正在查询学校信息...');
    Sidebar.open();

    // 调后端 AI 聚合 API
    const result = await DataLoader.querySchoolDetail(name);

    hideLoading();

    if (result && result.success) {
      // 渲染侧边栏
      Sidebar.renderSchoolDetail(result.data);

      // flyTo 到学校位置
      if (result.data.location) {
        MapManager.flyTo(result.data.location.lng, result.data.location.lat, 15);
      }

      // 高亮学区
      if (result.data.zone && result.data.zone.coords) {
        MapManager.highlightZone(result.data.zone.coords);
      }

      // 显示房源点
      if (result.data.houses) {
        MapManager.showHouseMarkers(result.data.houses);
      }
    } else {
      Sidebar.showError(`未找到「${name}」的详细信息，请尝试其他学校名`);
    }
  }

  async function applyFilters() {
    const schools = await DataLoader.getSchools();
    let filtered = schools;

    if (currentDistrict !== 'all') {
      filtered = filtered.filter(s => s.district === currentDistrict);
    }
    if (currentLevel !== 'all') {
      filtered = filtered.filter(s => s.level === currentLevel);
    }

    MapManager.showSchools(filtered);
  }

  function showLoading(text) {
    document.getElementById('loadingMask').style.display = 'flex';
    if (text) document.getElementById('loadingText').textContent = text;
  }

  function hideLoading() {
    document.getElementById('loadingMask').style.display = 'none';
  }

  return { init, applyFilters, showLoading, hideLoading };
})();
