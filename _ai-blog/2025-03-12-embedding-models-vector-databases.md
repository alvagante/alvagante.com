---
title: Embedding Models & Vector Databases
date: 2025-03-12
layout: post
category: play
collection: ai-blog
---
## Embedding Models & Vector Databases

Your embeddings are not vectors. They're probability distributions in disguise. And they're the most underrated component in AI architecture.

### What Embeddings Actually Are

An embedding is a dense vector that represents semantic information. "King" and "queen" have similar embeddings "man" and "woman. "Because the model learned their meanings from training data.

```python
# Example: embedding comparison
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

# Get embeddings for different texts
texts = [
    "The cat sat on the mat.",
    "The feline rested on the rug.",  # Similar meaning, different words
    "I need to buy a new car.",      # Different topic
    "The weather is nice today.",     # Different topic, different structure
]

embeddings = model.encode(texts)

# Compute cosine similarities
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

print("Text similarity scores:")
for i in range(len(texts)):
    for j in range(i+1, len(texts)):
        sim = cosine_similarity(embeddings[i], embeddings[j])
        print(f"  '{texts[i][:30]}...' vs '{texts[j][:30]}...': {sim:.3f}")

# What you should see:
# - "cat/mat" vs "feline/rug": high similarity (0.7+) because similar meaning
# - "cat/mat" vs "car": low similarity (~0.0) because different topic
# - "cat/mat" vs "weather": low similarity (~0.0) because different topic

# The embedding captures "meaning," not "keywords" or "structure"
# That's why "cat" and "feline" are close, even though they share NO words
```

### Embedding Model Selection

```python
"""
Embedding model comparison (2025):

1. text-embedding-3-small (OpenAI)
   - Dimensions: 512, 1024, 3072, 1536
   - Cost: $0.02/1M tokens
   - Benchmark: MTEF top performer
   - Use when: you want simplicity and good performance

2. text-embedding-3-large (OpenAI)
   - Dimensions: 256, 1024, 3072
   - Cost: $0.13/1M tokens
   - Benchmark: MTEF top performer on long documents
   - Use when: you have long documents and need max accuracy
   - Warning: expensive for large datasets

3. bge-large-en-v1.5 (BAAI)
   - Dimensions: 1024
   - Cost: Free (self-host)
   - Benchmark: Competitive with OpenAI at lower cost
   - Use when: you want open-source with good performance

4. e5-large-v2 (Hugging Face)
   - Dimensions: 1024
   - Cost: Free (self-host)
   - Benchmark: Strong cross-lingual performance
   - Use when: you need multilingual support

5. nomic-embed-text
   - Dimensions: 768
   - Cost: Free (self-host)
   - Benchmark: Budget option with reasonable performance
   - Use when: you need cheap, self-hosted embeddings

6. GTE-large (Alibaba)
   - Dimensions: 1024
   - Cost: Free (self-host)
   - Benchmark: Strong on code and technical text
   - Use when: you're working with code or technical docs

Selection criteria:
- Accuracy: text-embedding-3-large > bge-large-en > e5-large-v2
- Cost: self-hosted is free but needs infrastructure
- Language: e5-large-v2 for multilingual, bge for English
- Scale: text-embedding-3-small for most cases
"""
```

### Vector Databases: The Choice Isn't About Accuracy

All major vector databases use the same underlying algorithm (usually FAISS or hnswlib). The choice is about:

```python
"""
Vector DB choices ranked by deployment complexity:

1. Chroma
   - Setup: pip install chroma
   - Scale: < 10M vectors (good for prototyping)
   - Cost: Free
   - Best for: local development, small deployments
   - Docker: docker run -d -p 8000:8000 chromadb/chroma

2. Qdrant
   - Setup: docker run -p 6333:6333 qdrant/qdrant
   - Scale: 100M+ vectors (production)
   - Cost: Free (self-host), $39/mo (cloud)
   - Best for: production at scale
   - Features: hybrid search, filtering, payload support

3. Pinecone
   - Setup: pip install pinecone
   - Scale: 100M+ vectors (SaaS)
   - Cost: $100+/mo (cloud only)
   - Best for: teams that don't want to manage infrastructure
   - Features: serverless, scaling, uptime guarantees

4. Weaviate
   - Setup: docker run -p 8080:8080 weaviate/weaviate
   - Scale: 50M+ vectors (production)
   - Cost: Free (self-host), $29/mo (cloud)
   - Best for: complex queries (filtering + vector search)
   - Features: hybrid search, cross-encoder reranking

5. Milvus
   - Setup: docker run -p 19530:19530 milvusdb/milvus
   - Scale: 1B+ vectors (massive scale)
   - Cost: Free (self-host)
   - Best for: massive-scale deployments
   - Features: distributed, sharding, GPU acceleration

Key decision: self-hosted vs SaaS
- Self-hosted: free but needs DevOps
- SaaS: costs money but handles scaling
"""
```

