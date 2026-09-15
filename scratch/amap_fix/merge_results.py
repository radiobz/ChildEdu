#!/usr/bin/env python3
"""
合并高德校正结果到 schools.json
- 应用所有批次的坐标补全结果
- 应用删除、改名、改坐标校正
- 补全新增幼儿园
- 同步两份 schools.json
"""
import json
import os
import glob
import shutil
from datetime import datetime

BASE = '/home/user/Doubao/chats/38440640968808450/ChildEdu'
DATA_FILE = f'{BASE}/data/schools.json'
FRONTEND_FILE = f'{BASE}/docs/data/schools.json'
RESULTS_DIR = f'{BASE}/scratch/amap_fix/results'
CORRECTIONS_FILE = f'{BASE}/scratch/amap_fix/corrections.json'
NEW_KG_FILE = f'{BASE}/scratch/amap_fix/new_kindergartens.json'

def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    schools = load_json(DATA_FILE)
    original_count = len(schools)
    stats = {
        'location_filled': 0,
        'location_needs_verify': 0,
        'deleted': 0,
        'name_changed': 0,
        'location_corrected': 0,
        'kindergartens_added': 0,
    }

    # === 1. 应用坐标补全结果 ===
    all_results = {}
    result_files = sorted(glob.glob(f'{RESULTS_DIR}/batch_*_results.json'))
    for rf in result_files:
        data = load_json(rf)
        for r in data:
            all_results[r['orig_index']] = r

    for idx, r in all_results.items():
        if idx >= len(schools):
            continue
        if r['status'] == 'found' and r.get('location'):
            schools[idx]['location'] = r['location']
            if r.get('address') and not schools[idx].get('address'):
                schools[idx]['address'] = r['address']
            if not schools[idx].get('source'):
                schools[idx]['source'] = 'gaode_poi'
            schools[idx]['enrichedAt'] = datetime.now().isoformat()
            stats['location_filled'] += 1
        elif r['status'] == 'not_found':
            schools[idx]['source'] = 'needs_verify'
            stats['location_needs_verify'] += 1

    # === 2. 应用校正（删除、改名、改坐标）===
    if os.path.exists(CORRECTIONS_FILE):
        corr = load_json(CORRECTIONS_FILE)

        # 改名（先改名，因为删除索引可能受影响）
        for item in corr.get('to_fix_name', []):
            idx = item['orig_index']
            if idx < len(schools) and schools[idx].get('name') == item.get('old_name'):
                schools[idx]['name'] = item['new_name']
                schools[idx]['source'] = 'gaode_poi'
                stats['name_changed'] += 1

        # 改坐标
        for item in corr.get('to_fix_location', []):
            idx = item['orig_index']
            if idx < len(schools):
                schools[idx]['location'] = item['new_location']
                stats['location_corrected'] += 1

        # 删除（从大到小删除以保持索引有效）
        to_delete = sorted(corr.get('to_delete', []), key=lambda x: x['orig_index'], reverse=True)
        delete_indices = set(item['orig_index'] for item in to_delete)
        schools = [s for i, s in enumerate(schools) if i not in delete_indices]
        stats['deleted'] = len(delete_indices)

    # === 3. 补全新增幼儿园 ===
    if os.path.exists(NEW_KG_FILE):
        new_kgs = load_json(NEW_KG_FILE)
        existing_names = set(s.get('name', '') for s in schools)
        max_id = 0
        for s in schools:
            sid = s.get('id', '')
            if sid and sid.startswith('amap-'):
                try:
                    num = int(sid.split('-')[-1]) if sid.split('-')[-1].isdigit() else 0
                    max_id = max(max_id, num)
                except:
                    pass

        for kg in new_kgs:
            if kg['name'] in existing_names:
                continue
            new_entry = {
                'id': f"gaode-new-{len(schools) + max_id + 1}",
                'name': kg['name'],
                'district': kg.get('district', ''),
                'stage': '幼儿园',
                'type': kg.get('type'),
                'address': kg.get('address', ''),
                'location': kg.get('location'),
                'score': None,
                'quality': None,
                'facility': None,
                'tuition': None,
                'tags': [],
                'intro': '',
                'teachers': '',
                'achievements': '',
                'source': 'gaode_poi',
                'sourceYear': '2026',
                'tel': kg.get('tel'),
                'qualityDetail': {},
                'enrichedAt': datetime.now().isoformat(),
            }
            schools.append(new_entry)
            existing_names.add(kg['name'])
            stats['kindergartens_added'] += 1

    # === 4. 验证 ===
    no_loc = sum(1 for s in schools if not s.get('location'))
    empty_name = sum(1 for s in schools if not s.get('name', '').strip())
    invalid_loc = sum(1 for s in schools if s.get('location') and (
        not isinstance(s['location'], list) or len(s['location']) != 2 or
        not isinstance(s['location'][0], (int, float)) or not isinstance(s['location'][1], (int, float))
    ))

    print(f"原始数量: {original_count}")
    print(f"最终数量: {len(schools)}")
    print(f"补坐标: {stats['location_filled']}")
    print(f"标记needs_verify: {stats['location_needs_verify']}")
    print(f"删除: {stats['deleted']}")
    print(f"改名: {stats['name_changed']}")
    print(f"改坐标: {stats['location_corrected']}")
    print(f"新增幼儿园: {stats['kindergartens_added']}")
    print(f"仍缺坐标: {no_loc}")
    print(f"空名称: {empty_name}")
    print(f"无效坐标格式: {invalid_loc}")

    # === 5. 保存两份 ===
    save_json(DATA_FILE, schools)
    shutil.copy2(DATA_FILE, FRONTEND_FILE)
    print(f"\n已保存到: {DATA_FILE}")
    print(f"已同步到: {FRONTEND_FILE}")

    # 验证两份一致
    with open(DATA_FILE, encoding='utf-8') as f1, open(FRONTEND_FILE, encoding='utf-8') as f2:
        assert f1.read() == f2.read(), "两份文件不一致!"
    print("两份文件一致性验证通过 ✓")

if __name__ == '__main__':
    main()
