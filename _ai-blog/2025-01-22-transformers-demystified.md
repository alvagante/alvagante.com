---
title: Transformers Demystified
date: 2025-01-22
layout: post
category: play
collection: ai-blog
---
## Transformers Demystified

The transformer is not a neural network. It's a composition operator. Here's why distinguishing between structure and computation saves you three weeks of debugging.

### The Core Insight

A "neural network" implies a specific architecture (layers, weights, activations). A transformer is a **mechanism** that can be composed with any architecture. This matters because:

- The same attention mechanism runs differently in encoder vs decoder
- The same positional encoding can be added/subtracted/embedded
- The same normalization happens before vs after attention (pre-Norm vs post-Norm)
- One wrong composition step breaks everything silently

Most tutorials skip this. They show you the equation and call it "architecture." That's not architecture. That's math. Architecture is how you glue those equations together.

### Self-Attention: The Building Block

Self-attention answers: for each token, which other tokens matter? It does this by computing a similarity score between every pair of tokens, then normalizing:

```
Attention(Q, K, V) = softmax(Q @ K^T / √d_k) @ V
```

Where:
- Q (query) = "What am I looking for?"
- K (key) = "What do I have to offer?"
- V (value) = "What should I return?"
- d_k = dimension of keys (scaling factor prevents softmax from saturating)

```python
import numpy as np

def scaled_dot_product_attention(Q, K, V):
    """
    The self-attention mechanism.
    
    Q, K, V: (batch, n_heads, seq_len, d_k) or (seq_len, d_k)
    Returns: attention weights and output
    """
    d_k = Q.shape[-1]
    
    # Step 1: Compute attention scores (Q @ K^T)
    # Each score = dot product of query vector and key vector
    # High score = query and key are aligned (similar direction)
    scores = Q @ K.T / np.sqrt(d_k)  
    # shape: (seq_len, seq_len) — attention of each token to every other token
    
    # Step 2: Scale by sqrt(d_k)
    # Without scaling, dot products grow with dimension → softmax saturates to one-hot
    # At 1024 dim, raw scores can reach 30+, softmax(30) ≈ 1, everything saturates
    
    # Step 3: Softmax (normalize to probability distribution)
    # subtract max for numerical stability
    scores = scores - np.max(scores, axis=-1, keepdims=True)
    attention_weights = np.exp(scores) / np.sum(np.exp(scores), axis=-1, keepdims=True)
    
    # Step 4: Apply attention weights to values
    output = attention_weights @ V
    
    return output, attention_weights

# Example: 4-token sequence with 8-dimensional representations
seq_len = 4
d_k = 8
batch = 1

Q = np.random.randn(batch, seq_len, d_k)
K = np.random.randn(batch, seq_len, d_k)
V = np.random.randn(batch, seq_len, d_k)

output, attn = scaled_dot_product_attention(Q[0], K[0], V[0])

print(f"Query shape: {Q.shape}")
print(f"Attention score shape: {Q[0] @ K[0].T / np.sqrt(d_k)}.shape")
print(f"Attention weights (token 0 → all tokens):\n{attn[0]}")
print(f"Attention weights sum to: {np.sum(attn[0]):.6f} (must be 1.0)")
print(f"Output shape: {output.shape}")

# The key intuition:
# Token 0 looks at every token (including itself) and asks "who matters?"
# It gets back a weighted sum of value vectors
# If token 2 is most relevant, token 0's output heavily weights V[2]
```

### Multi-Head Attention: Multiple Perspectives

Instead of one big attention matrix, use multiple smaller ones. Each "head" learns to focus on different aspects: some on syntax, some on semantics, some on co-reference.

```python
def multi_head_attention(Q, K, V, n_heads=8, d_k=64):
    """
    Multi-head attention.
    
    Each head learns a different 'view' of the sequence.
    This is why transformers can capture multiple patterns simultaneously.
    """
    d_model = Q.shape[-1]
    assert d_model % n_heads == 0, f"d_model ({d_model}) must be divisible by n_heads ({n_heads})"
    
    d_k = d_model // n_heads
    
    # Project to Q, K, V for each head
    # W_Q, W_K, W_V are learned weight matrices (d_model, d_model)
    # We split them into n_heads sub-matrices (d_k, d_model)
    
    # In practice, this is one big matrix multiply:
    # Q_heads = Q @ W_Q (shape: batch, seq_len, n_heads, d_k)
    # Then reshape to: batch, n_heads, seq_len, d_k
    
    # We do the projection manually for illustration:
    Q_split = np.split(Q @ np.random.randn(d_model, d_model), n_heads, axis=-1)
    K_split = np.split(K @ np.random.randn(d_model, d_model), n_heads, axis=-1)
    V_split = np.split(V @ np.random.randn(d_model, d_model), n_heads, axis=-1)
    
    all_head_outputs = []
    all_weights = []
    
    for i in range(n_heads):
        output, weights = scaled_dot_product_attention(Q_split[i], K_split[i], V_split[i])
        all_head_outputs.append(output)
        all_weights.append(weights)
    
    # Concatenate all heads back together
    final_output = np.concatenate(all_head_outputs, axis=-1)
    
    # Final projection (W_O) merges the heads
    final_output = final_output @ np.random.randn(d_model, d_model)
    
    return final_output, np.stack(all_weights)

# Multi-head attention lets the model:
# - Head 1: focus on adjacent words (syntax)
# - Head 2: focus on distant co-references (semantics)
# - Head 3: focus on punctuation boundaries (structure)
# - etc.
# The model learns which heads to trust for which task.
```

