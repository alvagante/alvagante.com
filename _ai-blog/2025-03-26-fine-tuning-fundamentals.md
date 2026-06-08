---
title: Fine-Tuning Fundamentals
date: 2025-03-26
layout: post
category: play
collection: ai-blog
---
## Fine-Tuning Fundamentals

You probably don't need fine-tuning. Here's how to tell when you do.

### The Fine-Tuning Decision Tree

```python
def decision_tree(task):
    """
    Should you fine-tune? Use this decision tree.
    
    Each question narrows down the best approach.
    """
    print("Fine-tuning decision tree:")
    print(f"  TASK: {task}")
    print()
    
    # Question 1: Does the model already answer this correctly in zero-shot?
    if model_zero_shot(task, accuracy=0.9):
        print("  → Model works. Use zero-shot prompting. Stop here.")
        return "prompting"
    
    # Question 2: Is the task about formatting/style?
    if task.is_formatting_style():
        print("  → Task is about formatting/style. Use few-shot prompting.")
        print("     Fine-tuning won't help (same model, just different formatting).")
        return "few-shot"
    
    # Question 3: Is the task about domain-specific knowledge?
    if task.requires_domain_knowledge():
        print("  → Task needs domain knowledge. Consider fine-tuning.")
        print("  → Better: use RAG (cheaper, easier, no training needed).")
        return "rag_or_finetune"
    
    # Question 4: Is it a unique capability the model doesn't have?
    if task.requires_unique_capability():
        print("  → Unique capability. Fine-tuning IS the right answer.")
        return "fine-tune"

# The key insight from real-world data:
# - 70% of "fine-tuning needed" tasks are solved by prompting alone
# - 20% are solved by RAG
# - 10% actually need fine-tuning
```

### When Fine-Tuning Actually Helps

```python
"""
Fine-tuning helps with:

1. Domain-specific output formatting that the model doesn't know
   - "Return results as JSON with these exact field names"
   - "Write in this specific style/tone"
   - "Always use this template for responses"

2. Teaching the model a pattern it couldn't learn from few-shot alone
   - "Always explain the reasoning before the answer"
   - "Never include citations in responses"
   - "Always include a disclaimer before medical advice"

3. Reducing token usage for repetitive instructions
   - Instead of "Please return JSON with fields A, B, C..." every prompt
   - One-time fine-tune teaches the pattern
   - Saves tokens and improves consistency

Fine-Tuning does NOT help with:
1. Adding knowledge the model doesn't have (use RAG)
2. Improving general capabilities (pre-training is better)
3. Making the model faster (inference cost stays the same)
4. Fixing prompt quality (bad prompts + fine-tuned model = bad results too)

Rule of thumb: if you can solve it with RAG, use RAG.
Fine-tuning is for patterns that RAG can't fix.
"""
```

### Data Requirements for Fine-Tuning

```python
def data_requirements(model_size="7B", task="classification"):
    """
    How much data do you need to fine-tune?
    
    Rule of thumb: more model = more data needed.
    """
    
    requirements = {
        "7B model": {
            "minimum_samples": "~100 high-quality examples",
            "recommended_samples": "~1,000 examples",
            "sweet_spot": "~5,000-10,000 examples",
        },
        "13B model": {
            "minimum_samples": "~500 high-quality examples",
            "recommended_samples": "~5,000 examples",
            "sweet_spot": "~10,000-50,000 examples",
        },
        "70B model": {
            "minimum_samples": "~1,000 high-quality examples",
            "recommended_samples": "~10,000 examples",
            "sweet_spot": "~50,000-100,000 examples",
        },
    }
    
    return requirements.get(model_size, {}).get(task, "Check specific model docs")

# Quality matters more than quantity. 100 carefully curated examples
# can outperform 10,000 random ones. Key quality factors:
# - Examples should match your actual use case
# - No synthetic data (synthetic = training on the same as your prompt)
# - Diversity > quantity (different ways of asking the same question)
# - Clean data (no typos, no noise)
"""
```

### LoRA Parameters Explained

