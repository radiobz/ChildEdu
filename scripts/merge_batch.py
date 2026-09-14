#!/usr/bin/env python3
"""把batch_*.json合并到schools.json"""
import json, glob, os

BASE = '/home/user/Doubao/chats/38440640968808450/ChildEdu/data'
schools = json.load(open(f'{BASE}/schools.json'))
by_name = {s['name']: s for s in schools}

merged = 0
for f in sorted(glob.glob(f'{BASE}/batch_*.json')):
    batch = json.load(open(f))
    for item in batch:
        name = item['name']
        if name in by_name:
            by_name[name]['qualityDetail'] = item['qualityDetail']
            by_name[name]['enrichedAt'] = '2026-09-12'
            merged += 1
    os.remove(f)

json.dump(schools, open(f'{BASE}/schools.json', 'w'), ensure_ascii=False, indent=2)
print(f'合并了{merged}所学校')
enriched = [s for s in schools if s.get('qualityDetail') and 'homework' in s.get('qualityDetail', {})]
print(f'现在已补全: {len(enriched)}/{len(schools)}')
