#!/usr/bin/env python3
"""把school_zones.json中存在的学校补进schools.json（学区为权威）"""
import json, re

DATA = '/home/user/Doubao/chats/38440640968808450/ChildEdu/data'
schools = json.load(open(f'{DATA}/schools.json'))
zones = json.load(open(f'{DATA}/school_zones.json'))

schools_by_name = {s['name']: s for s in schools}
# 也建立宽松索引：去掉区前缀的名字
schools_by_short = {}
for s in schools:
    short = re.sub(r'^(西安市|西安|西安市新城区|新城区|碑林区|莲湖区|雁塔区|未央区|灞桥区|长安区|临潼区|阎良区|高陵区|鄠邑区|蓝田县|周至县)', '', s['name'])
    schools_by_short[short] = s

added = 0
for z in zones:
    zn = z['schoolName']
    if zn in schools_by_name:
        continue
    # 尝试用短名匹配
    short_zn = re.sub(r'^(西安市|西安|西安市新城区|新城区|碑林区|莲湖区|雁塔区|未央区|灞桥区|长安区|临潼区|阎良区|高陵区|鄠邑区|蓝田县|周至县)', '', zn)
    if short_zn in schools_by_short:
        continue
    # 没有则新增
    schools.append({
        'name': zn,
        'district': z.get('district', ''),
        'stage': z.get('stage', '小学'),
        'address': '',
        'latitude': None,
        'longitude': None,
        'qualityDetail': {
            'tier': '学区已收录',
            'summary': '学区数据已收录，学校基础信息待补充'
        }
    })
    schools_by_name[zn] = schools[-1]
    added += 1

print(f'新增学校: {added}')
print(f'总学校: {len(schools)}')

# 统计有经纬度的学校
with_loc = sum(1 for s in schools if s.get('longitude') and s.get('latitude'))
with_loc2 = sum(1 for s in schools if s.get('location'))
print(f'有经纬度(latitude/longitude): {with_loc}')
print(f'有经纬度(location字段): {with_loc2}')

json.dump(schools, open(f'{DATA}/schools.json', 'w'), ensure_ascii=False, indent=2)
