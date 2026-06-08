---
title: "LLM Training Lifecycle"
date: 2025-01-29
layout: default
category: play
---

## LLM Training Lifecycle

Pretraining is expensive. Fine-tuning is easy. Both are wrong. The actual training pipeline: data curation → pretraining → SFT → RLHF/DPO → monitoring.

### The 5 Stages of LLM Training

Every LLM goes through five stages. Each stage has its own requirements, costs, and failure modes.

```python
# The full pipeline:
# Stage 1: Pretraining — learn languages, facts, reasoning from raw text
# Stage 2: SFT — learn to follow instructions (Supervised Fine-Tuning)
# Stage 3: Reward Modeling — learn to prefer good answers over bad ones
# Stage 4: RLHF/DPO — optimize for human preferences via reinforcement learning
# Stage 5: Monitoring — catch when things break

stages = [
    "Pretraining:  $10M-$100M  (compute-heavy, data-heavy)",
    "SFT:          $100K-$1M   (label-heavy, compute-light)",
    "Reward Model: $50K-$500K  (label-heavy, compute-light)",
    "RLHF/DPO:     $100K-$2M   (compute-light, label-heavy)",
    "Monitoring:   $10K-$100K/yr (ongoing)"
]

for stage in stages:
    print(stage)
```

### Stage 1: Pretraining

Pretraining is where the model learns "the world." It processes trillions of tokens, learning patterns that become "knowledge," "reasoning," and "language understanding."

```python
def pretraining_pipeline():
    """
    Pretraining pipeline — the most expensive and least understood stage.
    """
    
    # Step 1: Data Collection
    # Sources: Common Crawl, Wikipedia, PubMed, GitHub, books, websites
    # Total dataset: 10-100 trillion tokens (for billion-scale models)
    
    # Step 2: Data Curation (THE MOST IMPORTANT STEP)
    # Bad data in = garbage out. Always. No amount of architecture fixes bad data.
    curation_steps = [
        "1. Deduplication (exact + fuzzy): Remove near-duplicates",
        "2. Quality filtering: Remove low-quality text",
        "3. Perplexity scoring: Keep high-LLM-perplexity text",
        "4. Toxicity filtering: Remove harmful/offensive content",
        "5. Language detection: Separate datasets by language",
        "6. Tokenization consistency: Use model's own tokenizer"
    ]
    for step in curation_steps:
        print(step)
    
    # Step 3: Training Loop
    # - Use data parallelism (multiple GPUs process different batches)
    # - Use tensor parallelism (split model across GPUs within a batch)
    # - Use pipeline parallelism (split layers across GPUs)
    # - Gradient accumulation (simulate larger batches with limited GPU memory)
    
    print("\nStep 3: Training Configuration")
    print("  Loss: Next-token prediction (cross-entropy)")
    print("  Optimizer: AdamW (lr=1e-4 to 3e-4, with warmup)")
    print("  LR schedule: Cosine annealing with WMT warmup")
    print("  Batch size: 2-8 Million tokens per step")
    print("  Max gradient norm: 1.0 (clip to prevent explosion)")
    print("  Checkpoint every: 5-10k steps (for resuming)")
    print("  eval every: 1k steps (for monitoring)")
    
    # Step 4: Evaluation
    # - Perplexity on held-out validation set
    # - Language benchmarks (MMLU, HellaSwag, ARC, etc.)
    # - Toxicity assessment
    # - Memorization check (does the model repeat training data verbatim?)
    
    # Step 5: Stop Criteria
    # - Validation loss plateaus
    # - Memorization exceeds threshold
    # - Compute budget exhausted
    # - Diminishing returns on benchmarks

pretraining_pipeline()

# The actual pretraining process in code:

import numpy as np

class PretrainingTrainer:
    """Simplified pretraining loop."""
    
    def __init__(self, model, tokenizer, dataset, args):
        self.model = model
        self.tokenizer = tokenizer
        self.dataset = dataset
        self.args = args
        
        # AdamW optimizer state
        self.m = {}  # first moment (exponential moving avg of gradients)
        self.v = {}  # second moment (exponential moving avg of squared gradients)
        self.step = 0
        
    def train_step(self, batch_texts):
        """Single pretraining step."""
        # 1. Tokenize
        tokens = self.tokenizer(batch_texts).to(self.device)
        
        # 2. Forward pass — next token prediction
        inputs = tokens[:, :-1]    # all but last token → input
        labels = tokens[:, 1:]     # all but first token → target
        
        logits = self.model(inputs)  # (batch, seq_len, vocab_size)
        loss = self.cross_entropy_loss(logits.reshape(-1, self.vocab_size), labels.reshape(-1))
        
        # 3. Backward pass
        loss.backward()
        
        # 4. Gradient clipping
        grad_norm = torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.args.max_grad_norm)
        
        # 5. Optimizer step with warmup
        lr = self.get_lr()
        self.optimizer.step(lr)
        self.optimizer.zero_grad()
        
        self.step += 1
        
        return {
            'loss': loss.item(),
            'lr': lr,
            'grad_norm': grad_norm.item(),
            'step': self.step
        }
    
    def cross_entropy_loss(self, logits, targets):
        """Standard cross-entropy loss for next-token prediction."""
        loss = torch.nn.functional.cross_entropy(logits, targets)
        return loss
    
    def get_lr(self):
        """Cosine annealing with linear warmup."""
        warmup_steps = self.args.warmup_steps
        total_steps = self.args.total_steps
        
        if self.step < warmup_steps:
            # Linear warmup: start at 0, linearly increase to peak LR
            return self.args.lr_start * (self.step / warmup_steps)
        else:
            # Cosine annealing: from peak LR down to 0
            cos_inner = np.pi * (self.step - warmup_steps) / (total_steps - warmup_steps)
            return self.args.lr_peak * 0.5 * (1 + np.cos(cos_inner))

# Key pretraining insights:
# - Data quality > model size > architecture > optimizer
# - You can improve model quality more by cleaning data than by changing architecture
# - The dataset is the training data + the preprocessing pipeline
# - Memorization is a feature and a curse: you want enough capacity to learn, 
#   but not so much that it stores training examples verbatim
```

