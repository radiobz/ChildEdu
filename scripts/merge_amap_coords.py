#!/usr/bin/env python3
"""合并schools_amap.json坐标+补充缺失学校"""
import json, re

DATA = '/home/user/Doubao/chats/38440640968808450/ChildEdu/data'
AMAP = '/home/user/.doubao/agent_mode/workspace/.sessions/38440640968808450/attachments/schools_amap.json'

schools = json.load(open(f'{DATA}/schools.json'))
amap = json.load(open(AMAP))

def norm(n):
    """归一化学校名：去掉市/区前缀"""
    n = n.strip()
    n = re.sub(r'^(西安市|西安)', '', n)
    n = re.sub(r'^(新城区|碑林区|莲湖区|雁塔区|未央区|灞桥区|长安区|临潼区|阎良区|高陵区|鄠邑区|蓝田县|周至县)', '', n)
    return n

amap_by_norm = {}
for a in amap:
    amap_by_norm.setdefault(norm(a['name']), []).append(a)

schools_by_name = {s['name']: s for s in schools}

added = 0
coord_filled = 0
for a in amap:
    an = a['name']
    loc = a.get('location')
    # 1. 精确名已存在 → 补坐标
    if an in schools_by_name:
        s = schools_by_name[an]
        if not s.get('location') and loc:
            s['location'] = loc
            coord_filled += 1
        # 补district/stage/address/type
        if not s.get('district') and a.get('district'): s['district'] = a['district']
        if not s.get('stage') and a.get('stage'): s['stage'] = a['stage']
        if not s.get('address') and a.get('address'): s['address'] = a['address']
        if not s.get('type') and a.get('type'): s['type'] = a['type']
        continue
    # 2. 归一化名匹配（去掉市/区前缀）
    an_norm = norm(an)
    found = None
    for s in schools:
        if norm(s['name']) == an_norm:
            found = s
            break
    if found:
        if not found.get('location') and loc:
            found['location'] = loc
            coord_filled += 1
        continue
    # 3. 不存在 → 新增
    schools.append({
        'name': an,
        'district': a.get('district', ''),
        'stage': a.get('stage', '小学'),
        'type': a.get('type', ''),
        'address': a.get('address', ''),
        'location': loc,
        'score': a.get('score'),
        'quality': a.get('quality'),
        'facility': a.get('facility'),
        'qualityDetail': {
            'tier': '',
            'summary': ''
        }
    })
    schools_by_name[an] = schools[-1]
    added += 1

print(f'新增学校: {added}')
print(f'补坐标: {coord_filled}')
print(f'总学校: {len(schools)}')

with_loc = sum(1 for s in schools if s.get('location'))
print(f'有坐标学校: {with_loc}')

json.dump(schools, open(f'{DATA}/schools.json', 'w'), ensure_ascii=False, indent=2)
