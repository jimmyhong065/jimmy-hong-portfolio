# 後台課程管理 — 設計 spec

> 狀態:設計定稿,待實作。
> 日期:2026-06-21
> 範圍:純後台(admin-only)。不加任何公開頁面。章節內文**匯入 posts**(以 draft 存,公開端讀不到)。

## 一、目標與範圍

在後台新增「課程管理」區,讓目前 `docs/course-*/` 的 6 門課(perf / k6 / api / quality / comm / second-brain)以課程實體出現,每門課可上**課程封面**、每章可上**各章封面**、章節可排序。章節內文正式收進 DB(`posts`),複用現有文章編輯器與發布流程。

- **這版做**:`courses` 資料表、`posts` 加 course 關聯與封面欄、一次性 seed 腳本(掃 docs 把課灌進 `courses`、把章節內文灌進 `posts` 當 draft)、後台 list + edit 兩頁、課程/章節封面上傳、章節上下移排序。
- **這版不做(YAGNI)**:任何公開 route / 公開課程頁;章節獨立編輯頁(複用現有 `AdminPostEdit`);拖拉排序。

### 內文的家:`posts`(單一來源)

章節內文匯入 `posts`,每章 = 一個 `posts` row,以 `course_id` 關聯課程。好處:內文只有一份家、複用現有文章 markdown 編輯器(`AdminPostEdit`)、複用發布流程。匯入時 `published = false`,所以公開端看不到(見「五、安全」)。

## 二、安全 —「還不要公開」如何保證(已驗證)

匯入 `posts` 的風險是草稿外洩。已確認公開端三條路都擋:

- `usePosts`(列表)`.eq('published', true)`。
- bot dynamic render middleware(`functions/_middleware.js`)list 與單篇查詢都 `published=eq.true`。
- 單篇 SPA `BlogPost.jsx` 雖然查詢沒加 filter,但 **posts RLS 政策** `anon read published posts ... USING (published = true)` 在 DB 層只讓 anon 拿到 published row。draft 章節 anon 讀不到。

結論:章節以 `published=false` 匯入即不公開。`courses` 表照樣加同模式 RLS(anon 只讀 `published=true`,本輪課程全 `false`)。

## 三、資料模型

### `courses` 表(加入 `supabase/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS courses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,        -- 'course-second-brain'(對應 docs 目錄名)
  title         text NOT NULL,
  subtitle      text,                         -- 定位一句話
  description   text,                         -- 簡介
  cover_url     text,                         -- 課程封面
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

-- RLS 照 posts/photo_projects
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
-- anon 只讀 published=true；authenticated 全權
```

### `posts` 加三欄(ALTER TABLE,皆 nullable,不動既有文章)

```sql
ALTER TABLE posts ADD COLUMN IF NOT EXISTS course_id    uuid REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS course_order int;       -- 課程內章節序(1 起)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_url    text;      -- 各章封面
CREATE INDEX IF NOT EXISTS posts_course_idx ON posts (course_id, course_order);
```

- 一般部落格文章 `course_id` 為 null,行為不變。
- 章節 = `course_id` 指向某課的 post;`course_order` 給課程內排序;`cover_url` 存各章封面。
- 課程的章節清單 = `SELECT * FROM posts WHERE course_id = ? ORDER BY course_order`。

### slug 策略(seed 產生,穩定且唯一)

`posts.slug` UNIQUE。章節 slug 由「課程短名 + 檔名」產生,避免撞既有文章:
`slug = <course-short>-<filebase>`,例:`second-brain-s01-why-qa-second-brain`(`course-short` = 去掉 `course-` 前綴;`filebase` = 去掉 `article-` 與 `.md`)。穩定 → seed 重跑用它比對。

## 四、Seed 腳本 `scripts/seed-courses.mjs`(一次性、可重跑、非破壞)

用 `VITE_SERVICE_ROLE_KEY` 寫入(同改線上文那套)。

行為:
1. 掃 `docs/course-*/`,每目錄 → upsert 一筆 `courses`(`slug` = 目錄名;`README.md` 第一個 `#` → `title`,定位 blockquote/首段 → `subtitle`/`description`)。
2. 每目錄的 `article-*.md` 依檔名排序 → 每篇 upsert 一筆 `posts`:
   - `title` / `excerpt` / `tags` 讀 frontmatter;`content` = 去掉 frontmatter 的正文。
   - `slug` 依上方策略;`course_id` = 該課 id;`course_order` = 排序序號;`published = false`。
3. **冪等且非破壞**:以 slug 判斷。
   - `posts`:**該 slug 已存在就跳過,不覆寫**(保留後台改過的內文、封面、published、course_order)。只 insert 缺的章節。
   - `courses`:已存在則只更新 `title`/`subtitle`/`description`,**保留 `cover_url`、`published`、`display_order`**。
4. `display_order`:課程給穩定預設(固定清單對映,如 perf=1…second-brain=6),後台可改。

跑完:6 門課進 `courses`,~84 章以 draft 進 `posts`,後台即可見、可排序、可上封面;公開端看不到。

## 五、後台頁(鏡像現有 list+edit 模式)

### `src/pages/admin/AdminCourses.jsx` — `/admin/courses`(列表)
- 每門課一列/卡:封面縮圖、課名、章節數(count posts where course_id)、`published` 徽章、`display_order`。
- 點進編輯;「新增課程」按鈕(手動建空課)。

### `src/pages/admin/AdminCourseEdit.jsx` — `/admin/courses/:id`(編輯)
- 課程欄位:`title` / `subtitle` / `description` / **課程封面上傳**(`useUpload`,鏡像 `AdminPhotoProjectEdit` cover)/ `published` 開關 / `display_order`。存檔 → update `courses` row。
- 章節清單(查 `posts where course_id` 排序):每列 = `course_order`、章名(連到既有 `/admin/posts/:id` 編輯內文)、**各章封面縮圖 + 上傳鈕**(寫 `posts.cover_url`)、上移 / 下移(改 `course_order`)。
- 章節內文**不在此頁編**,點章名跳 `AdminPostEdit`(完全複用)。本頁只管課程層欄位 + 章節封面 + 排序。

### 接線
- `src/App.jsx`:lazy import 兩頁 + `/admin/courses`、`/admin/courses/:id` 兩 route(放 photo-projects 附近)。
- `src/pages/admin/AdminLayout.jsx`:「📝 文章管理」附近加 `🎓 課程管理` → `/admin/courses`。

### 既有頁的小影響
- 匯入後 ~84 draft 章節也會出現在「📝 文章管理」列表(draft 狀態)。現有 draft/published 篩選已能處理;這版**不**為 AdminPosts 加課程篩選(YAGNI,之後嫌亂再加)。

### 復用
`useUpload`、`supabase` client、admin Tailwind 樣式、`ProtectedRoute`、`AdminPostEdit`(章節內文編輯)。

## 六、測試(輕量,vitest,鏡像現有 admin __tests__)
- seed 純函式單測:檔名 → `{ key, order, slug }` 解析(S01/A01/L01 前綴 + 排序 + slug 產生規則)。
- `AdminCourses` 渲染:mock courses,驗證課名與章節數顯示。
- `AdminCourseEdit` 章節上移/下移:驗證 `course_order` 重排邏輯(純函式抽出來測)。

## 七、非目標(再次明列)
- 不加公開課程頁、不改任何 public route。
- 不做章節獨立編輯頁(複用 `AdminPostEdit`)、不做拖拉排序。
- seed 不覆寫已存在資料(後台編輯為主、seed 只補缺)。
