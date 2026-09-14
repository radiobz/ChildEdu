#!/usr/bin/env python3
"""一次性补齐所有区域初中学区数据"""
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
            'sourceUrl': '教育局2026',
            'year': '2026'
        })
        zones_by_name[name] = zones[-1]

# 新城区初中
xincheng = [
    ("西安市第三十中学", "北大街以东，西五路以南，新城大院-南新街以西，东大街以北"),
    ("西安市第八十九中学", "东区：尚德路以东，西七路以南，顺城东巷以西，东五路以北；西区：北大街以东，西五路以南，解放路以西，东五路以北"),
    ("西安市第八十九中教育集团尚德中学", "南新街以东，东新街以南，解放路以西，东大街以北"),
    ("西安市第四十三中学", "解放路以东，陇海线以南，东二环以西，碑林界-东大街以北"),
    ("西安市西安市汇知中学", "北大街以东，西五路以北，顺城东路以西，西七路以南"),
    ("西安市西安市爱知中学", "新城大院以东，东新街以南，解放路以西，东大街以北"),
]

# 未央区初中
weiyang = [
    ("西安市第十一中学", "贞观路以东，渭滨路以西，凤城九路以南，北二环以北"),
    ("西安市第十七中学", "太华北路以东，北辰路以西，光启路以南，仁谨路以北"),
    ("西安市第四十八中学", "凝晖巷-玄武路-开元南路以东，太和路以西，北二环以南"),
    ("西安市第五十八中学", "武德路以西，西铜路以东，秦汉大道以南，北三环以北"),
    ("汉都第一学校", "未央区辖区"),
]

# 经开区初中
jingkai = [
    ("西安市经开第六学校", "对口：经开第六学校小学部、经开第七小学"),
    ("西安市经开第五中学", "对口：经开第九小学、第十小学、第十一小学"),
    ("西安市经开第一学校", "对口：经开第一学校小学部"),
    ("西安市经开第三中学", "对口：经开第三学校小学部"),
]

# 灞桥区初中
baqiao = [
    ("西安市第三十四中学", "灞桥区辖区"),
    ("西安市第五十五中学", "灞桥区辖区"),
    ("西安市宇航中学", "航天四院辖区"),
    ("西安市庆华中学", "庆华厂辖区"),
    ("西安市纺织城初级中学", "纺织城辖区"),
]

# 长安区初中
changan = [
    ("长安区第一中学", "韦曲街道户籍"),
    ("长安区第二中学", "韦曲街道户籍"),
    ("长安区第三中学", "韦曲街道户籍"),
    ("长安区第四中学", "滦镇街道户籍"),
    ("长安区第五中学", "子午街道户籍"),
    ("长安区第六中学", "引镇街道户籍"),
    ("长安区第七中学", "鸣犊街道户籍"),
    ("长安区第八中学", "太乙宫街道户籍"),
]

# 高新区初中
gaoxin = [
    ("西安高新第一中学", "高新路以东，科技路以南，唐延路以西，科技四路以北"),
    ("西安高新第二中学", "唐延路以东，科技路以南，太白路以西，科技四路以北"),
    ("西安高新第三中学", "丈八北路以东，科技路以南，唐延路以西，科技八路以北"),
]

# 曲江新区初中
qujiang = [
    ("西安市曲江第一中学", "翠华路以东，芙蓉西路以西，南三环以北，雁南一路以南"),
    ("西安市曲江第二中学", "曲江路以东，南三环以北，长鸣路以西，登高路以南"),
    ("西安市曲江第三初级中学", "曲江路以东，上巳路以南，长鸣路以西，南三环以北"),
]

# 港务区初中
gangwu = [
    ("陆港第一初级中学", "陆港金海岸、枫林九溪等"),
    ("陆港第七初级中学", "西航花园、骞柳小区等"),
    ("陕师大陆港学校", "保利锦上、陕建雲玥府等"),
]

# 航天基地初中
hangtian = [
    ("西安航天城第一中学", "航天基地辖区"),
    ("西安航天城第二中学", "航天基地辖区"),
    ("西安航天城第三中学", "航天基地辖区"),
]

# 西咸新区初中
xixian = [
    ("沣东新城第一初级中学", "沣东新城辖区"),
    ("沣西新城第一学校", "沣西新城辖区"),
    ("秦汉中学", "秦汉新城辖区"),
]

for name, roads in xincheng:
    add_zone(name, '新城区', '初中', roads)
for name, roads in weiyang:
    add_zone(name, '未央区', '初中', roads)
for name, roads in jingkai:
    add_zone(name, '经开区', '初中', roads)
for name, roads in baqiao:
    add_zone(name, '灞桥区', '初中', roads)
for name, roads in changan:
    add_zone(name, '长安区', '初中', roads)
for name, roads in gaoxin:
    add_zone(name, '高新区', '初中', roads)
for name, roads in qujiang:
    add_zone(name, '曲江新区', '初中', roads)
for name, roads in gangwu:
    add_zone(name, '港务区', '初中', roads)
for name, roads in hangtian:
    add_zone(name, '航天基地', '初中', roads)
for name, roads in xixian:
    add_zone(name, '西咸新区', '初中', roads)

json.dump(zones, open(f'{DATA}/school_zones.json', 'w'), ensure_ascii=False, indent=2)
print(f'总学区: {len(zones)}')
