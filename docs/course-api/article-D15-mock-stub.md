---
title: 第三方金流三天兩頭壞，你的測試怎麼辦？Mock 與 Stub
excerpt: 你的下單 API 要呼叫第三方金流，但它的 sandbox 不穩、難造逾時、還可能要錢。這篇講用 mock／stub 把不可控的依賴隔離掉，並劃清「該 mock」和「mock 過頭變成測假的」的界線。
tags: [API 測試, mock, stub, 依賴隔離]
status: draft
---

# 第三方金流三天兩頭壞，測試怎麼辦？

你要測「下單」，但下單會去呼叫第三方金流。問題來了：金流的 sandbox 三天兩頭壞、想測「金流逾時」根本造不出那個情境、有些還按呼叫次數收費。難道你的測試要跟著它一起時好時壞？

不用。這就是 **mock／stub** 的場景——把不可控的依賴換成你能掌控的假替身。

## 隔離依賴：測「我方的處理」

mock 的核心價值，是讓你能**穩定地重現各種回應**，尤其是真實環境難造的那些：第三方回逾時、回 `500`、回畸形資料。你關心的不是金流本身對不對，而是「**當金流這樣回，我的系統有沒有正確處理**」。

用 `responses` 套件示範——攔截送往金流的請求，叫它回你指定的結果：

```python
import responses
import requests

CHARGE_URL = "https://payment.example.com/charge"

@responses.activate
def test_checkout_handles_payment_500():
    # 假裝金流爆了，回 500
    responses.add(responses.POST, CHARGE_URL, json={"error": "internal"}, status=500)

    result = checkout(order_id=123)        # 你的下單流程

    # 重點：驗你的系統有優雅處理，而不是自己也跟著爆
    assert result["status"] == "payment_failed"
    assert result["order_state"] == "pending"   # 訂單沒被誤標成已付款


@responses.activate
def test_checkout_handles_payment_timeout():
    # 連逾時都能模擬——真實環境最難造的情境
    responses.add(responses.POST, CHARGE_URL, body=requests.exceptions.ConnectionError())

    result = checkout(order_id=123)
    assert result["status"] == "payment_failed"
```

逾時、`500` 這種在真實 sandbox 裡可遇不可求的情境，mock 讓你說來就來——這正是它最不可取代的地方。

## Stub 與 mock 的差別

兩個詞常混用，但有個有用的區分：

- **Stub**：只負責「回固定的假資料」，讓流程能走下去。
- **Mock**：除了回假資料，還會**記錄自己怎麼被呼叫**，讓你驗「有沒有用對的參數打它」。

例如驗「下單真的有用正確金額去扣款」，就需要 mock 去斷言「`charge` 被呼叫時帶的金額是 111」。

## 服務級的假替身

如果要連整支服務一起假掉（跨語言、給多個測試共用），可以用 **WireMock** 這類工具，起一個假的 HTTP 服務，照你設定的規則回應。`responses`／`requests-mock` 適合 Python 程序內，WireMock 適合獨立的假服務。

## 別 mock 過頭

mock 是雙面刃。最大的陷阱是：**你 mock 的假回應，跟真實服務早就不一樣了，但測試還一片綠。** 這叫「測試在測你自己的假設」，給你虛假的安全感。

劃界線的原則：

- **該 mock**：不可控的第三方、難造的異常情境（逾時、錯誤）、慢或要錢的依賴。
- **不該全 mock**：你真正要驗的那支 API 本身別 mock；而且要留**少量真實整合測試**，定期確認「真實服務的契約沒有漂移」。

mock 測「我方對各種回應的處理」，真實整合測試守「契約還對得上」——兩者搭配，才不會自我感覺良好。

## 帶得走

- 不可控依賴（第三方、難造的逾時／錯誤、要錢的）用 mock／stub 隔離。
- mock 讓你穩定重現真實難造的情境，驗的是**我方的處理**對不對。
- stub 回假資料、mock 還記錄呼叫方式（可驗參數對不對）。
- 別 mock 過頭：要測的 API 別 mock，並留少量真實整合測試守契約不漂移。

下一篇：當服務多到整合測試跑不動，用契約測試守住服務間的約定。
