# Feature Flag 讓測試變複雜了，也讓它變安全了

---

## 目錄

1. [我第一次遇到 feature flag 的時候](#第一次遇到)
2. [Feature Flag 對測試的影響](#對測試的影響)
3. [測 Feature Flag 要測的三件事](#三件事)
4. [Flag 清理：被忽略的維護成本](#flag-清理)
5. [結尾](#結尾)

---

## 我第一次遇到 feature flag 的時候

我們的 App 準備上一個新功能：好友一起種樹，計時同步，可以看到彼此的進度。

這個功能開發了六週，但 PM 不想一次開放給所有人，想先開放給 5% 的用戶做 beta，觀察留存和反饋，再逐步擴大。

RD 的做法是：功能做完，但在後端加一個 feature flag `friend_timer_enabled`，flag 關閉的用戶看不到這個功能的入口。

我接到測試任務，第一個問題是：「我要測 flag on 還是 flag off？」

答案是：都要測。但這兩個狀態的測試方法和重點完全不同。

---

## Feature Flag 對測試的影響

**測試矩陣倍增**

沒有 feature flag：功能 A 有 N 種測試情境。

有 feature flag：功能 A 在 flag on 和 flag off 兩種狀態下各有 N 種情境，共 2N。

如果同時有多個 flag（我們的 App 在某個時期有 4 個 flag 同時存在），組合爆炸：4 個 flag 有 2⁴ = 16 種組合。你不可能全部測，必須選擇。

**Flag 的邊界狀態**

用戶在 flag on 的狀態下使用了某個功能，flag 突然關掉（rollback），用戶的資料和狀態怎麼辦？

這個「flag 切換中間狀態」是最容易出 bug 的地方，也是最容易被漏測的。

**Staging 環境的 flag 狀態**

如果 staging 環境的 flag 和 production 不一樣，你在 staging 測的行為和用戶看到的行為就不同。

---

## 測 Feature Flag 要測的三件事

**1. Flag Off 的隔離性**

Flag 關閉的用戶，應該完全看不到這個功能，也不應該能通過 API 繞過 flag 的限制。

```python
def test_flag_off_user_cannot_access_friend_timer(flag_off_user_token):
    # UI 上沒有入口，但直接呼叫 API 呢？
    response = requests.post(
        f"{BASE_URL}/friend-timer/start",
        headers={"Authorization": f"Bearer {flag_off_user_token}"},
        json={"friend_id": "test_friend"}
    )
    assert response.status_code == 403  # 不是 404 也不是 200

    # 403 代表後端有做 server-side 的 flag 驗證
    # 如果是 200，代表 flag 只擋了 UI，API 沒有驗證，這是個安全問題
```

這個測試很重要：很多 feature flag 只在前端隱藏 UI，後端 API 沒有做對應的驗證。懂技術的用戶可以直接呼叫 API 存取還沒有開放的功能。

**2. Flag 切換的中間狀態**

模擬用戶在 flag on 的狀態下操作，然後 flag 被關掉：

```python
def test_active_session_when_flag_disabled(fresh_user_token):
    # Flag on：開始一個好友計時 session
    enable_flag("friend_timer_enabled", user_id=user_id)
    session = start_friend_timer(fresh_user_token, friend_id="friend_1")

    # Flag 突然關閉（rollback 情境）
    disable_flag("friend_timer_enabled", user_id=user_id)

    # 已經在進行中的 session 怎麼辦？
    status = get_timer_status(fresh_user_token)
    # 預期行為需要 PM 定義，但一定要測
    # 可能是：session 繼續，但好友同步停止
    # 或者：session 變成單人計時
    # 不可接受：App crash 或資料損毀
```

這個情境 PM 通常沒有想到，但 flag rollback 在 production 是真實會發生的事。

**3. Flag 組合的關鍵情境**

你不需要測所有組合，但需要測「高風險的組合」：

我們的 App 的兩個 flag 組合測試：
- `friend_timer_enabled = on` + `premium_trees_enabled = off`：好友計時可以用，但稀有樹種沒開放，如果好友選了稀有樹種會怎樣？
- `friend_timer_enabled = on` + `offline_mode_enabled = on`：離線模式下好友計時怎麼行為？

這些組合情境要和 RD 確認預期行為，然後寫進測試案例。

---

## Flag 清理：被忽略的維護成本

Feature flag 最大的債務是：flag 永遠開著，變成了永久的 code path。

我們的 App 在某個時期有 12 個 feature flag 同時存在。其中有 5 個已經 100% 開放了，但 flag 沒有被清理，code 裡還有 if-else 分支處理 flag off 的情況。

這 5 個 flag 沒有用戶真的處於 flag off 的狀態，但每次測試我還是要考慮「flag off 的行為是否正確」。

Flag 清理的時機：
- Flag 已經 100% rollout 超過兩週且沒有問題
- 沒有任何計畫要 rollback

清理的步驟：刪除 flag off 的 code path → 更新測試（刪除 flag off 的測試案例）→ 確認 CI 全綠。

我現在會在每個 sprint 末看一次 flag 列表，標記哪些可以準備清理。這是測試維護的一部分。

---

## 結尾

Feature flag 讓發布更安全了：出問題可以快速關掉，不需要回滾整個 release。但它也讓測試矩陣變大，讓 code 的長期維護成本上升。

把 flag 當成一個有生命週期的東西管理——引入、測試、rollout、清理——而不是一個「開關上去就不管了」的東西，才能享受它帶來的好處，而不是被它累積的複雜度拖住。
