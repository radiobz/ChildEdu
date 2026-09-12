#!/usr/bin/env python3
"""给已有学区数据补多边形坐标"""
import json, os, requests, time

ZONES_FILE = '/home/user/Doubao/chats/38440640968808450/ChildEdu/data/school_zones.json'
API_KEY = "2d8f251eae74485781180fcb9e0b5d9b.JHnWlnCI2XT9RFLs"
API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

zones = json.load(open(ZONES_FILE))
need_fix = [z for z in zones if not z.get('coords') or len(z.get('coords', [])) < 3]
print(f"需要补coords的学区: {len(need_fix)}/{len(zones)}")

for i, z in enumerate(need_fix):
    print(f"\n[{i+1}/{len(need_fix)}] {z['schoolName']}")
    roads_text = '；'.join(z.get('roads', [])) or '无'
    communities_text = '；'.join(z.get('communities', [])) or '无'
    
    prompt = f"""你是西安地理专家。西安市区经纬度范围：经度108.85-109.15，纬度34.20-34.40。

学校：{z['schoolName']}（{z.get('district','')}，{z.get('stage','')}）
学区描述：{roads_text}
主要小区：{communities_text}

根据以上路名描述，给出这个学区的大致多边形边界坐标，4-6个点，按顺时针排列。
只输出JSON，不要解释：
{{"coords": [[lng1,lat1],[lng2,lat2],[lng3,lat3],[lng4,lat4]]}}

坐标要准确反映道路围成的范围。比如"含光路以西、友谊西路以北"就取这两条路附近的矩形角点。
"""

    try:
        resp = requests.post(API_URL, 
            headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "glm-4-flash",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1
            }, timeout=30)
        data = resp.json()
        content = data['choices'][0]['message']['content']
        # 提取JSON
        import re
        m = re.search(r'\[.*\]', content, re.DOTALL)
        if m:
            coords = json.loads(m.group())
            if len(coords) >= 3:
                z['coords'] = coords
                print(f"  ✅ 补了{len(coords)}个坐标点")
            else:
                print(f"  ❌ 坐标点太少")
        else:
            print(f"  ❌ 无法解析: {content[:100]}")
    except Exception as e:
        print(f"  ❌ 失败: {e}")
    
    time.sleep(0.5)

json.dump(zones, open(ZONES_FILE, 'w'), ensure_ascii=False, indent=2)
print(f"\n💾 已保存，现在有coords的学区: {len([z for z in zones if z.get('coords') and len(z['coords'])>=3])}")
