#!/usr/bin/env python3
"""
学校信息自动采集脚本
每周跑一次，每次处理 N 所信息不完整的学校，调 AI API 补全详情
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
SCHOOLS_FILE = os.path.join(DATA_DIR, 'schools.json')
PATHWAYS_FILE = os.path.join(DATA_DIR, 'pathways.json')
ZONES_FILE = os.path.join(DATA_DIR, 'school_zones.json')

BATCH_SIZE = int(os.environ.get('BATCH_SIZE', '20'))
AI_API_BASE = os.environ.get('AI_API_BASE', 'https://api.deepseek.com/v1')
AI_API_KEY = os.environ.get('AI_API_KEY', '')
AI_MODEL = os.environ.get('AI_MODEL', 'deepseek-chat')


def load_json(path):
    if not os.path.exists(path):
        return []
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def call_ai(prompt):
    """调用AI API获取学校详情"""
    if not AI_API_KEY:
        print("⚠️  AI_API_KEY 未设置，跳过")
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
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            content = data['choices'][0]['message']['content']
            return json.loads(content)
    except Exception as e:
        print(f"❌ AI调用失败: {e}")
        return None


def build_prompt(school):
    return f"""你是西安教育数据分析师。请查询"{school['name']}"（{school['district']}{school.get('type','')}{school['stage']}）的以下信息，严格JSON格式返回：
{{
  "intro": "学校简介：历史、特色、梯队定位（50-100字）",
  "teachers": "师资情况：骨干教师数量、教研特色、管理风格（50-100字）",
  "tuition": "学费标准",
  "achievements": "近年成绩/荣誉（50字内）",
  "tags": ["标签1","标签2"]
}}
不确定的字段填空字符串，不要编造。"""


def main():
    schools = load_json(SCHOOLS_FILE)
    print(f"📚 共 {len(schools)} 所学校")

    # 找出信息不完整的学校（intro为空）
    incomplete = [s for s in schools if not s.get('intro')]
    print(f"🔍 信息待补全: {len(incomplete)} 所")

    if not incomplete:
        print("✅ 所有学校信息已补全")
        return

    # 本批处理
    batch = incomplete[:BATCH_SIZE]
    updated = 0

    for i, school in enumerate(batch):
        print(f"\n[{i+1}/{len(batch)}] 采集: {school['name']}")
        result = call_ai(build_prompt(school))

        if result:
            school['intro'] = result.get('intro', '')
            school['teachers'] = result.get('teachers', '')
            school['tuition'] = result.get('tuition', school.get('tuition'))
            school['achievements'] = result.get('achievements', '')
            school['tags'] = result.get('tags', school.get('tags', []))
            school['dataEnriched'] = True
            school['enrichedAt'] = time.strftime('%Y-%m-%d')
            updated += 1
            print(f"  ✅ 已补全")
        else:
            print(f"  ⏭️ 跳过")

        time.sleep(1)  # 避免API限流

    if updated > 0:
        save_json(SCHOOLS_FILE, schools)
        print(f"\n💾 已保存 {updated} 所学校的新数据")
    else:
        print("\n⏭️ 本批无更新")


if __name__ == '__main__':
    main()
