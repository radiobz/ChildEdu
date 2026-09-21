// 地图核心逻辑
const MapManager = (() => {
  let map = null;
  let currentMarkers = [];
  let zonePolygons = [];
  let zoneRoadLabels = []; // 学区道路标签
  let zoneCircle = null; // 学区圆形范围
  let houseMarkers = [];
  let mouseTool = null;
  let currentRect = null;
  let currentBounds = null;
  let highlightMarkers = []; // 高亮的学校点
  let pulseMarker = null; // 当前选中的脉冲标记
  let autoMarkers = []; // 视野内自动标识
  let rectActive = false; // 是否处于框选模式
  let communityMarkers = []; // 学区内小区标注
  let communityInfoWin = null; // 小区信息窗

  function init() {
    map = new AMap.Map('mapContainer', {
      center: window.APP_CONFIG.DEFAULT_CENTER,
      zoom: window.APP_CONFIG.DEFAULT_ZOOM,
      viewMode: '2D',
      resizeEnable: true
    });

    // 框选工具
    map.plugin(['AMap.MouseTool'], function() {
      mouseTool = new AMap.MouseTool(map);
      mouseTool.on('draw', function(e) {
        // 清除旧矩形
        if (currentRect) { currentRect.setMap(null); currentRect = null; }
        currentRect = e.obj;
        const bounds = e.obj.getBounds();
        currentBounds = bounds;
        if (window.onBoundsFilter) window.onBoundsFilter(bounds);
      });
    });

    // 地图移动结束后自动筛选当前视野内学校
    map.on('moveend', function() {
      if (window.onMapMoveEnd) window.onMapMoveEnd();
    });
    map.on('zoomend', function() {
      if (window.onMapMoveEnd) window.onMapMoveEnd();
    });

    // 点击地图空白处：取消学区高亮 + 清除学校定位 + 关闭详情抽屉（框选模式下不干扰）
    map.on('click', function(e) {
      if (rectActive) return;
      // e.target 为覆盖物（marker等）时不取消，交给对应点击逻辑
      if (e.target && e.target.getPosition && typeof e.target.getPosition === 'function') return;
      clearZoneHighlights();
      clearMarkSchool();
      if (window.onMapBlankClick) window.onMapBlankClick();
    });
  }

  function getLevelIcon(level) {
    switch(level) {
      case 'kindergarten': return '幼';
      case 'primary': return '小';
      case 'junior': return '初';
      case 'high': return '高';
      default: return '校';
    }
  }

  function getLevelColor(level) {
    switch(level) {
      case 'kindergarten': return '#52c41a';
      case 'primary': return '#1677ff';
      case 'junior': return '#722ed1';
      case 'high': return '#fa8c16';
      default: return '#666';
    }
  }

  function showSchools(schools) {
    // 清除旧 markers
    currentMarkers.forEach(m => m.setMap(null));
    currentMarkers = [];

    schools.forEach(school => {
      if (!school.location || !school.location.lng) return;
      const color = getLevelColor(school.level);
      const marker = new AMap.Marker({
        position: [school.location.lng, school.location.lat],
        title: school.name,
        content: `<div style="
          width:26px;height:26px;line-height:26px;text-align:center;
          background:#fff;border:2px solid ${color};border-radius:50%;
          font-size:11px;font-weight:600;color:${color};
          box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:pointer;
        ">${getLevelIcon(school.level)}</div>`,
        offset: new AMap.Pixel(-13, -13),
        zIndex: 100
      });
      marker.setExtData(school);
      marker.on('click', () => {
        // 点击直接跳详情
        if (window.onSchoolMarkerClick) window.onSchoolMarkerClick(school);
      });
      marker.setMap(map);
      currentMarkers.push(marker);
    });
  }

  function flyTo(lng, lat, zoom = 15) {
    if (!map) return;
    map.setZoomAndCenter(zoom, [lng, lat], false, 700);
  }

  // 高亮框选区域内的学校
  function highlightSchools(schools) {
    // 清除旧高亮
    highlightMarkers.forEach(m => m.setMap(null));
    highlightMarkers = [];

    schools.forEach(school => {
      if (!school.location || !school.location.lng) return;
      const color = getLevelColor(school.level);
      const marker = new AMap.Marker({
        position: [school.location.lng, school.location.lat],
        content: `<div style="
          width:32px;height:32px;line-height:32px;text-align:center;
          background:${color};border:3px solid #fff;border-radius:50%;
          font-size:12px;font-weight:700;color:#fff;
          box-shadow:0 0 12px ${color};cursor:pointer;
          animation:pulse 1.5s ease-in-out infinite;
        ">${getLevelIcon(school.level)}</div>`,
        offset: new AMap.Pixel(-16, -16),
        zIndex: 200
      });
      marker.setExtData(school);
      marker.on('click', () => {
        if (window.onSchoolMarkerClick) window.onSchoolMarkerClick(school);
      });
      marker.setMap(map);
      highlightMarkers.push(marker);
    });
  }

  // 在地图上标记单个学校（红色脉冲圈）
  function markSchool(lng, lat, name) {
    // 清除旧标记
    if (pulseMarker) { pulseMarker.setMap(null); pulseMarker = null; }

    pulseMarker = new AMap.CircleMarker({
      center: [lng, lat],
      radius: 20,
      strokeColor: '#ff4d4f',
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: '#ff4d4f',
      fillOpacity: 0.2,
      map: map,
      zIndex: 300
    });

    // 中心点
    const centerMarker = new AMap.Marker({
      position: [lng, lat],
      content: `<div style="
        width:16px;height:16px;line-height:16px;text-align:center;
        background:#ff4d4f;border:3px solid #fff;border-radius:50%;
        box-shadow:0 0 10px #ff4d4f;
      "></div>`,
      offset: new AMap.Pixel(-8, -8),
      map: map,
      zIndex: 301
    });
    pulseMarker._center = centerMarker;
  }

  function clearMarkSchool() {
    if (pulseMarker) {
      pulseMarker.setMap(null);
      if (pulseMarker._center) pulseMarker._center.setMap(null);
      pulseMarker = null;
    }
  }

  function getBounds() {
    return map ? map.getBounds() : null;
  }

  // 高亮学区多边形
  function highlightZone(zoneCoords) {
    clearZoneHighlights();
    if (!zoneCoords || !zoneCoords.length) return;

    const polygon = new AMap.Polygon({
      path: zoneCoords,
      strokeColor: '#1677ff',
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: '#1677ff',
      fillOpacity: 0.15,
      map: map
    });
    zonePolygons.push(polygon);
  }

  function clearZoneHighlights() {
    zonePolygons.forEach(p => p.setMap(null));
    zonePolygons = [];
    zoneRoadLabels.forEach(m => m.setMap(null));
    zoneRoadLabels = [];
    if (zoneCircle) { zoneCircle.setMap(null); zoneCircle = null; }
    clearCommunityMarkers();
  }

  // 标注学区内小区（绿色房屋图标，点击弹信息窗带房产外链）
  function showCommunityMarkers(list) {
    clearCommunityMarkers();
    if (!list || !list.length) return;

    list.forEach(cm => {
      if (!cm.location) return;
      const marker = new AMap.Marker({
        position: [cm.location[0], cm.location[1]],
        content: `<div style="
          width:24px;height:24px;line-height:24px;text-align:center;
          background:#00b894;border:2px solid #fff;border-radius:50%;
          font-size:12px;box-shadow:0 1px 4px rgba(0,0,0,0.35);cursor:pointer;
        ">🏠</div>`,
        offset: new AMap.Pixel(-12, -12),
        zIndex: 130
      });
      marker.setExtData(cm);
      marker.on('click', () => openCommunityCard(cm));
      marker.setMap(map);
      communityMarkers.push(marker);
    });
  }

  function clearCommunityMarkers() {
    communityMarkers.forEach(m => m.setMap(null));
    communityMarkers = [];
    if (communityInfoWin) { communityInfoWin.close(); communityInfoWin = null; }
  }

  function openCommunityCard(cm) {
    const amapUrl = `https://uri.amap.com/search?keyword=${encodeURIComponent(cm.name)}&city=610100`;
    const anjukeUrl = `https://xian.anjuke.com/community/rs${encodeURIComponent(cm.name)}/`;
    const wubaUrl = `https://xian.58.com/xiaoqu/rs${encodeURIComponent(cm.name)}/`;
    const html = `
      <div style="padding:4px 2px;font-size:13px;min-width:210px;">
        <div style="font-weight:600;font-size:14px;margin-bottom:2px;">🏠 ${cm.name}</div>
        ${cm.address ? `<div style="color:#999;font-size:11px;margin-bottom:6px;">${cm.address}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:6px;">
          <a href="${amapUrl}" target="_blank" rel="noopener" style="background:#1677ff;color:#fff;padding:4px 10px;border-radius:12px;font-size:12px;text-decoration:none;">📍 定位</a>
          <a href="${anjukeUrl}" target="_blank" rel="noopener" style="background:#00b578;color:#fff;padding:4px 10px;border-radius:12px;font-size:12px;text-decoration:none;">安居客</a>
          <a href="${wubaUrl}" target="_blank" rel="noopener" style="background:#fa541c;color:#fff;padding:4px 10px;border-radius:12px;font-size:12px;text-decoration:none;">58房源</a>
        </div>
      </div>`;
    if (!communityInfoWin) {
      communityInfoWin = new AMap.InfoWindow({ offset: new AMap.Pixel(0, -30), autoMove: true });
    }
    communityInfoWin.setContent(html);
    communityInfoWin.open(map, [cm.location[0], cm.location[1]]);
  }

  // 保底方案：用道路标签+半透明圆表示学区范围
  function highlightZoneRoads(roads, centerLng, centerLat, fallbackNames) {
    // 先清除旧的学区高亮，保证同时只有一个学校学区显示
    clearZoneHighlights();
    // 画半透明圆表示大致学区范围（注意：Circle 必须显式 setMap，构造参数 map 在 2.0 下不生效）
    if (centerLng && centerLat) {
      zoneCircle = new AMap.Circle({
        center: [centerLng, centerLat],
        radius: 1200,
        strokeColor: '#1677ff',
        strokeWeight: 3,
        strokeOpacity: 0.9,
        fillColor: '#1677ff',
        fillOpacity: 0.2
      });
      zoneCircle.setMap(map);
    }

    // 收集要搜索的名称：roadNames优先，其次传入roads清洗，最后fallback小区名
    let searchNames = [];
    if (roads && roads.length) searchNames = roads.filter(n => n && n.length >= 2);
    if (fallbackNames && fallbackNames.length && searchNames.length < 5) {
      fallbackNames.forEach(n => {
        if (n && n.length >= 2 && !searchNames.includes(n)) searchNames.push(n);
      });
    }
    searchNames = searchNames.slice(0, 8); // 最多8个，避免请求过多

    if (!searchNames.length || !window.AMap.PlaceSearch) return;

    const placeSearch = new AMap.PlaceSearch({
      city: '西安',
      pageSize: 1,
      pageIndex: 1
    });

    searchNames.forEach((name) => {
      // 去掉方向词等噪音
      const cleanName = String(name).replace(/[以东以西以南以北以内之外]/g, '').trim();
      if (!cleanName || cleanName.length < 2) return;

      placeSearch.search(cleanName, (status, result) => {
        if (status !== 'complete' || !result.poiList || !result.poiList.pois.length) return;
        const poi = result.poiList.pois[0];
        if (!poi.location) return;

        // 创建道路标签标记（带颜色区分：路名蓝色，小区名绿色）
        const isCommunity = !/[路街巷里大道]/.test(cleanName);
        const bg = isCommunity ? '#00b894' : '#1677ff';
        const marker = new AMap.Marker({
          position: [poi.location.lng, poi.location.lat],
          map: map,
          label: {
            content: `<div style="background:${bg};color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);">${isCommunity ? '🏠' : '📍'} ${cleanName}</div>`,
            direction: 'top'
          },
          icon: 'transparent'
        });
        zoneRoadLabels.push(marker);
      });
    });
  }

  // 在地图上标注学区房源点
  function showHouseMarkers(houses) {
    clearHouseMarkers();
    if (!houses || !houses.length) return;

    houses.forEach(h => {
      if (!h.location || !h.location.lng) return;
      const marker = new AMap.CircleMarker({
        center: [h.location.lng, h.location.lat],
        radius: 6,
        strokeColor: '#ff4d4f',
        strokeWeight: 1,
        strokeOpacity: 0.8,
        fillColor: '#ff4d4f',
        fillOpacity: 0.6,
        map: map,
        zIndex: 50
      });
      marker.on('mouseover', () => {
        marker.setLabel({
          content: `<div style="
            background:rgba(0,0,0,0.75);color:#fff;padding:4px 8px;
            border-radius:4px;font-size:12px;white-space:nowrap;
          ">${h.community} ${h.price || ''}</div>`,
          direction: 'top'
        });
      });
      houseMarkers.push(marker);
    });
  }

  function clearHouseMarkers() {
    houseMarkers.forEach(m => m.setMap(null));
    houseMarkers = [];
  }

  function startRectangle() {
    rectActive = true;
    if (mouseTool) mouseTool.rectangle();
  }

  function stopRectangle() {
    rectActive = false;
    if (mouseTool) mouseTool.close(false);
  }

  // 清除框选矩形 + 框选高亮学校点
  function clearRect() {
    if (currentRect) { currentRect.setMap(null); currentRect = null; }
    currentBounds = null;
    highlightMarkers.forEach(m => m.setMap(null));
    highlightMarkers = [];
  }

  // 视野内学校自动标识（缩放>=14时调用）
  function showVisibleSchools(schools, threshold = 14) {
    if (!map) return 0;
    const zoom = map.getZoom();
    if (zoom < threshold) {
      // 缩放级别低时清除自动高亮（避免视觉噪音）
      autoMarkers.forEach(m => m.setMap(null));
      autoMarkers = [];
      return 0;
    }
    const bounds = map.getBounds();
    if (!bounds) return 0;

    // 清除旧自动标识
    autoMarkers.forEach(m => m.setMap(null));
    autoMarkers = [];

    let count = 0;
    schools.forEach(school => {
      if (!school.location || !school.location.lng) return;
      if (!bounds.contains([school.location.lng, school.location.lat])) return;
      count++;
      const color = getLevelColor(school.level);
      const marker = new AMap.Marker({
        position: [school.location.lng, school.location.lat],
        content: `<div style="
          width:30px;height:30px;line-height:30px;text-align:center;
          background:${color};border:2.5px solid #fff;border-radius:50%;
          font-size:12px;font-weight:700;color:#fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer;
          transition:transform .15s;
        ">${getLevelIcon(school.level)}</div>`,
        offset: new AMap.Pixel(-15, -15),
        zIndex: 150
      });
      marker.setExtData(school);
      marker.on('click', () => {
        if (window.onSchoolMarkerClick) window.onSchoolMarkerClick(school);
      });
      marker.setMap(map);
      autoMarkers.push(marker);
    });
    return count;
  }

  function clearVisibleSchools() {
    autoMarkers.forEach(m => m.setMap(null));
    autoMarkers = [];
  }

  return {
    init,
    showSchools,
    flyTo,
    getBounds,
    highlightZone,
    highlightZoneRoads,
    clearZoneHighlights,
    showHouseMarkers,
    clearHouseMarkers,
    startRectangle,
    stopRectangle,
    clearRect,
    highlightSchools,
    markSchool,
    clearMarkSchool,
    showVisibleSchools,
    clearVisibleSchools,
    showCommunityMarkers,
    clearCommunityMarkers,
    getMap: () => map
  };
})();
