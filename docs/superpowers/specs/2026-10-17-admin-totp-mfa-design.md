# 後台強制 TOTP 兩階段驗證設計

日期：2026-10-17

## 目標

為 QA Lens 部落格後台加入強制 TOTP 多因素驗證（MFA）。管理員完成 Email 與密碼登入後，必須再通過驗證器產生的六位數代碼，將 Supabase session 提升至 `aal2`，才能瀏覽後台、寫入資料或呼叫管理 API。

本功能沿用既有 React、Supabase Auth、Supabase RLS 與 Cloudflare Pages Functions 架構，不新增自建的密碼、TOTP secret 或復原碼儲存服務。

## 現況與問題

目前系統使用 Supabase Email／密碼登入：

- `Login` 成功取得 session 後直接導向 `/admin`。
- `ProtectedRoute` 只確認 session 是否存在，未檢查 MFA assurance level。
- Supabase RLS 的 `public.is_admin()` 只比對管理員 Email。
- Cloudflare Pages Functions 的 `requireAdmin()` 只確認 token 有效且使用者 Email 符合 `ADMIN_EMAIL`。

因此，只要管理員密碼或現有 session 遭竊，攻擊者便可能取得後台權限。此次設計要求前端、Pages Functions 與資料庫三層共同強制 `aal2`，避免只靠畫面擋路由。

## 已選方案

採用 Supabase Auth 的 TOTP MFA，並在所有管理邊界強制 `aal2`：

1. 前端負責 TOTP 綁定、挑戰、驗證與路由引導。
2. Supabase RLS 同時驗證管理員 Email 與 JWT `aal = 'aal2'`。
3. Cloudflare Pages Functions 驗證 token、管理員 Email 與 JWT `aal`。
4. 管理員必須建立兩個已驗證的 TOTP factor，降低遺失單一裝置造成的鎖定風險。

不採用以下方案：

- 只在登入畫面要求 TOTP：無法阻止繞過前端直接呼叫資料庫或 API。
- Cloudflare Access 疊加保護：安全性更高，但現階段會增加個人部落格的設定與維護成本，不列入本次範圍。
- 自建復原碼：Supabase TOTP 沒有提供內建復原碼；自行設計會引入額外的秘密保存、雜湊、輪替與稽核責任。

## 登入與綁定流程

### 密碼登入

1. 管理員在 `/login` 輸入 Email 與密碼。
2. `signInWithPassword` 成功後，前端取得目前與下一個 authenticator assurance level。
3. 系統依狀態導向：
   - 沒有已驗證的 TOTP factor：前往 `/mfa/setup`。
   - 已有 factor，但目前 session 仍是 `aal1`：前往 `/mfa/verify`。
   - 目前 session 已是 `aal2` 且至少有兩個已驗證 factor：前往 `/admin`。

### 首次綁定

1. `/mfa/setup` 呼叫 Supabase MFA enrollment API 建立 TOTP factor。
2. 畫面顯示 QR Code、手動輸入 secret 與 factor 名稱欄位。
3. 管理員用驗證器掃描 QR Code，輸入第一組六位數代碼。
4. 前端依序建立 challenge 並 verify；成功後該 factor 成為 verified，session 提升至 `aal2`。
5. 系統要求建立第二個獨立 factor。第二個 factor 驗證完成前，只能停留在 MFA 設定／驗證流程，不能進入一般後台頁面。
6. 兩個 factor 都 verified 後導向 `/admin`。

使用者離開尚未完成的 enrollment 時，系統在下次進入流程時先列出 factors，清理或重用未驗證 factor，避免反覆產生無效項目。畫面不持久化 QR Code、secret 或六位數代碼。

### 後續登入

1. 密碼登入後，系統列出 verified TOTP factors。
2. 若有多個 factor，管理員選擇要使用的驗證器。
3. 前端建立 challenge，管理員輸入六位數代碼並完成 verify。
4. session 升級為 `aal2` 後，重新取得 session，再導向原本欲前往的管理頁面；沒有安全的內部返回路徑時導向 `/admin`。

返回路徑只接受站內 `/admin` 開頭的路徑，避免 open redirect。

## 前端授權邊界

`useAuth` 將提供一致的登入安全狀態，而不讓各頁自行推測：

