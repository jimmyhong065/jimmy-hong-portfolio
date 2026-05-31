# Security Testing 入門：不懂資安的 QA 能做的第一步

---

## 目錄

1. [那個我沒有測的帳號隔離問題](#那個帳號隔離問題)
2. [QA 做 Security Testing 的定位](#qas-定位)
3. [四個不需要資安專業的測試方向](#四個方向)
4. [工具和流程](#工具和流程)
5. [結尾](#結尾)

---

## 那個我沒有測的帳號隔離問題

我們的 App 有一個功能：好友可以查看彼此的森林。

我測試了正常流程：加好友、查看好友森林、顯示正確。測試過了。

幾週後，另一個 QA 同事在測的時候發現：如果直接修改 API request 裡的 `user_id` 參數，你可以查看任何人的森林，不只是你的好友。

這是一個水平權限控制（IDOR，Insecure Direct Object Reference）問題。在 OWASP Top 10 裡排名一直在前幾位。

我沒有測到這個問題，因為我只測了「正常用戶做正常操作」的流程。我沒有問：「如果用戶刻意修改 request，能不能存取不屬於他的資源？」

---

## QA 的定位

做 security testing 不需要是滲透測試專家。QA 的定位不是找零日漏洞，是：

**在功能測試中，同時確認基本的安全邊界有被正確實作。**

這包含：
- 用戶只能存取屬於自己的資源
- 未授權的操作被正確拒絕
- 敏感資料沒有在不應該出現的地方暴露
- 輸入沒有被當成程式碼執行

這些不需要深厚的資安知識，需要的是「用攻擊者的眼光問問題」的習慣。

---

## 四個不需要資安專業的測試方向

**1. 水平權限控制（IDOR）**

核心問題：用戶 A 能不能存取用戶 B 的資源？

測試方法：
1. 登入帳號 A，找一個資源的 ID（比如森林的 `item_id`、計時 session 的 `session_id`）
2. 登出，登入帳號 B
3. 用帳號 B 的 token，直接呼叫 API 存取帳號 A 的資源

```bash
# 用帳號 A 的 item_id，但用帳號 B 的 token
curl -H "Authorization: Bearer TOKEN_B" \
  https://api.example.com/v1/forests/FOREST_ID_OF_A
```

預期結果：API 回 403 Forbidden，不是 200 + 資料。

如果回了 200 + 資料，就是 IDOR 問題。

我們的 App 應該測的情境：
- 用別人的 `item_id` 查看森林
- 用別人的 `session_id` 查看計時記錄
- 用別人的帳號 ID 刪除他的樹木

**2. 垂直權限控制**

核心問題：免費用戶能不能存取 Pro 功能？

測試方法：
1. 用免費帳號直接呼叫 Pro 功能的 API，不透過 UI
2. 確認 API 有做 server-side 的權限驗證，而不只是 UI 隱藏了按鈕

很多地方 UI 隱藏了免費用戶看不到的功能，但 API 本身沒有驗證。用戶如果知道 API endpoint，可以直接呼叫。

**3. 輸入驗證**

核心問題：你的 API 能不能接受惡意的輸入？

不需要測複雜的 SQL injection 或 XSS，幾個基本的測試：

- 超長字串：在 `tree_type` 欄位輸入 10000 字元
- 特殊字元：`<script>alert(1)</script>`、`'; DROP TABLE users;--`
- 負數和邊界值：`duration: -1`、`duration: 999999999`
- 型別錯誤：`duration: "abc"` 而不是整數

觀察 API 的反應：是正確地回 400 Bad Request 並帶有明確的錯誤訊息，還是 500 Internal Server Error（代表錯誤沒有被正確處理），還是靜默接受了不合理的輸入。

**4. 敏感資料暴露**

核心問題：API response 有沒有帶出不應該暴露的資料？

用 Postman 或 browser DevTools 看 API response：
- 有沒有帶出其他用戶的資料
- 有沒有帶出密碼的 hash 或 token
- 有沒有帶出過多的系統內部資訊（stack trace、DB 結構）
- HTTPS？所有 API 都走 HTTPS，沒有例外

這些用肉眼看 response 就能發現，不需要工具。

---

## 工具和流程

**OWASP ZAP（免費）**

一個 proxy 工具，可以 intercept 並修改 HTTP request。比 Postman 更適合做安全測試：可以自動掃描已知的漏洞模式、可以 fuzzing 輸入。

基本用法：把 ZAP 設成 proxy，瀏覽 App，讓 ZAP 記錄所有 request，然後對這些 request 跑 active scan。

不需要懂所有掃描結果，先看 High 和 Medium 風險的 finding，逐一確認。

**Burp Suite Community（免費版）**

功能比 ZAP 豐富，學習曲線稍高。如果你需要做更細緻的 request 修改和 repeater 測試，Burp 比 ZAP 好用。

**一個簡單的 security checklist**

每次測試新功能，過一遍這個清單：

```
□ 有沒有涉及用戶資源的 CRUD？→ 測 IDOR
□ 有沒有 Pro / 免費版的功能差異？→ 測垂直權限
□ 有沒有接受用戶輸入的欄位？→ 測邊界值和特殊字元
□ 有沒有在 response 裡帶出敏感資料？→ 看 API response
```

---

## 結尾

那個好友森林的 IDOR 問題，修起來只是一行：在 API handler 裡加一個「request 的 user 有沒有看這個 forest 的權限」的驗證。

問題不在技術難度，在沒有人問「有沒有測過未授權存取」這個問題。

Security testing 不需要一開始就做得很完整，從這四個方向開始，把「用攻擊者的眼光問問題」加進每個功能的測試流程裡。這樣做發現不了零日漏洞，但能擋住大部分最常見的安全問題——而且這些問題幾乎每個 App 都有。
