---
title: Cost Engineering for AI Systems
date: 2025-05-14
layout: post
category: play
collection: ai-blog
---
## Cost Engineering for AI Systems

AI is expensive. Here's how to not go broke building with it.

### The Cost Equation

```
Total Cost = (token_input × cost_per_token_input) + (token_output × cost_per_token_output)
             + (model_serving_infrastructure) + (monitoring_infrastructure)
             + (human_evaluation_cost)
```

Every component is a line item you can reduce. Let's go through them.

### Token Cost: The Biggest Line Item

```python
"""
Current API pricing (2025, per 1M tokens):

| Model               | Input (per 1M) | Output (per 1M) | Use Case |
|------|------------------------|-----------------------|----------|
| GPT-4o-mini       | $0.15                | $0.60                  | Chat, basic tasks |
| GPT-4o            | $2.50                | $10.00                 | Complex reasoning |
| Claude 3.5 Haiku  | $0.25                | $1.25                  | Fast, cheap reasoning |
| Claude 3.5 Sonnet | $3.00                | $15.00                 | Best reasoning |
| Claude 3.5 Opus   | $15.00               | $75.00                 | Expert reasoning (expensive!) |
| Llama 3.1 70B     | $0.70                | $0.90                  | Self-hosted or Replicate |
| Mistral Large     | $2.00                | $6.00                  | Multilingual |
| Gemini 1.5 Pro    | $1.25                | $5.00                  | Long context |
| Google Gemmini    | $0.075               | $0.30                  | Cheapest option |

Key insight: cost per input is almost always cheaper than cost per output.
So: reduce output tokens = reduce cost.
"""
```

### Reducing Token Count (The Easithing to Reduce Token Count

```python
"""
Top token-saving techniques:

1. Smaller models where possible
   → Use GPT-4o-mini for simple tasks where GPT-4o would work
   → Cost reduction: 94% (GPT-4o-mini is 94% cheaper than GPT-4o)
   → Quality loss: minimal for simple tasks

2. Reduce output length (the most effective)
   → Prompt: "Be concise" (saves 30-50% tokens on generated text)
   → Prompt: "Only return code, no explanation" (saves 70-80%)
   → Prompt: "Return JSON, not explanation" (saves 60%)
   → Cost reduction: 30-80% on output tokens
   → Quality trade-off: some detail loss

3. Use system prompts for instructions (repeat them)
   → System prompt: "Always respond in JSON format."
   → User prompt: just the data (no "Please format as JSON" in user prompt)
   → Cost reduction: 5-10% on input tokens (instructions = tokens)

4. Cache responses
   → For identical prompts, return cached response (cost: $0)
   → Cost reduction: 100% on cached prompts
   → Setup: simple Redis cache (or even in-memory dict)

5. Batch requests
   → Send multiple prompts in one API call (not one per call)
   → Cost reduction: 10-20% (reduced API overhead = same input cost)

6. Use local models for repetitive tasks
   → Llama 3.1 8B self-hosted ≈ $0.02/1M input, $0.02/1M output
   → That's 99% cheaper than GPT-4o
   → Quality: good for simple tasks (classification, formatting, etc.)
"""
```

### Model Selection & Routing

```python
"""
Model routing: send each request to the right model.

Routing strategy:
┌─ Simple task (classification, formatting) ──→ GPT-4o-mini / GEMini
├─ Medium task (reasoning, summarization) ────→ Claude 3.5 Haiku / GPT-4o
└─ Hard task (complex reasoning, code gen) ───→ GPT-4o / Claude 3.5 Sonnet

Cost of routing:
- Simple tasks: $0.15/1M input → $0.075/1M input (75% cost reduction!)
- Medium tasks: $1.25/1M output → $0.75/1M output (40% cost reduction!)
- Hard tasks: no alternative (GPT-4o/Claude Sonnet are the best)

Total savings: 40-60% on mixed workload (depending on task complexity distribution)
"""
```

### Inference Cost: Self-Hosted vs API