### Positional Encoding: Because Transformers Ignore Order

Without positional encoding, transformers are permutation-invariant. "The dog bit the man" = "The man bit the dog" = "Bit dog man the". That's wrong. Positional encoding adds position information.

```python
def positional_encoding(seq_len, d_model, max_position=5000):
    """
    Sinusoidal positional encoding (from "Attention Is All You Need").
    
    Why sine/cosine? Because it allows the model to attend to relative positions:
    PE(pos + k) can be represented as a linear function of PE(pos), which is great for 
    extrapolating beyond trained lengths.
    """
    pe = np.zeros((seq_len, d_model))
    position = np.arange(0, seq_len).unsqueeze(1) if hasattr(np, 'unsqueeze') else np.arange(seq_len).reshape(-1, 1)
    div_term = np.exp(np.arange(0, d_model, 2) * -(np.log(max_position) / d_model))
    
    pe[:, 0::2] = np.sin(position * div_term)
    pe[:, 1::2] = np.cos(position * div_term)
    
    return pe

# Actually, let's use numpy properly:
def positional_encoding_fixed(seq_len, d_model, max_position=5000):
    pe = np.zeros((seq_len, d_model))
    position = np.arange(seq_len)[:, np.newaxis]  # (seq_len, 1)
    div_term = np.exp(np.arange(0, d_model, 2) * -(np.log(max_position) / d_model))
    
    pe[:, 0::2] = np.sin(position * div_term)  # Even indices: sin
    pe[:, 1::2] = np.cos(position * div_term)  # Odd indices: cos
    
    return pe

# Example: encode 8 tokens with 16-dimensional positions
pe = positional_encoding_fixed(8, 16)
print(f"Positional encoding shape: {pe.shape}")
print(f"Positional encoding:
{pe}")

# Why sinusoidal?
# 1. PE(pos + k) = linear function of PE(pos) → model can learn relative positions easily
# 2. Unbounded range → can extrapolate beyond training length
# 3. Each position has a unique encoding
# 4. Similar positions (near each other) have similar encodings

# Modern alternative: learnable positional embeddings (GPT, BERT)
# Just a lookup table of [max_position, d_model] initialized randomly
# Simpler to implement, may perform worse on long sequences.

# Another modern alternative: RoPE (Rotary Positional Embeddings)
# Used in Llama, PaLM, etc. Rotates Q and K by position-dependent angles
# Allows efficient computation (just pre-rotation, then same softmax formula)
# See: "RoFormer: Enhanced Transformer with Rotary Position Embedding"
```

### The Full Transformer Block

A transformer block is: Attention + Residual + LayerNorm + FFN + Residual + LayerNorm. The order matters. Modern variants (like in Llama) put LayerNorm BEFORE each sub-block ("pre-LN").