### Stage 2: Supervised Fine-Tuning (SFT)

SFT teaches the model to follow instructions. It's supervised learning: you provide (prompt, response) pairs and train the model to generate the response.

```python
def sft_pipeline():
    """
    SFT pipeline — teaching the model to follow instructions.
    """
    
    print("SFT Requirements:")
    print("  Dataset: ~10K-1M high-quality (instruction, response) pairs")
    print("  Cost: ~$10K-$100K (compute) + $50K-$500K (labeling)")
    print("  Method: Continue pretraining on SFT dataset (not fine-tuning)")
    
    print("\nInstruction Template:")
    templates = [
        "User: {instruction}\\nAssistant: {response}",  # Simple
        "Question: {question}\\nAnswer: {response}",  # QA
        "Given the context: {context}\\nQuestion: {question}\\nAnswer: {response}",  # RAG
        "Code: {code}\\nExplanation: {response}",  # Code
    ]
    for t in templates:
        print(f"  - {t}")
    
    print("\nSFT Best Practices:")
    practices = [
        "1. Use the same tokenization as pretraining (don't use a new tokenizer!)",
        "2. Pad all sequences to the same length (for batching efficiency)",
        "3. Mask loss on padding tokens (don't train on padding!)",
        "4. Use LoRA for cost savings (freeze base model, train only LoRA adapters)",
        "5. Monitor loss on both instructions and responses (not just responses)",
        "6. Use early stopping (SFT can overfit faster than pretraining)",
        "7. Quality of instructions > quantity of examples"
    ]
    for p in practices:
        print(f"  {p}")
    
    # SFT in code:

import torch
import torch.nn.functional as F

class SFTTrainer:
    """Supervised Fine-Tuning trainer."""
    
    def __init__(self, model, dataset):
        self.model = model
        self.dataset = dataset
        self.criterion = torch.nn.CrossEntropyLoss(ignore_index=0)  # ignore padding
        
    def train_step(self, prompts, responses):
        """Single SFT training step."""
        # Combine prompt + response into one sequence
        combined = self.tokenizer.encode(prompts + responses)
        
        # Create labels: loss only on response (not prompt)
        prompt_len = len(self.tokenizer.encode(prompts))
        labels = combined.clone()
        labels[:prompt_len] = -100  # ignore loss on prompt tokens
        
        # Forward pass
        outputs = self.model(combined, labels=labels)
        loss = outputs.loss
        
        # Backward pass
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
        
        return loss.item()
    
    def evaluate(self, eval_prompts, expected_responses):
        """Evaluate SFT on held-out instructions."""
        correct = 0
        total = len(eval_prompts)
        
        for prompt, expected in zip(eval_prompts, expected_responses):
            response = self.model.generate(prompt, max_new_tokens=512)
            # Simple string match or BLEU score
            if self.tokenizer.decode(response) == expected:
                correct += 1
        
        accuracy = correct / total
        return {'accuracy': accuracy}

# The most common SFT mistake:
# Using raw text responses without instruction formatting
# Example of bad SFT data: "The sky is blue." (no instruction context)
# Example of good SFT data: "What color is the sky? The sky is blue."

# The template is the instruction. Without it, you're just continuing to
# pretrain. The model has no way to know when to generate and when to wait.

```

