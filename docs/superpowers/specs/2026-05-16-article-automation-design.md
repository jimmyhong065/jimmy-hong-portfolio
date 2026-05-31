# QA Blog 文章自動化生成流程 — Design Spec

**Date:** 2026-05-16
**Author:** Jimmy Hong
**Status:** Approved

---

## 1. 目的

定期自動搜尋 QA 最新知識，結合個人工作經驗風格，產生 Medium 等級的技術文章草稿存入 Supabase，讓作者只需審閱後一鍵發布。

---

## 2. 架構

```
topics.json（主題佇列）
       ↓ 每週日 09:00（Claude Code 排程 Agent）
讀取下一個 pending 主題
       ↓
WebSearch × 3
  ├─ "[主題] QA 實作 踩坑 工程師"
  ├─ "[主題] testing best practices site:medium.com"
  └─ "QA testing trends 2025 site:medium.com OR dev.to"
       ↓
載入風格範例（appium-article-revised.md + k6-article-revised.md）
       ↓
Claude 生成文章（遵循風格規則）
       ↓
寫入 Supabase posts（status: draft）
       ↓
topics.json 標記為 done
```

---

## 3. topics.json schema

```json
{
  "topics": [
    {
      "id": 1,
      "title": "主題名稱",
      "tags": ["tag1", "tag2"],
      "status": "pending | done",
      "generated_at": null
    }
  ]
}
```

位置：`/data/topics.json`

---

## 4. 文章風格規則

### 必須遵守
- 開頭：真實事件或失敗經驗，不是「本文介紹 X」
- 作者要有立場和偏好，不用「各有優缺點」
- 不用勵志結語
- 不用 emoji（程式碼外）
- 不用 `📖 說明` 等手冊式標記
- 允許短段落、不對稱結構

### 文章結構（固定框架）
1. 事件開頭（我遇到了什麼）
2. 當時的錯誤理解
3. 發現了什麼（知識點在這裡）
4. 我現在怎麼做（有立場的建議）
5. 結語（真實的，不是格言）

### 風格範例檔案
- `docs/appium-article-revised.md`
- `docs/k6-article-revised.md`

---

## 5. Supabase 寫入欄位

| 欄位 | 值 |
|------|----|
| title | 生成的文章標題（中文） |
| content | Markdown 全文 |
| tags | 繼承自 topics.json |
| status | `draft` |
| slug | kebab-case，英文，自動產生 |
| created_at | 執行當下時間 |

---

## 6. 排程設定

- 工具：Claude Code `/schedule` skill
- 頻率：每週日 09:00
- 每次處理一個主題
- 無 pending 主題時跳過

---

## 7. 人工介入點

唯一介入點在 `/admin/posts`：
1. 看到新草稿
2. 讀完、可修改
3. 按發布 → status 改為 `published`