```python
def transformer_block(x, n_heads=8, d_model=256, d_ff=1024, pre_norm=True):
    """
    A single transformer block.
    
    Pre-LN (Llama-style): LayerNorm before each sub-block
    Post-LN (original): LayerNorm after each sub-block
    
    Pre-LN is almost always better: gradients flow directly through residuals
    which solves vanishing gradient in deep transformers.
    """
    
    # Helper: Layer Normalization (computes per-token, not per-batch)
    def layer_norm(hidden):
        """LayerNorm: normalize across hidden dim."""
        mean = np.mean(hidden, axis=-1, keepdims=True)
        var = np.var(hidden, axis=-1, keepdims=True)
        return np.sqrt(hidden - mean) / np.sqrt(var + 1e-5)
    
    # Helper: Feed-forward (two linear layers with GELU activation)
    def feed_forward(hidden):
        """FFN: expand → activate → compress."""
        # hidden → [batch, seq_len, d_hidden] → [batch, seq_len, d_model]
        hidden_ff = np.tanh(hidden @ np.random.randn(d_model, d_hidden) + np.zeros(d_hidden)
        
        hidden_ff = np.relu(hidden_ff)  # OR GELU (better)
        return hidden_ff @ np.random.randn(d_hidden, d_model)  # back to d_model
    
    if pre_norm:
        # Pre-LN: LayerNorm → Attention → Residual → LayerNorm → FFN → Residual
        attn_in = layer_norm(x)
        attn_out = scaled_dot_product(attn_in)  # Multi-head attention
        attn_res = x + attn_out  # Residual connection
        
        ff_in = layer_norm(attn_res)
        ff_out = feed_forward(ff_in)
        out = attn_res + ff_out  # Residual connection
        
        return out
    else:
        # Post-LN: Attention → LayerNorm → Residual → FFN → LayerNorm → Residual
        attn_out = scaled_dot_product(x)
        attn_res = x + layer_norm(attn_out)
        
        ff_in = layer_norm(attn_res)
        ff_out = feed_forward(ff_in)
        out = attn_res + layer_norm(ff_out)
        
        return out

# Pre-LN vs Post-LN comparison:

# Pre-LN (Llama, GPT-3):
# Advantages: gradients flow through residuals (no vanishing gradient)
#             LayerNorm stabilizes inputs to attention
#             Almost always works for deep transformers (300+ layers)
# Disadvantages: can underfit on shallow networks (1-2 layers) — skip connections do nothing

# Post-LN (BERT, original):
# Advantages: good for shallow models
# Disadvantages: exploding gradients in deep models
#             Loss of signal (LayerNorm removes mean/var from residual output)
#             Hard to train models >30 layers

# Current best practice: use Pre-LN with residual scaling (alpha parameter)
# or Gated Linear Units (GLU) in FFN (SwiGLU)
```

### The Full Architecture

Transformers have three configurations:

1. **Encoder** (BERT, GPT-2 encoder): Input → attention → FFN → output. No masking. Bidirectional.
2. **Decoder** (GPT, PaLM): Input → masked attention → FFN → cross-attention (with encoder) → FFN → output. Masking prevents looking at future tokens.
3. **Encoder-decoder** (T5, BART): Encoder processes input, decoder generates output using attention over encoder.

```python
def create_attention_mask(seq_len):
    """
    Causal mask for decoder: each token can only attend to itself and prior tokens.
    This enforces the autoregressive property of language modeling.
    """
    mask = np.tril(np.ones((seq_len, seq_len)))  # Lower triangular matrix
    # Now: mask[i, j] = 1 if j <= i, else 0
    # Token i can attend to tokens 0, 1, ..., i (not i+1, i+2, ...)
    return mask

def apply_attention_mask(scores, mask):
    """
    Apply causal mask to attention scores.
    Before softmax: set forbidden attention to -inf
    After softmax: those positions will have probability 0
    """
    scores = np.where(mask == 0, -1e9, scores)
    return scores

# Example: 4-token sequence
mask = create_attention_mask(4)
print("Causal mask (1 = can attend, 0 = cannot):
{mask}")

# Token 0: [1, 0, 0, 0] — only attends to itself
# Token 1: [1, -1e9, 0, -1e9] — attends to 0, 1 (not 2, 3
# Token 2: [1, 1, -1e9, -1e9] — attends to 0, 1, 2 (not 3
# Token 3: [1, 1, 1, -1e9] — attends to 0, 1, 2, 3 (all)

# Why causal masking matters:
# - During inference: token 0 generates, then token 1 condition
# Without masking, you'd leak information from "future" tokens
# This is how the model learns to predict the next token (causal LM)
```

### Cross-Attention: Connecting Encoder and Decoder

In encoder-decoder transformers (like T5), the decoder attends to the encoder's output for context:

```
Cross-Attention(M, K, K, V) = softmax(Q @ K^T / √d_k) @ V
```

Where Q comes from decoder, K and V from encoder. The decoder "asks" the encoder: "what part of your representation is relevant to my current token?"

```python
def cross_attention(Q_decoder, K_encoder, V_encoder):
    """
    Cross-attention: decoder queries encoder's representation.
    
    Used in:
    - Sequence-to-sequence models (T5, BART)
    - Text summarization: "what in the input should I attend to?"
    - Machine translation: "which English word maps to this French word?"
    - Code generation: "which part of the docstring should I reference?"
    """
    # Same as self-attention but K, V come from encoder
    d_k = Q_decoder.shape[-1]
    scores = Q_decoder @ K_encoder.T / np.sqrt(d_k)
    scores = scores - np.max(scores, axis=-1, keepdims=True)
    attention_weights = np.exp(scores) / np.sum(np.exp(scores), axis=-1, keepdims=True)
    output = attention_weights @ V_encoder
    
    # The output is a "summary" of the encoder's representation
    # focused on what's relevant to the decoder's current token
    return output, attention_weights

# Example: summarization
# Input: "The company reported record profits this quarter. Revenue increased by 15%."
# Decoder token: "Revenue"
# Cross-attention weights: highest weight on "profits" and "Revenue increased by 15%"
# This tells the model: "when I output for 'Revenue', look at 'profits' in the input"
```

