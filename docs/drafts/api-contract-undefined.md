# API contract 沒定清楚，QA 踩的坑長這樣

---

## 目錄

1. [那個「按照 spec 實作」的 API](#那個按照-spec-實作的-api)
2. [Contract 沒定清楚的三種形式](#三種形式)
3. [QA 怎麼在測試階段發現 contract 問題](#怎麼發現)
4. [從源頭解決：API Design Review](#從源頭解決)
5. [結尾](#結尾)

---

## 那個「按照 spec 實作」的 API

我們的 App 的計時完成 API，spec 上寫的是：

```
POST /sessions/complete
Response: { "status": "success", "coins_earned": number }
```

前端拿到 `coins_earned`，更新顯示，然後觸發種樹動畫。

我測試計時完成的流程，發現有時候種樹動畫不播。

我去看 API response，`coins_earned` 是 `null`——不是 `0`，是 `null`。

前端的程式碼是：

```typescript
if (response.coins_earned > 0) {
  playPlantingAnimation()
}
```

`null > 0` 在 JavaScript 是 `false`，動畫不播。

我去問後端：「`coins_earned` 什麼時候會是 null？」

後端說：「帳號今天已經達到硬幣上限，不能再拿了，所以回 null 代表沒有入帳。」

我去問前端：「你知道 `coins_earned` 可以是 null 嗎？」

前端說：「不知道，spec 上寫的是 number，我以為不會是 null。」

---

## Contract 沒定清楚的三種形式

**1. 型別沒有定清楚**

`number` 和 `number | null` 是完全不同的 contract。Spec 上寫 `number`，但實際回 `null`，前端沒有準備好處理 null 的邏輯。

這種問題在動態型別語言（JavaScript、Python）的 API 裡特別常見，因為後端可以隨時回 null，不會有 compile error。

**2. Error case 的格式沒有定義**

正常情況的 response format 都有定義，但錯誤情況呢？

- API rate limit 被觸發，回什麼？
- 帳號被封鎖，回什麼？
- 上游服務 timeout，回什麼？

Spec 上通常只有 200 OK 的格式。4xx 和 5xx 各自的 response body 是什麼，很少有完整定義。前端通常用通用的 error handling，但如果後端在不同錯誤情況下回的格式不一致，就是 bug 的溫床。

**3. 語意沒有定清楚**

`status: "success"` 是什麼意思？是「伺服器收到請求了」，還是「所有操作都完成了」？

在 我們的 App 的案例裡，計時完成 API 回 `status: "success"` 的時候，硬幣入帳是非同步的——先回 success，再背景更新。但前端以為 success 就是一切都完成了，直接顯示最終狀態。

語意上的誤解，兩邊都沒有錯，但加在一起就是 bug。

---

## 怎麼發現

QA 在測試 API 的時候，會做幾件手動 spec 不會做的事：

**看所有可能的 response，不只是 200**

我在 Postman 裡測計時完成 API，會特意造出各種邊界條件：帳號硬幣上限、帳號封鎖、網路中斷後 retry。每種條件下的 response 我都會記錄，和 spec 對照。

任何 spec 沒有定義的 response 格式，都是潛在的 contract 問題。

**問「null 的情況」**

每看到一個 optional 欄位，我會問後端：「這個欄位什麼時候會是 null？」

Spec 上寫 nullable 是一回事，但「什麼情況下是 null」往往沒有定義清楚。知道這個，前端才能寫出正確的處理邏輯。

**前後端對讀 spec**

最有效的做法是：讓前後端各自解釋 spec 裡的欄位語意，然後比對。通常兩邊對同一個欄位的理解會有細微差異。

這件事花 30 分鐘，可以提前發現好幾個 spec 沒有說清楚的地方，比上線後再修省很多。

---

## 從源頭解決：API Design Review

與其在測試階段發現 contract 問題，不如在 API 設計階段就把問題問清楚。

我現在的做法是：在 API 進入實作之前，和前後端一起看 spec 15 分鐘，問幾個固定的問題：

1. 每個欄位可以是 null 嗎？什麼情況下是 null？
2. 錯誤情況的 response format 是什麼？每種錯誤碼分別代表什麼？
3. 這個 API 的 response 是同步的還是非同步的？
4. 如果用戶重複呼叫這個 API（retry），行為是幂等的嗎？

這四個問題，能把大部分的 contract 模糊地帶提前消滅。

---

## 結尾

那個種樹動畫不播的 bug，後來 spec 更新了：`coins_earned` 改成 `number | null`，並且加上了 null 的語意說明；前端加了 null check。

修起來不難，但如果在 API design 的時候問了那個問題，這個 bug 根本不會進到測試階段。

Contract 問題的麻煩在於：前後端各自都沒有做錯，是溝通的縫隙讓 bug 進來的。而溝通的縫隙最容易在 spec 裡找到，在測試之前就把它閉上，才是最省成本的做法。
