#!/usr/bin/env python3
"""追加航天基地学区数据"""
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
            'sourceUrl': '航天基地官网2026',
            'year': '2026'
        })
        zones_by_name[name] = zones[-1]

# 航天基地小学数据（从本地宝/政府2026）
hangtian = [
    ("西安航天城第一小学", "东至航天东路，南至飞天路，西至神舟大道，北至航天大道区域"),
    ("西安航天城第二小学", "东至西康高速，南至少陵路-生态路线，西至航新路-航天南路-神舟大道线，北至东长安街；西北村、栲栳村、朱坡村、大府井村、简王井村、南伍村及羊村"),
    ("西安航天城第三小学", "东至神舟三路，南至航天南路，西至规三路-神舟二路-东长安街-航天西路线，北至航天大道（含航天逸居、聚福苑）"),
    ("西安航天城第四小学", "东至神舟大道，南至航天南路，西至航天西路，北至航天大道"),
    ("西安航天城第五小学", "东至神舟大道，南至航拓路，西至神舟二路，北至航天南路"),
    ("西安航天城第六小学", "东至公田二路南段，南至航天大道，西至航天西路，北至航天北路（含曲江千林郡、西延澜山）；夏殿村、北里王村"),
    ("西安航天城第八学校", "西曹村、中兆村、兆寨村、新和村、新寨子村、旧寨子村"),
    ("航天基地实验小学", "东至航天西路，南至少陵路-神舟一路-东长安街，西至北长安街，北至航天北路；东韦村"),
]

for name, roads in hangtian:
    add_zone(name, '航天基地', '小学', roads)

json.dump(zones, open(f'{DATA}/school_zones.json', 'w'), ensure_ascii=False, indent=2)
print(f'总学区: {len(zones)}')