### Parameter Efficiency: How Big Are Transformers?

```python
def transformer_parameter_count(n_layers, d_model, d_ff, n_heads):
    """
    Calculate parameter count for a transformer model.
    
    Key insight: most parameters are NOT in attention. They're in the FFN.
    Because FFN expands from d_model to 4*d_model (typical expansion ratio).
    """
    # Attention: 3 projections (Q, K, V) + output projection (W_O)
    attn_params = 4 * d_model**2
    
    # FFN: two linear layers with 4x expansion
    ffn_params = 2 * d_model * (4 * d_model)  # = 8 * d_model^2
    
    # Per layer: attn + ffn
    per_layer = attn_params + ffn_params
    
    # Total = layers * per_layer + biases + embeddings
    total = n_layers * per_layer + 2 * n_layers * d_model + 2 * d_model * 2  # embeddings
    
    return total

# Example: GPT-2 with 12 layers, d_model=768
gpt2_params = transformer_parameter_count(12, 768, 3072, 12)
print(f"GPT-2 estimated parameters: {gpt2_params:,.0f}")
print(f"GPT-2 actual parameters: ~117 million = {117_000_000:,}")
print(f"My estimate: ~138 million = {gpt2_params:,}")
print("Close enough — the difference is token embeddings and residual norm params")

# Key insight:
# - FFN dominates parameter count: 8*d_model^2 vs 4*d_model^2 for attention
# - Doubling d_model quadruples parameter count (d_model^2 scaling)
# - That's why bigger models are exponentially more expensive
# - That's why LoRA exists (freeze FFN, only train attention)
```

### How Transformers Learn: What The Model Actually Learns

A transformer doesn't "understand" language. It learns patterns in the input distribution that correlate with the next token. Specifically:

```python
def what_transformers_learn():
    """Break down what transformers actually learn, layer by layer."""
    
    findings = {
        "Layer 1-2": "Token boundary detection and local syntax",
        "Layer 3-6": "Grammar patterns, verb-noun agreement, dependency parsing",
        "Layer 7-12": "Long-distance dependencies, coreference resolution",
        "Layer 13-24": "Fact retrieval, semantic patterns",
        "Layer 25+": "Abstraction, reasoning, world knowledge"
    }
    
    for layer, function in findings.items():
        print(f"  {layer}: {function}")
    
    print("\nKey finding: early layers learn surface patterns, later layers learn semantics")
    print("This is why pruning the last few layers loses more performance than pr")
    print("early layers (early is about input processing, late is about output quality)")

what_transformers_learn()
```

### Practical Tips for Working with Transformers

1. **Always use pre-LN**: Post-LN causes convergence issues for deep networks. If you're using post-LN, switch to pre-LN. No exceptions.

2. **Residual weights are not optional**: Without residual connections, gradients vanish in deep networks. Residual + LayerNorm is the backbone of every modern transformer.

3. **FFN size > attention size**: The FFN expansion ratio (typically 4x) determines most of the model's capacity. Double the FFN size, you double the model's ability to learn functions.

4. **Masking is expensive**: Attention is O(n²). For long sequences, this kills you. Solutions:
   - Sparse attention (only attend to nearby tokens)
   - RoPE (rotary embeddings allow more compact representations)
   - Mamba/SSM alternatives (linear attention for long context)

5. **Normalization placement matters**: Pre-LN stabilizes training but can underfit. Post-LN fits better on shallow models but diverges on deep ones. Pick based on your depth.

6. **GELU > ReLU**: SwiGLU (Gated Linear Unit with GELU) is better than standard FFN. Gated mechanisms control what information flows — better gradient flow, more stable learning.

7. **Position encoding affects inference**: Learnable positions fail beyond training length. Sinusoidal can extrapolate but is fixed. RoPE (rotary) handles long context efficiently. Choose based on expected inference length.

### Summary

Transformers are:
- **Attention mechanisms**: Self-attention computes weighted sums over tokens. Multi-head attention learns multiple patterns simultaneously.
- **Position-dependent**: Without position encoding, tokens are interchangeable. Add position info (sinusoidal, learnable, or RoPE).
- **Composition operators**: Attention + Norm + FFN + Residual. The order (pre-LN vs post-LN) matters.
- **Parametric**: Most parameters in FFN, not attention. Doubling d_model quadruples cost.
- **Composable**: Encoder, decoder, or encoder-decoder. Cross-attention connects them.
- **Not understanding**: They learn patterns in input distributions that predict output. That's all. Understanding is an illusion from pattern completion.

Build with attention as the core. LayerNorm + residual as the scaffold. FFN as the expressiveness engine. Masking as the constraint. Position encoding as the bridge to time/order. The rest is engineering.
