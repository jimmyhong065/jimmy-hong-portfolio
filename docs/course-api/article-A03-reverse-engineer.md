---
title: 沒有 API 文件怎麼辦？用 DevTools 逆推一支 API
excerpt: 理想世界裡每支 API 都有 Swagger 文件，但現實是很多公司根本沒有。這篇教你在最壞情況下，用瀏覽器的開發者工具，從一個表單操作逆推出一支 API 的全貌。
tags: [API 測試, DevTools, 逆向, 入門]
status: draft
---

# 沒有 API 文件怎麼辦？用 DevTools 逆推

上一篇說「開測前要先掌握 API 契約」。但如果你問開發要文件，得到的是一句「沒有耶」呢？

先給你打個預防針：**真的很多公司沒有 API 文件。** 我看過最慘的一次，是一支有上千個欄位的 API，背後的邏輯處理全靠無數次測試推敲，整整拆了一個禮拜。所以這篇要講的，是沒辦法中的辦法——但你遲早用得上。

## 先講理想：有文件長怎樣

最理想的情況，是開發用工具產生的 API 文件，最常見的是 **Swagger／OpenAPI**。它會清楚列出每支 API 的 URL、方法、參數、request／response 格式，甚至能直接在上面試打。有 Swagger，前一篇那張契約表幾乎是現成的。

但沒有的話，就只能自己抓。

## 用 DevTools 逆推：四步

瀏覽器的開發者工具（F12）就是你的抓包神器。以 `automationintesting.online` 的「給店家留言」表單為例：

1. 打開 DevTools，切到 **Network** 分頁。
2. 在頁面上實際操作一次——填好表單、按送出。
3. Network 會出現這次操作打出去的請求，點開它。
4. 看三個地方收集資訊：**Headers**（URL、方法、認證）、**Payload**（request body）、**Response**（回應內容與 status code）。

整理出來大概長這樣：

```
URL: https://automationintesting.online/message/

Request:
  Method: POST
  Content-Type: application/json
  Body: { "name": ..., "email": ..., "phone": ..., "subject": ..., "description": ... }

Response:
  Content-Type: application/json
  Body: { "messageId": int, ...原內容 }
  Success Status Code: 201
```

## 逆推抓不到的，怎麼補

DevTools 能告訴你「這支 API 長怎樣、怎麼成功呼叫」，但有些資訊它給不了：

- **每個欄位的長度／型別限制**：看得到值，看不到規則。
- **各種失敗情境**：你只操作了成功的那次。

補的辦法有三條：如果有權限看資料庫，欄位的長度限制通常跟 DB schema 的設定有關，可以推測；其餘的就只能**自己試**（故意填超長、填空、填錯格式，看它回什麼），或是**直接問開發**。

## 帶得走

- 理想是 Swagger／OpenAPI 文件；沒有就用 DevTools 逆推。
- 逆推四步：Network 分頁 → 實際操作 → 點開請求 → 抓 Headers／Payload／Response。
- 逆推抓不到欄位限制與失敗情境，要靠看 DB、自己試、或問開發補齊。
- 順帶一句良心話：拜託寫 API 文件，逆推太燒時間了。

下一篇：status code 回 200 就代表成功嗎？聊聊 HTTP／REST 的必備底層。
