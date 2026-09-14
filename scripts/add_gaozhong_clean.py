#!/usr/bin/env python3
"""解析高中招生计划，添加到schools.json和school_zones.json，同时清理错误数据"""
import json, re

DATA = '/home/user/Doubao/chats/38440640968808450/ChildEdu/data'
schools = json.load(open(f'{DATA}/schools.json'))
schools_by_name = {s['name']: s for s in schools}
zones = json.load(open(f'{DATA}/school_zones.json'))
zones_by_name = {z['schoolName']: z for z in zones}

# 解析高中
txt = open(f'{DATA}/gaozhong.txt').read()
lines = txt.split('\n')
current_district = ''
count = 0

for line in lines:
    # 区名行
    m_district = re.match(r'^\s*(阎良区|临潼区|长安区|高陵区|鄠邑区|蓝田县|周至县|西咸新区)\s+\d+', line)
    if m_district:
        current_district = m_district.group(1)
        continue
    
    # 学校行
    m = re.match(r'^\s*\d+\s+(.+?)\s+\d+', line)
    if m:
        name = m.group(1).strip()
        # 去掉括号里的省示范/省标/普高
        name_clean = re.sub(r'\(.*?\)', '', name).strip()
        
        # 添加到schools.json
        if name_clean not in schools_by_name:
            schools.append({
                'name': name_clean,
                'district': current_district,
                'stage': '高中',
                'address': f'{current_district}',
                'latitude': None,
                'longitude': None,
                'qualityDetail': {
                    'tier': name,
                    'summary': f'{current_district}公办高中'
                }
            })
            schools_by_name[name_clean] = schools[-1]
            count += 1
        
        # 添加到school_zones.json
        if name_clean not in zones_by_name:
            zones.append({
                'schoolName': name_clean,
                'district': current_district,
                'stage': '高中',
                'communities': [],
                'roads': [f'{current_district}辖区'],
                'sourceUrl': '西安市教育局2026',
                'year': '2026'
            })
            zones_by_name[name_clean] = zones[-1]

# 清理错误数据：删除没有经纬度且地址为空的学校
cleaned_schools = []
removed = 0
for s in schools:
    # 保留幼儿园和有学区数据的学校
    if s['stage'] == '幼儿园' or s['name'] in zones_by_name:
        cleaned_schools.append(s)
    else:
        removed += 1

schools = cleaned_schools

json.dump(schools, open(f'{DATA}/schools.json', 'w'), ensure_ascii=False, indent=2)
json.dump(zones, open(f'{DATA}/school_zones.json', 'w'), ensure_ascii=False, indent=2)
print(f'新增高中: {count}')
print(f'清理无效学校: {removed}')
print(f'总学校: {len(schools)}')
print(f'总学区: {len(zones)}')
