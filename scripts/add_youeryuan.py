#!/usr/bin/env python3
"""解析西安市幼儿园一览表，添加到schools.json和school_zones.json"""
import json, re

DATA = '/home/user/Doubao/chats/38440640968808450/ChildEdu/data'
schools = json.load(open(f'{DATA}/schools.json'))
schools_by_name = {s['name']: s for s in schools}
zones = json.load(open(f'{DATA}/school_zones.json'))
zones_by_name = {z['schoolName']: z for z in zones}

txt = open(f'{DATA}/youeryuan.txt').read()
lines = txt.split('\n')

count = 0
for line in lines:
    # 格式：学校名  幼儿园  陕西省  西安市  区  街道  社区
    m = re.match(r'^(.+?幼儿园)\s+幼儿园\s+陕西省\s+西安市\s+(.+?)\s+(.+?)\s+(.+)$', line)
    if m:
        name = m.group(1).strip()
        district = m.group(2).strip()
        street = m.group(3).strip()
        community = m.group(4).strip()
        
        # 添加到schools.json
        if name not in schools_by_name:
            schools.append({
                'name': name,
                'district': district,
                'stage': '幼儿园',
                'address': f'{district}{street}{community}',
                'latitude': None,
                'longitude': None,
                'qualityDetail': {
                    'tier': '幼儿园',
                    'summary': f'{district}{street}{community}附近幼儿园'
                }
            })
            schools_by_name[name] = schools[-1]
            count += 1
        
        # 添加到school_zones.json
        if name not in zones_by_name:
            zones.append({
                'schoolName': name,
                'district': district,
                'stage': '幼儿园',
                'communities': [community],
                'roads': [f'{street}街道{community}'],
                'sourceUrl': '西安市教育局2024',
                'year': '2024'
            })
            zones_by_name[name] = zones[-1]

json.dump(schools, open(f'{DATA}/schools.json', 'w'), ensure_ascii=False, indent=2)
json.dump(zones, open(f'{DATA}/school_zones.json', 'w'), ensure_ascii=False, indent=2)
print(f'新增幼儿园: {count}')
print(f'总学校: {len(schools)}')
print(f'总学区: {len(zones)}')
