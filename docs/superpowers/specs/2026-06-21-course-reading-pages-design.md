# 課程閱讀頁設計（Course Reading Pages）

**Date:** 2026-06-21
**Status:** Approved, ready for implementation plan

## 目標

讓課程（`courses` + 章節 `posts`）有可閱讀的前台頁面。本輪先當「後台預覽」用 —
作者以學員視角讀完整課，評估學習體驗好不好；同一頁同時是日後對外公開課程頁的雛形，
發布後直接上線，不重做。

決策來源（brainstorm）：
- 此頁是**未來公開課程頁的雛形**，設計要為上線鋪路。
- 版面採**課程首頁 + 章節頁**（手機優先；重用現有文章渲染；上線後課程首頁是乾淨 SEO/分享單元）。
- 章節頁走**獨立 `/course/:slug/:chapter` 路由**。
- 章節**課程專屬，不進 /blog** → canonical = 課程章節頁，無重複內容問題。

## 路由

| 路由 | 頁面 | 內容 |
|------|------|------|
| `/course/:slug` | 課程首頁 CourseLanding | 封面、標題、副標、簡介、章節清單（編號 + 章封面 + 已讀/未讀 + 「X / N 章」進度） |
| `/course/:slug/:chapterSlug` | 章節頁 CourseChapter | 文章內文、頂部閱讀進度條、上一章/下一章、回課程首頁 |

兩條都加進 `src/App.jsx` 的 `AppRoutes`（公開區，非 /admin 底下）。

## 預覽 gate（重用現有 `?preview=1`）

沿用 BlogPost 既有模式（`const isPreview = searchParams.get('preview') === '1'`）：

- 預設只在 `courses.published = true`（章節另需 `posts.published = true`）時可見。
- 未發布時，`?preview=1` 可看 → admin 預覽用途。
- `AdminCourses.jsx` 與 `AdminCourseEdit.jsx` 各加一顆「預覽」鈕，連到 `/course/:slug?preview=1`。
- `?preview=1` 在課程首頁要傳遞到章節連結，章節頁才能繼續預覽未發布內容。

## 資料取法

新增 `src/hooks/useCourse.js`：依 slug 抓 course 與其章節。

- 課程首頁：
  - `courses` where `slug` = :slug（單筆）
  - `posts` where `course_id` = course.id，`select id, title, slug, course_order, cover_url, published`，
    `order by course_order`
  - 非 preview 時章節清單只顯示 `published = true` 的章節
- 章節頁：
  - `posts` where `slug` = :chapterSlug（單筆）；非 preview 加 `published = true`
  - 上一章/下一章 = **同 `course_id`、相鄰 `course_order`**（不可用 `published_at`，不可走 tags 系列）

## 課程專屬，不漏進 /blog

- `src/hooks/usePosts.js`：query 加 `.is('course_id', null)`，已發布章節不出現在部落格列表。
- `src/pages/BlogPost.jsx`：prev/next 與 tags 系列查詢同樣排除 `course_id`
  （`.is('course_id', null)`），讓 /blog 文章導航不會連進課程章節。

## 重用渲染

`BlogPost.jsx` 的內文已透過 `src/components/MarkdownContent.jsx`（`props: { content }`）渲染。
`CourseChapter` 直接重用 `MarkdownContent`，**不需**另抽 ArticleBody（YAGNI）。
同樣可直接重用 `TableOfContents`、`useReadingProgress`、`useReadHistory`、`useActiveHeading`、`parseHeadings`。

## 閱讀體驗（對應「比較好學習」，全用現有 hook）

- 章節清單已讀/未讀標記：`useReadHistory`（by slug）
- 章節頁頂部閱讀進度條：`useReadingProgress`
- 課程內上一章/下一章導航；課程首頁顯示「X / N 章」已讀進度

## 元件清單

新檔（皆小、單一職責）：
- `src/pages/CourseLanding.jsx`
- `src/pages/CourseChapter.jsx`
- `src/hooks/useCourse.js`

改檔：
- `src/App.jsx`（加兩條路由，lazy import）
- `src/hooks/usePosts.js`（排除 course_id）
- `src/pages/BlogPost.jsx`（prev/next + 系列排除 course_id）
- `src/pages/admin/AdminCourses.jsx`、`src/pages/admin/AdminCourseEdit.jsx`（加預覽鈕）

## 本輪不做（follow-up）

- bot 全文注入（`functions/_middleware.js`）對 `/course/...` URL 的處理 —
  未發布前不急；課程發布前再補（避免 AI 爬蟲拿到空殼）。
- 付費牆 / 試讀章節 gate。
- 桌機側邊目錄（雙欄）加強版。

## 測試

- `useCourse`：依 slug 回 course + 排序章節；preview 與非 preview 過濾差異。
- 章節相鄰邏輯：以 `course_order` 取上/下章，邊界（首章無上一章、末章無下一章）。
- `usePosts` 排除 course_id：已發布章節不在列表。
- 既有 `AdminCourses` / `courseOrder` 測試維持通過；BlogPost 抽 ArticleBody 後行為不變。
