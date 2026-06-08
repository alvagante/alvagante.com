---
title: Linear Algebra for Engineers
date: 2025-01-08
layout: post
category: play
collection: ai-blog
---
## Linear Algebra for Engineers

Matrices are just functions. Stop pretending they're magic.

If you've ever sat through a linear algebra class and thought "when will I ever use this?" — you will. Right now. Every day. In transformers, in embeddings, in losses, everywhere. But you don't need proofs. You need intuition and code.

### Matrices as Linear Transformations

A matrix is a function that transforms one vector into another: `y = Wx`. That's it. Nothing mystical. It takes an n-dimensional vector and maps it to an m-dimensional vector.

```python
import numpy as np

# A 3x2 matrix transforms 2D vectors into 3D vectors
W = np.array([[1, 2],
              [3, 4],
              [5, 6]])

# Input vector (2D)
x = np.array([1, 0])  # Pointing along x-axis

# Transformation
y = W @ x  # @ is matrix multiplication
print(f"Input: {x}, Output: {y}")
# Output: [1, 3, 5]

# The columns of W are where the basis vectors land
print(f"Column 1 (where e1 goes): {W[:, 0]}")
print(f"Column 2 (where e2 goes): {W[:, 1]}")

# This is the key insight: a matrix IS its columns
# The first column shows where the first axis lands
# The second column shows where the second axis lands
# All other transformations are linear combos of these
```

### Transpose and Dot Product

Transpose (`T`) flips a matrix across its diagonal. Dot product is inner product — when positive, vectors point in similar directions. When zero, they're orthogonal. When negative, they point opposite.

```python
W = np.array([[1, 2],
              [3, 4]])

print(f"Original:\n{W}")
print(f"Transpose:\n{W.T}")

# Dot product
a = np.array([1, 2])
b = np.array([3, 4])
dot = np.dot(a, b)  # Or a @ b
print(f"Dot product: {dot}")

# Dot product = |a| * |b| * cos(theta)
# Positive = acute angle (similar direction)
# Zero = 90 degrees (orthogonal)
# Negative = obtuse angle (opposite direction)
angle = np.arccos(np.clip(dot / (np.linalg.norm(a) * np.linalg.norm(b)), -1, 1))
print(f"Angle between vectors: {np.degrees(angle):.1f}°")

# Why this matters in AI:
# - Attention = dot products between query and key vectors
# - Cosine similarity = dot product / (norms)
# - Orthogonal initialization prevents gradient collapse
```

### Matrix-Vector vs Vector-Vector Operations

```python
# Matrix-vector: W @ x = weighted sum of columns of W
W = np.array([[1, 0, 0.5],
              [0, 1, 1],
              [0, 0, 1]])
x = np.array([2, 3, 0])

result = W @ x
print(f"W @ x = {result}")
# = 2 * col1 + 3 * col2 + 0 * col3 = [2+0+0, 0+3+0, 0+0+0]

# Vector outer product: a @ b.T = matrix
a = np.array([1, 2])
b = np.array([3, 4])
outer = np.outer(a, b)
print(f"Outer product:\n{outer}")
# = [[1*3, 1*4], [2*3, 2*4]] = [[3, 4], [6, 8]]

# Why outer products matter:
# - Attention weight matrices often use outer products
# - Rank-1 updates in optimization
# - Embedding layer weight updates
```

### Determinant

The determinant tells you how much a matrix scales area (2D) or volume (3D). Zero determinant = singular matrix = the transformation squashes space to lower dimension (like a sheet of paper, which has area zero in 3D).

```python
W1 = np.array([[2, 0],
               [0, 2]])  # Scales everything by 2
det1 = np.linalg.det(W1)
print(f"Determinant of scaling matrix: {det1}")
# Area scales by 4 (2*2) — makes sense, 2x2 = 4x area

W2 = np.array([[1, 0],
               [0, 0.5]])  # Squashes y direction
det2 = np.linalg.det(W2)
print(f"Determinant of squishing matrix: {det2}")
# Area scales by 0.5 — y got halved

W3 = np.array([[1, 1],
              [2, 2]])  # Singular (rows proportional)
det3 = np.linalg.det(W3)
print(f"Determinant of singular matrix: {det3:.6f}")
# ~0. The transformation squashes everything to a line.
# You cannot invert this. Information is lost forever.
```

