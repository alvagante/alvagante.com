---
title: Tokenization & Context Windows
date: 2025-02-05
layout: post
category: play
collection: ai-blog
---
## Tokenization & Context Windows

Your 128K context window is a lie. Understanding tokenizers, subword fragmentation, context window economics, and when longer actually helps.

### What is a Token?

A token is not a word. It's not a character. It's a piece of a word that the tokenizer decided fits into its vocabulary. This distinction is the source of many practical problems in AI engineering.

```python
# Example showing the difference between word-level and character-level tokenization
# Word-level tokenizer on each character

import tokenization as tok

text = "Hello, world!"
words = tok.word_tokenize(text)  # ['Hello', ',', 'world', '!']
tokens = tok.char_tokenize(text)  # ['H', 'e', 'l', 'l', 'o', ',', 'w', 'o', 'r', 'l', 'd', '!']

print(f"Words: {words}")
print(f"Tokens: {tokens}")

# Modern tokenizers (BPE, WordPiece) use a mixture:
# - Common words stay as single tokens (e.g., "the", "hello")
# - Rare words get split (e.g., "unhappiness" → "un" + "happiness")
# - Punctuation is its own token
# - Spaces are tokens (or part of tokens)

# Example with a real tokenizer
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("gpt2")
tokens = tokenizer("Hello, world! How are you today?")
print(f"Token IDs: {tokens}")
print(f"Decoded: {tokenizer.decode(tokens)}")
print(f"Number of tokens: {len(tokens)}")

# Key insight: tokenization is lossy. Information can be lost when words
# are split into multiple tokens. Your model sees tokens, not characters.
```

### BPE (Byte-Pair Encoding)

BPE is the most common tokenizer. It starts with individual characters and merges the most frequent pairs. This creates a vocabulary where common words are single tokens and rare words get split.

```python
import numpy as np

def bpe_tokenize(word, vocab, merges):
    """
    Tokenize a word using BPE.
    
    vocab: set of allowed characters
    merges: list of (char_a, char_b) merges, ordered by frequency
    """
    # Split word into characters
    tokens = list(word)
    
    # Try each merge in order
    for merge in merges:
        for i in range(len(tokens) - 1):
            if tokens[i] == merge[0] and tokens[i+1] == merge[1]:
                # Apply the merge
                tokens[i:i+2] = [merge[0] + merge[1]]
                break
    
    return tokens

# Example BPE:
word = "unhappiness"
vocab = set('a e i n p s u y _')  # letters + underscore
# Merges ordered by frequency (simulated):
merges = [
    ('h', 'a'), ('a', 'p'), ('u', 'n'),  # "un"
    ('s', '_'), ('i', 's'), ('e', 's'),   # "eness"
    ('n', 'a'), ('p', 'p'), ('p', 'i'),   # "pp"
    ('h', 'i'), ('n', 'e'), ('s', 'a'),   # "nappiness"
    ('u', 's'), ('s', '_'),               # "s_"
    ('h', 'e'), ('a', 'n'), ('i', 'y'),   # "y"
]

tokens = bpe_tokenize(word, vocab, merges)
print(f"BPE tokens for '{word}': {tokens}")
print("The result shows how BPE splits the word into subword units")
print("Common parts ('un', 'happiness') stay together")
print("Rare parts get split further

# Why BPE matters:
# - Vocabulary size: typically 32K-50K tokens
# - Common words (the, and, is) → 1 token
# - Rare words (unhappiness, x-rays) → multiple tokens
# - Non-English languages → many single-character tokens
# - Code → many single-character tokens (symbols are frequent in code!)
```

### Why Tokenization Breaks Things

The tokenizer you choose determines how your model "sees" content. Different tokenizers for the same text produce very different token counts:

```python
# Compare tokenizers on the same text
import numpy as np

# Simulate different tokenizers
text = "The model's attention mechanism processes sequences token by token."

# GPT-2 (BPE) tokenizer
gpt2_tokens = 15
# Llama-2 (SentencePiece) tokenizer
llama_tokens = 14
# Claude (custom, optimized for code) tokenizer
claude_tokens = 13
# Mistral (similar to Llama-2 but different vocab) tokenizer
mistral_tokens = 14

print(f"GPT-2: {gpt2_tokens} tokens")
print(f"Llama-2: {llama_tokens} tokens")
print(f"Claude: {claude_tokens} tokens")
print(f"Mistral: {mistral_tokens} tokens")

# Same text, 4 different tokenizers → 4 different token counts
# This matters because:
# 1. Context windows are measured in tokens, not words
# 2. Your model may handle different text lengths differently
# 3. Cross-lingual: BPE vs WordPiece vs SentencePiece behave differently
# 4. Long texts: token count can exceed context window unexpectedly
```

### Context Window Economics

The context window is the number of tokens a model can process at once. This is not just a technical limitation — it's an economic one.

```python
def context_window_economics(n_tokens, cost_per_1m_input=1.5, cost_per_1m_output=2.0):
    """
    Calculate the cost of processing a given number of tokens.
    """
    # Cost scales linearly with token count (roughly)
    input_cost = (n_tokens / 1_000_000) * cost_per_1m_input
    output_cost = (n_tokens / 1_000_000) * cost_per_1m_output  # output usually costs more
    
    total_cost = input_cost + output_cost
    
    print(f"Tokens: {n_tokens:,}")
    print(f"Input cost (per 1M tokens @ ${cost_per_1m_input}): ${input_cost:.4f}")
    print(f"Output cost (per 1M tokens @ ${cost_per_1m_output}): ${output_cost:.4f}")
    print(f"Total cost: ${total_cost:.4f}")
    return total_cost

# Example: processing a 100-page book
n_pages = 100
tokens_per_page = 500
n_tokens = n_pages * tokens_per_page

print("Cost to process a 100-page book (500 tokens/page):")
context_window_economics(n_tokens)

# Example at scale
n_tokens = 1_000_000_000  # 1 billion tokens
print("\nCost to process 1 billion tokens:")
context_window_economics(n_tokens)

# Key insight: longer context windows are expensive
# At 100 pages: ~$0.75
# At 1 billion tokens: ~$3,500 (for a single pass through the data)
# That's why context window scaling is a huge problem
```

