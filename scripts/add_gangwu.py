#!/usr/bin/env python3
"""解析港务区学区数据"""
import json, re

DATA = '/home/user/Doubao/chats/38440640968808450/ChildEdu/data'
zones = json.load(open(f'{DATA}/school_zones.json'))
zones_by_name = {z['schoolName']: z for z in zones}

def add_zone(name, district, stage, roads):
    if name in zones_by_name:
        zones_by_name[name]['roads'] = [roads]
        zones_by_name[name]['district'] = district
    else:
        zones.append({
            'schoolName': name,
            'district': district,
            'stage': stage,
            'communities': [],
            'roads': [roads],
            'sourceUrl': '港务区官网2026',
            'year': '2026'
        })
        zones_by_name[name] = zones[-1]

txt = open(f'{DATA}/gangwu.txt').read()
lines = txt.split('\n')
current_school = None
current_zone = ''
for line in lines:
    # 学校名在左列，学区在右列
    m = re.match(r'^\s*(.+?(?:小学|学校))\s{2,}(.+)$', line)
    if m and '小学' in m.group(1):
        if current_school and current_zone.strip():
            add_zone(current_school, '港务区', '小学', current_zone.strip()[:200])
        current_school = m.group(1).strip()
        current_zone = m.group(2).strip()
    elif current_school and line.strip() and '附件' not in line and '西安浐灞' not in line:
        if len(line.strip()) > 10 and '小学' not in line[:5]:
            current_zone += ' ' + line.strip()
if current_school and current_zone.strip():
    add_zone(current_school, '港务区', '小学', current_zone.strip()[:200])

json.dump(zones, open(f'{DATA}/school_zones.json', 'w'), ensure_ascii=False, indent=2)
print(f'总学区: {len(zones)}')
