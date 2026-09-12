// 搜索与筛选逻辑
const SearchManager = (() => {
  let currentDistrict = 'all';
  let currentLevel = 'all';
  let allSchools = [];

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

    // 框选按钮
    let isRectActive = false;
    document.getElementById('rectBtn').addEventListener('click', () => {
      if (isRectActive) exitRectMode();
      else enterRectMode();
    });
    document.getElementById('rectClearBtn').addEventListener('click', clearRectSelection);

    function enterRectMode() {
      isRectActive = true;
      document.getElementById('rectBtn').textContent = '✕ 退出';
      document.getElementById('rectBtn').classList.add('active');
      document.getElementById('rectHint').style.display = 'block';
      MapManager.startRectangle();
    }

    function exitRectMode() {
      isRectActive = false;
      document.getElementById('rectBtn').textContent = '□ 框选';
      document.getElementById('rectBtn').classList.remove('active');
      document.getElementById('rectHint').style.display = 'none';
      MapManager.stopRectangle();
    }

    function clearRectSelection() {
      MapManager.clearRect();
      document.getElementById('rectClearBtn').style.display = 'none';
      exitRectMode();
    }

    // ESC退出框选
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isRectActive) exitRectMode();
    });

    // 点击地图marker直接跳详情
    window.onSchoolMarkerClick = async function(school) {
      showLoading('正在查询...');
      Sidebar.open();
      const result = await DataLoader.querySchoolDetail(school.name);
      hideLoading();
      if (result && result.success) {
        Sidebar.renderSchoolDetail(result.data);
        if (result.data.location) {
          MapManager.flyTo(result.data.location.lng, result.data.location.lat, 15);
        }
        if (result.data.zone && result.data.zone.coords) {
          MapManager.highlightZone(result.data.zone.coords);
        }
        if (result.data.houses) {
          MapManager.showHouseMarkers(result.data.houses);
        }
      } else {
        Sidebar.showError(`未找到「${school.name}」的详细信息`);
      }
    };

    // 框选区域后显示学校列表
    window.onBoundsFilter = function(bounds) {
      const inBounds = allSchools.filter(s => {
        if (!s.location || !s.location.lng) return false;
        return bounds.contains([s.location.lng, s.location.lat]);
      });
      showSchoolList(inBounds, '框选区域内学校');
      // 地图上高亮这些学校
      MapManager.highlightSchools(inBounds);
      exitRectMode();
      document.getElementById('rectClearBtn').style.display = 'block';
    };

    // 地图移动后自动筛选视野内学校
    window.onMapMoveEnd = function() {
      // 不自动刷新列表，避免打扰；用户可点框选按钮
    };
  }

  async function doSearch() {
    const input = document.getElementById('searchInput');
    const name = input.value.trim();
    if (!name) return;

    showLoading('正在查询学校信息...');
    Sidebar.open();

    const result = await DataLoader.querySchoolDetail(name);

    hideLoading();

    if (result && result.success) {
      Sidebar.renderSchoolDetail(result.data);
      if (result.data.location) {
        MapManager.flyTo(result.data.location.lng, result.data.location.lat, 15);
        MapManager.markSchool(result.data.location.lng, result.data.location.lat, result.data.name);
      }
      if (result.data.zone && result.data.zone.coords) {
        MapManager.highlightZone(result.data.zone.coords);
      } else if (result.data.zone && result.data.zone.roads) {
        const roadsArr = result.data.zone.roads.split('；').filter(Boolean);
        MapManager.highlightZoneRoads(roadsArr, result.data.location.lng, result.data.location.lat);
      }
      if (result.data.houses) {
        MapManager.showHouseMarkers(result.data.houses);
      }
    } else {
      Sidebar.showError(`未找到「${name}」的详细信息，请尝试其他学校名`);
    }
  }

  async function applyFilters() {
    const schools = await DataLoader.getSchools();
    allSchools = schools;
    let filtered = schools;

    if (currentDistrict !== 'all') {
      filtered = filtered.filter(s => s.district === currentDistrict);
    }
    if (currentLevel !== 'all') {
      filtered = filtered.filter(s => s.level === currentLevel);
    }

    MapManager.showSchools(filtered);
  }

  // 显示学校列表（框选结果）
  function showSchoolList(schools, title) {
    Sidebar.open();
    const content = document.getElementById('drawerContent');

    // 按评分排序
    const sorted = [...schools].sort((a, b) => (b.score || 0) - (a.score || 0));

    const listHTML = sorted.map((s, i) => `
      <div onclick="SearchManager.listItemClick('${s.name}')" style="
        display:flex;align-items:center;gap:10px;padding:10px 0;
        border-bottom:1px solid #f5f5f5;cursor:pointer;
      ">
        <div style="
          width:24px;height:24px;line-height:24px;text-align:center;
          background:#f5f5f5;border-radius:50%;font-size:12px;
          color:#999;flex-shrink:0;
        ">${i + 1}</div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:500;">${s.name}</div>
          <div style="font-size:12px;color:#999;margin-top:2px;">
            ${s.district || ''} · ${s.level === 'primary' ? '小学' : s.level === 'junior' ? '初中' : s.level === 'high' ? '高中' : '幼儿园'}
            ${s.score ? ` · ⭐${s.score}` : ''}
          </div>
        </div>
        <div style="color:#ccc;font-size:14px;">›</div>
      </div>
    `).join('');

    content.innerHTML = `
      <div style="margin-bottom:12px;">
        <div style="font-size:16px;font-weight:600;">${title}</div>
        <div style="font-size:12px;color:#999;margin-top:4px;">共 ${schools.length} 所学校，按评分排序</div>
      </div>
      ${listHTML || '<div style="color:#999;text-align:center;padding:40px 0;">该区域内暂无学校</div>'}
    `;
  }

  async function listItemClick(name) {
    showLoading('正在查询...');
    const result = await DataLoader.querySchoolDetail(name);
    hideLoading();
    if (result && result.success) {
      Sidebar.renderSchoolDetail(result.data);
      if (result.data.location) {
        MapManager.flyTo(result.data.location.lng, result.data.location.lat, 15);
        MapManager.markSchool(result.data.location.lng, result.data.location.lat, result.data.name);
      }
      if (result.data.zone && result.data.zone.coords) {
        MapManager.highlightZone(result.data.zone.coords);
      } else if (result.data.zone && result.data.zone.roads) {
        const roadsArr = result.data.zone.roads.split('；').filter(Boolean);
        MapManager.highlightZoneRoads(roadsArr, result.data.location.lng, result.data.location.lat);
      }
      if (result.data.houses) {
        MapManager.showHouseMarkers(result.data.houses);
      }
    }
  }

  function showLoading(text) {
    document.getElementById('loadingMask').style.display = 'flex';
    if (text) document.getElementById('loadingText').textContent = text;
  }

  function hideLoading() {
    document.getElementById('loadingMask').style.display = 'none';
  }

  return { init, applyFilters, showLoading, hideLoading, listItemClick };
})();
