#!/usr/bin/env python3
"""追加莲湖区初中学区数据"""
import json

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
            'sourceUrl': '莲湖区教育局2026',
            'year': '2026'
        })
        zones_by_name[name] = zones[-1]

# 莲湖区初中（对口小学模式）
lihu_chuzhong = [
    ("西安市第一中学", "对口：大庆路小学教育集团环城西路小学（铁塔寺北街以东、一中北路以南、环城西路北段以西、铁塔寺路以北）"),
    ("西安市第十中学", "对口：郝家巷小学、希望小学、龙首村小学"),
    ("西安市第二十三中学", "对口：青年路小学教育集团八一街小学、青年路小学、郝家巷小学、龙首村小学"),
    ("西安市第七十中学分校", "对口：西关第一小学分校、洒金桥小学、庙后街小学、西安小学"),
    ("西安市庆安初级中学", "对口：丰庆路小学、南小巷小学、西桃园小学、西关第一小学、大庆路小学、机场小学"),
    ("西安市第一中学分校", "对口：机场小学、环城西路小学"),
    ("西安市第一中学教育集团四十四中学", "对口：劳动路小学、西关第一小学、前卫路小学、莲湖路小学、西安小学、工农路小学、大兴新区小学"),
    ("西安市庆安初级中学分校", "对口：大兴新区小学、星火路小学、工农路小学、西铁小学"),
    ("西安市第七十中学", "对口：陕西师范大学实验小学、第二实验小学、报恩寺街小学"),
    ("西安市莲湖第一学校", "对口：红光路小学、莲湖第一学校小学部、金光门小学"),
    ("西安市莲湖第二学校", "对口：莲湖第二学校小学部、远东实验小学"),
    ("西安市莲湖第一中学", "对口：红光路小学、远东第二小学分校"),
    ("西安市远东第一中学", "对口：远东第一小学、土门小学等"),
    ("西安市远东第二中学", "对口：远东第二小学、枣园小学、邓家村小学、行知小学"),
    ("西安市西电中学", "对口：西电实验小学、金光门小学、庆安小学"),
    ("西安市大兴新区初级中学", "对口：二府庄小学、沣惠路小学、大兴新区小学"),
    ("西安市第二十三中学分校", "对口：青年路小学分校、庙后街小学"),
    ("西安市益新中学", "对口：大庆路小学、环城西路小学"),
]

for name, roads in lihu_chuzhong:
    add_zone(name, '莲湖区', '初中', roads)

json.dump(zones, open(f'{DATA}/school_zones.json', 'w'), ensure_ascii=False, indent=2)
print(f'总学区: {len(zones)}')
