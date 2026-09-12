#!/usr/bin/env python3
"""
学校信息自动采集脚本
按完整维度采集：梯队/师资/生源/升学/班型/硬件/学费/评价/学区小区
"""
import json
import os
import time
import urllib.request

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
SCHOOLS_FILE = os.path.join(DATA_DIR, 'schools.json')
PATHWAYS_FILE = os.path.join(DATA_DIR, 'pathways.json')
ZONES_FILE = os.path.join(DATA_DIR, 'school_zones.json')

BATCH_SIZE = int(os.environ.get('BATCH_SIZE', '100'))
AI_API_BASE = os.environ.get('AI_API_BASE', 'https://open.bigmodel.cn/api/paas/v4')
AI_API_KEY = os.environ.get('AI_API_KEY', '')
AI_MODEL = os.environ.get('AI_MODEL', 'glm-4-flash')


def load_json(path):
    if not os.path.exists(path):
        return []
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def call_ai(prompt):
    if not AI_API_KEY:
        return None
    url = f"{AI_API_BASE}/chat/completions"
    payload = json.dumps({
        "model": AI_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"},
        "temperature": 0.3
    }).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json"
    })
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return json.loads(data['choices'][0]['message']['content'])
    except Exception as e:
        print(f"  ❌ AI调用失败: {e}")
        return None


def build_prompt(school):
    return f"""你是西安教育数据分析师。请查询"{school['name']}"（{school['district']}，{school['stage']}，{school.get('type','')}，地址：{school.get('address','')}），
按以下维度输出JSON，每个字段都要有实质内容，不要空话：

{{
  "tier": "梯队定位：在所在区的第几梯队、什么级别（省示范/市一级/普通公办等），一句话",
  "teaching": "师资教学：师资水平、教学风格、管理严格度、教研特色，2-3句",
  "homework": "作业量与晚自习：每天作业时长、是否有晚自习、晚自习到几点，一句话",
  "cafeteria": "食堂伙食：是否有食堂、伙食评价、是否可校外订餐，一句话",
  "afterSchool": "午休与课后服务：是否有午休/宿舍、课后服务内容、延时放学到几点，一句话",
  "students": "生源结构：学生来源、生源质量、是否筛选，一句话",
  "admission": "升学情况：对口初中/高中、普高率、重点率（初中高中填，小学填对口初中），2-3句",
  "lottery": "摇号录取比例：民办学校填报人数/录取比例，公办填暂无",
  "choiceAdvice": "小升初择校建议：针对这所小学的家长，小升初怎么选，2-3句",
  "housePrice": "学区房价格区间：附近小区均价范围，如约1.2-1.8万/㎡，一句话",
  "class_type": "班型教学：班额大小、是否有重点班、教学模式，一句话",
  "facilities": "硬件地段：校园条件、位置、周边配套，一句话",
  "tuition": "学费标准",
  "contact": "联系方式与官网：学校电话或官网，没有就填暂无",
  "verdict": "一句话总结：这所学校的核心优劣势",
  "suitable": "适合谁/不适合谁",
  "tags": ["标签1","标签2"],
  "communities": ["学区内主要小区1","小区2"],
  "roads": ["学区覆盖路段1","路段2"],
  "zoneCoords": [[lng1,lat1],[lng2,lat2],[lng3,lat3],[lng4,lat4]]
}}

zoneCoords是学区的大致边界多边形，用西安经纬度坐标（经度108.85-109.15，纬度34.20-34.40）。
根据roads里的路名描述，给出4-8个围成学区范围的经纬度点。
比如"含光路以西、友谊西路以北"就给出这两条路交汇处附近的矩形4个角点。
坐标要尽量准确反映学区范围，不要随便填。如果实在不知道就填空数组[]。

不确定的字段填"暂无公开信息"，不要编造。"""


def main():
    schools = load_json(SCHOOLS_FILE)
    pathways = load_json(PATHWAYS_FILE)
    zones = load_json(ZONES_FILE)

    print(f"📚 共 {len(schools)} 所学校，{len(pathways)} 条升学链，{len(zones)} 条学区")

    # 找出未补全的（没有quality详情的）
    incomplete = [s for s in schools if not s.get('qualityDetail')]
    print(f"🔍 待补全: {len(incomplete)} 所")

    if not incomplete:
        print("✅ 全部补全完成")
        return

    batch = incomplete[:BATCH_SIZE]
    updated = 0

    for i, school in enumerate(batch):
        print(f"\n[{i+1}/{len(batch)}] {school['name']}")
        result = call_ai(build_prompt(school))
        if not result:
            continue

        # 存详细评价到qualityDetail
        school['qualityDetail'] = {
            'tier': result.get('tier', ''),
            'teaching': result.get('teaching', ''),
            'homework': result.get('homework', ''),
            'cafeteria': result.get('cafeteria', ''),
            'afterSchool': result.get('afterSchool', ''),
            'students': result.get('students', ''),
            'admission': result.get('admission', ''),
            'lottery': result.get('lottery', ''),
            'choiceAdvice': result.get('choiceAdvice', ''),
            'housePrice': result.get('housePrice', ''),
            'class_type': result.get('class_type', ''),
            'facilities': result.get('facilities', ''),
            'contact': result.get('contact', ''),
            'verdict': result.get('verdict', ''),
            'suitable': result.get('suitable', '')
        }
        school['tags'] = result.get('tags', school.get('tags', []))
        if result.get('tuition'):
            school['tuition'] = result['tuition']
        school['enrichedAt'] = time.strftime('%Y-%m-%d')
        updated += 1
        print(f"  ✅ 已补全评价维度")

        # 如果有升学信息，补充到pathways
        communities = result.get('communities', [])
        roads = result.get('roads', [])
        zone_coords = result.get('zoneCoords', [])
        if communities or roads or zone_coords:
            existing = next((z for z in zones if z.get('schoolName') == school['name']), None)
            if existing:
                if communities:
                    existing['communities'] = list(set(existing.get('communities', []) + communities))
                if roads:
                    existing['roads'] = list(set(existing.get('roads', []) + roads))
                if zone_coords and len(zone_coords) >= 3:
                    existing['coords'] = zone_coords
            else:
                new_zone = {
                    'schoolName': school['name'],
                    'district': school['district'],
                    'stage': school['stage'],
                    'communities': communities,
                    'roads': roads,
                    'sourceUrl': 'AI自动采集',
                    'year': '2026'
                }
                if zone_coords and len(zone_coords) >= 3:
                    new_zone['coords'] = zone_coords
                zones.append(new_zone)
            print(f"  ✅ 补充学区信息")

        time.sleep(1)

    if updated:
        save_json(SCHOOLS_FILE, schools)
        save_json(ZONES_FILE, zones)
        print(f"\n💾 已保存 {updated} 所学校的完整数据")
    else:
        print("\n⏭️ 本批无更新")


if __name__ == '__main__':
    main()
