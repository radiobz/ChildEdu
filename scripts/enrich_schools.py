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

BATCH_SIZE = int(os.environ.get('BATCH_SIZE', '10'))
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
  "teaching": "师资教学：师资水平、教学风格、管理严格度、作业量、教研特色，2-3句",
  "students": "生源结构：学生来源、生源质量、是否筛选，一句话",
  "admission": "升学情况：对口初中/高中、普高率、重点率（初中高中填，小学填对口初中），2-3句",
  "class_type": "班型教学：班额大小、是否有重点班、教学模式，一句话",
  "facilities": "硬件地段：校园条件、位置、周边配套，一句话",
  "tuition": "学费标准",
  "verdict": "一句话总结：这所学校的核心优劣势",
  "suitable": "适合谁/不适合谁",
  "tags": ["标签1","标签2"],
  "communities": ["学区内主要小区1","小区2"],
  "roads": ["学区覆盖路段1","路段2"]
}}

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
            'students': result.get('students', ''),
            'admission': result.get('admission', ''),
            'class_type': result.get('class_type', ''),
            'facilities': result.get('facilities', ''),
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
        if communities or roads:
            existing = next((z for z in zones if z.get('schoolName') == school['name']), None)
            if existing:
                if communities:
                    existing['communities'] = list(set(existing.get('communities', []) + communities))
                if roads:
                    existing['roads'] = list(set(existing.get('roads', []) + roads))
            else:
                zones.append({
                    'schoolName': school['name'],
                    'district': school['district'],
                    'stage': school['stage'],
                    'communities': communities,
                    'roads': roads,
                    'sourceUrl': 'AI自动采集',
                    'year': '2026'
                })
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
