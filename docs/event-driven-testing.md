# 測試 Event-Driven 系統：當你沒辦法直接 assert 結果

---

## 目錄

1. [計時完成，但樹要幾秒後才出現](#計時完成但樹要幾秒後才出現)
2. [同步 vs 非同步系統的測試差異](#同步-vs-非同步)
3. [測試非同步流程的幾種策略](#幾種策略)
4. [Event Queue 壞掉長什麼樣子](#event-queue-壞了)
5. [結尾](#結尾)

---

## 計時完成，但樹要幾秒後才出現

我們的 App 的種樹流程重構了一次，改成 event-driven 架構：

計時完成 → `計時服務` 發 `session.completed` event → event queue → `獎勵服務` 消費 event，計算硬幣 → 發 `reward.credited` event → `主功能服務` 消費，種樹

這個架構讓各個 service 解耦，效能更好。但它帶來了一個測試問題：

**計時完成 API 回 200 的瞬間，樹木還沒有種好。**

以前的測試邏輯：

```python
# 同步架構
response = complete_timer(duration=25)
assert response["status"] == "success"
# 立刻查
forest = get_forest()
assert len(forest["trees"]) == 1  # ← 這樣不行了
```

在 event-driven 架構下，`complete_timer` 只是把 event 丟進 queue。`主功能服務` 什麼時候處理這個 event，取決於 queue 的消費速度，可能是 100ms 後，可能是 3 秒後。

你沒辦法在 API 回 200 之後立刻 assert 樹木出現了。

---

## 同步 vs 非同步系統的測試差異

根據 O'Reilly 2021 年軟體架構調查，超過 50% 的企業後端服務已採用某種形式的事件驅動架構或訊息佇列設計，但對應的測試策略往往滯後於架構演化。這個落差讓測試工程師面對的不只是新工具，而是整個測試思維模式的轉換。

傳統同步架構：

```
Client → API → 處理 → 回應
              ↑ 所有事情在這裡同步完成
```

測試：發 request → 拿到 response → assert response 的內容

Event-driven 架構：

```
Client → API → 發 event → 回應（event 已入隊）
                  ↓
              event queue
                  ↓
           consumer 處理（非同步）
                  ↓
              最終狀態更新
```

測試：發 request → 拿到 response（只知道 event 入隊了）→ ??? → 最終狀態

中間那個 `???` 是最難的地方：你不知道什麼時候狀態會更新，你需要某種機制來「等待」，而不是立刻 assert。

---

## 幾種策略

**策略一：Polling（輪詢等待）**

不斷查詢直到狀態更新，或者超時：

```python
import time

def wait_for_tree_to_appear(auth_token, timeout=10, interval=0.5):
    start = time.time()
    while time.time() - start < timeout:
        forest = get_forest(auth_token)
        if len(forest["trees"]) > 0:
            return forest
        time.sleep(interval)
    raise TimeoutError("Tree did not appear within timeout")

def test_tree_appears_after_timer_complete(fresh_account_token):
    complete_timer(fresh_account_token, duration=25)
    forest = wait_for_tree_to_appear(fresh_account_token, timeout=10)
    assert len(forest["trees"]) == 1
    assert forest["trees"][0]["type"] == "oak"
```

優點：實作簡單，對大部分情況夠用。
缺點：timeout 設多少是藝術；如果 event 正常應該在 200ms 處理完，但你 timeout 設 10 秒，測試慢很多。

**策略二：訂閱 Event（直接監聽 queue）**

不查詢最終狀態，直接監聽 event queue，確認 event 有被正確發出：

```python
# 用測試帳號訂閱 event channel
with event_listener(channel="forest.tree.planted", user_id=user_id) as listener:
    complete_timer(auth_token, duration=25)
    event = listener.wait_for_event(timeout=5)

assert event["data"]["tree_type"] == "oak"
assert event["data"]["user_id"] == user_id
```

優點：不依賴最終狀態的查詢，更快，更精確地測試 event 本身的正確性。
缺點：需要 infrastructure 支援（測試環境能訂閱 event queue），實作成本較高。

**策略三：測試每個環節，不測整條鏈**

把 event-driven 流程拆開，每個 service 獨立測：

```python
# 測 計時服務：完成計時後，有沒有正確發出 event
def test_timer_publishes_correct_event():
    with mock_event_publisher() as publisher:
        complete_timer(auth_token, duration=25, tree_type="oak")
        published_events = publisher.get_published_events()

    assert len(published_events) == 1
    assert published_events[0]["type"] == "session.completed"
    assert published_events[0]["data"]["duration"] == 25

# 測 獎勵服務：收到 event，硬幣計算是否正確
def test_reward_service_calculates_coins():
    event = {"type": "session.completed", "data": {"duration": 25, "user_id": "test"}}
    result = reward_service.process(event)
    assert result["coins_earned"] == 25

# 測 主功能服務：收到 reward event，樹木是否種好
def test_main_service_plants_tree():
    event = {"type": "reward.credited", "data": {"coins": 25, "tree_type": "oak", "user_id": "test"}}
    main_service.process(event)
    trees = main_service.get_trees(user_id="test")
    assert len(trees) == 1
```

這個策略不測整條 end-to-end 鏈，但每個環節的邏輯都有覆蓋。

實際上你需要三種測試都做：unit test 測每個 service 的邏輯，integration test 測 event 格式的對齊，E2E test 測完整流程但用 polling 等待最終狀態。

---

## Event Queue 壞掉長什麼樣子

非同步系統出問題的時候，症狀很不直觀：

**Event 入隊成功，但沒有被消費**

API 回 200，用戶看到「種植成功」，但樹木永遠不出現。因為 `主功能服務` 的 consumer 掛了，event 在 queue 裡堆著沒有被處理。

測試層面很難抓到這個：你的 API 測試過了（event 有發出），你的 service 測試過了（consumer 邏輯正確），但整個鏈在 production 環境的特定條件下斷了。

這就是為什麼你需要 E2E 測試加上 polling：不只驗 API 的 response，驗最終狀態是否確實更新。

**Event 被消費多次（at-least-once delivery）**

大部分的 event queue（Kafka、RabbitMQ）保證 at-least-once delivery：event 至少會被消費一次，但可能被消費多次。

如果你的 consumer 不是 idempotent，同一個 event 被處理兩次，用戶會獲得雙倍硬幣、兩棵樹。

測試方法：發同一個 event 兩次，確認最終狀態只有一棵樹。

```python
def test_duplicate_event_is_idempotent(fresh_account_token):
    session_id = "test-session-123"
    # 同一個 session 的 event 發兩次
    complete_timer(auth_token, session_id=session_id, duration=25)
    complete_timer(auth_token, session_id=session_id, duration=25)

    forest = wait_for_tree_to_appear(fresh_account_token)
    assert len(forest["trees"]) == 1  # 不是 2
```

---

## 結尾

Event-driven 架構讓測試變複雜，不是因為它的邏輯難，是因為它打破了「發 request → 立刻 assert response」的直覺流程。

適應這個改變需要在思維上做一個轉換：你測的不是「這個 API 回了什麼」，是「這整個流程最終把系統帶到了正確的狀態嗎」。

Polling 是最低成本的起點，先用它讓 E2E 測試能跑起來。然後逐步建立 event listener 和 idempotency 測試，讓覆蓋更精確。

非同步不是測試的敵人，是需要不同武器的戰場。

## 參考資料

- [Testing Microservices - Martin Fowler](https://martinfowler.com/articles/microservice-testing/)
- [Testing Event-Driven Architectures - AWS Builder's Library](https://aws.amazon.com/builders-library/testing-distributed-systems/)
- [Enterprise Integration Patterns: Messaging Patterns](https://www.enterpriseintegrationpatterns.com/)
- [Apache Kafka: Testing Producer and Consumer Applications](https://kafka.apache.org/documentation/)
- [Google Testing Blog: Testing Asynchronous Code](https://testing.googleblog.com/)
