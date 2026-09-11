// 主入口
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化地图
  MapManager.init();

  // 初始化搜索/筛选
  SearchManager.init();

  // 初始化侧边栏
  Sidebar.init();

  // 加载基线学校数据并展示
  const schools = await DataLoader.getSchools();
  if (schools && schools.length) {
    MapManager.showSchools(schools);
  }

  console.log('ChildEdu 学区地图已加载', `共 ${schools ? schools.length : 0} 所学校`);
});
