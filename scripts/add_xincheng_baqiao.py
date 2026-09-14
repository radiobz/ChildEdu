#!/usr/bin/env python3
"""追加新城区和灞桥区学区数据"""
import json, re

DATA = '/home/user/Doubao/chats/38440640968808450/ChildEdu/data'
zones = json.load(open(f'{DATA}/school_zones.json'))
zones_by_name = {z['schoolName']: z for z in zones}

def add_zone(name, district, stage, roads):
    if name in zones_by_name:
        zones_by_name[name]['roads'] = [roads]
        zones_by_name[name]['district'] = district
        zones_by_name[name]['year'] = '2026'
        zones_by_name[name]['sourceUrl'] = '政府官网2026'
    else:
        zones.append({
            'schoolName': name,
            'district': district,
            'stage': stage,
            'communities': [],
            'roads': [roads],
            'sourceUrl': '政府官网2026',
            'year': '2026'
        })
        zones_by_name[name] = zones[-1]

# 新城区小学
xincheng_primary = [
    ("西一路小学", "北大街以东，西新街以南，南新街以西，东大街以北"),
    ("西安市新城区通济坊小学", "北大街以东，西五路以南，新城大院以西，西新街以北"),
    ("西安市新城区后宰门小学", "北区：北大街以东，西七路以南，尚德路以西，西五路以北；南区：西五路南62-82号，皇城东路"),
    ("西安市新城区新知小学", "北大街以东，顺城北巷以南，北新街以西，西七路以北"),
    ("西安育英小学", "北新街以东，顺城北巷以南，尚德路以西，西七路以北"),
    ("西安市新城区坤中巷小学", "解放路以东，顺城北巷以南，顺城东巷以西，东五路以北"),
    ("励耘小学", "解放路以东，东五路以南，顺城东巷以西，东大街以北"),
    ("西安市新城区实验小学", "北区：尚德路以东，顺城北巷以南，解放路以西，西五路以北；南区：皇城东路以东，西五路以南，解放路以西，东新街以北"),
    ("西安市新城区太华路小学", "太华路以东，未央界以南，红旗专线以西，陇海线以北"),
    ("西安昆仑小学", "公园北路35街坊、36街坊昆仑社区，万寿中路15街坊、16街坊昆仑社区；长乐中路57号晟方家属院；幸福林带以东，长乐东路以南，浐灞界以西，华山路以北"),
]
for name, roads in xincheng_primary:
    add_zone(name, '新城区', '小学', roads)

# 新城区初中
xincheng_junior = [
    ("陕西省西安爱知中学", "北大街以东，顺城北巷以南，顺城东巷以西，东七路-西七路以北"),
    ("西安市汇知中学", "北大街以东，西七路以南，尚德路以西，西五路以北"),
    ("西安市第四十三中学", "东区：环城东路以东，陇海线以南，康复路-兴业路以西；西区：解放路以东，东五路以南，顺城东巷以西，东大街以北"),
    ("西安市第三十八中学", "太华路以东，未央界以南，浐灞界以西，陇海线以北"),
    ("西安市第八十九中学教育集团弘德中学", "北区：北关正街以东，二马路以南，拾翠路以西，自强东路以北；南区：北关正街以东，自强东路以南，太华路以西，环城北路以北"),
    ("西安市昆仑中学", "昆仑厂家属区；幸福林带以东，长乐东路以南；东二环以东，兴工路以南；勤工路以东，长缨东路以南"),
    ("西安市西光中学", "西光14-16街坊、35-37街坊、西光新区、广场小区西光职工家属楼"),
    ("西安市秦川中学", "秦川社区；幸福林带以东，高楼路以南；公园南路以东，韩森路沿线以南"),
    ("西安市东方中学", "东二环以东，咸宁中路以南，幸福林带以西，建工路以北"),
    ("西安市华山中学", "华山社区16-17街坊、20街坊、26街坊；东二环以东，长乐公园以南；东二环以东，韩森路以南，公园南路以西"),
    ("西安市第八十三中学", "东二环以东，爱学路以南，复聪路-火炬路以西，延兴路以北"),
]
for name, roads in xincheng_junior:
    add_zone(name, '新城区', '初中', roads)

# 解析灞桥区PDF
txt = open(f'{DATA}/baqiao.txt').read()
# 简单提取：行首是学校名+空格+学区范围
lines = txt.split('\n')
current_school = None
current_zone = ''
for line in lines:
    # 学校名模式：以"小学"或"中学"结尾，前面有空格
    m = re.match(r'^\s*(.+?(?:小学|中学|学校))\s{2,}(.*)$', line)
    if m and ('小学' in m.group(1) or '中学' in m.group(1)):
        if current_school and current_zone.strip():
            add_zone(current_school, '灞桥区', '小学', current_zone.strip())
        current_school = m.group(1).strip()
        current_zone = m.group(2).strip()
    elif current_school and line.strip() and not line.strip().startswith('适龄') and not line.strip().startswith('居住'):
        current_zone += ' ' + line.strip()
if current_school and current_zone.strip():
    add_zone(current_school, '灞桥区', '小学', current_zone.strip())

json.dump(zones, open(f'{DATA}/school_zones.json', 'w'), ensure_ascii=False, indent=2)
print(f'总学区: {len(zones)}')
