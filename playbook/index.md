---
title: "AI Engineer's Playbook"
layout: default
---

# AI Engineer's Playbook

A pragmatic field guide for software engineers and IT professionals stepping into AI/ML.

No hype. No "journey" metaphors. No "democratizing" anything. Just facts, patterns, code that runs, and the occasional "here's what everyone gets wrong."

## Table of Contents

### Foundations

1. [Probability & Statistics for Engineers](/playbook/posts/2025-01-01-probability-for-engineers/) — Your Bayesian intuition is probably broken. Let's fix it.
   - Cheatsheet · PDF
   - [Live Code Demo](/playbook/live-code/demo-probability.ipynb)

2. [Linear Algebra for Engineers](/playbook/posts/2025-01-08-linear-algebra-for-engineers/) — Matrices are just functions. Stop pretending they're magic.
   - Cheatsheet · PDF
   - [Live Code Demo](/playbook/live-code/demo-linear-algebra.ipynb)

3. [Optimization & Calculus for ML](/playbook/posts/2025-01-15-optimization-calculus-for-ml/) — Gradient descent is just walking downhill. Your intuition fails at 100D, so here's code instead.
   - Cheatsheet · PDF
   - [Live Code Demo](/playbook/live-code/demo-optimization.ipynb)

### LLM Fundamentals

4. [Transformers Demystified](/playbook/posts/2025-01-22-transformers-demystified/) — The transformer is not a neural network. It's a composition operator. Here's why that distinction saves you three weeks of debugging.
   - Cheatsheet · PDF
   - [Live Code Demo](/playbook/live-code/demo-transformers.ipynb)

5. [LLM Training Lifecycle](/playbook/posts/2025-01-29-llm-training-lifecycle/) — Pretraining is expensive. Fine-tuning is easy. Both are wrong. The actual pipeline: data curation → pretraining → SFT → RLHF/DPO → monitoring.
   - Cheatsheet · PDF
   - [Live Code Demo](/playbook/live-code/demo-training-lifecycle.ipynb)

6. [Tokenization & Context Windows](/playbook/posts/2025-02-05-tokenization-context-windows/) — Your 128K context window is a lie. Understanding tokenizers, subword fragmentation, and context economics.
   - Cheatsheet · PDF
   - [Live Code Demo](/playbook/live-code/demo-tokenization.ipynb)

### Prompting (It's Not Magic, But It's Not Nothing)

7. [Prompt Engineering Patterns](/playbook/posts/2025-02-12-prompt-engineering-patterns/) — Zero-shot, few-shot, CoT, ReAct — patterns that actually work and ones that don't.
   - Cheatsheet · PDF
   - [Live Code Demo](/playbook/live-code/demo-prompting.ipynb)

8. [Structured Outputs & Function Calling](/playbook/posts/2025-02-19-structured-outputs-function-calling/) — JSON is a schema. Functions are APIs. Here's how to make LLMs use them reliably.
   - Cheatsheet · PDF
   - [Live Code Demo](/playbook/live-code/demo-structured-outputs.ipynb)

9. [Guardrails & Safety](/playbook/posts/2025-02-26-guardrails-safety/) — Your LLM will argue and lie. Here's how to constrain it without making it useless.
   - Cheatsheet · PDF
   - [Live Code Demo](/playbook/live-code/demo-guardrails.ipynb)

### RAG (Retrieval, Not Magic)

10. [RAG Architecture & Chunking](/playbook/posts/2025-03-05-rag-architecture/) — RAG is just Google with a neural network. Here's what actually makes it work.
    - Cheatsheet · PDF
    - [Live Code Demo](/playbook/live-code/demo-rag-chunking.ipynb)

11. [Embedding Models & Vector Databases](/playbook/posts/2025-03-12-embedding-models-vector-databases/) — Your embeddings are not vectors. They're probability distributions in disguise.
    - Cheatsheet · PDF
    - [Live Code Demo](/playbook/live-code/demo-embeddings.ipynb)

12. [RAG Debugging & Evaluation](/playbook/posts/2025-03-19-rag-debugging-evaluation/) — RAG isn't broken. Your evaluation is. Here's how to actually test it.
    - Cheatsheet · PDF
    - [Live Code Demo](/playbook/live-code/demo-rag-evaluation.ipynb)

### Fine-Tuning (When It's Actually Worth It)

13. [Fine-Tuning Fundamentals](/playbook/posts/2025-03-26-fine-tuning-fundamentals/) — You probably don't need fine-tuning. Here's how to tell when you do.
    - Cheatsheet · PDF
    - [Live Code Demo](/playbook/live-code/demo-fine-tuning.ipynb)

14. [LoRA & QLoRA in Practice](/playbook/posts/2025-04-02-lora-qlora/) — Low-rank adaptation for engineers who don't care about the math (but need the results).
    - Cheatsheet · PDF
    - [Live Code Demo](/playbook/live-code/demo-lora.ipynb)

### AI Engineering Tools

15. [Orchestration Frameworks](/playbook/posts/2025-04-09-orchestration-frameworks/) — LangChain is a dependency tree. LlamaIndex is RAG-specific. DSPy is the weird one. Here's when to use which.
    - Cheatsheet · PDF
    - [Live Code Demo](/playbook/live-code/demo-frameworks.ipynb)

16. [Model Serving & Inference](/playbook/posts/2025-04-16-model-serving-inference/) — Inference is not deployment. Here's latency/throughput/cost without the marketing copy.
    - Cheatsheet · PDF
    - [Live Code Demo](/playbook/live-code/demo-serving.ipynb)

17. [Agent Frameworks](/playbook/posts/2025-04-23-agent-frameworks/) — Agents are just programs with tool access. Most patterns are overcomplicated. Here's what actually works.
    - Cheatsheet · PDF
    - [Live Code Demo](/playbook/live-code/demo-agents.ipynb)

### MLOps & Production

18. [Training Pipeline Engineering](/playbook/posts/2025-04-30-training-pipelines/) — Training pipelines are infrastructure problems with a math hat.
    - Cheatsheet · PDF
    - [Live Code Demo](/playbook/live-code/demo-pipelines.ipynb)

19. [Monitoring & Drift Detection](/playbook/posts/2025-05-07-monitoring-drift/) — Your model works. Until it doesn't. Here's how to catch it before your users do.
    - Cheatsheet · PDF
    - [Live Code Demo](/playbook/live-code/demo-monitoring.ipynb)

20. [Cost Engineering for AI Systems](/playbook/posts/2025-05-14-cost-engineering/) — AI is expensive. Here's how to not go broke building with it.
    - Cheatsheet · PDF
    - [Live Code Demo](/playbook/live-code/demo-cost.ipynb)