### When Longer Context Helps (and When It Doesn't)

Longer context windows aren't always better. There's a sweet spot:

```python
def context_window_analysis():
    """
    Analyze the tradeoffs of different context window sizes.
    """
    
    scenarios = {
        "Short context (4K-8K)": {
            "use_cases": [
                "Single-prompt completions",
                "Chat-based interactions",
                "Code generation (single function)",
                "Translation of short texts"
            ],
            "pros": [
                "Fast (less compute)",
                "Cheaper (fewer tokens)",
                "More focused (less noise)"
            ],
            "cons": [
                "Can't reference large documents",
                "Can't maintain multi-turn context",
                "Can't use as a knowledge base"
            ]
        },
        "Medium context (32K-128K)": {
            "use_cases": [
                "Long document analysis",
                "Multi-turn conversations",
                "Codebase navigation",
                "Multi-document synthesis"
            ],
            "pros": [
                "Can process longer inputs",
                "Can remember more context",
                "Can reference documents"
            ],
            "cons": [
                "Expensive (more compute per token)",
                "Slower (more tokens to process)",
                "Attention dilution (focus may scatter)"
            ]
        },
        "Long context (256K+)": {
            "use_cases": [
                "Full book analysis",
                "Legal document review",
                "Medical record analysis",
                "Long video/audio transcripts"
            ],
            "pros": [
                "Can process very long inputs",
                "Can reference entire documents",
                "Better for retrieval-augmented generation"
            ],
            "cons": [
                "Very expensive (10-100x more than short context)",
                "Very slow (token count scales linearly)",
                "Attention dilution is real (longest-range attention is noisy)",
                "Quality drops without RAG (direct attention is often worse than retrieval)"
            ]
        }
    }
    
    for window, info in scenarios.items():
        print(f"\n{window}:")
        print(f"  Use cases:")
        for case in info['use_cases']:
            print(f"    - {case}")
        print(f"  Pros:")
        for pro in info['pros']:
            print(f"    - {pro}")
        print(f"  Cons:")
        for con in info['cons']:
            print(f"    - {con}")

context_window_analysis()

# Key finding: longer context windows are NOT always better
# For many tasks, chunking + retrieval (RAG) beats raw attention
# The "needle in a haystack" problem is real: as context grows,
# model's ability to find specific information DECREASES
```

### RoPE (Rotary Positional Embeddings)

RoPE allows models to handle longer context windows efficiently. It encodes position through rotation rather than addition:

```python
import numpy as np

def rope_apply(q, k, positions):
    """
    Apply Rotary Positional Embeddings (RoPE) to query and key vectors.
    
    RoPE rotates each dimension by an angle that depends on the position.
    This allows the model to attend to relative positions efficiently.
    
    Compared to absolute positional encoding:
    - RoPE is more compact: only need to rotate by (position, d_model)
    - RoPE allows longer context: no max_position limit
    - RoPE is more efficient: rotation matrices are sparse (can be computed on-the-fly)
    """
    # For each position, apply rotation to q and k
    for i in range(positions):
        q[i] = rope_rotate(q[i], positions[i], d_model=q.shape[1])
        k[i] = rope_rotate(k[i], positions[i], d_model=k.shape[1])
    
    return q, k

def rope_rotate(x, position, d_model):
    """Apply RoPE rotation to a single vector."""
    rot = np.zeros_like(x)
    for i in range(0, d_model - 1, 2):
        # Each pair of dimensions is rotated by an angle proportional to position
        angle = position * (1.0 / 10000 ** (i / d_model))
        rot[i] = x[i] * cos(angle) - x[i+1] * sin(angle)
        rot[i+1] = x[i] * sin(angle) + x[i+1] * cos(angle)
    return rot

# RoPE is used in:
# - Llama, Llama2, Llama3
# - PaLM, PaLM2
# - Qwen, Qwen1.5
# - Falcon
# - Many other models
```

### Practical Tips for Tokenization

1. **Always count tokens, not words**: When measuring input length, use the model's actual tokenizer. Different models have different tokenizers.

2. **Padding matters**: When batching sequences, pad to a common length. But don't pad to 128K with 10-token inputs. That's wasted compute.

3. **Know your tokenizer's vocabulary**: GPT-2 has 50K tokens. Llama-2 has 32K. You can't mix tokenizers with the same model.

4. **Long texts need chunking**: Don't feed 100-page documents all at once. Use RAG or chunking to process information in manageable pieces.

5. **Code is hard for BPE**: Many programming symbols get split into multiple tokens. Code often produces 2-3x more tokens than natural language.

6. **Multilingual text is expensive**: Non-English languages often produce more tokens per word. Chinese, Japanese, and Korean can be 2-3x more than English.

7. **Token limits are real**: Context windows are hard limits, not soft suggestions. If you exceed them, your model will truncate or fail.

### Summary

Tokenization is the bridge between text and model. A good understanding of tokenization:
- Prevents unexpected costs (token count surprises)
- Avoids truncation issues (exceeding context windows)
- Improves efficiency (chunking → RAG is better than raw attention)
- Optimizes costs (fewer tokens → lower cost)

Build with tokenization in mind. It's the first layer of your AI system — if it's wrong, everything downstream suffers.
