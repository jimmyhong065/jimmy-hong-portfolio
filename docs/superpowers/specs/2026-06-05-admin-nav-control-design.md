# Admin Nav Control — Design Spec

Date: 2026-06-05

## Goal

讓後台可以控制手機底部 tab bar：顯示/隱藏、排序、修改標籤/URL、新增/刪除 tab，並支援從預設 SVG 圖示庫選擇圖示。

---

## Architecture

```
Supabase settings (id=1)
  └── nav_tabs: JSONB  ← 新增欄位 (DEFAULT NULL)

useSettings hook (已有)
  └── Nav.jsx 讀取 settings.nav_tabs

Nav.jsx
  └── nav_tabs 有值 → 用 nav_tabs（filter visible, sort by order）
      nav_tabs 為 null/空 → fallback 原本 5 個 hardcoded tab

AdminSettings.jsx
  └── 新增「手機選單」區塊（獨立儲存按鈕）
```

---

## Tab Schema

```ts
interface NavTab {
  id: string           // uuid 或 nanoid，前端生成
  label: string        // 顯示在 icon 下方的文字
  url: string          // 內部路由 (e.g. /blog) 或外部 URL (https://...)
  icon_key: string     // 對應 SVG_MAP 的 key
  visible: boolean     // 是否在 tab bar 顯示
  order: number        // 排序，從 0 開始
}
```

---

## SVG_MAP

前端 constant，定義 12 個可選圖示：

| key | 圖示說明 |
|-----|---------|
| `projects` | 4 個格子（現有） |
| `blog` | 文件 + 折角（現有） |
| `saved` | 書籤（現有） |
| `faq` | 問號圓圈（現有） |
| `about` | 人像（現有） |
| `camera` | 相機 |
| `home` | 首頁房子 |
| `star` | 星號 |
| `link` | 外部連結箭頭 |
| `mail` | 信封 |
| `chart` | 折線圖 |
| `code` | `</>` |

SVG_MAP 存在 `src/components/NavIconMap.jsx`（新建），Nav.jsx 和 AdminSettings.jsx 都 import。

---

## Fallback Tabs

`Nav.jsx` 定義 `FALLBACK_TABS`，格式對齊 NavTab schema：

```js
const FALLBACK_TABS = [
  { id:'1', label:'作品集', url:'/projects', icon_key:'projects', visible:true, order:0 },
  { id:'2', label:'部落格', url:'/blog',     icon_key:'blog',     visible:true, order:1 },
  { id:'3', label:'收藏',   url:'/saved',    icon_key:'saved',    visible:true, order:2 },
  { id:'4', label:'FAQ',    url:'/faq',      icon_key:'faq',      visible:true, order:3 },
  { id:'5', label:'關於我', url:'/about',    icon_key:'about',    visible:true, order:4 },
]
```

---

## Nav.jsx 邏輯

```js
const rawTabs = settings?.nav_tabs?.length ? settings.nav_tabs : FALLBACK_TABS
const tabs = rawTabs
  .filter(t => t.visible)
  .sort((a, b) => a.order - b.order)
```

外部連結判斷：
```js
url.startsWith('http')
  ? <a href={url} target="_blank" rel="noreferrer">
  : <Link to={url}>
```

---

## Admin UI — 手機選單區塊

位置：`AdminSettings.jsx` 現有表單底部，`<hr>` 分隔，獨立儲存按鈕。

### Tab 清單

每筆顯示：
- 眼睛 toggle（filled = visible，灰 = hidden）
- icon_key 對應的 SVG 小圖預覽（16px）
- label 文字
- url 文字（truncate）
- ⬆ ⬇ 按鈕（swap order）
- ✎ 展開編輯
- 🗑 刪除（直接從 array 移除，存檔後生效）

### 編輯模式（inline expand）

點 ✎ 後展開同列：

```
圖示選擇: [12 個圖示格，點選高亮]
標籤:     [input]
網址:     [input, placeholder="https://... 或 /blog"]
          [取消] [確認]
```

### 新增 tab

清單底部「+ 新增 tab」按鈕，展開同樣的 inline 表單，預設 icon_key = `link`、visible = true。

### 儲存邏輯

「儲存選單設定」按鈕：
- 重新計算每個 tab 的 `order`（依陣列 index）
- `supabase.from('settings').update({ nav_tabs: tabs }).eq('id', 1)`

---

## Supabase Migration

```sql
ALTER TABLE settings ADD COLUMN IF NOT EXISTS nav_tabs JSONB DEFAULT NULL;
```

執行於 Supabase SQL Editor。初始值 NULL，Nav.jsx fallback 原本 5 tab，現有用戶不受影響。

---

## Out of Scope

- 拖曳排序（用上下箭頭取代，不加 dnd 套件）
- 桌機版選單控制（桌機 nav 另有設計）
- Tab icon 自訂 SVG 上傳
- Tab 數量限制（UI 不強制，合理使用）