### Embedding Techniques That Improve Accuracy

```python
# Technique 1: Dimensionality reduction (PCA, UMAP)
from sklearn.decomposition import PCA
from umap import UMAP

def apply_UMAP(embeddings, n_components=256):
    """Reduce embedding dimensions with UMAP."""
    reducer = UMAP(n_components=n_components, metric='cosine')
    reduced = reducer.fit_transform(embeddings)
    return reduced

# Technique 2: Query expansion for better retrieval
def expand_query(original_query):
    """Expand query with synonyms and related terms."""
    # Get embeddings for query
    query_emb = model.encode(original_query)
    
    # For each term in the query, find similar terms
    expanded = set(original_query.split())
    for term in query.split():
        # Find similar terms in the index
        similar = find_similar_terms(term, top_k=5)
        expanded.update(similar)
    
    # Generate embeddings for all expanded terms
    expanded_emb = model.encode(list(expanded))
    
    # Return the average embedding of the expanded query
    return np.mean(expanded_emb, axis=0)

# Technique 3: Multi-vector pooling
def pool_multiple_embeddings(texts):
    """
    Encode each sentence separately, then average.
    This captures both local (sentence-level) and global (document-level) meaning.
    """
    sentences = split_into_sentences(texts)
    sentence_embs = model.encode(texts)
    pooled = np.mean(sentence_embs, axis=0)
    return pooled

# Technique 4: Cross-encoder reranking (for accuracy, not speed)
"""
Cross-encoders re-score the top-k results from dense retrieval.
This is the single most impactful accuracy improvement you can make to a RAG system.
"""
from sentence_transformers import CrossEncoder

cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

def rerank_results(queries, documents, top_k=10):
    """Re-score the top-k results from dense retrieval."""
    # First: get top-k with dense embeddings
    scores = compute_dense_similarity(query_embedding, documents)
    top_k_indices = scores.argsort()[-top_k:][::-1]
    
    # Second: re-score with cross-encoder
    rerank_scores = cross_encoder.predict([(query, documents[i]) for i in top_k_indices])
    
    # Third: return re-ranked
    reranked_indices = rerank_scores.argsort()[::-1]
    return [top_k_indices[i] for i in reranked_indices]
```

### Vector Distance Metrics

```python
"""
Distance metrics for vector search:

1. Cosine Similarity (default for embeddings)
   - Measures angle between vectors, not magnitude
   - Range: [-1, 1] (higher = more similar)
   - Best for: semantic similarity in text embeddings

2. Euclidean Distance (L2)
   - Measures straight-line distance
   - Range: [0, ∞] (lower = more similar)
   - Best for: when magnitude matters (rarely in embeddings)

3. Dot Product
   - Measures both magnitude and angle
   - Range: [-∞, +∞]
   - Best for: when you want to penalize long vectors

4. Chebyshev Distance
   - Maximum of all coordinate differences
   - Range: [0, ∞] (lower = more similar)
   - Best for: high-dimensional sparse vectors

5. Inner Product (normalized)
   - Same as cosine on normalized vectors
   - Range: [-1, 1]
   - Best for: when you want to normalize magnitudes

For text embeddings: use cosine similarity. For everything else, read the docs.
"""
```

### Practical Tips

1. **Embedding model > database**: The embedding model determines retrieval quality more than the database does.
2. **Cross-encoders beat everything**: A cheap cross-encoder on top of any retrieval system dramatically improves results.
3. **Normalize your vectors**: For cosine similarity, normalize vectors to unit length before storage. This speeds up search and ensures correct results.
4. **Index tuning matters**: hnswlib's M (links per node) and ef_construction (construction) parameters dramatically affect accuracy vs. recall trade-off.
5. **Regularly prune stale embeddings**: Stale documents dilute your embedding space. Remove or update them.

### Summary

Embeddings are the heart of RAG. They're not vectors. They're semantic representations that capture meaning. Choose your embedding model based on:
- **Accuracy**: text-embedding-3-large for documents, bge-large-en for open-source
- **Cost**: self-host for large datasets, API for small ones
- **Language**: e5-large-v2 for multilingual, bge for English

Vector DB choice is about deployment complexity, not accuracy:
- **Prototyping**: Chroma
- **Production**: Qdrant or Pinecone
- **Massive scale**: Milvus

Build embeddings first. Get them right. Everything else depends on this.