### Inverse

The inverse `W^{-1}` undoes the transformation. If `W` scales by 2x, `W^{-1}` scales by 0.5x. Not all matrices have inverses (singular matrices don't). In AI, inverses appear in least squares, Gauss-Newton, and Mahalanobis distance.

```python
W = np.array([[4, 7],
              [2, 6]])

W_inv = np.linalg.inv(W)
print(f"Inverse:\n{W_inv}")

# Verify: W @ W^{-1} = identity
identity = W @ W_inv
print(f"Matrix @ Inverse =\n{identity}")
# Should be close to identity: [[1,0],[0,1]]

# Least squares solution: x = (A^T A)^{-1} A^T b
# Used in linear regression, which is the simplest model you'll ever build
A = np.array([[1, 1],
              [1, 2],
              [1, 3]])  # Design matrix (first col = bias, second = feature)
b = np.array([2.1, 3.9, 5.8])

x = np.linalg.inv(A.T @ A) @ A.T @ b
print(f"Regression coefficients: {x}")
# y = x[0] + x[1]*t ≈ 0.3 + 1.85*t

# The matrix inverse formula (A^T A)^{-1} A^T is "normal equations."
# It's the closed-form solution to linear regression. 
# Don't use it in practice (numerically unstable). Use QR or SVD instead.
```

### Trace

Trace = sum of diagonal elements = sum of eigenvalues. Useful in gradient computation, loss functions, and information theory (Shannon entropy involves trace of covariance).

```python
W = np.array([[3, 0, 1],
              [0, 2, 0],
              [1, 0, 4]])

trace = np.trace(W)
eigenvalues = np.linalg.eigvals(W)
print(f"Trace: {trace}")
print(f"Sum of eigenvalues: {np.sum(eigenvalues)}")
# They match! That's not a coincidence — it's a theorem

# Trace trick for gradient computation:
# d/dX Tr(AX) = A^T
# This appears constantly in backpropagation
# When you see "trace trick" in a derivation, it's just:
# Tr(AB) = sum of element-wise product of A and B.T
```

### Eigenvalues and Eigenvectors

An eigenvector is a direction that doesn't change when multiplied by a matrix. The eigenvalue is how much it scales. Think of it as the "axis of least resistance" and its "resistance."

```python
W = np.array([[4, 0],
              [1, 2]])

eigenvalues, eigenvectors = np.linalg.eig(W)
print(f"Eigenvalues: {eigenvalues}")
print(f"Eigenvectors (columns):\n{eigenvectors}")

# For each eigenvalue λ and eigenvector v:
# W @ v = λ * v
for i in range(len(eigenvalues)):
    v = eigenvectors[:, i]
    check = W @ v
    print(f"λ={eigenvalues[i]:.2f}, check: {check} ≈ {eigenvalues[i] * v}")

# Key facts:
# - |λ| > 1 means directions expand
# - |λ| < 1 means directions shrink  
# - |λ| = 1 means directions preserve (rotate at least)
# - Product of eigenvalues = determinant
# - Sum of eigenvalues = trace
# - If all eigenvalues are positive → positive definite

# Why this matters in AI:
# - Covariance matrix eigenvalues = principal components
# - Hessian eigenvalues = curvature (optimization stability)
# - GPT-2 uses eigenvalue analysis to diagnose representation quality
```

### Singular Value Decomposition (SVD)

Every matrix A (even non-square!) can be decomposed as A = UΣV^T. U contains left singular vectors, Σ contains singular values (the "importance" of each direction), V^T contains right singular vectors. SVD is the most numerically stable matrix decomposition. Use it when precision matters.

```python
A = np.array([[1, 2, 3],
              [4, 5, 6]])

U, S, Vt = np.linalg.svd(A, full_matrices=False)
print(f"U:\n{U}")
print(f"Singular values: {S}")
print(f"V^T:\n{Vt}")

# U: m×m orthogonal matrix (left singular vectors)
# S: singular values (always non-negative, in descending order)
# Vt: n×n orthogonal matrix (right singular vectors, transposed)

# Reconstruct A:
A_reconstructed = U @ np.diag(S) @ Vt
print(f"Original:\n{A}")
print(f"Reconstructed:\n{A_reconstructed}")
print(f"Max reconstruction error: {np.max(np.abs(A - A_reconstructed)):.10f}")

# SVD is how you:
# - Reduce dimensionality (keep top k singular values → PCA)
# - Find the rank of a matrix (count non-zero singular values)
# - Compute pseudo-inverse (replace σ with 1/σ in Σ)
# - Solve least squares (more stable than normal equations)

# Low-rank approximation:
k = 1  # Keep only 1 singular value
A_approx = U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]
print(f"\nRank-1 approximation:\n{A_approx}")
# Error = ||A - A_approx|| = sqrt(sum(S[k:]^2))
fro_error = np.sqrt(np.sum(S[k:]**2))
print(f"Frobenius norm of error: {fro_error:.4f}")

# PCA = eigendecomposition of covariance = SVD of centered data
# Same thing, different name. The data scientists have better marketing.
```

### Orthogonal and Symmetric Matrices

Orthogonal matrices preserve length and angle (rotations). Their inverse = their transpose. Symmetric matrices (A = A^T) always have real eigenvalues and orthogonal eigenvectors. Both appear everywhere in ML but under different names.

```python
# Orthogonal matrix: Q^T Q = Q^{-1} Q = I
# Rotation by 45 degrees
theta = np.pi / 4
Q = np.array([[np.cos(theta), -np.sin(theta)],
              [np.sin(theta), np.cos(theta)]])

print(f"Orthogonal matrix:\n{Q}")
print(f"Q^T Q:\n{Q.T @ Q}")  # Should be identity

# Symmetric matrix: A = A^T
A = np.array([[2, 1],
              [1, 2]])
print(f"Symmetric? {np.allclose(A, A.T)}")

# Symmetric matrices always have real eigenvalues
eigenvalues = np.linalg.eigvals(A)
print(f"Eigenvalues: {eigenvalues}")  # Should be real: 3, 1

# Why this matters:
# - Weight initialization (Xavier/He): orthogonal matrices are stable
# - PCA: eigenvalues of symmetric covariance matrix are real
# - Spectral clustering: works because adjacency matrix is symmetric
```

### Matrix Norms (How to Measure "Size")

Norms generalize "length" to matrices and vectors. Different norms emphasize different things in AI:
- **Frobenius norm** (F): total energy across all elements. Like Euclidean norm but for matrices.
- **Nuclear norm** (∗): sum of singular values. Convex relaxation of rank (used in matrix completion).
- **Spectral norm** (2): largest singular value. Measures amplification factor. Critical for stability bounds.
- **L1 norm** (1): sum of absolute values. Encourages sparsity.
- **Infinity norm**: max row sum. Worst-case impact.

```python
A = np.array([[3, -2, 4],
              [1, 0, -3]])

fro_norm = np.linalg.norm(A, 'fro')  # Frobenius
spectral_norm = np.linalg.norm(A, 2)  # Spectral (largest singular value)
l1_norm = np.linalg.norm(A.flatten(), 1)  # L1
inf_norm = np.inf if A.max() > 0 else 0  # Infinity

print(f"Frobenius: {fro_norm:.2f}")
print(f"Spectral: {spectral_norm:.2f}")
print(f"L1: {l1_norm:.2f}")

# Key relationship: spectral ≤ Frobenius (spectral is the max, Fro is RMS of all)
# Why spectral norm matters in AI:
# - Lipschitz constant of a layer = its spectral norm
# - Stability: if spectral norms < 1, gradient doesn't explode
# - Weight clipping in GANs (WGAN): clip spectral norm of weight matrix
```

### Tensor Operations (ML's Native Data Structure)

Tensors are just multidimensional arrays. A scalar is 0D, a vector is 1D, a matrix is 2D, a batch of images is 4D (batch × height × width × channels). Deep learning frameworks are tensor libraries with auto-differentiation on top.

```python
# 4D tensor: batch of images
# (batch_size, channels, height, width)
images = np.random.rand(32, 3, 224, 224)

print(f"Shape: {images.shape}")

# Batch operations (the ML way):
# Sum over channels → grayscale
grayscale = np.mean(images, axis=1)  # (32, 224, 224)
print(f"Grayscale shape: {grayscale.shape}")

# Sum over all spatial dimensions → one number per image (mean color)
mean_color = np.mean(images, axis=(1, 2, 3))  # (32,)
print(f"Mean color shape: {mean_color.shape}")

# Broadcasting: (3,) * (32, 1, 1, 1) → mean-center
mean_color_expanded = mean_color[:, np.newaxis, np.newaxis, np.newaxis]
centered = images - mean_color_expanded
print(f"Centered shape: {centered.shape}")

# Matrix multiply batch: (b, d_in, d_out) = (b, d_in) @ (d_in, d_out)
batch_x = np.random.rand(32, 128)  # 32 samples, 128 features
weights = np.random.rand(128, 64)  # Linear layer weights
batch_y = batch_x @ weights  # Broadcasting over batch dimension
print(f"Batch output shape: {batch_y.shape}")
# Same weights applied to all 32 samples
```

### Gradient of Matrix Operations

Gradient of matrix operations is just calculus extended. Here are the most common ones you'll encounter in backpropagation:

```python
# d/dX (AXB) = A^T Y B^T (where Y = AXB)
# d/dX Tr(AX) = A^T
# d/dX ||AX - B||_F^2 = 2A^T(AX - B)  (loss gradient)
# d/dX log det(X) = X^{-T}
# d/dX Xw = w^T  (gradient of matrix-vector product)

# The loss gradient is the bread and butter of backpropagation
def loss_gradient(A, X, B):
    """Gradient of ||AX - B||_F^2 w.r.t. X."""
    residual = A @ X - B  # (m, n)
    gradient = 2 * A.T @ residual  # (n, n) where n = X.shape[1]
    return gradient

A = np.random.rand(10, 5)
X = np.random.rand(5, 5)
B = np.random.rand(10, 5)

grad = loss_gradient(A, X, B)
print(f"Gradient shape: {grad.shape}")
# = 2 * A^T(AX - B)

# Check with numerical gradient (finite differences)
eps = 1e-7
numerical_grad = np.zeros_like(X)
for i in range(X.shape[0]):
    for j in range(X.shape[1]):
        X_plus = X.copy(); X_plus[i, j] += eps
        X_minus = X.copy(); X_minus[i, j] -= eps
        f_plus = np.sum((A @ X_plus - B)**2)
        f_minus = np.sum((A @ X_minus - B)**2)
        numerical_grad[i, j] = (f_plus - f_minus) / (2 * eps)

print(f"Analytical vs numerical (max diff): {np.max(np.abs(grad - numerical_grad)):.2e}")
# Should be ~1e-6 or better. If not, you derived the gradient wrong.
```

### Practical Tips for AI

1. **Always check matrix dimensions before multiplying**: `np.shape(A) = (m, n)` and `np.shape(B) = (n, p)` must match on the middle dimension. `A @ B` only works if `n == n`.

2. **Use numpy's einsum for complex operations**: It handles index notation compactly and correctly.
```python
# Dot product: np.einsum('i,i->', a, b)
# Matrix multiply: np.einsum('ij,jk->ik', A, B)
# Batch matrix multiply: np.einsum('bij,bjk->bik', A, B)
# Outer product: np.einsum('i,j->ij', a, b)
# Trace: np.einsum('ii->', A)
```

3. **Beware of ill-conditioned matrices**: When the ratio of largest to smallest singular value (condition number) is very large, the matrix is nearly singular. Solutions become unstable. Always check `np.linalg.cond(A)`.

4. **Orthogonal initialization is the default for stability**: Xavier/He initialization produces near-orthogonal weight matrices to prevent exploding/vanishing gradients. It works because orthogonal matrices preserve norm.

5. **SVD > eigendecomposition when possible**: SVD always exists for any matrix. Eigendecomposition requires square matrices and may not exist. SVD is also more numerically stable.

### Summary

Linear algebra in AI is about:
- **Transformations**: Matrices transform data. Every layer is a transformation.
- **Basis**: Eigenvalues/eigenvectors reveal the principal directions of a transformation.
- **Dimensionality**: SVD tells you how much information lives in each direction.
- **Stability**: Condition number, spectral norm, and orthogonality determine if your model explodes or collapses.
- **Gradient**: Matrix calculus powers backpropagation. The math is just chain rule applied element-wise.

You don't need to memorize the proofs. You need to know what each operation does geometrically and how it behaves numerically. That's enough to build and debug AI systems that don't explode.
