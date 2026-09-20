// 主入口
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化地图
  MapManager.init();

  // 初始化搜索/筛选
  SearchManager.init();

  // 初始化侧边栏
  Sidebar.init();

  // 默认只显示地图，不加载/展示全部学校标识（用户选择学段/性质筛选或搜索学校后再显示）
  const schools = await DataLoader.getSchools();
  console.log('ChildEdu 学区地图已加载', `共 ${schools ? schools.length : 0} 所学校`);
});
