#!/bin/bash
# 每天手動執行一次，產生今日 QA 文章草稿
# 用法: ./generate-article.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOPICS_FILE="$SCRIPT_DIR/data/topics.json"
DRAFTS_DIR="$SCRIPT_DIR/docs/drafts"
STYLE_DIR="$SCRIPT_DIR/docs"
TODAY=$(date +%Y-%m-%d)

mkdir -p "$DRAFTS_DIR"

# 取得下一個 pending 主題
TOPIC_ID=$(jq '[.topics[] | select(.status == "pending")] | first | .id' "$TOPICS_FILE")
TOPIC_TITLE=$(jq -r '[.topics[] | select(.status == "pending")] | first | .title' "$TOPICS_FILE")
TOPIC_TAGS=$(jq -r '[.topics[] | select(.status == "pending")] | first | .tags | join(", ")' "$TOPICS_FILE")

if [ "$TOPIC_TITLE" = "null" ] || [ -z "$TOPIC_TITLE" ]; then
  echo "✓ 所有主題已完成，請在 data/topics.json 新增更多主題"
  exit 0
fi

echo "主題：$TOPIC_TITLE"
echo "Tags：$TOPIC_TAGS"
echo "開始生成..."

# 讀取風格範例
STYLE_EXAMPLE_1=$(cat "$STYLE_DIR/appium-article-revised.md")
STYLE_EXAMPLE_2=$(cat "$STYLE_DIR/k6-article-revised.md")

OUTPUT_FILE="$DRAFTS_DIR/${TODAY}-draft.md"

# 用 claude CLI 生成文章
claude --dangerously-skip-permissions -p "你是一位有多年實務經驗的 QA 工程師，正在為 Medium 寫一篇技術文章。

## 主題
$TOPIC_TITLE

## 風格規則（必須嚴格遵守）
- 開頭必須是一個真實的失敗、困惑、或踩坑的事件，不能是「本文介紹 X」
- 作者要有明確立場和個人偏好，不能說「各有優缺點，視情況而定」
- 不能用勵志結語（例如「穩定是我們換來的」這類格言）
- 不用 emoji（程式碼區塊以外）
- 不用「📖 說明」「✅ 重點」等手冊標記
- 允許短段落，不需要每段對稱
- 技術知識要正確，但說話方式像在跟同事講話

## 文章結構
1. 事件開頭：一個具體的失敗或困惑時刻
2. 當時的錯誤理解：讀者會認同，因為他們也這樣想過
3. 發現了什麼：知識點在這裡出現，但用「我發現...」引導
4. 我現在怎麼做：有立場的建議，不是中立的列表
5. 結尾：真實的，可以說「我還在學」或「這是目前的做法」

## 風格範例 1（請模仿這個風格）
$STYLE_EXAMPLE_1

## 風格範例 2（請模仿這個風格）
$STYLE_EXAMPLE_2

## 任務
請搜尋關於「$TOPIC_TITLE」的最新知識（包括業界趨勢和實作經驗），結合以上風格範例，寫一篇完整的 Markdown 文章。

文章要求：
- 長度：1500–2500 字
- 語言：繁體中文
- 要有至少一個真實工作場景的例子
- 程式碼範例（如果適合的話）
- Tags 參考：$TOPIC_TAGS

只輸出 Markdown 文章本身，不要加任何前言或解釋。" > "$OUTPUT_FILE"

# 更新 topics.json，標記為 done
jq --argjson id "$TOPIC_ID" --arg date "$TODAY" \
  '(.topics[] | select(.id == $id)) |= . + {status: "done", generated_at: $date}' \
  "$TOPICS_FILE" > "${TOPICS_FILE}.tmp" && mv "${TOPICS_FILE}.tmp" "$TOPICS_FILE"

echo ""
echo "✓ 文章已存至：$OUTPUT_FILE"
echo "✓ 主題 #$TOPIC_ID 標記為完成"
