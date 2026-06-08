---
title: Model Serving & Inference
date: 2025-04-16
layout: post
category: play
collection: ai-blog
---
## Model Serving & Engine Comparison

Inference is not deployment. Here's latency/throughput/cost without the marketing copy.

### Serving Engines: The Real Trade-offs

Serving engines are not interchangeable. Each has different strengths and weaknesses that matter for production.

```python
"""
Serving engine comparison (2025):

1. vLLM
   - PagedAttention (memory management)
   - Throughput: 3-5x faster than HuggingFace Transformers
   - Latency: low (continuous batching)
   - GPU support: NVIDIA (CUDA)
   - quantization: FP16, BF16, FP8
   - Cost: Free (self-host)
   - Verdict: Default choice for most use cases

2. TGI (Text Generation Inference — Hugging Face)
   - Tensor parallelism built-in
   - Best for: large models (70B+) on multiple GPUs
   - Latency: moderate (higher than vLLM for small models)
   - GPU support: NVIDIA, AMD
   - quantization: AWQ, GPTQ bits, FP16, BF16
   - Cost: Free (self-host)
   - Verdict: Best for models that don't fit on one GPU

3. Triton (NVIDIA)
   - Multi-model, multi-framework support
   - Best for: enterprise, complex pipelines (not just LLM)
   - Latency: configurable (you optimize)
   - GPU support: NVIDIA
   - quantization: FP16, BF16, INT8, FP8
   - Cost: Free (self-host)
   - Verdict: Best for complex inference pipelines

4. SGLang
   - Radix attention (prefix caching)
   - Best for: multi-turn conversations with shared context
   - Latency: low for repeated prefixes
   - GPU support: NVIDIA
   - quantization: FP16, BF16
   - Cost: Free (self-host)
   - Verdict: Best for chat apps with shared context

5. llama.cpp
   - CPU inference (yes, really)
   - Best for: prototyping, edge devices, cost-sensitive deployments
   - Latency: 10-100x slower than GPU
   - GPU support: minimal (some hardware via llama.cpp backend)
   - quantization: Q4_K_M (4-bit), Q8_0 (8-bit)
   - Cost: Free (self-host)
   - Verdict: Best for CPU-only deployments
"""
```

### Latency vs Throughput Trade-offs

```python
"""
Latency vs Throughput:

- Latency: time from request to response (per-request)
  → Matters for real-time apps (chat, coding assistants)
  → Users will abandon after 2-3 seconds

- Throughput: requests processed per second (aggregate)
  → Matters for batch processing (data labeling, batch analysis)
  → You want to maximize throughput at acceptable latency

- Trade-off: throughput-focused engines (batch size = ∞) have higher latency
  → vLLM: high throughput, moderate latency
  → TGI: high throughput, high latency for single requests
  → llama.cpp: low throughput, high latency (CPU)

Rule: choose based on your user experience, not your server's performance.
If latency >2s, users will abandon. No amount of throughput helps.
"""
```

### Quantization for Inference

Quantized models use fewer bits per weight, reducing memory and compute requirements.

```python
"""
Quantization for inference (cost vs quality):

- FP16 (16-bit): original quality, original size (default)
  → Use when: quality is paramount, GPU memory is not a concern

- BF16 (16-bit): same as FP16 for inference (usually better for training)
  → Use when: you need BF16 training compatibility

- INT8 (8-bit): ~2x memory reduction, ~1-2% accuracy loss
  → Use when: you need 2x throughput for acceptable quality loss

- FP8 (8-bit floating point): newer, better than INT8 for LLMs
  → Use when: you need good quality with low bits (vLLM supports FP8)

- INT4 (4-bit): ~4x memory reduction, ~5-15% accuracy loss
  → Use when: you need max throughput and can tolerate quality loss
  → llama.cpp: QQ4_K_M, Q5_K_M quality options
  
- AWQ (Activation-aware Weight Quantization): ~3x memory reduction, ~1-3% loss
  → Use when: you want 4-bit quality with minimal accuracy loss

Recommendation: INT8 for most cases. AWQ if you need lower bits.
FP8 if supported by your engine (best quality/size trade-off).
"""
```

### Cost Optimization for Inference

```python
"""
Inference cost optimization (ranked by impact):

1. Choose the right engine (vLLM > HuggingFace Transformers)
   → 3-5x throughput improvement = same cost for 3-5x more requests

2. Quantize your models (FP16 → INT8 or FP8)
   → 2x throughput = half the cost per request

3. Use smaller models (7B vs 70B) when possible
   → 10x latency improvement, often negligible quality difference

4. Implement response caching
   → For repeated queries, cache responses (cache hits cost $0)

5. Use speculative decoding (if available)
   → Small model drafts, large model validates (2x speedup)

6. Batch requests (continuous batching)
   → vLLM, LlamaIndex both support this

7. Schedule during off-peak hours (for batch processing)
   → Some clouds charge less during off-peak hours

8. Use spot/preemptible instances (for non-critical workloads)
   → 60-70% cost reduction on GPU spot instances

Rule: optimize the biggest wins first. Engine choice > quantization > caching > batching.
"""
```

### Practical Setup Example

```python
# vLLM setup (serving a model on a single GPU)
# docker run -d --gpus all -p 8000:8000 vllm/vllm-openai:latest \
#   --model meta-llama/Llama-3.1-8B-Instruct \
#   --tensor-parallel-size 1 \
#   --max-model-len 8192 \
#   --dtype float16 \
#   --max-num-seqs 256

# API call (OpenAI-compatible):
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.1-8B-Instruct",
    "messages": [{"role": "user", "content": "Hello!"}],
    "temperature": 0.7
  }'
```

### Summary

Serving engines are about matching the right tool to your workload:
- **vLLM**: Default choice. Best throughput, good latency.
- **TGI**: For models that don't fit on one GPU.
- **Triton**: For complex multi-model pipelines.
- **SGLang**: For chat apps with shared context.
- **llama.cpp**: For CPU-only deployments.

Quantize for cost. Choose the right engine for throughput. The rest is optimization. Build for your user experience first. Latency > throughput > cost.
