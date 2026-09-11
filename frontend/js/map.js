// 地图核心逻辑
const MapManager = (() => {
  let map = null;
  let markerCluster = null;
  let currentMarkers = [];
  let zonePolygons = [];
  let houseMarkers = [];
  let mouseTool = null;

  function init() {
    map = new AMap.Map('mapContainer', {
      center: window.APP_CONFIG.DEFAULT_CENTER,
      zoom: window.APP_CONFIG.DEFAULT_ZOOM,
      viewMode: '2D',
      resizeEnable: true
    });

    // 点聚合
    markerCluster = new AMap.MarkerCluster(map, [], {
      gridSize: 70,
      maxZoom: 16,
      renderClusterMarker: function(context) {
        const count = context.markers.length;
        let color = '#1677ff'; // 蓝 <10
        if (count >= 50) color = '#ff4d4f';
        else if (count >= 10) color = '#722ed1';
        context.marker.setContent(
          `<div style="
            width:36px;height:36px;line-height:36px;text-align:center;
            background:${color};color:#fff;border-radius:50%;
            font-size:12px;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,0.3);
          ">${count}</div>`
        );
        context.marker.setOffset(new AMap.Pixel(-18, -18));
      },
      renderMarker: function(context) {
        const data = context.data;
        context.marker.setContent(
          `<div style="
            width:24px;height:24px;line-height:24px;text-align:center;
            background:#fff;border:2px solid #1677ff;border-radius:50%;
            font-size:10px;font-weight:600;color:#1677ff;
            box-shadow:0 1px 4px rgba(0,0,0,0.2);
          ">${getLevelIcon(data.level)}</div>`
        );
        context.marker.setOffset(new AMap.Pixel(-12, -12));
      }
    });

    // 框选工具
    map.plugin(['AMap.MouseTool'], function() {
      mouseTool = new AMap.MouseTool(map);
      mouseTool.on('draw', function(e) {
        const bounds = e.obj.getBounds();
        filterByBounds(bounds);
        mouseTool.close(false);
      });
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

  function showSchools(schools) {
    // 清除旧 markers
    currentMarkers.forEach(m => m.setMap(null));
    currentMarkers = [];

    schools.forEach(school => {
      if (!school.location || !school.location.lng) return;
      const marker = new AMap.Marker({
        position: [school.location.lng, school.location.lat],
        title: school.name
      });
      marker.setExtData(school);
      marker.on('click', () => {
        Sidebar.showSchoolCard(school);
      });
      currentMarkers.push(marker);
    });

    markerCluster.setData(currentMarkers);
  }

  function flyTo(lng, lat, zoom = 15) {
    if (!map) return;
    map.setZoomAndCenter(zoom, [lng, lat], false, 700);
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

  function filterByBounds(bounds) {
    // 通知外部筛选框内学校
    if (window.onBoundsFilter) window.onBoundsFilter(bounds);
  }

  function startRectangle() {
    if (mouseTool) mouseTool.rectangle();
  }

  return {
    init,
    showSchools,
    flyTo,
    highlightZone,
    clearZoneHighlights,
    showHouseMarkers,
    clearHouseMarkers,
    startRectangle,
    getMap: () => map
  };
})();