- `session`：目前 Supabase session。
- `currentLevel`：目前 session 的 assurance level。
- `nextLevel`：完成已綁定 factor 後可達到的 assurance level。
- `verifiedFactors`：已驗證的 TOTP factors。
- `authReady`：session、AAL 與 factor 清單均完成載入。

`ProtectedRoute` 的決策順序：

1. 尚在載入：顯示中性 loading 狀態，不短暫露出後台內容。
2. 無 session：導向 `/login`。
3. session 是 `aal1` 且已有 verified factor：導向 `/mfa/verify`。
4. verified factor 少於兩個：導向 `/mfa/setup`。
5. session 是 `aal2` 且至少兩個 verified factors：顯示後台。

`/mfa/setup` 與 `/mfa/verify` 需要有效的 `aal1` session，但不放在要求 `aal2` 的 `ProtectedRoute` 內。兩個頁面會阻止未登入使用者操作 Supabase MFA API。

## 登入安全性管理

在後台「個人設定」加入獨立的「登入安全性」區塊，職責與網站外觀設定分開：

- 列出 verified factor 的友善名稱與狀態。
- 新增並驗證另一個 TOTP factor。
- 移除遺失或停用的 factor。
- Supabase 沒有直接重新命名 factor 的 API；若要改名稱，必須先建立並驗證新 factor，再移除舊 factor。
- 顯示至少保留兩個 factor 的原因與目前是否符合要求。
- UI 不允許移除後低於兩個 verified factors；更換裝置時必須先驗證新 factor，再移除舊 factor。

新增與移除 factor 後立即重新載入 factor 清單與 AAL 狀態。任何管理操作失敗時保留目前畫面狀態，顯示可重試的錯誤，不假設操作已完成。

## Supabase RLS 強制

新增 migration，將 `public.is_admin()` 的判斷收緊為：

- JWT Email 等於既有指定管理員 Email；且
- JWT `aal` 等於 `aal2`。

既有 authenticated policies 已集中呼叫 `public.is_admin()`，因此更新函式後，所有使用該函式的 SELECT、INSERT、UPDATE、DELETE 政策會一併要求 MFA。migration 必須包含驗證查詢，確認所有預期的 authenticated policies 仍引用 `public.is_admin()`。

RLS 是資料存取的最終邊界。即使攻擊者改寫前端、直接使用 Supabase client 或持有只有 `aal1` 的合法 session，也不能存取管理員資料。

## Cloudflare Pages Functions 強制

共用 `requireAdmin(request, env)` 維持單一授權入口：

1. 從 `Authorization: Bearer` 取得 access token；缺少 token 回 `401 Unauthorized`。
2. 使用同一 token 呼叫 Supabase `/auth/v1/user`，確認 token 有效並取得使用者。
3. 比對使用者 Email 與 `ADMIN_EMAIL`；不符合回 `403 Forbidden`。
4. 在 token 已由 Supabase 驗證後，讀取同一 JWT payload 的 `aal`；不是 `aal2` 時回 `403`，錯誤碼為 `MFA_REQUIRED`。
5. 通過後才執行端點原有行為。

此共用檢查會保護既有圖片上傳、R2 管理、寄信、推播、訂閱者讀取與群發信等管理端點。JWT payload 解析只用來讀取已驗證 token 的 claim，不取代簽章與有效期限驗證。

## 錯誤處理

前端向使用者提供可行動且不洩漏敏感資訊的訊息：

- 密碼登入失敗：「帳號或密碼錯誤」。
- TOTP 不正確或已過期：「驗證碼錯誤或已過期，請輸入目前顯示的代碼」。
- enrollment 已失效：清除畫面上的 enrollment 資料並要求重新產生 QR Code。
- 網路或 Supabase 暫時失敗：保留非敏感輸入狀態，提供重試。
- `MFA_REQUIRED`：清除可能過時的授權狀態，導向 `/mfa/verify`。
- session 無效或過期：登出本機 session，導向 `/login`。

不得在 UI、console、Cloudflare log、錯誤追蹤或資料庫中記錄 QR Code、TOTP secret、六位數驗證碼或完整 access token。

## 備援與緊急復原

日常復原依賴兩個獨立 verified factors。遺失其中一個裝置時，管理員使用另一個 factor 登入，新增替代 factor，確認可用後再移除遺失的 factor。

若兩個 factors 都無法使用，復原程序為：