### Stage 3: Reward Modeling

Reward models learn to score responses. They're the "critic" that tells the policy (your LLM) which answers are better. They're trained on human preference data: given two responses to the same prompt, which one did a human prefer?

```python
def reward_modeling_pipeline():
    """
    Reward modeling — training a reward model on human preferences.
    """
    
    print("Reward Modeling Requirements:")
    print("  Dataset: ~50K-200K preference pairs (response_a, response_b, winner)")
    print("  Cost: ~$50K-$500K (mostly human labeling)")
    print("  Method: Fine-tune a language model to predict preference")
    
    print("\nHuman Preference Labeling Process:")
    labeling_steps = [
        "1. Generate 2 responses for each prompt (from the SFT model)",
        "2. Randomize order (A/B blind)",
        "3. Ask workers: 'Which response is better?'",
        "4. Accept only if both workers agree (for quality)",
        "5. Keep examples of disagreement (hard cases)"
    ]
    for step in labeling_steps:
        print(f"  {step}")
    
    print("\nReward Model Architecture:")
    architecture = [
        "1. Same base model as SFT",
        "2. Input: [prompt; response]",
        "3. Output: single scalar (reward score)",
        "4. Loss: binary cross-entropy (predicted preference vs actual winner)",
        "5. Use CLS token or last token as reward token"
    ]
    for a in architecture:
        print(f"  {a}")
    
    print("\nReward Model Training:")
    training_steps = [
        "1. Format: 'System: {prompt}\\nAssistant: {response_a}' or '...{response_b}'",
        "2. Add two classes: 'preference_a' or 'preference_b'",
        "3. Train to predict which response the human prefers",
        "4. Use early stopping (reward models overfit FAST)"
    ]
    for step in training_steps:
        print(f"  {step}")

reward_modeling_pipeline()

# Reward model in code:

class RewardModel:
    """Simple reward model — a classifier that predicts which response is better."""
    
    def __init__(self, model, config):
        self.model = model
        self.config = config
        
    def compute_score(self, prompt, response):
        """
        Get reward score for a (prompt, response) pair.
        Higher score = more preferred.
        """
        # Format: "Prompt: {prompt}\\nResponse: {response}"
        text = f"Prompt: {prompt}\\nResponse: {response}"
        tokens = self.tokenizer(text, return_tensors='pt')
        
        # Forward pass through the reward model
        with torch.no_grad():
            output = self.model(**tokens)
            reward = output.logits[:, -1].item()  # Last token's logit
        
        return reward
    
    def train_step(self, prompt, response_a, response_b, winner_a=True):
        """Single reward model training step."""
        # Create labels for the preference
        if winner_a:
            reward_a = self.compute_score(prompt, response_a)
            reward_b = self.compute_score(prompt, response_b)
            target = torch.tensor([reward_a - reward_b])  # Positive = response A is better
        else:
            reward_a = self.compute_score(prompt, response_a)
            reward_b = self.compute_score(prompt, response_b)
            target = torch.tensor([reward_b - reward_a])  # Positive = response B is better
        
        # Loss = log sigmoid of score difference
        loss = -F.logsigmoid(target)  # Binary cross-entropy
        loss.backward()
        
        return loss.item()

# Common mistake: using the SAME model for reward and policy
# This leads to reward hacking — the model learns to optimize the reward
# function rather than actually being better. Always use separate models.

```

