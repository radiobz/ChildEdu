#!/usr/bin/env python3
"""解析各区学区PDF文本，更新school_zones.json"""
import json, re, os

DATA = '/home/user/Doubao/chats/38440640968808450/ChildEdu/data'
zones = json.load(open(f'{DATA}/school_zones.json'))
zones_by_name = {z['schoolName']: z for z in zones}

DISTRICT_MAP = {
    'beilin': '碑林区',
    'lianhu': '莲湖区',
    'yanta': '雁塔区',
    'weiyang': '未央区'
}

updated = 0

for fname, district in DISTRICT_MAP.items():
    txt = open(f'{DATA}/{fname}.txt').read()
    lines = txt.split('\n')
    
    # 找学校名模式：行首有数字+学校名
    # 学校名通常以"XX小学"或"XX中学"结尾
    school_pattern = re.compile(r'^\s*\d+\s+(.+?(?:小学|中学|学校|附小|附中|实验小学|第一小学|第二小学))\s*(.*)$')
    
    current_school = None
    current_zone = ''
    
    for line in lines:
        m = school_pattern.match(line)
        if m:
            # 保存上一个
            if current_school and current_zone.strip():
                # 匹配到zones里
                for zn, z in zones_by_name.items():
                    if current_school in zn or zn in current_school:
                        z['roads'] = [current_zone.strip()]
                        z['district'] = district
                        z['year'] = '2026'
                        updated += 1
                        break
                else:
                    # 新增
                    zones.append({
                        'schoolName': current_school,
                        'district': district,
                        'stage': '小学',
                        'communities': [],
                        'roads': [current_zone.strip()],
                        'sourceUrl': '政府官网2026',
                        'year': '2026'
                    })
                    zones_by_name[current_school] = zones[-1]
                    updated += 1
            
            current_school = m.group(1).strip()
            current_zone = m.group(2).strip()
        else:
            if current_school and line.strip():
                current_zone += ' ' + line.strip()
    
    # 最后一个
    if current_school and current_zone.strip():
        for zn, z in zones_by_name.items():
            if current_school in zn or zn in current_school:
                z['roads'] = [current_zone.strip()]
                z['district'] = district
                z['year'] = '2026'
                updated += 1
                break

json.dump(zones, open(f'{DATA}/school_zones.json', 'w'), ensure_ascii=False, indent=2)
print(f'更新了{updated}条学区数据')
print(f'总学区: {len(zones)}')
