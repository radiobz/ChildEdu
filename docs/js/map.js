// 地图核心逻辑
const MapManager = (() => {
  let map = null;
  let currentMarkers = [];
  let zonePolygons = [];
  let houseMarkers = [];
  let mouseTool = null;
  let currentBounds = null;

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
        const bounds = e.obj.getBounds();
        currentBounds = bounds;
        if (window.onBoundsFilter) window.onBoundsFilter(bounds);
        mouseTool.close(false);
      });
    });

    // 地图移动结束后自动筛选当前视野内学校
    map.on('moveend', function() {
      if (window.onMapMoveEnd) window.onMapMoveEnd();
    });
    map.on('zoomend', function() {
      if (window.onMapMoveEnd) window.onMapMoveEnd();
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
    if (mouseTool) mouseTool.rectangle();
  }

  function stopRectangle() {
    if (mouseTool) mouseTool.close(false);
  }

  return {
    init,
    showSchools,
    flyTo,
    getBounds,
    highlightZone,
    clearZoneHighlights,
    showHouseMarkers,
    clearHouseMarkers,
    startRectangle,
    stopRectangle,
    getMap: () => map
  };
})();