1. 使用受保護的 Supabase 管理帳號進入專案管理端。
2. 對指定 Auth user 人工移除失效的 MFA factors。
3. 再次登入部落格後台；系統因 factor 少於兩個而強制重新綁定。
4. 建立並驗證兩個新 factors 後，重新測試管理權限。

應將這段程序記錄在不包含任何 secret 的營運文件中。Supabase 管理帳號本身必須另外啟用 MFA，且復原方式不能只存在於同一支可能遺失的手機。

## 測試策略

### 前端單元與元件測試

- `useAuth` 正確映射 session、AAL 與 factor 狀態。
- `ProtectedRoute` 覆蓋 loading、未登入、需要驗證、需要第二個 factor 及可進入後台等分支。
- `Login` 根據 MFA 狀態導向正確頁面。
- setup 覆蓋 QR enrollment、正確／錯誤／過期代碼、重試及未完成 enrollment。
- verify 覆蓋 factor 選擇、challenge、verify 與安全返回路徑。
- 安全性設定不允許移除後低於兩個 verified factors。
- `MFA_REQUIRED` API 回應會導向驗證流程。

測試使用 mock Supabase Auth MFA API，不在測試輸出放入真實 secret 或 token。

### Pages Functions 測試

- 無 Authorization header：`401`。
- 無效或過期 token：`401`。
- 有效 token，但 Email 不是管理員：`403`。
- 管理員 token，但 `aal1`：`403` 且錯誤碼為 `MFA_REQUIRED`。
- 管理員 `aal2` token：授權通過。
- 畸形 JWT payload：安全地拒絕，不讓函式拋出未處理例外。

### RLS 整合驗證

- 管理員 `aal1` session 對受保護資料的讀寫均被拒絕。
- 非管理員 `aal2` session 仍被拒絕。
- 管理員 `aal2` session 可依既有 policies 執行預期操作。
- anon 公開讀取規則不因 admin MFA migration 被意外改變。

### 正式環境煙霧測試

- 新登入完成兩個 factors 的首次綁定。
- 登出後分別使用兩個 factors 登入。
- 重新整理瀏覽器後仍可正確判斷 AAL。
- 文章新增／編輯、設定更新、圖片上傳、R2 管理、寄信與推播各執行一次安全的代表性操作。
- 使用 `aal1` session 直接呼叫一個 Supabase 寫入與一個 Pages Function，確認兩者均被拒絕。

## 上線順序與回復

為避免在 UI 尚不可用時先鎖住資料庫，上線依序進行：

1. 確認 Supabase 專案已允許 TOTP enrollment、challenge 與 verify。
2. 部署 MFA 頁面、前端路由保護及支援 `aal2` 的 Pages Functions。
3. 在正式環境建立兩個 verified factors，登出後分別驗證可登入。
4. 套用收緊 `public.is_admin()` 的 RLS migration。
5. 執行正式環境煙霧測試並保存不含 secret 的結果。

migration 需附一份明確的緊急回復 SQL，可把 `public.is_admin()` 暫時恢復為只檢查管理員 Email。回復會降低安全性，只能在 MFA UI 或 Supabase MFA 服務異常、且後台營運確實受阻時人工執行；問題排除後必須重新套用 `aal2` 規則並再次驗證。

## 不在本次範圍

- SMS MFA、Email OTP 或 WebAuthn／passkey。
- Cloudflare Access。
- 自建 recovery codes。
- 多管理員角色與權限模型重構。
- 修改公開網站訪客的登入或閱讀體驗。

## 完成條件

- 未完成 TOTP 的 `aal1` session 無法開啟任何一般後台頁面。
- 管理員必須維持至少兩個 verified TOTP factors 才能進入一般後台。
- Supabase RLS 與所有管理 Pages Functions 均拒絕 `aal1`。
- 非管理員即使完成 MFA 仍沒有管理權限。
- 兩個 factors 均已在正式環境完成登入驗證。
- 自動測試、build、lint 與正式環境煙霧測試都有明確結果。
- log、錯誤訊息與持久化資料中不含 TOTP secret、驗證碼或完整 access token。

## 參考資料

- [Supabase Multi-Factor Authentication](https://supabase.com/docs/guides/auth/auth-mfa)
- [Supabase TOTP MFA](https://supabase.com/docs/guides/auth/auth-mfa/totp)
- [Supabase JavaScript MFA enrollment](https://supabase.com/docs/reference/javascript/auth-mfa-enroll)
