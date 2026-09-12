#!/bin/bash
# 连续批量采集脚本，直到全部完成
cd /home/user/Doubao/chats/38440640968808450/ChildEdu

export AI_API_KEY="2d8f251eae74485781180fcb9e0b5d9b.JHnWlnCI2XT9RFLs"
export AI_API_BASE="https://open.bigmodel.cn/api/paas/v4"
export AI_MODEL="glm-4-flash"
export BATCH_SIZE=50

while true; do
    echo "===== 开始新一轮采集 $(date) ====="
    python3 scripts/enrich_schools.py 2>&1 | tee /tmp/enrich.log
    
    # 复制到docs
    cp data/schools.json docs/data/schools.json
    cp data/school_zones.json docs/data/school_zones.json
    
    # 检查是否完成
    REMAIN=$(python3 -c "
import json
schools = json.load(open('data/schools.json'))
enriched = [s for s in schools if s.get('qualityDetail') and 'homework' in s.get('qualityDetail', {})]
print(len(schools)-len(enriched))
")
    echo "剩余: $REMAIN 所"
    
    if [ "$REMAIN" = "0" ]; then
        echo "全部完成！"
        break
    fi
    
    # 检查是否有错误（连续失败太多就停）
    if grep -q "Traceback" /tmp/enrich.log; then
        echo "脚本出错，等30秒重试"
        sleep 30
    fi
done