### Stage 4: RLHF / DPO (Reinforcement Learning from Human Feedback)

RLHF optimizes the model to maximize the reward model's scores. It's the most controversial stage and often the most misunderstood.

```python
def rlhf_pipeline():
    """
    RLHF (Reinforcement Learning from Human Feedback).
    """
    
    print("RLHF Method:")
    methods = [
        "PPO (Proximal Policy Optimization): Original RLHF, stable but complex",
        "DPO (Direct Preference Optimization): No reward model needed. Simpler.",
        "KTO (Kahneman-Tversky Optimization): Single comparison (good/bad, not A/B)"
    ]
    for m in methods:
        print(f"  {m}")
    
    print("\nDPO (Direct Preference Optimization):")
    print("  - No reward model needed (we train the policy directly)")
    print("  - Loss: minimize -log(σ(r_θ(x,y_w) - r_θ(x,y_l))) where")
    print("    r_θ(x,y) = β * log(p_θ(y|x)/p_ref(y|x)) is the implicit reward")
    print("    y_w = 'won' response (preferred), y_l = 'lost' response")
    print("  - Much simpler than PPO and often performs better")
    
    print("\nRLHF vs DPO comparison:")
    print("  RLHF:  Reward model + PPO (complex, 4 models)")
    print("  DPO:   Direct policy optimization (simple, 1 model)")
    print("  Verdict: Use DPO unless you have specific reasons for RLHF")

rlhf_pipeline()

# DPO in code:

class DPOTrainer:
    """Direct Preference Optimization trainer."""
    
    def __init__(self, policy_model, reference_model, beta=0.1):
        self.policy = policy_model
        self.ref = reference_model  # Reference model (frozen, from SFT)
        self.beta = beta  # Temperature hyperparameter
        
    def dpo_loss(self, prompt, win_response, loss_response):
        """
        Compute DPO loss for one preference pair.
        
        r_θ(x, y) = β * log(p_θ(y|x) / p_ref(y|x))
        """
        # Compute log-probabilities under policy and reference
        policy_logprobs = {}
        ref_logprobs = {}
        
        for response in [win_response, loss_response]:
            tokens = self.tokenizer(f"{prompt}\\n{response}", return_tensors='pt')
            with torch.no_grad():
                outputs = self.ref(**tokens)
                ref_logprobs[response] = outputs.logits[:, :-1]  # Reference log-probs
            
            outputs = self.policy(**tokens)
            policy_logprobs[response] = outputs.logits[:, :-1]  # Policy log-probs
            
        # DPO loss: minimize -log(sigmoid(r_w - r_l))
        r_w = self.beta * (policy_logprobs[win_response] - ref_logprobs[win_response])
        r_l = self.beta * (policy_logprobs[loss_response] - ref_logprobs[loss_response])
        
        loss = -F.logsigmoid(r_w - r_l)
        return loss.mean()
    
    def train_step(self, prompt, win_resp, loss_resp):
        """Single DPO training step."""
        loss = self.dpo_loss(prompt, win_resp, loss_resp)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.policy.parameters(), 1.0)
        return loss.item()

# Key DPO insight: 
# DPO is equivalent to RLHF with PPO (theoretical result from Xu et al., 2024)
# The reward model is implicit: r(x,y) = β * log(p(y|x)/p_ref(y|x))
# This means you don't need a separate reward model at generation time
# This is why DPO is simpler

# The beta parameter is critical:
# - High beta (0.5+): policy is forced closer to reference (less creative)
# - Low beta (0.05-): more freedom, but risk of overfitting
# - Beta = 0.1 is a good starting point
```

### Stage 5: Monitoring (During and After Training)

Training monitoring is the stage most people skip. It's the most important engineering stage.

