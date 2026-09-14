#!/usr/bin/env python3
"""追加西咸新区学区数据"""
import json

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
            'sourceUrl': '西咸新区官网2026',
            'year': '2026'
        })
        zones_by_name[name] = zones[-1]

# 西咸新区小学数据
xixian = [
    # 沣东新城
    ("西咸新区沣东新城第五小学", "沣东新城", "和盛花园、蓝光公园华府、保利和光尘樾、中南上悦城、国樾府、万科星誉沣华、沣和苑、康璟馨苑"),
    ("西安沣东实验小学", "沣东新城", "西围墙村、六合家园、中海昆明路六号、沣明苑；王寺村、纪杨村等过渡"),
    ("沣东新城第一小学", "沣东新城", "沣东新城辖区户籍适龄儿童"),
    # 秦汉新城
    ("陕西省西咸新区秦汉中学", "秦汉新城", "秦汉佳苑、华清园文津观澜、旭辉江山阅、世纪澜庭、中国铁建长河天骄府"),
    ("西咸新区秦汉新城秦汉小学", "秦汉新城", "春城十八里、枫丹丽舍、德杰国际城、星河湾、万科理想城、中天诚品"),
    # 空港新城
    ("空港新城第一学校", "空港新城", "空港新城辖区户籍适龄儿童"),
    # 泾河新城
    ("泾河新城第一小学", "泾河新城", "泾河新城辖区户籍适龄儿童"),
]

for name, district, roads in xixian:
    add_zone(name, district, '小学', roads)

json.dump(zones, open(f'{DATA}/school_zones.json', 'w'), ensure_ascii=False, indent=2)
print(f'总学区: {len(zones)}')
