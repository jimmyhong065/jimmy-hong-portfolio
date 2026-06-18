# 我試圖用 assert 測試 LLM，然後發現這個方法根本行不通

Stack Overflow 2024 年調查顯示，76% 的開發者已在使用或計畫使用 AI 工具——這意味著越來越多產品開始直接整合 LLM。但大多數 QA 工程師在接手「測試 AI 功能」的任務時，拿的還是傳統軟體測試的工具箱。那個工具箱在這裡幾乎沒用。

---

## 目錄

1. [那個每次都給不同答案的 API](#那個每次都給不同答案的-api)
2. [傳統測試思維在 LLM 上為什麼失效](#傳統測試思維失效)
3. [LLM 測試的兩層架構](#兩層架構)
4. [Hallucination 怎麼測](#hallucination-怎麼測)
5. [我現在用的工具和流程](#工具和流程)
6. [結尾](#結尾)

---

## 那個每次都給不同答案的 API

我們的 App 加了一個 AI 功能：讓用戶輸入今天想完成的任務，AI 幫他建議最適合的專注時長和休息節奏。我接到任務：幫這個功能寫測試。

我的第一反應是：這跟測一般 API 一樣吧。發 request，驗 response，斷言結果符合預期。

我寫了這樣的測試：

```python
def test_focus_suggestion():
    response = llm_api.suggest("寫一份報告，預計需要兩小時")
    assert "25 分鐘" in response
```

第一次跑：過。
第二次跑：過。
第三次：模型回答「建議你用番茄工作法，每段 25 到 30 分鐘」，沒有精確的「25 分鐘」，測試爆了。

我修了 assert，改成 `assert "番茄" in response`。

隔天跑：模型改成直接說「建議每次專注 30 分鐘，中間休息 5 分鐘」，再爆。

我意識到一件事：**這個 API 每次的輸出都不一樣，而且都可能是對的**。

---

## 傳統測試思維失效

傳統軟體測試的核心假設是：**相同輸入 → 相同輸出**。

你寫一個 assert，是因為你知道預期結果是什麼，而且它是確定的。登入成功回 200，付款失敗回 402，欄位缺少回 400——這些是確定的。

LLM 打破了這個假設。

同一個問題，LLM 每次回答的用詞、語氣、結構可能都不同。而且它們可能都是「正確」的答案。你沒有辦法寫一個 assert 說「正確答案就是這 20 個字」。

更麻煩的是 hallucination：模型有時候會用非常自信的語氣回答錯誤的事實。這不會觸發任何 exception，response 的格式完全正常，HTTP 200，但內容是錯的。

如果你只驗 status code 和格式，hallucination 永遠不會被你的測試抓到。

---

## 兩層架構

後來我在一篇 Medium 文章看到一句話，讓我整個理解框架重組：

> "You can't assert your way out of non-determinism."

重點不是放棄測試，是**把 LLM 應用拆成兩層分別對待**：

```
輸入
  ↓
【確定性層】Prompt 組裝、資料擷取、格式驗證、Business Logic
  ↓
LLM API 呼叫
  ↓
【非確定性層】模型輸出的品質、相關性、正確性
  ↓
輸出
```

**確定性層：用傳統方式測**

Prompt 怎麼組裝、RAG 的資料怎麼撈、輸入格式怎麼驗——這些邏輯是確定的，可以寫一般的 unit test。

```python
def test_prompt_assembly():
    context = retrieve_context("用戶任務描述")
    prompt = build_prompt(user_task="寫一份報告", context=context)
    assert "[TASK]" in prompt
    assert len(prompt) < 4096  # token 上限
```

這層的 bug 是你寫壞了程式邏輯，不是模型的問題。

**非確定性層：用評估取代斷言**

模型輸出的品質不是對或錯，是一個分數。你設門檻，判斷是否達標。

```python
# 不要這樣
assert response == "25 分鐘"

# 改成這樣：評估相關性分數
score = evaluate_relevance(
    question="寫兩小時報告的最佳專注時長建議",
    answer=response
)
assert score >= 0.8  # 80% 相關性門檻
```

這個 `evaluate_relevance` 本身可以是另一個 LLM（LLM-as-a-Judge）、一個 embedding 相似度計算，或是人工標記的 golden dataset 比對。

---

## Hallucination 怎麼測

Hallucination 是我覺得最難的部分，因為它不會讓系統報錯，它讓系統給出聽起來正確但實際上是假的答案。

目前我用的幾個方式：

**1. Faithfulness 評估（RAG 場景特別重要）**

如果你的系統是 RAG（Retrieval-Augmented Generation），模型的回答應該要 grounded 在你提供的 context 裡，不能憑空捏造。

評估問題：「模型的回答，有沒有超出我給它的 context 範圍？」

用 RAGAS 這個工具可以自動計算這個分數：

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy

result = evaluate(
    dataset=test_dataset,
    metrics=[faithfulness, answer_relevancy]
)
print(result)
# {'faithfulness': 0.87, 'answer_relevancy': 0.92}
```

faithfulness 低代表模型在亂說 context 裡沒有的事。

**2. Adversarial Testing**

刻意給模型容易出錯或誤導的問題，看它怎麼反應：

- 問一個它不可能知道答案的問題（「我昨天買了什麼？」）
- 給它矛盾的 context，看它選哪個
- 問它有爭議性的事實，看它是否過度自信

這部分還是要手動設計，沒有辦法完全自動化。

**3. Golden Dataset 回歸測試**

準備一份你知道「正確答案是什麼」的測試集，每次模型更新或 prompt 改動之後跑一次，確認沒有退步。

這份 dataset 要人工維護，而且要包含：
- 一般問題（應該答得出來）
- 邊界問題（應該說不知道）
- 容易 hallucinate 的問題（有明確的正確答案可以比對）

---

## 工具和流程

目前我測 LLM 應用用到這幾個工具：

**DeepEval** — 最接近傳統測試框架的 LLM 測試工具，可以寫類似 pytest 的測試：

```python
from deepeval import assert_test
from deepeval.metrics import HallucinationMetric
from deepeval.test_case import LLMTestCase

def test_no_hallucination():
    test_case = LLMTestCase(
        input="我今天要寫一份兩小時的報告，建議我怎麼安排專注時段？",
        actual_output=llm_api.suggest("寫一份報告，預計兩小時"),
        context=["我們的 App 支援 25/50 分鐘計時，建議搭配短休息"]
    )
    metric = HallucinationMetric(threshold=0.5)
    assert_test(test_case, [metric])
```

**RAGAS** — 專門針對 RAG 系統的評估，faithfulness / answer relevancy / context recall 三個核心指標。

**Promptfoo** — 用 YAML 設定測試案例，可以接 CI/CD，適合跑 regression：

```yaml
prompts:
  - "我今天要寫一份報告，幫我建議專注時段"
tests:
  - assert:
    - type: contains-any
      value: ["25 分鐘", "50 分鐘", "番茄", "專注時段"]
    - type: llm-rubric
      value: 答案應該要包含具體的時間建議，不能只說「多休息」之類的模糊回答
```

---

## 一個現實的認知

LLM 測試跟傳統測試最大的差距是：你**永遠無法保證**模型 100% 的輸出是正確的。OWASP LLM Top 10（2025 版）把「過度依賴 AI 輸出」（Overreliance）列為重點風險之一，指出在缺乏驗證機制的情況下，AI 產出的錯誤資訊可能以自信的語氣呈現，讓使用者難以辨別。

傳統測試可以做到「這個功能在我測過的所有案例都正確」。LLM 測試只能做到「這個模型在我的評估集上，faithfulness 達到 87%，answer relevancy 達到 92%」。

這不代表 LLM 測試沒有意義，是你需要接受一個不同的品質定義：**統計上的品質，而不是絕對的正確**。

當你每次改動 prompt 或換模型版本，你的目標是確保這些分數沒有顯著退步，不是確保每一個 case 都過。

這個思維的轉換，對我來說比學會用 DeepEval 更花時間。

---

## 結尾

我當初試圖用 assert 測 LLM 的時候，以為是工具問題，換個框架就解決了。

後來發現是思維問題。LLM 應用不是傳統軟體，它是一個非確定性系統，你需要的不是更聰明的 assert，是一套評估框架。

確定性層的邏輯用傳統方式測，非確定性層的輸出用統計方式評估。這個分法讓我從「測試一直爆」變成「有一套可以持續跑的評估流程」。

如果你的產品開始加 LLM 功能，越早建立這套思維，越不會在後來被 hallucination 和 flaky test 卡住。

---

## 參考資料

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [ISTQB AI Tester Certification](https://www.istqb.org/certifications/artificial-intelligence-tester)
- [RAGAS — Evaluation Framework for RAG Pipelines](https://docs.ragas.io/)
- [Promptfoo — LLM Testing Tool](https://www.promptfoo.dev/)
- [Stack Overflow Developer Survey 2024](https://survey.stackoverflow.co/2024/)
