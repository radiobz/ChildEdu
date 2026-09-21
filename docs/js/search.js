// 搜索与筛选逻辑
const SearchManager = (() => {
  let currentDistrict = 'all';
  // 学段多选：空Set=不限；每项可独立选中/取消
  let currentLevels = new Set();
  // 性质多选（公办/民办）：空Set=不限
  let currentTypes = new Set();
  let allSchools = [];
  // 当前筛选后的学校（供视野内自动标识用）
  let filteredSchools = [];

  function init() {
    // 搜索按钮
    document.getElementById('searchBtn').addEventListener('click', doSearch);
    document.getElementById('searchInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') doSearch();
    });

    // 输入联想
    const input = document.getElementById('searchInput');
    let debounceTimer = null;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => showSuggestions(input.value.trim()), 200);
    });
    input.addEventListener('focus', () => {
      if (input.value.trim()) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => showSuggestions(input.value.trim()), 200);
      }
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#searchBox')) hideSuggestions();
    });

    // 初始化加载学校数据（供视野内标识用）
    DataLoader.getSchools().then(schools => {
      allSchools = schools;
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

    // 学段筛选（多选：每项可独立选中/取消）
    document.querySelectorAll('.level-chip[data-level]').forEach(chip => {
      chip.addEventListener('click', () => {
        const lv = chip.dataset.level;
        if (currentLevels.has(lv)) {
          currentLevels.delete(lv);
          chip.classList.remove('active');
        } else {
          currentLevels.add(lv);
          chip.classList.add('active');
        }
        applyFilters();
      });
    });

    // 性质筛选（公办/民办，多选）
    document.querySelectorAll('.level-chip[data-type]').forEach(chip => {
      chip.addEventListener('click', () => {
        const tp = chip.dataset.type;
        if (currentTypes.has(tp)) {
          currentTypes.delete(tp);
          chip.classList.remove('active');
        } else {
          currentTypes.add(tp);
          chip.classList.add('active');
        }
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
      showToast('已清除框选区域');
    }

    // ESC退出框选
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isRectActive) exitRectMode();
    });

    // 点击地图marker直接跳详情（复用完整详情流程：学区+小区+房源）
    window.onSchoolMarkerClick = async function(school) {
      await openSchoolDetail(school.name);
    };

    // 点击地图空白处：关闭详情抽屉（遮罩已不拦截点击）
    window.onMapBlankClick = function() {
      Sidebar.close();
    };

    // 框选区域后显示学校列表（遵循当前学段/性质筛选；无筛选时框选全部，保证有反馈）
    window.onBoundsFilter = function(bounds) {
      const pool = (currentLevels.size || currentTypes.size) ? filteredSchools : allSchools;
      const inBounds = pool.filter(s => {
        if (!s.location || !s.location.lng) return false;
        return bounds.contains([s.location.lng, s.location.lat]);
      });
      showSchoolList(inBounds, '框选区域内学校');
      // 地图上高亮这些学校
      MapManager.highlightSchools(inBounds);
      // 不清除框选模式，方便连续框选；显示已选数量反馈
      document.getElementById('rectBtn').textContent = `✓ 已选${inBounds.length}所`;
      document.getElementById('rectClearBtn').style.display = 'block';
      showToast(`已选 ${inBounds.length} 所学校`);
    };

    // 地图移动/缩放后自动标识视野内学校（zoom>=14；仅在用户选择了学段/性质筛选后启用）
    window.onMapMoveEnd = function() {
      // 未选择任何学段/性质：保持地图纯净，不自动标识
      if (currentLevels.size === 0 && currentTypes.size === 0) {
        MapManager.clearVisibleSchools();
        return;
      }
      const zoom = MapManager.getMap() ? MapManager.getMap().getZoom() : 0;
      if (zoom >= 14) {
        const count = MapManager.showVisibleSchools(filteredSchools, 14);
        if (count > 0) {
          showToast(`当前视野内 ${count} 所学校`);
        }
      } else {
        MapManager.clearVisibleSchools();
      }
    };
  }

  async function doSearch() {
    hideSuggestions();
    const input = document.getElementById('searchInput');
    const name = input.value.trim();
    if (!name) return;

    showLoading('正在搜索...');
    Sidebar.open();

    // 先做模糊搜索，找所有匹配的学校
    const allSchools = await DataLoader.getSchools();
    const lowerName = name.toLowerCase();
    
    // 模糊匹配：包含关键字即算匹配
    const matches = allSchools.filter(s => 
      s.name.toLowerCase().includes(lowerName)
    );

    hideLoading();

    if (matches.length === 0) {
      Sidebar.showError(`未找到包含「${name}」的学校，请尝试其他关键字`);
      return;
    }

    if (matches.length === 1) {
      // 只有一个结果，直接打开详情
      await openSchoolDetail(matches[0].name);
    } else {
      // 多个结果，显示候选列表让用户选择
      showSearchCandidates(matches, name);
    }
  }

  // 显示搜索候选列表
  function showSearchCandidates(matches, keyword) {
    const content = document.getElementById('drawerContent');
    
    const sorted = [...matches].sort((a, b) => {
      // 精确匹配排前面，然后按评分排序
      const aExact = a.name === keyword ? 0 : 1;
      const bExact = b.name === keyword ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return (b.score || 0) - (a.score || 0);
    });

    const listHTML = sorted.map((s, i) => {
      const levelText = s.level === 'primary' ? '小学' : s.level === 'junior' ? '初中' : s.level === 'high' ? '高中' : '幼儿园';
      return `
      <div onclick="SearchManager.listItemClick('${s.name.replace(/'/g, "\\'")}')" style="
        display:flex;align-items:center;gap:10px;padding:12px 0;
        border-bottom:1px solid #f5f5f5;cursor:pointer;
      ">
        <div style="
          width:28px;height:28px;line-height:28px;text-align:center;
          background:#e6f7ff;border-radius:50%;font-size:13px;
          color:#1890ff;flex-shrink:0;font-weight:500;
        ">${i + 1}</div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:500;">${s.name}</div>
          <div style="font-size:12px;color:#999;margin-top:2px;">
            ${s.district || ''} · ${levelText}
            ${s.score ? ` · ⭐${s.score}` : ''}
          </div>
        </div>
        <div style="color:#ccc;font-size:16px;">›</div>
      </div>`;
    }).join('');

    content.innerHTML = `
      <div style="margin-bottom:16px;">
        <div style="font-size:16px;font-weight:600;">搜索「${keyword}」</div>
        <div style="font-size:12px;color:#999;margin-top:4px;">找到 ${matches.length} 个匹配结果，请选择</div>
      </div>
      ${listHTML}
    `;
  }

  // 统一学区高亮：coords多边形 > roadNames道路 > roads文本 > 圆
  function highlightZoneForDetail(detail) {
    const zone = detail.zone;
    if (!zone) { MapManager.clearZoneHighlights(); return; }

    if (zone.coords && zone.coords.length) {
      MapManager.highlightZone(zone.coords);
      return;
    }
    const roadsArr = (zone.roadNames && zone.roadNames.length) ? zone.roadNames
      : (zone.roads ? zone.roads.split('；').filter(Boolean) : []);
    MapManager.highlightZoneRoads(roadsArr, detail.location ? detail.location.lng : null,
      detail.location ? detail.location.lat : null, zone.communities || []);
  }

  // 打开学校详情（共用函数）
  async function openSchoolDetail(name) {
    showLoading('正在查询学校信息...');
    const result = await DataLoader.querySchoolDetail(name);
    hideLoading();

    if (result && result.success) {
      Sidebar.renderSchoolDetail(result.data);
      if (result.data.location) {
        MapManager.flyTo(result.data.location.lng, result.data.location.lat, 15);
        MapManager.markSchool(result.data.location.lng, result.data.location.lat, result.data.name);
      }
      highlightZoneForDetail(result.data);
      // 标注学区内小区（绿色🏠点，点击弹卡片带房产外链）
      if (result.data.zone && result.data.zone.communityDetails && result.data.zone.communityDetails.length) {
        MapManager.showCommunityMarkers(result.data.zone.communityDetails);
      }
      if (result.data.houses) {
        MapManager.showHouseMarkers(result.data.houses);
      }
    } else {
      Sidebar.showError(`未找到「${name}」的详细信息`);
    }
  }

  async function applyFilters() {
    const schools = await DataLoader.getSchools();
    allSchools = schools;
    let filtered = schools;

    if (currentDistrict !== 'all') {
      filtered = filtered.filter(s => s.district === currentDistrict);
    }
    if (currentLevels.size) {
      filtered = filtered.filter(s => currentLevels.has(s.level));
    }
    if (currentTypes.size) {
      filtered = filtered.filter(s => s.type && currentTypes.has(s.type));
    }

    filteredSchools = filtered;

    // 没有任何学段/性质筛选时：默认只显示地图，不显示学校标识
    if (currentLevels.size === 0 && currentTypes.size === 0) {
      MapManager.showSchools([]);
      MapManager.clearVisibleSchools();
      return;
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
    hideSuggestions();
    await openSchoolDetail(name);
  }

  // 显示搜索联想下拉
  async function showSuggestions(keyword) {
    hideSuggestions();
    if (!keyword || keyword.length < 1) return;

    const schools = await DataLoader.getSchools();
    const lower = keyword.toLowerCase();
    let matches = schools.filter(s => s.name.toLowerCase().includes(lower));

    // 排序：前缀匹配 > 包含匹配
    matches.sort((a, b) => {
      const aPre = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
      const bPre = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
      if (aPre !== bPre) return aPre - bPre;
      return (b.score || 0) - (a.score || 0);
    });
    matches = matches.slice(0, 8); // 最多8个

    if (!matches.length) return;

    const box = document.createElement('div');
    box.id = 'suggestBox';
    box.style.cssText = `
      position:absolute;top:100%;left:0;right:0;z-index:500;
      background:#fff;border-radius:0 0 12px 12px;
      box-shadow:0 6px 20px rgba(0,0,0,0.15);
      max-height:320px;overflow-y:auto;
    `;

    box.innerHTML = matches.map(s => {
      const levelText = s.level === 'primary' ? '小学' : s.level === 'junior' ? '初中' : s.level === 'high' ? '高中' : '幼儿园';
      return `
      <div onclick="SearchManager.listItemClick('${s.name.replace(/'/g, "\\'")}')" style="
        display:flex;align-items:center;gap:10px;padding:10px 12px;
        border-bottom:1px solid #f5f5f5;cursor:pointer;
      ">
        <span style="
          width:22px;height:22px;line-height:22px;text-align:center;border-radius:50%;
          font-size:11px;color:#fff;flex-shrink:0;
          background:${s.level === 'primary' ? '#1677ff' : s.level === 'junior' ? '#722ed1' : s.level === 'high' ? '#fa8c16' : '#52c41a'};
        ">${levelText[0]}</span>
        <div style="flex:1;font-size:13px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${highlightKeyword(s.name, keyword)}
        </div>
        <span style="font-size:11px;color:#999;flex-shrink:0;">${s.district || ''}</span>
      </div>`;
    }).join('');

    const searchBox = document.getElementById('searchBox');
    if (searchBox) searchBox.appendChild(box);
  }

  function highlightKeyword(text, keyword) {
    const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx < 0) return text;
    return text.slice(0, idx) + `<span style="color:#1677ff;font-weight:600;">` +
      text.slice(idx, idx + keyword.length) + `</span>` + text.slice(idx + keyword.length);
  }

  function hideSuggestions() {
    const box = document.getElementById('suggestBox');
    if (box) box.remove();
  }

  // Toast 轻提示
  function showToast(msg) {
    let toast = document.getElementById('globalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalToast';
      toast.style.cssText = `
        position:fixed;top:70px;left:50%;transform:translateX(-50%);
        background:rgba(0,0,0,0.8);color:#fff;padding:8px 18px;
        border-radius:20px;font-size:13px;z-index:1000;
        transition:opacity .3s;pointer-events:none;max-width:80%;text-align:center;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 1800);
  }

  function showLoading(text) {
    document.getElementById('loadingMask').style.display = 'flex';
    if (text) document.getElementById('loadingText').textContent = text;
  }

  function hideLoading() {
    document.getElementById('loadingMask').style.display = 'none';
  }

  return { init, applyFilters, showLoading, hideLoading, listItemClick, showToast, hideSuggestions };
})();
