---
title: LoRA & QLoRA in Practice
date: 2025-04-02
layout: post
category: play
collection: ai-blog
---
## LoRA & QLoRA in Practice

Low-rank adaptation for engineers who don't care about the math (but need the results).

### What LoRA Actually Does

LoRA freezes the base model's weights and adds small trainable matrices. When you train, only the small matrices learn. At inference, you merge them into the base model (or combine on-the-fly). The math simplifies to:

```
W_new = W_frozen + A × b  (where A and B are the low-rank matrices)
```

A and B have rank r (typically 4-64). They're much smaller than W (which is typically d_model x d_ff). When r << d_model, you're training a tiny fraction of parameters.

```python
def lora_matrices(base_model, rank=16):
    """
    Create LoRA matrices for a given model layer.
    
    For a layer with weight matrix W of shape (d_model, d_ff):
    - A shape: (d_model, r)
    - B shape: (r, d_ff)
    - Total LoRA params: d_model * r + r * d_ff = r * (d_model + d_ff)
    
    If d_model=4096, d_ff=11008, r=16:
    - LoRA params: 16 * (4096 + 11008) = 256,000 per layer
    - Full model params: 4096 * 11008 = 45,127,680
    - LoRA is 0.57% of the model's parameters
    """
    d_model = 4096
    d_ff = 11008
    r = rank
    
    # Initialize A (random) and B (zeros)
    # Initialization matters: B must start at zeros so the model
    # behaves identically to the base model at training start
    A = np.random.randn(d_model, r) * 0.02  # Xavier initialization
    B = np.zeros((r, d_ff))  # Must be zeros!
    
    total_lora_params = d_model * r + r * d_ff
    total_model_params = d_model * d_ff
    
    print(f"LoRA parameters: {total_lora_params:,} ({total_lora_params/total_model_params*100:.2f}%)")
    print(f"Full model parameters: {total_model_params:,}")
    print(f"Parameter reduction: {1 - total_lora_params/total_model_params:.4%}")
    
    return A, B

# Why LoRA works:
# 1. You train on specific patterns, not the whole distribution
# 2. The patterns live in a low-dimensional subspace
# 3. The base model provides general knowledge; LoRA adds domain-specific knowledge
# 4. You can swap LoRA adapters without retraining the whole model

# The key insight: fine-tuning isn't about retraining the whole model.
# It's about finding the direction in weight space that improves performance.
# That direction is low-rank. LoRA finds it efficiently.
```

### QLoRA: Quantized LoRA

QLoRA quantizes the base model to 4-bit before training. This dramatically reduces memory requirements while maintaining accuracy.

```python
"""
QLoRA (Quantized LoRA) = 4-bit quantization + LoRA

Why QLoRA matters:
- Full fine-tuning of a 70B model: ~280GB VRAM
- LoRA of a 70B model: ~80GB VRAM
- QLoRA of a 70B model: ~10-20GB VRAM (can run on a single consumer GPU!)

How QLoRA works:
1. Quantize base model to 4-bit (NF4 = NormalFloat)
2. Cast to 16-bit (bfloat16) for training
3. Apply LoRA adapters (only these are trainable)
4. Backprop through the quantized weights (using Double Quantization to save memory)

Result: You can fine-tune a 70B model on a single RTX 3090 (24GB VRAM)
```

### LoRA vs QLoRA Comparison

```python
"""
LoRA vs QLoRA:

| Metric           | LoRA       | QLoRA      |
|------------------|------------|------------|
| Memory (70B)     | ~80GB      | ~10-20GB   |
| GPU requirement  | Multi-GPU  | Single GPU |
| Training speed   | Fast       | Slightly slower |
| Quality          | Excellent  | Near-equivalent |
| Speed            | Fast       | Slightly slower |
| Cost             | High       | Low        |
| Use case         | Enterprise | Small teams, experimentation |

Recommendation: Use QLoRA for everything unless you need maximum training speed.
QLoRA is faster (less memory = less swap = faster training).
QLoRA is cheaper (consumer GPU vs cluster).
QLoRA is simpler (no distributed training needed).
"""
```

### Practical LoRA Configuration

