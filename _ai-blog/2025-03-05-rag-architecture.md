---
title: RAG Architecture & Chunking Strategies
date: 2025-03-05
layout: post
category: play
collection: ai-blog
---
## RAG Architecture & Chunking Strategies

RAG is just Google with a neural network. Here's what actually makes it work (hint: chunking strategy matters more than your embedding model).

### What RAG Actually Is

RAG (Retrieval-Augmented Generation) adds a retrieval step between the user question and the answer. It's not "retrieval" in the traditional sense (exact match). It's "find semantically similar text, then feed it to the model as context."

```python
# The RAG pipeline:
# 1. User asks a question
# 2. Embed the question → dense vector
# 3. Retrieve similar documents (via vector DB)
# 4. Feed documents + question to the LLM
# 5. LLM generates an answer

# The diagram:
# User → [Embed] → [Search Vector DB] → [Similar Docs] → [LLM] → Answer
#                                                    ↑
#                                              [Documents]
```

RAG works when:
- The answer isn't in the model's training data
- The model lacks the answer even though it knows the domain
- You need factual grounding (not opinion generation)

RAG fails when:
- The retrieval step fetches irrelevant documents
- The documents are wrong (garbage in, garbage out)
- The model can't use the retrieved context (too noisy)

### The Chunking Problem

The single most important design decision in RAG is chunking. You can't retrieve a document if the document is too large. You can't use it if the answer isn't in the chunk. You need to break your corpus into chunks that:
- Contain the answer to the most likely questions
- Are small enough to fit in the model's context window
- Are large enough to contain the full context of the answer

```python
import re

def simple_chunking(text, chunk_size=500):
    """Simple fixed-size chunking (the baseline everyone starts with)."""
    chunks = []
    text = text.replace('\n', ' ')
    for i in range(0, len(text), chunk_size - overlap):
        chunks.append(text[i:i + chunk_size])
    return chunks

def semantic_chunking(text, chunk_size=500):
    """Semantic chunking: split at paragraph/document boundaries."""
    # Split on double newlines (paragraphs)
    paragraphs = text.split('\n\n')
    
    chunks = []
    current_chunk = ""
    for paragraph in paragraphs:
        if len(current_chunk) + len(paragraph) < chunk_size:
            current_chunk += " " + paragraph
        else:
            chunks.append(current_chunk.strip())
            current_chunk = paragraph
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    return chunks

def sentence_chunking(text, max_sentences=3):
    """Split into chunks of N sentences, respecting sentence boundaries."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    for i in range(0, len(sentences), max_sentences):
        chunk = ' '.join(sentences[i:i+max_sentences])
        if len(chunk) > 0:
            chunks.append(chunk)
    return chunks

# The problem with fixed-size chunking:
# - Sentences get cut in the middle
# - Important content might span two chunks
# - Answer and context might end up in different chunks

# The problem with semantic chunking:
# - Might be too small or too large
# - Doesn't adapt to document structure

# The right choice depends on your documents:
# - Technical docs: semantic chunking (paragraph-level)
# - Books: chapter-level
# - Legal: section/subsection level
# - Code: function/class level
```

### Chunking Strategy Comparison

```python
"""
Chunking strategies ranked by effectiveness (generally):

1. Overlapping semantic chunking: Best for most use cases
   - Split at paragraph/document boundaries
   - Add overlap (e.g., 50 tokens between chunks) to preserve context
   - Example: "The company reported $5.2B revenue in Q4 2023.
               Revenue grew 15% from Q3, driven by strong growth in
               enterprise segment." → one chunk, because it's from same paragraph

2. Query-aware chunking: Best for FAQ/knowledge base
   - Chunk based on likely questions
   - "Why is my internet slow?" → chunk about internet troubleshooting
   - Requires understanding your users' questions

3. Code-aware chunking: Best for codebases
   - Split on function/class boundaries
   - Include imports and docstrings
   - "The function compute_avg takes x and returns x.mean()."

4. Sentence-level chunking: Best for dense information (facts, numbers)
   - Each chunk is 1-3 sentences
   - High recall but low precision (too many irrelevant chunks)

5. Fixed-size: Worst strategy, but simplest
   - Everyone starts here because it's easy
   - Terrible quality but good enough for prototyping

Rule of thumb: chunk size should match the answer size.
If the answer is 1-2 sentences, use sentence-level chunks.
If the answer spans multiple paragraphs, use paragraph-level chunks.
"""
```

