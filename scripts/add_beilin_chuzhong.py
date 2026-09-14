#!/usr/bin/env python3
"""解析碑林区初中学区数据"""
import json, re

DATA = '/home/user/Doubao/chats/38440640968808450/ChildEdu/data'
zones = json.load(open(f'{DATA}/school_zones.json'))
zones_by_name = {z['schoolName']: z for z in zones}

def add_zone(name, district, stage, roads):
    if name in zones_by_name:
        zones_by_name[name]['roads'] = [roads]
        zones_by_name[name]['stage'] = stage
    else:
        zones.append({
            'schoolName': name,
            'district': district,
            'stage': stage,
            'communities': [],
            'roads': [roads],
            'sourceUrl': '碑林区教育局2026',
            'year': '2026'
        })
        zones_by_name[name] = zones[-1]

txt = open(f'{DATA}/beilin_chuzhong.txt').read()
lines = txt.split('\n')
current_school = None
current_zone = ''
for line in lines:
    m = re.match(r'^\s*\d+\s+(.+?(?:中学|学校|分校))\s+(.+)$', line)
    if m and '中学' in m.group(1):
        if current_school and current_zone.strip():
            add_zone(current_school, '碑林区', '初中', current_zone.strip()[:200])
        current_school = m.group(1).strip()
        current_zone = m.group(2).strip()
    elif current_school and line.strip() and not re.match(r'^\s*\d', line) and '备注' not in line and '序号' not in line and '附件' not in line:
        if len(line.strip()) > 10:
            current_zone += ' ' + line.strip()
if current_school and current_zone.strip():
    add_zone(current_school, '碑林区', '初中', current_zone.strip()[:200])

json.dump(zones, open(f'{DATA}/school_zones.json', 'w'), ensure_ascii=False, indent=2)
print(f'总学区: {len(zones)}')