```python
def monitoring_during_training():
    """
    What to monitor during training.
    """
    
    metrics = [
        ("Training loss", "Should decrease. Flat = learning rate too low or converged"),
        ("Validation loss", "Should decrease. Rising = overfitting"),
        ("Gradient norm", "Should stay bounded. Spikes = unstable gradients"),
        ("Reward model score", "Should improve. If flat = reward model not learning"),
        ("Perplexity on samples", "Should decrease. If rising = degradation"),
        ("Memorization rate", "Should stay < 5%. If rising = overfitting"),
        ("Evaluation accuracy", "Should improve on held-out benchmarks"),
        ("Loss on instructions vs responses", "Should be balanced")
    ]
    
    print("Metrics to track:")
    for metric, interpretation in metrics:
        print(f"  {metric}: {interpretation}")
    
    print("\nWhen to stop training:")
    stop_criteria = [
        "1. Validation loss has plateaued for 3+ consecutive evaluations",
        "2. Memorization exceeds 10%",
        "3. Reward model accuracy > 90% (reward hacking likely)",
        "4. Compute budget exhausted",
        "5. No improvement on downstream benchmarks for 2+ evaluations"
    ]
    for c in stop_criteria:
        print(f"  {c}")

monitoring_during_training()

# Monitoring after deployment:

def deployment_monitoring():
    """
    Monitor deployed models for drift, quality degradation, and safety issues.
    """
    
    print("Post-deployment monitoring:")
    monitoring_items = [
        "1. Latency: p50, p95, p99 response times",
        "2. Quality: prompt-specific evaluation (not just benchmarks)",
        "3. Safety: toxicity, jailbreak attempts, prompt injection detection",
        "4. Cost: tokens per day, cost per prompt",
        "5. Usage: most common prompts, most common failures",
        "6. Drift: input distribution change over time",
        "7. User feedback: thumbs-up/down ratio, complaint tracking"
    ]
    for item in monitoring_items:
        print(f"  {item}")
    
    print("\nAutomated quality checks:")
    automated = [
        "1. Random sampling: periodically score responses with a separate evaluator",
        "2. Adversarial testing: automated jailbreak attempts",
        "3. Prompt injection detection: regex + ML-based filters",
        "4. Factual accuracy: cross-reference claims with knowledge base",
        "5. Latency SLA: drop requests that exceed time limit"
    ]
    for item in automated:
        print(f"  {item}")

deployment_monitoring()

# The cost of monitoring:
# - Automated evaluation: ~$500/month for a small team
# - Human evaluation: ~$5K-$20K/month for a team of 5-10 evaluators
# - Monitoring infrastructure: ~$1K-$5K/month
# - Cost of an undetected model failure: potentially much more

# Never deploy a model without monitoring.
# Models degrade. Drift happens. And users don't care why — they just stop using it.

```

### Cost Breakdown by Stage

```python
cost_breakdown = {
    "Data Collection": "$1K-$10K (tools + labor)",
    "Data Curation": "$10K-$100K (mostly human labor)",
    "Pretraining": "$10K-$100M (compute, mostly GPU hours)",
    "SFT": "$100K-$1M (labels + compute)",
    "Reward Model": "$50K-$500K (labels + compute)",
    "RLHF/DPO": "$100K-$2M (labels + compute)",
    "Monitoring": "$10K-$100K/year (ongoing)",
}

print("Estimated Cost by Stage (for a 7B parameter model):")
for stage, cost in cost_breakdown.items():
    print(f"  {stage:20s}: {cost}")

print("\nTotal: ~$113K-$111.7M (depending on scale and quality)")
print("The huge range is data scale and compute requirements.")
```

### Summary

The LLM training lifecycle is five stages, each with its own requirements:
- **Pretraining**: Learn the world. Most expensive. Data quality determines your ceiling.
- **SFT**: Learn instructions. Supervised learning on (prompt, response) pairs.
- **Reward Modeling**: Learn preference. Train a critic model on human judgments.
- **RLHF/DPO**: Optimize for preference. DPO is simpler and often better than PPO.
- **Monitoring**: Catch degradation before users do. Always monitor, always track.

Build with the full pipeline in mind. Each stage requires different resources, different expertise, and has different failure modes. Skip any stage and your model will either underperform or fail silently.