### Overlap: A Small Optimization That Matters

Overlap between chunks ensures that no important context is cut at the boundary. It's like adding padding around your tiles so they don't create gaps.

```python
def overlapping_chunking(text, chunk_size=1000, overlap=200):
    """
    Chunk with overlap. This preserves context across chunk boundaries.
    
    Overlap should be large enough to contain:
    1. The entire context of any answer (usually 1-3 sentences)
    2. Enough semantic context for retrieval to work
    
    Typical overlap: 10-20% of chunk size
    """
    tokens = text.split()
    chunks = []
    
    for i in range(0, len(tokens), chunk_size - overlap):
        chunk = ' '.join(tokens[i:i + chunk_size])
        if len(chunk) > 0:
            chunks.append(chunk)
    
    # Overlap ratio
    overlap_ratio = overlap / chunk_size * 100
    print(f"Chunk size: {chunk_size} tokens")
    print(f"Overlap: {overlap} tokens ({overlap_ratio:.1f}%)")
    print(f"Number of chunks: {len(chunks)}")
    
    return chunks

# Overlap vs performance:
# No overlap: cheap but misses cross-boundary context
# 10% overlap: reasonable for most cases
# 20% overlap: better for dense documents (legal, medical)
# >30% overlap: diminishing returns, more storage, slower retrieval
```

### Embedding Models & Vector Databases

The retrieval step depends on your embedding model picking the right chunks. Choose wisely.

```python
# Most common embedding models:
embedding_models = {
    "text-embedding-3-small (OpenAI)": {
        "dimensions": [512, 1024, 1536, 3072],
        "cost": "$0.02/1M tokens",
        "performance": "Good (default for most)"
        "truncation": "Can truncate at lower dimensions",
    },
    "text-embedding-3-large (OpenAI)": {
        "dimensions": [256, 1024, 3072],
        "cost": "$0.13/1M tokens",
        "performance": "Best (but expensive)",
    },
    "e5-large-v2": {
        "dimensions": [1024],
        "cost": "Free (self-host)",
        "performance": "Good for open-source scenarios"
    },
    "bge-large-en-v1.5": {
        "dimensions": [1024],
        "cost": "Free (self-host)",
        "performance": "Good for English text"
    },
    "nomic-embed-text": {
        "dimensions": [768],
        "cost": "Free (self-host)",
        "performance": "Good budget option"
    },
}

# When to choose which:
# - Small datasets: text-embedding-3-small (fast, cheap, adequate)
# - Large datasets: bge-large-en-v1.5 (free, comparable to OpenAI)
# - Multilingual: e5-large-v2 (better cross-lingual)
# - Budget: nomic-embed-text (best value for self-hosted)
# - Enterprise: text-embedding-3-large (if cost isn't a concern)
```

### Hybrid Search: Dense + Sparse

Pure dense embedding retrieval misses things. Combine dense (semantic) with sparse (keyword) for better recall.

```python
def hybrid_search(query, dense_docs, sparse_docs):
    """
    Hybrid search: combine dense embeddings with sparse keyword matching.
    
    Dense retrieval: finds semantically similar documents
    Sparse retrieval: finds documents with the same keywords
    
    Combined: best of both worlds
    """
    # Dense retrieval (semantic similarity)
    dense_scores = compute_dense_similarity(query_embedding, dense_docs)
    
    # Sparse retrieval (BM25 keyword matching)
    sparse_scores = compute_sparse_similarity(query_terms, sparse_docs)
    
    # Normalize scores to [0, 1]
    dense_norm = (dense_scores - dense_scores.min()) / (dense_scores.max() - dense_scores.min() + 1e-10)
    sparse_norm = (sparse_scores - sparse_scores.min()) / (sparse_scores.max() - sparse_scores.min() + 1e-10)
    
    # Combine with weights (typical: 0.7 dense / 0.3 sparse)
    combined = 0.7 * dense_norm + 0.3 * sparse_norm
    
    # Return top-k results
    top_indices = combined.argsort()[-k:][::-1]
    return [docs[i] for i in top_indices]

# Why hybrid search:
# - Dense: finds "synonyms" (e.g., "car" and "automobile")
# - Sparse: finds exact terms (e.g., specific product names, IDs, errors)
# - Combined: captures both (semantic search + exact match)
# - This is why Chroma/Pinecone/Weaviate all offer hybrid search
# - The weight ratio (0.7/0.3) is a good default, but tune for your data
```

