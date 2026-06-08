---
title: Monitoring & Drift Detection
date: 2025-05-07
layout: post
category: play
collection: ai-blog
---
## Monitoring & Drift Detection

Your model works. Until it doesn't. Here's how to catch it before your users do.

### Monitoring is Not About the Model

Monitoring AI systems is fundamentally different from monitoring traditional software. In traditional software, you monitor:
- Latency
- Error rate
- Throughput

In AI, you also need to monitor:
- Quality (is the output still good?)
- Drift (has the input distribution changed?)
- Safety (is the model behaving appropriately?)
- Cost (is the model cheaper or more expensive than before?)
- Reliability (is the model crashing more than before?)

```python
"""
AI monitoring layers (from most to least important):

Layer 1: Quality Monitoring
- Evaluate output quality continuously (automated evaluation)
- Check for hallucination rate, factual accuracy, tone consistency
- If quality drops, the model is the first suspect (but it's usually data drift)

Layer 2: Infrastructure Monitoring
- Latency (p50, p95, p99)
- Error rate (4xx, 5xx)
- Token rate (tokens/sec)
- GPU utilization
- Cost per request

Layer 3: Drift Monitoring
- Input drift (user queries are changing)
- Output drift (generated responses are changing)
- Token distribution drift (are more/fewer tokens being used?)
- Embedding drift (Are the input embeddings moving in the embedding space?)

Layer 4: Safety Monitoring
- Jailbreak attempts
- PII leaks
- Harmful content
- Prompt injection success rate
"""
```

### Quality Monitoring (Automated Evaluation)

```python
"""
Automated quality evaluation patterns:

1. LLM-as-Judge (least expensive, easiest)
   - Use a separate LLM to score outputs on 4-5 criteria
   - Criteria: helpfulness, accuracy, tone, completeness
   - Cost: ~$0.01 per evaluation
   - Accuracy: ~80-85% (but good enough for trend detection)

2. Embedding Similarity (no LLM needed)
   - Compare embeddings of recent outputs vs. previous outputs
   - If similarity < threshold, something changed
   - Cost: ~$0.001 per evaluation
   - Accuracy: ~70% (catches distribution changes, not quality per se)

3. Rule-based Evaluation (most accurate, most work)
   - Regex, keyword checks, format validation
   - Cost: ~$0.0001 per evaluation (essentially free)
   - Accuracy: depends on rules (if rules cover all edge cases: ~95%)

4. Synthetic Data (for regression testing)
   - Create a test set of "hard" prompts
   - Run them through the model periodically
   - Compare outputs against baseline
   - Cost: one-time setup (~$1K-$5K for 100-1000 test prompts)
   - Accuracy: very high (detects specific regressions)
"""
```

### Drift Detection (How to Know When Your Inputs Change)

```python
"""
Drift detection methods, ranked by practicality:

1. Embedding Drift (most effective, easiest to implement)
   - Compute embedding of incoming input
   - Compare with embedding of first N inputs
   - If distance grows beyond threshold → drift detected
   - Cost: ~$0.001 per test
   - Setup: 10 lines of code

2. Distribution Shift (for structured inputs)
   - Track distribution of categorical fields over time
   - If distribution of a field changes by > 5% → alert
   - Example: if your app used to get "How do I reset my password?" 
             but now queries are "How much does your API cost?",
             your users' needs changed.

3. Input Length Drift
   - Monitor average input length over time
   - Sudden length increase = users are trying something new
   - Example: from avg 100 tokens to avg 500 tokens = longer queries

4. Topic Drift (for conversational inputs)
   - Cluster inputs by topic (using embeddings)
   - Track which topics are growing/shrinking
   - If topics shift, your user base or product changed

5. Query Pattern Analysis
   - Track frequency of specific query patterns
   - If query pattern count drops suddenly → feature broken?
   - If query pattern count increases suddenly → feature popular?
   - Example: "API rate limit" mentions suddenly spike → your API is rate-limiting too aggressively
"""
```

### Monitoring in Production (A Working Setup)

```python
"""
Production monitoring setup (what actually works):

1. Log everything:
   - Request: input text, timestamp, user_id, model_name
   - Output: response text, tokens used, latency, model_version
   - Metrics: quality_score (from automated eval), cost_per_request

2. Set up dashboards:
   - Latency: p50, p95, p99 (over time)
   - Error rate: 4xx, 5xx (over time)
   - Quality score: avg over time (over time)
   - Token count: avg tokens per request (over time)
   - Cost: total daily cost, cost per model (over time)
   - Drift: embedding distance over time

3. Set up alerts:
   - Latency > 5s (for 5+ consecutive requests)
   - Error rate > 5% (for 5+ consecutive minutes)
   - Quality score drop > 10% (from yesterday's average)
   - Drift distance > threshold (from yesterday's average)
   - Cost increase > 20% (from yesterday's average)

4. Weekly review:
   - Look at quality trends
   - Look at drift trends
   - Look at cost trends
   - Decide: does the model need retraining? RAG update? Prompt change?

Monitoring is not "set it and forget it."
It's a daily habit for anyone who cares about quality.
"""
```

### Alerting on Model Degradation

```python
"""
When to alert (and when to ignore):

ALERT when:
- Quality score drops > 15% in 24 hours (real degradation)
- Latency p99 > 10s for >5 minutes (user experience impact)
- Error rate > 10% (system failure, not degradation)
- Drift distance > 2× normal (distribution changed)
- Cost increases > 50% (something is wrong)

IGNORE when:
- Quality score drops by 5% on any single day (normal variance)
- Latency spikes for 1-2 requests (intermittent network issues)
- Quality score drops gradually (seasonal, not alarming)
- Token count increases 10% (might be a feature change, not degradation)

Set thresholds based on your data, not arbitrary numbers.
Monitor for 2-4 weeks before setting alerts.
"""
```

### Model Decay (Why Your Model Stops Working)

```python
"""
Models degrade for three reasons:

1. Data drift: User queries change over time
   - Example: users start asking questions not in your RAG docs
   - Fix: update RAG docs, retrain on new queries

2. Model degradation: The model's behavior changes (even for same inputs)
   - Example: updated model weights in-place, but behavior shifted
   - Fix: rollback to previous version, or retrain

3. Feature decay: Your product features change, but your AI doesn't
   - Example: you added a new feature, but the AI can't answer about it
   - Fix: update prompts, update RAG, add new capabilities

The fix is always the same: monitor, detect, update.
The hard part is monitoring (and deciding when to act).
"""
```

### Summary

Monitoring AI systems requires four layers:
- **Quality monitoring**: automated evaluation (LLM-as-judge, embedding similarity, rule-based)
- **Infrastructure monitoring**: latency, error rate, throughput, cost
- **Drift detection**: embedding drift, distribution shift, topic drift
- **Safety monitoring**: jailbreak attempts, PII leaks, harmful content

Monitor everything. Alert on meaningful changes. Act on drift.

Monitoring is not optional. It's what prevents "my model worked yesterday" from becoming "my model is broken and nobody noticed for a month."
