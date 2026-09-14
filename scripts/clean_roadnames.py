#!/usr/bin/env python3
"""清洗学区数据：从噪音文本中提取真实路名，生成roadNames字段"""
import json, re

DATA = '/home/user/Doubao/chats/38440640968808450/ChildEdu/data'
zones = json.load(open(f'{DATA}/school_zones.json'))

# 道路词后缀（西安常用）
ROAD_SUFFIX = r'(大道|环路|街道|街办|路|街|巷|里|道|线)'

def extract_roads(text):
    """从一段文本中提取路名"""
    if not text:
        return []
    roads = set()
    # 匹配：2-8个字符 + 道路后缀
    pattern = re.compile(r'[\u4e00-\u9fa5A-Za-z0-9]{1,7}?(?:大道|环路|街道|路|街|巷)')
    for m in pattern.finditer(text):
        road = m.group(0)
        # 过滤噪音
        if len(road) < 2:
            continue
        # 去掉明显不是路名的（含学校名/小区名噪音词）
        if any(kw in road for kw in ['小学', '中学', '学校', '学区', '除外', '范围', '幼儿园', '附小', '附中', '学院', '大学']):
            # 但"大学南路""大学东路"是真的路名，单独处理
            if not re.match(r'^大学[东南西北]', road):
                continue
        roads.add(road)
    return list(roads)

def clean_community_name(text):
    """从小区名中提取可能的地名（供搜索）"""
    if not text:
        return []
    # 小区名本身可能可被PlaceSearch识别，保留前10个
    names = []
    for part in re.split(r'[、，,；;\s]+', text):
        part = part.strip()
        if 2 <= len(part) <= 12 and not any(kw in part for kw in ['小学', '中学', '学区', '除外', '范围']):
            names.append(part)
    return names[:10]

updated = 0
for z in zones:
    all_roads = []
    # 1. 从roads字段提取
    for r in z.get('roads', []):
        all_roads.extend(extract_roads(r))
    # 2. 从communities字段提取路名
    for c in z.get('communities', []):
        all_roads.extend(extract_roads(c))
    
    # 去重，按长度优先（长路名更精确），最多10个
    dedup = list(dict.fromkeys(all_roads))
    # 清理前缀："至""到""沿""东至""西至"等方向词
    cleaned = []
    for r in dedup:
        r2 = re.sub(r'^(至|到|沿|东至|西至|南至|北至|东起|西起|自)', '', r)
        r2 = re.sub(r'[东西南北]侧$', '', r2)
        if len(r2) >= 2:
            cleaned.append(r2)
    dedup = list(dict.fromkeys(cleaned))
    dedup.sort(key=len, reverse=True)
    dedup = dedup[:10]
    
    # 去掉与学校名完全相同的（如"大学南路小学"→"南路小学"噪音）
    school = z.get('schoolName', '')
    dedup = [r for r in dedup if r not in school]
    
    if dedup:
        z['roadNames'] = dedup
        updated += 1
    else:
        z['roadNames'] = []

# 统计
has_roadnames = sum(1 for z in zones if z.get('roadNames'))
total_roads = sum(len(z.get('roadNames', [])) for z in zones)
print(f'总学区: {len(zones)}')
print(f'有roadNames: {has_roadnames}')
print(f'共提取路名: {total_roads}')
print(f'新增更新: {updated}')

# 抽查几个
for name in ['碑林区大学南路小学', '西安市曲江第一小学', '长安区南街小学', '陆港第一小学']:
    for z in zones:
        if z.get('schoolName') == name:
            print(f"\n{name}: roadNames={z.get('roadNames', [])}")

json.dump(zones, open(f'{DATA}/school_zones.json', 'w'), ensure_ascii=False, indent=2)
print('\n已写入')
