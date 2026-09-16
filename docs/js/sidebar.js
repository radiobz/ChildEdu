// 侧边栏/抽屉渲染
const Sidebar = (() => {
  let isOpen = false;
  let isExpanded = false;

  function init() {
    const drawer = document.getElementById('drawer');
    const mask = document.getElementById('drawerMask');
    const handle = drawer.querySelector('.drawer-handle');

    // 点击遮罩关闭
    mask.addEventListener('click', close);

    // 点击手柄切换展开/收起
    handle.addEventListener('click', () => {
      if (isExpanded) collapse();
      else expand();
    });
  }

  function open() {
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerMask').classList.add('show');
    isOpen = true;
  }

  function close() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawer').classList.remove('expanded');
    document.getElementById('drawerMask').classList.remove('show');
    isOpen = false;
    isExpanded = false;
  }

  function expand() {
    document.getElementById('drawer').classList.add('expanded');
    isExpanded = true;
  }

  function collapse() {
    document.getElementById('drawer').classList.remove('expanded');
    isExpanded = false;
  }

  function showSchoolCard(school) {
    open();
    const content = document.getElementById('drawerContent');
    content.innerHTML = `
      <div class="school-header">
        <div class="name">${school.name || '未知学校'}</div>
        <div class="tags">
          <span class="tag">${getLevelText(school.level)}</span>
          ${school.district ? `<span class="tag">${school.district}</span>` : ''}
          ${school.tags ? school.tags.map(t => `<span class="tag">${t}</span>`).join('') : ''}
        </div>
      </div>
      <div class="info-section">
        <div class="section-title">学校信息</div>
        <div class="section-body">
          ${school.address ? `📍 ${school.address}<br>` : ''}
          ${school.phone ? `📞 ${school.phone}<br>` : ''}
          ${school.score ? `⭐ 评分：${school.score}（非官方，仅供参考）` : ''}
        </div>
      </div>
      <div class="disclaimer">
        数据来源于公开信息整理，仅供参考。学区划分以教育局当年公布为准。
      </div>
    `;
  }

  function renderSchoolDetail(data, fromName) {
    open();
    const content = document.getElementById('drawerContent');

    // 升学链 HTML（节点可点击）
    let pathwayHTML = '';
    if (data.pathways) {
      const nodes = [];
      nodes.push(`<div class="pathway-node">${data.pathways.primary || data.name}</div>`);
      if (data.pathways.junior && data.pathways.junior.length) {
        nodes.push(`<div class="pathway-arrow">→</div>`);
        data.pathways.junior.forEach(j => {
          nodes.push(`<div class="pathway-node clickable" onclick="Sidebar.navigateTo('${j}')">${j}</div>`);
        });
      }
      if (data.pathways.high && data.pathways.high.length) {
        nodes.push(`<div class="pathway-arrow">→</div>`);
        data.pathways.high.forEach(h => {
          nodes.push(`<div class="pathway-node clickable" onclick="Sidebar.navigateTo('${h}')">${h}</div>`);
        });
      }
      pathwayHTML = `<div class="pathway-chain">${nodes.join('')}</div>`;
      if (data.pathways.notes) {
        pathwayHTML += `<div style="font-size:11px;color:#999;margin-top:6px;">ℹ️ ${data.pathways.notes}</div>`;
      }
    }

    // 学区小区 + 深链
    let communityHTML = '';
    if (data.zone && data.zone.communities && data.zone.communities.length) {
      const chips = data.zone.communities.map(c => {
        // 高德 URI：手机直接打开即小区地图定位，最稳定
        const amapUrl = `https://uri.amap.com/search?keyword=${encodeURIComponent(c)}&city=610100`;
        // 安居客/58：房源平台备选（贝壳西安站近期不稳定）
        const anjukeUrl = `https://xian.anjuke.com/community/rs${encodeURIComponent(c)}/`;
        const wubaUrl = `https://xian.58.com/xiaoqu/rs${encodeURIComponent(c)}/`;
        return `<div class="community-chip">
          ${c}
          <a href="${amapUrl}" target="_blank" rel="noopener" style="color:#1677ff;margin-left:4px;font-size:11px;">📍定位</a>
          <a href="${anjukeUrl}" target="_blank" rel="noopener" style="color:#00b578;margin-left:4px;font-size:11px;">安居客</a>
          <a href="${wubaUrl}" target="_blank" rel="noopener" style="color:#fa541c;margin-left:4px;font-size:11px;">58</a>
        </div>`;
      }).join('');
      communityHTML = `<div class="community-list">${chips}</div>`;
    } else if (data.name) {
      // 没有小区数据，给一个搜学区房的链接
      const amapUrl = `https://uri.amap.com/search?keyword=${encodeURIComponent(data.name)}&city=610100`;
      const anjukeUrl = `https://xian.anjuke.com/community/rs${encodeURIComponent(data.name)}/`;
      const wubaUrl = `https://xian.58.com/xiaoqu/rs${encodeURIComponent(data.name)}/`;
      communityHTML = `<div style="padding:8px 0;font-size:12px;color:#666;">
        <a href="${amapUrl}" target="_blank" rel="noopener" style="color:#1677ff;">📍 地图定位「${data.name}」</a>
        <span style="margin:0 4px;color:#ddd;">|</span>
        <a href="${anjukeUrl}" target="_blank" rel="noopener" style="color:#00b578;">安居客</a>
        <span style="margin:0 4px;color:#ddd;">|</span>
        <a href="${wubaUrl}" target="_blank" rel="noopener" style="color:#fa541c;">58房源</a>
      </div>`;
    }

    // 房源信息
    let housesHTML = '';
    if (data.houses && data.houses.length) {
      housesHTML = data.houses.map(h => `
        <div style="padding:8px 0;border-bottom:1px solid #f5f5f5;">
          <div style="font-weight:500;">${h.community}</div>
          <div style="font-size:12px;color:#666;margin-top:2px;">
            均价：${h.price || '暂无'} · ${h.year || ''}
            ${h.url ? ` · <a href="${h.url}" target="_blank" rel="noopener" style="color:#1677ff;">查看详情</a>` : ''}
          </div>
        </div>
      `).join('');
    }

    // 避坑点
    let pitfallsHTML = '';
    if (data.pitfalls && data.pitfalls.length) {
      pitfallsHTML = `<ul class="pitfall-list">${data.pitfalls.map(p => `<li>${p}</li>`).join('')}</ul>`;
    }

    // 办学质量分维度
    let qualityHTML = '';
    if (data.quality) {
      const q = data.quality;
      const rows = [];
      if (q.tier) rows.push(['梯队定位', q.tier]);
      if (q.teaching) rows.push(['师资教学', q.teaching]);
      if (q.homework) rows.push(['作业/晚自习', q.homework]);
      if (q.cafeteria) rows.push(['食堂伙食', q.cafeteria]);
      if (q.afterSchool) rows.push(['课后服务', q.afterSchool]);
      if (q.students) rows.push(['生源结构', q.students]);
      if (q.admission) rows.push(['升学情况', q.admission]);
      if (q.lottery) rows.push(['摇号比例', q.lottery]);
      if (q.choiceAdvice) rows.push(['择校建议', q.choiceAdvice]);
      if (q.housePrice) rows.push(['学区房价', q.housePrice]);
      if (q.class_type) rows.push(['班型教学', q.class_type]);
      if (q.facilities) rows.push(['硬件地段', q.facilities]);
      if (q.contact) rows.push(['联系方式', q.contact]);

      qualityHTML = rows.map(([label, val]) => `
        <div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #f5f5f5;">
          <div style="flex-shrink:0;width:60px;font-size:12px;color:#999;">${label}</div>
          <div style="flex:1;font-size:13px;color:#333;line-height:1.6;">${val}</div>
        </div>
      `).join('');

      if (q.verdict) {
        qualityHTML += `<div style="margin-top:10px;padding:10px;background:#f0f7ff;border-radius:8px;font-size:13px;color:#1677ff;line-height:1.6;">💡 ${q.verdict}</div>`;
      }
      if (q.suitable) {
        qualityHTML += `<div style="margin-top:8px;font-size:12px;color:#666;line-height:1.6;">👥 ${q.suitable}</div>`;
      }
    }

    content.innerHTML = `
      ${fromName ? `
        <div style="margin-bottom:12px;">
          <button onclick="Sidebar.goBack()" style="
            padding:6px 14px;background:#f5f5f5;border-radius:16px;
            font-size:13px;color:#1677ff;cursor:pointer;border:none;
          ">← 返回 ${fromName}</button>
        </div>
      ` : ''}
      <div class="school-header">
        <div class="name">${data.name || ''}</div>
        <div class="tags">
          ${data.school_type ? `<span class="tag">${data.school_type}</span>` : ''}
          ${data.district ? `<span class="tag">${data.district}</span>` : ''}
          ${data.year ? `<span class="tag warn">${data.year}年数据</span>` : ''}
        </div>
      </div>

      ${data.tuition ? `
        <div class="info-section">
          <div class="section-title">基本信息</div>
          <div class="section-body">
            💰 ${data.tuition}
          </div>
        </div>
      ` : ''}

      ${qualityHTML ? `
        <div class="info-section">
          <div class="section-title">办学质量（非官方，仅供参考）</div>
          <div class="section-body">${qualityHTML}</div>
        </div>
      ` : ''}

      ${pathwayHTML ? `
        <div class="info-section">
          <div class="section-title">升学路径</div>
          <div class="section-body">${pathwayHTML}</div>
        </div>
      ` : ''}

      ${communityHTML ? `
        <div class="info-section">
          <div class="section-title">学区小区</div>
          <div class="section-body">${communityHTML}</div>
        </div>
      ` : ''}

      ${housesHTML ? `
        <div class="info-section">
          <div class="section-title">学区房源</div>
          <div class="section-body">${housesHTML}</div>
        </div>
      ` : ''}

      ${pitfallsHTML ? `
        <div class="info-section">
          <div class="section-title">⚠️ 避坑提醒</div>
          <div class="section-body">${pitfallsHTML}</div>
        </div>
      ` : ''}

      <div class="disclaimer">
        办学质量评价由 AI 从公开信息聚合，非官方排名，仅供参考。<br>
        学区划分以教育局当年公布为准；升学路径非官方直升表。<br>
        房源价格来自公开平台，具体以实际成交为准。
      </div>
    `;
  }

  function showError(msg) {
    open();
    document.getElementById('drawerContent').innerHTML = `
      <div class="drawer-empty">
        <p>😕 ${msg}</p>
        <p class="hint">你可以尝试：输入学校全称，或检查网络后重试</p>
      </div>
    `;
  }

  function getLevelText(level) {
    const map = { kindergarten: '幼儿园', primary: '小学', junior: '初中', high: '高中' };
    return map[level] || '学校';
  }

  // 历史栈：用于升学链跳转后的返回
  let navStack = [];

  async function navigateTo(schoolName) {
    SearchManager.showLoading('正在查询...');
    const result = await DataLoader.querySchoolDetail(schoolName);
    SearchManager.hideLoading();

    if (result && result.success) {
      // 把当前页面push到栈里
      const currentName = document.querySelector('.school-header .name')?.textContent;
      navStack.push(currentName);

      renderSchoolDetail(result.data, currentName);

      // 地图flyTo
      if (result.data.location) {
        MapManager.flyTo(result.data.location.lng, result.data.location.lat, 15);
      }
      // 清学区高亮（初中/高中一般没有学区）
      MapManager.clearZoneHighlights();
      MapManager.clearHouseMarkers();
    } else {
      showError(`未找到「${schoolName}」的详细信息`);
    }
  }

  async function goBack() {
    if (navStack.length === 0) return;
    const prevName = navStack.pop();
    if (!prevName) return;

    SearchManager.showLoading('正在返回...');
    const result = await DataLoader.querySchoolDetail(prevName);
    SearchManager.hideLoading();

    if (result && result.success) {
      renderSchoolDetail(result.data, navStack.length > 0 ? navStack[navStack.length-1] : null);
      if (result.data.location) {
        MapManager.flyTo(result.data.location.lng, result.data.location.lat, 15);
      }
      // 恢复学区高亮
      if (result.data.zone && result.data.zone.coords) {
        MapManager.highlightZone(result.data.zone.coords);
      }
      if (result.data.houses) {
        MapManager.showHouseMarkers(result.data.houses);
      }
    }
  }

  return { init, open, close, showSchoolCard, renderSchoolDetail, showError, navigateTo, goBack };
})();

// 暴露到全局供 onclick 调用
window.Sidebar = Sidebar;
