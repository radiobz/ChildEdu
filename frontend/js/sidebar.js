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

  function renderSchoolDetail(data) {
    open();
    const content = document.getElementById('drawerContent');

    // 升学链 HTML
    let pathwayHTML = '';
    if (data.pathways) {
      const nodes = [];
      nodes.push(`<div class="pathway-node">${data.pathways.primary || data.name}</div>`);
      if (data.pathways.junior && data.pathways.junior.length) {
        nodes.push(`<div class="pathway-arrow">→</div>`);
        nodes.push(`<div class="pathway-node">${data.pathways.junior.join('、')}</div>`);
      }
      if (data.pathways.high && data.pathways.high.length) {
        nodes.push(`<div class="pathway-arrow">→</div>`);
        nodes.push(`<div class="pathway-node">${data.pathways.high.join('、')}</div>`);
      }
      pathwayHTML = `<div class="pathway-chain">${nodes.join('')}</div>`;
      if (data.pathways.notes) {
        pathwayHTML += `<div style="font-size:11px;color:#999;margin-top:6px;">ℹ️ ${data.pathways.notes}</div>`;
      }
    }

    // 学区小区 + 深链
    let communityHTML = '';
    if (data.zone && data.zone.communities) {
      const chips = data.zone.communities.map(c => {
        // 生成贝壳/链家深链
        const beikeUrl = `https://xian.ke.com/xiaoqu/rs${encodeURIComponent(c)}/`;
        const lianjiaUrl = `https://xian.lianjia.com/xiaoqu/rs${encodeURIComponent(c)}/`;
        return `<div class="community-chip">
          ${c}
          <a href="${beikeUrl}" target="_blank" rel="noopener" style="color:#1677ff;margin-left:4px;font-size:11px;">贝壳</a>
          <a href="${lianjiaUrl}" target="_blank" rel="noopener" style="color:#1677ff;margin-left:4px;font-size:11px;">链家</a>
        </div>`;
      }).join('');
      communityHTML = `<div class="community-list">${chips}</div>`;
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

    content.innerHTML = `
      <div class="school-header">
        <div class="name">${data.name || ''}</div>
        <div class="tags">
          ${data.school_type ? `<span class="tag">${data.school_type}</span>` : ''}
          ${data.district ? `<span class="tag">${data.district}</span>` : ''}
          ${data.year ? `<span class="tag warn">${data.year}年数据</span>` : ''}
        </div>
      </div>

      ${pathwayHTML ? `
        <div class="info-section">
          <div class="section-title">升学路径</div>
          <div class="section-body">${pathwayHTML}</div>
        </div>
      ` : ''}

      ${data.tuition || data.rank ? `
        <div class="info-section">
          <div class="section-title">学校信息</div>
          <div class="section-body">
            ${data.tuition ? `💰 学费：${data.tuition}<br>` : ''}
            ${data.rank ? `📊 排名：${data.rank}（非官方，仅供参考）<br>` : ''}
            ${data.rating ? `⭐ 评价：${data.rating}` : ''}
          </div>
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
        数据由 AI 从公开信息聚合，标注来源与年份，仅供参考。<br>
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

  return { init, open, close, showSchoolCard, renderSchoolDetail, showError };
})();
