# 後台課程管理 — 設計 spec

> 狀態:設計定稿,待實作。
> 日期:2026-06-21
> 範圍:純後台(admin-only)。不加任何公開頁面、不碰 posts、不匯入內文。

## 一、目標與範圍

在後台新增「課程管理」區,讓目前 `docs/course-*/` 的 6 門課(perf / k6 / api / quality / comm / second-brain)以課程實體出現,每門課可上**課程封面**、每章可上**各章封面**、章節可排序。

- **這版做**:courses 資料表、一次性 seed 腳本(掃 docs 灌資料)、後台 list + edit 兩頁、課程/章節封面上傳、章節上下移排序。
- **這版不做(YAGNI)**:任何公開 route / 公開課程頁;匯入章節內文到 DB;章節獨立編輯頁;拖拉排序;與 `posts` 的關聯。`published` 欄先存著,本輪全部維持未公開。

## 二、資料模型

章節在這版**只存 metadata**(標題 / 封面 / 排序 / 來源檔名),內文續留 `docs/` markdown,日後走文章發布流程。章節以 `chapters jsonb` 陣列存在 course row 上,完全鏡像現有 `photo_projects.images jsonb` 模式。

### `courses` 表(加入 `supabase/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS courses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,        -- 'course-second-brain'(對應 docs 目錄名)
  title         text NOT NULL,               -- 課名
  subtitle      text,                         -- 定位一句話
  description   text,                         -- 簡介
  cover_url     text,                         -- 課程封面
  chapters      jsonb DEFAULT '[]'::jsonb,    -- 見下方形狀
  tags          text[] DEFAULT '{}',
  published     boolean DEFAULT false,        -- 預設不公開
  display_order int DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS courses_set_updated_at ON courses;
CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

RLS 政策照 `photo_projects`:authenticated 全權讀寫;public 只能 `SELECT` where `published = true`(本輪無公開頁,但先建好政策不留洞)。

### chapter jsonb 形狀

```json
{
  "key": "S01",
  "title": "為什麼 QA 需要第二大腦",
  "source": "article-S01-why-qa-second-brain.md",
  "cover_url": "",
  "order": 1
}
```

- `key`:檔名前綴(S01 / A01 / L01 …),穩定識別子,seed 重跑用它比對保留封面。
- `source`:章節對應的 markdown 檔名(唯讀,給日後接 posts 用)。
- `order`:從 1 起,seed 依檔名排序給值;後台上下移會改寫。

## 三、Seed 腳本 `scripts/seed-courses.mjs`

一次性、可重跑。用 `VITE_SERVICE_ROLE_KEY` 寫入(同改線上文那套)。

行為:
1. 掃 `docs/course-*/` 每個目錄 → 一門課,`slug` = 目錄名。
2. `README.md`:第一個 `#` 標題 → `title`;定位 blockquote 或首段 → `subtitle` / `description`。
3. `article-*.md` 依檔名排序 → 章節:讀 frontmatter `title` 當章名,檔名當 `source`,序號當 `order`,檔名前綴當 `key`。
4. **upsert by slug 且保留封面**:寫入前先讀現有 row;course `cover_url` 若 DB 已有值就保留;每章 `cover_url` 以 `key`(後備 `source`)比對現有 chapters 陣列,有值就 merge 回去。只更新標題與章節結構,**不洗掉後台補過的封面**。
5. `display_order` 給課程一個穩定預設(可用固定清單或字母序),後台可改。

跑完 6 門課全進 `courses`,後台即可見。

## 四、後台頁(鏡像攝影作品 list+edit 模式)

### `src/pages/admin/AdminCourses.jsx` — `/admin/courses`(列表)
- 每門課一列/卡:封面縮圖、課名、章節數、`published` 徽章、`display_order`。
- 點進編輯;頂部「新增課程」按鈕(可手動建空課)。

### `src/pages/admin/AdminCourseEdit.jsx` — `/admin/courses/:id`(編輯)
- 課程欄位:`title` / `subtitle` / `description` / **封面上傳**(`useUpload`,鏡像 `AdminPhotoProjectEdit` 的 cover 上傳)/ `published` 開關 / `display_order`。
- 章節清單:每列 = order、章名、`source`(唯讀)、**各章封面縮圖 + 上傳鈕**、上移 / 下移。
- 存檔 → upsert `courses` row(含整個 chapters jsonb 一起寫)。新建走 insert、既有走 update,鏡像 `AdminPhotoProjectEdit` 的 insert/update 分支。

### 接線
- `src/App.jsx`:lazy import 兩頁 + 加 `/admin/courses`、`/admin/courses/:id` 兩條 route(放在 photo-projects 附近)。
- `src/pages/admin/AdminLayout.jsx`:在「📝 文章管理」附近加 `🎓 課程管理` NavLink → `/admin/courses`。

### 復用
`useUpload`(封面上傳到 Supabase Storage)、現有 `supabase` client、admin Tailwind 樣式、`ProtectedRoute`。

## 五、測試(輕量,vitest,鏡像現有 admin __tests__)
- `AdminCourses` 渲染:給 mock courses 資料,驗證課名與章節數有顯示。
- seed 對應邏輯:抽出「檔名 → { key, order } 」的純函式單測(S01/A01 前綴解析 + 排序)。

## 六、非目標(再次明列)
- 不加公開課程頁、不改任何 public route。
- 不匯入章節內文、不與 posts 建關聯(`source` 欄留作日後接點)。
- 不做拖拉排序、不做章節獨立編輯頁。