```python
"""
LoRA hyperparameters:

a: the "rank" of the low-rank matrices. Determines model capacity.
- Higher rank = more capacity = better learning but more parameters
- Typical range: 4-128
- Start with rank = 16, increase if loss plateaus

alpha: The LoRA scaling factor. Controls how much the LoRA adapter affects the model.
- Typical: alpha = 2 * rank (standard scaling)
- Alpha / rank determines the effective scaling
- If loss decreases too slowly, increase alpha
- If loss oscillates, decrease alpha

beta1, beta2: Adam optimizer hyperparameters (usually defaults: 0.9, 0.999)

lr: Learning rate. The most important hyperparameter.
- Typical range: 1e-4 to 5e-5 (LOWER than standard training)
- Too high = loss explodes, too low = no improvement
- Cosine annealing schedule works best

epochs: Number of passes through the data.
- Too many = overfitting (very common)
- Too few = underfitting
- Typical: 3-5 epochs with early stopping

batch_size: Number of examples per batch.
- Larger batch = more stable gradients but more memory
- Typical: 4-16 (depending on GPU memory)

warmup_ratio: Fraction of steps for learning rate warmup.
- Typical: 0.03-0.1 (3-10% of total steps)
- Prevents initial gradient explosion

mask_length: For sequence-to-sequence fine-tuning.
- Set to "max" to mask entire sequence
- Use "uniform" for partial masking
"""
```

### Fine-Tuning vs RAG vs Prompting Decision Matrix

```python
"""
When to use what:

| Scenario                          | Best Approach | Why |
|-------------------------------------------------------------|------------------|
| Model already does it well       | Prompting       | No training needed |
| Need different output format     | Few-shot Ppting | Easier than fine-tuning |
| Need domain knowledge not in model | RAG             | Cheaper, no retrained |
| Model keeps ignoring instructions | Fine-tuning     | Teach once, works always |
| Need consistent formatting       | Fine-tuning     | More reliable than prompting |
| Task is common knowledge         | Prompting       | Model already knows |
| Data changes frequently          | RAG             | Update index, retrain model |
| Unique capability needed         | Fine-tuning     | No alternative |
| Need low-latency                 | RAG             | Fine-tuning inference is same speed |
| Need explainability              | RAG             | Can trace to source docs |

Rule of thumb: prompting → RAG → fine-tuning (in that order)
If you can fix it with prompting, don't move to RAG.
If you can fix it with RAG, don't fine-tune.
Fine-tuning is the LAST option, not the first.
"""
```

### Evaluating Fine-Tuning Results

```python
def evaluate_fine_tuning(base_model, fine_tuned_model, eval_dataset):
    """
    Evaluate fine-tuning results.
    
    Comparison: fine-tuned vs base model on the same eval dataset.
    """
    base_accuracy = 0.0
    ft_accuracy = 0.0
    
    for item in eval_dataset:
        base_response = base_model.generate(item.input)
        ft_response = fine_tuned_model.generate(item.input)
        
        if is_correct(base_response, item.answer):
            base_accuracy += 1
        if is_correct(ft_response, item.answer):
            ft_accuracy += 1
    
    base_accuracy /= len(eval_dataset)
    ft_accuracy /= len(eval_dataset)
    
    print(f"Base model accuracy: {base_accuracy:.3f} ({*100:.1f}%)")
    print(f"Fine-tuned accuracy: {ft_accuracy:.3f} ({ft_accuracy*100:.1f}%)")
    print(f"Improvement: {(ft_accuracy - base_accuracy) * 100:.1f}%)
    
    if ft_accuracy - base_accuracy > 0.05:
        print("Fine-tuning helped!")
    else:
        print("Fine-tuning didn't help. Try more data, different hyperparameters, or RAG.

    # Important: also check for catastrophic forgetting
    # If accuracy increases on target task but decreases on unrelated tasks
    # your fine-tune was too aggressive. Use less data, lower lr, or LoRA.
"""
```

### Summary

Fine-tuning is for teaching patterns, not knowledge:
- Prompting solves 70% of "fine-tuning needed" tasks
- RAG solves 20% (add knowledge without training)
- Fine-tuning solves 10% (teach patterns that RAG can't fix)

Use the decision tree. Evaluate honestly. Don't fine-tune unless you have to. When you do: use high-quality data, monitor for overfitting, and compare against the base model.

Fine-tuning is a tool, not a panacea. It's the last option, not the first.