### Vector Database Options

```python
"""
Vector databases, ranked by simplicity of setup:

1. Chroma (local, file-based)
   - Simplest setup (pip install chroma)
   - Good for prototyping, small deployments
   - Limitation: doesn't scale beyond ~10M vectors well

2. FAISS (Facebook AI Similarity Search)
   - Extremely fast, memory-efficient
   - Great for large-scale retrieval
   - No persistence (you manage it)

3. Pinecone (cloud, managed)
   - Easiest deployment (SaaS)
   - Good for production with large datasets
   - Cost: starts at ~$100/month

4. Weaviate (self-hosted or cloud)
   - Hybrid search built-in
   - Good for complex queries (filtering + vector search)
   - Docker-based deployment

5. Qdrant (self-hosted or cloud)
   - Rust-based, very fast
   - Good for production at scale
   - Hybrid search, filtering, payload support

Choose based on:
- Dataset size (< 1M: Chroma, > 1M: Pinecone/Qdrant)
- Budget (self-host vs managed)
- Features needed (hybrid search? filtering?)
"""
```

### RAG Architecture Patterns

```python
"""
RAG architectures, from simplest to most advanced:

1. Naive RAG (retrieve-then-generate)
   - The baseline pattern
   - Works surprisingly well for many use cases
   - Cost: low, implementation: trivial

2. Multi-query RAG
   - Generate multiple queries from the original question
   - Retrieve for each query, merge results
   - Better recall (covers more ground)
   - Cost: 3-5x more API calls

3. HyDE (Hypothetical Document Embeddings)
   - Generate a hypothetical answer (that's actually wrong)
   - Embed the hallucination and search for it
   - Works because the hallucination is closer to the relevant docs
   - Cost: 1 extra generation call

4. Query Reformulation (Step-Back RAG)
   - First: ask a "step-back" question (more abstract)
   - Then: retrieve relevant context for the abstract question
   - Finally: retrieve for the original question
   - Example: "How do I fix a memory leak?" → "What are common software bugs?"

5. Parent-Document Retriever
   - Chunk fine-grained (for retrieval)
   - Retrieve the parent (larger document) of the matching chunk
   - Give the parent to the model (more context)
   - Best for: knowledge bases, documentation

6. RAG-Fusion (re-ranked reranking)
   - Generate multiple queries
   - Retrieve for each
   - Re-rank results using Llama Index or similar
   - Better precision at the cost of latency
"""
```

### Practical Tips for Building RAG

1. **Embedding model > chunking > RAG architecture**: The embedding model is usually the bottleneck. Get that right first.
2. **Chunk size should match answer size**: If answers are short (1 sentence), use short chunks. If answers span paragraphs, use longer chunks.
3. **Always include overlap**: No overlap = context is lost at chunk boundaries. 10-20% overlap is the sweet spot.
4. **Hybrid search > dense-only**: Keywords catch things embeddings miss (product names, IDs, error codes, etc.).
5. **Test your retrieval before testing your generations**: Fix the retrieval quality first. If retrieval is good, generations improve automatically.

### Summary

RAG is about retrieving the right context for the model:
- Chunking: semantic > sentence > fixed-size
- Embeddings: choose based on budget and performance needs
- Hybrid search: combine dense + sparse for best recall
- Architecture: start simple (naive RAG), add complexity only when needed

Build with retrieval quality as the first priority. Everything else (generations, fine-tuning, architecture) is noise without good retrieval.