```python
"""
Self-hosting vs API: when does it make sense?

API (e.g., OpenAI):
- Cost: $0.02-0.15 per task (simplified)
- Infrastructure cost: $0
- Total cost for 1M tasks/year: ~$20K-$150K
- Best for: < 1M tasks/year, variable workload, no infra expertise

Self-hosted (vLLM + Llama 3.1 70B on AWS/GCP):
- GPU cost: ~$5/hr × 24/7 × 30 days ≈ $3,600/month
- Total cost for 1M tasks/year: ~$43K (infrastructure) + $5K (compute) ≈ $48K
- Best for: 1M+ tasks/year, high-volume, consistent workload

Self-hosted (Llama 3.1 8B on one RTX 3090):
- GPU cost: ~$0.50/hr (consumer GPU) × 24/7 × 30 days ≈ $360/month
- Total cost for 1M tasks/year: ~$4.3K (infrastructure) + $1K (compute) ≈ $5.3K
- Best for: simple tasks, low-cost, full control

Model size vs token cost (per 1M tokens):
- Llama 8B (self-hosted): ~$0.001 input, $0.001 output
- Llama 70B (self-hosted): ~$0.005 input, $0.006 output
- GPT-4o: ~$2.50 input, $10.00 output
- GPT-4o-mini: ~$0.15 input, $0.60 output
"""
```

### Cost Tracking & Budgeting

```python
"""
Cost tracking for AI systems:

1. Track cost per endpoint (model per user, not just total)
   → "How much does Feature A cost?" vs "How much was everything?"
   → Without per-endpoint cost, you can't optimize

2. Track cost per task type
   → "Classification: $0.001/task" vs "Reasoning: $0.05/task"
   → This tells you where the money goes

3. Track cost per feature
   → "Chat feature costs $10K/month" vs "Summarization costs $500/month"
   → This tells you which features are profitable

4. Set budgets per feature
   → "Maximum $1K/month for the chat feature"
   → If a feature exceeds its budget: optimize or remove

5. Track cost per user
   → "Power user costs $0.50/day" vs "Occasional user costs $0.01/day"
   → This tells you about pricing models (pay-per-use vs subscription)

Monitoring should include: "What's my total cost per day this week?"
If you don't know your daily cost, you're flying blind.
"""
```

### Cost Reduction Checklist

```python
"""
Cost reduction checklist (ranked by impact):

[ ] Replace expensive models with cheaper ones where quality is acceptable
   → Impact: 30-80% reduction

[ ] Reduce output token count (prompt more concisely)
   → Impact: 30-80% reduction

[ ] Cache frequent responses (Redis, in-memory cache)
   → Impact: 10-100% on cached requests (free)

[ ] Use self-hosted models for repetitive tasks
   → Impact: 90%+ (Llama on GPU vs API pricing)

[ ] Implement model routing (send simple tasks to cheaper models)
   → Impact: 40-60% on mixed-workload

[ ] Batch requests (reduce API overhead)
   → Impact: 10-20% reduction

[ ] Use quantization (INT8/FP8 for inference)
   → Impact: 2x throughput = half the compute cost

[ ] Use spot/preemptible instances for batch processing
   → Impact: 60-70% reduction on compute cost

[ ] Track cost per feature/user/task type
   → Impact: tells you where to optimize (can't fix what you don't measure)

[ ] Monitor daily cost trends
   → Impact: catch cost anomalies early

Start with the top 3 you can implement. Then do the rest.
"""
```

### Summary

Cost engineering is about knowing where every dollar goes:
- **Model selection**: cheapest model that does the job well
- **Token optimization**: reduce output tokens, cache responses, use smaller models
- **Infrastructure**: self-host for >1M tasks/year, API for <1M
- **Tracking**: per-feature, per-user, per-task-type cost
- **Budget**: set budgets per feature. Exceed them: optimize or remove

Build AI systems that don't bankrupt you. Monitor cost daily. Optimize monthly. The biggest wins are model selection and reducing output tokens.

Cost is not inevitable; it's a design choice. Design smart.