```python
from peft import LoraConfig, get_peft_model

# Recommended LoRA configuration
lora_config = LoraConfig(
    r=16,                          # Rank: start here, increase if loss plateaus
    lora_alpha=32,                 # Alpha: 2x rank is standard
    lora_dropout=0.05,             # Dropout: prevents overfitting to training data
    target_modules=["q_proj", "v_proj"],  # Target specific layers
    task_type="CAUSAL_LM",        # Causal language model (for text generation)
    bias="none",                  # Bias: don't train bias terms
)

# target_modules depends on the model:
# - Llama: ["q_proj", "v_proj", "k_proj", "o_proj"]
# - Mistral: ["q_proj", "v_proj"]
# - GPT-J: ["q_proj", "v_proj"]
# - GPT-Neo: ["q_attn"]
# More targeted modules = fewer parameters but may miss important patterns

# Target ALL attention layers for maximum improvement:
target_modules = [
    "q_proj", "k_proj", "v_proj", "o_proj",
    "gate_proj", "up_proj", "down_proj",  # FFN layers
]

def get_lora_config(target_modules):
    return LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        target_modules=target_modules,
        task_type="CAUSAL_LM",
        bias="none",
    )

# Training configuration
training_args = TrainingArguments(
    output_dir="./lora-model",
    num_train_epochs=3,             # 3 epochs is usually enough
    per_device_train_batch_size=4,  # Depends on GPU memory
    learning_rate=2e-4,             # Lower is better (LoRA converges with smaller lr)
    lr_scheduler_type="cosine",     # Cosine annealing
    warmup_ratio=0.03,              # 3% warmup
    fp16=True,                      # Mixed precision training
    gradient_accumulation_steps=4,  # Simulate larger batch sizes
    logging_steps=100,              # Log every 100 steps
    save_steps=500,                 # Save every 500 steps
    optim="paged_adamw_8bit",       # Memory-efficient optimizer
    report_to="none",               # Disable wandb (or enable it)
)
```

### When to Fine-Tune (and When LoRA Won't Help)

```python
"""
LoRA works when:
- Fine-tuning on a specific domain/style
- Learning a new output format or pattern
- Teaching the model a new capability (code, math, etc.)

LoRA is LESS effective when:
- You need to change the model's world knowledge (use RAG instead)
- The task requires changing the model's fundamental behavior (use full fine-tuning)
- You're tuning a very small model (< 7B) — the model may not have enough capacity
- The dataset is very small (< 100 examples) — not enough data to learn from

LoRA fails (with solutions):
- Loss doesn't decrease → training data is bad or learning rate is wrong
- Loss decreases but accuracy doesn't → model is memorizing, not learning
  → Try: more regularization, less data, different rank
- Overfitting on training set → train set accuracy: 95%, eval set: 60%
  → Try: more data, higher dropout, lower lr, reduce epochs
"""
```

### Inference: Merging vs Adapter Loading

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

class LoraInference:
    """LoRA inference options: merge or load as adapter."""
    
    def __init__(self, base_model_name, adapter_path=None, merge=False):
        self.base_model = AutoModelForCausalLM.from_pretrained(base_model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(base_model_name)
        
        if adapter_path:
            if merge:
                # Option 1: Merge LoRA weights into base model
                # Pros: faster inference (just one forward pass)
                # Cons: can't switch adapters without re-loading base model
                self.model = self.base_model.merge_and_unload()
            else:
                # Option 2: Load as adapter on-the-fly
                # Pros: can switch adapters dynamically
                # Cons: slightly slower (two forward passes)
                self.model = PeftModel.from_pretrained(self.base_model, adapter_path)
    
    def generate(self, prompt, max_new_tokens=512):
        inputs = self.tokenizer(prompt, return_tensors="pt")
        return self.model.generate(**inputs, max_new_tokens=max_new_tokens)

# Why merge?
# - LoRA adapters are additional operations. Merging saves 1 forward pass.
# - For production: merge once, deploy once. No adapter loading overhead.
# - For experimentation: load as adapter, compare multiple adapters.

# Important: you can't "unmerge" a LoRA adapter. Once merged, it's in the base model.
# Keep your base model around so you can merge different adapters.
```

### Summary

LoRA/QLoRA are about efficiency:
- LoRA: train 0.57% of parameters, get 80% of full fine-tuning's results
- QLoRA: add 4-bit quantization, get the same results on a single consumer GPU
- Alpha = 2x rank is the standard setting
- Lower learning rate (2e-4) than full fine-tuning
- Merge adapters for production, load for experimentation

Build LoRA adapters. Test them. Merge them for deployment. Monitor for overfitting. Swap them when you need to.

LoRA isn't a hack. It's a mathematical fact that the space of "changes to a trained model" is low-dimensional. Use it.
