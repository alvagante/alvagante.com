---
title: "Optimization & Calculus for ML"
date: 2025-01-15
layout: default
category: play
---

## Optimization & Calculus for ML

Gradient descent is just walking downhill in high dimensions. Your intuition fails at 100D, so here's code instead.

### Derivatives: The Engine of Learning

A derivative measures sensitivity. How much does the output change when I nudge the input? This is literally what "training" means: finding inputs (weights) where the output (loss) is minimal.

```python
import numpy as np

# The derivative of f(x) at point x:
# f'(x) ≈ (f(x+h) - f(x-h)) / (2h)  [symmetric difference, more accurate]

def numerical_derivative(f, x, h=1e-7):
    """Approximate the derivative at point x."""
    return (f(x + h) - f(x - h)) / (2 * h)

# Example: derivative of f(x) = x^2 at x = 3
# Analytical: f'(x) = 2x → f'(3) = 6
f = lambda x: x**2
print(f"f(x) = x^2")
print(f"f'(3) = {numerical_derivative(f, 3):.6f}")
print(f"Analytical answer: 6.0")
```

For ML, the derivative tells us which direction to adjust weights. Positive derivative = increase weights, increase loss. Negative derivative = decrease weights, decrease loss. Simple logic, powerful application.

### The Chain Rule: How Backprop Works

The chain rule is the entire reason deep learning works. When y = f(g(x)), the derivative is:

```
dy/dx = dy/du × du/dx  (where u = g(x))
```

This lets us decompose a complex function's derivative into smaller pieces. Each layer only needs to know its own derivative. Multiply them together, chain them, and you get the full gradient.

```python
def chain_rule(df_du, du_dx):
    """The chain rule: df/dx = df/du × du/dx."""
    return df_du * du_dx

# Example: y = sin(x^2)
# Inner function: u = x^2, du/dx = 2x
# Outer function: y = sin(u), dy/du = cos(u)
# dy/dx = cos(x^2) × 2x

def dy_dx(x):
    u = x**2
    du_dx = 2 * x
    dy_du = np.cos(u)
    return dy_du * du_dx

print(f"dy/dx at x=2: {dy_dx(2):.6f}")
# cos(4) × 4 = -0.6536 × 4 = -2.6146

# Numerical verification
f = lambda x: np.sin(x**2)
print(f"Numerical: {numerical_derivative(f, 2):.6f}")

# In a neural network:
# loss → (L2) → MSE → (diff) → residual → (square) → MSE value
# To compute d(loss)/d(w), we chain through ALL these operations.
```

### Gradient Descent

Gradient descent updates weights to minimize loss:

```
w_new = w_old — lr × ∂L/∂w
```

The learning rate (lr) determines step size. Too large: diverge. Too small: takes forever. Just right: converges.

```python
def gradient_descent(loss_func, gradient_func, x0, lr=0.1, epsilon=1e-7, max_iters=10000):
    """
    Basic gradient descent optimizer.
    
    loss_func: f(w) → scalar (the loss)
    gradient_func: f'(w) → d(f)/dw
    x0: starting point
    lr: learning rate
    epsilon: convergence threshold
    max_iters: maximum iterations
    """
    x = x0
    for i in range(max_iters):
        grad = gradient_func(x)
        x_new = x - lr * grad
        
        if abs(x_new - x) < epsilon:
            break
        
        x = x_new
    
    return x, loss_func(x), i + 1

# Example: minimize f(x) = x^2
# Minimum at x = 0, f(0) = 0
f = lambda x: x**2
grad_f = lambda x: 2 * x

opt_x, opt_f, n_iters = gradient_descent(f, grad_f, x0=5, lr=0.1)
print(f"Minimum: x_opt={opt_x:.6f}, f(x)={opt_f:.6f}, iterations={n_iters}")
```

### Why Learning Rate Matters More Than Architecture

```python
def learning_rate_experiment():
    """Show how learning rate affects convergence."""
    f = lambda x: x**4 - 2*x**2 + 1  # "W" shaped function
    grad_f = lambda x: 4*x**3 - 4*x
    
    results = {}
    
    for lr in [0.01, 0.1, 0.5, 1.0, 1.5]:
        x = 2.0  # Start at the right
        loss_history = []
        
        for i in range(100):
            grad = grad_f(x)
            loss_history.append(f(x))
            x -= lr * grad
            
            if abs(grad) < 1e-7:
                break
        
        results[lr] = {
            'loss': loss_history[-1] if loss_history else float('inf'),
            'iterations': len(loss_history),
            'final_x': x,
            'converged': loss_history and abs(loss_history[-1]) < 1e-3
        }
    
    for lr, res in results.items():
        status = "✓ converged" if res['converged'] else "✗ diverged/final"
        print(f"lr={lr:5.2f} → x={res['final_x']:8.4f}, loss={res['loss']:10.4f}, iters={res['iterations']:3d} {status}")

learning_rate_experiment()

# Key takeaway: lr matters more than the model architecture
# A good lr on a simple model beats a bad lr on a complex model
# Every "breakthrough architecture" that didn't fix lr was lucky
```

### Momentum

Momentum smooths out the optimization path by accumulating gradients over time:

```
v_t = β × v_{t-1} — lr × ∇L(w)
w_t = w_{t-1} + v_t
```

β (typically 0.9) acts as friction. Small gradients build up → large effective steps. Large gradients are dampened → less oscillation.

```python
def gradient_descent_momentum(gradient_func, x0, lr=0.1, beta=0.9, epsilon=1e-7):
    """Gradient descent with momentum."""
    x = x0
    v = 0
    for i in range(10000):
        grad = gradient_func(x)
        v = beta * v - lr * grad
        x = x + v
        
        if abs(v) < epsilon:
            break
    
    return x, v, i + 1

f = lambda x: x**2
grad_f = lambda x: 2 * x

# Without momentum, starting far from the minimum:
x_no_momentum, _, n_iters_no = gradient_descent(f, grad_f, x0=5, lr=0.1)

# With momentum:
x_with_momentum, _, n_iters_with = gradient_descent_momentum(grad_f, x0=5, lr=0.1)

print(f"Without momentum: x={x_no_momentum:.6f}, iterations={n_iters_no}")
print(f"With momentum:    x={x_with_momentum:.6f}, iterations={n_iters_with}")
# Momentum converges faster because it "accelerates" in consistent directions
# and dampens oscillations when gradients flip sign.
```

### Adam: The Default Optimizer (And Why)

Adam combines momentum (velocity) with adaptive learning rates per parameter. It's the default for a reason: it works, most of the time.

```
m_t = β1 × m_{t-1} + (1 — β1) × ∇L(w)        # Momentum (first moment)
v_t = β2 × v_{t-1} + (1 — β2) × ∇L(w)^2        # Variance (second moment)
m_hat = m_t / (1 — β1^t)                         # Bias correction
v_hat = v_t / (1 — β2^t)                         # Bias correction
w_t = w_{t-1} — lr × m_hat / (√v_hat + ε)       # Update
```

```python
def adam_step(param, grad, m, v, t, lr=0.001, beta1=0.9, beta2=0.999, eps=1e-8):
    """
    Adam optimizer step.
    
    param: current parameter value
    grad: gradient
    m: running average of gradients (momentum)
    v: running average of squared gradients (variance)
    t: current time step (for bias correction)
    """
    m = beta1 * m + (1 - beta1) * grad
    v = beta2 * v + (1 - beta2) * grad**2
    
    m_hat = m / (1 - beta1**t)
    v_hat = v / (1 - beta2**t)
    
    new_param = param - lr * m_hat / (np.sqrt(v_hat) + eps)
    
    return new_param, m, v

# Common hyperparameters:
# lr = 1e-3 (most things work at this)
# beta1 = 0.9, beta2 = 0.999, eps = 1e-8  (defaults, don't change)
# The only parameter that really matters is lr

def test_adam():
    """Test Adam on a simple optimization problem."""
    f = lambda x: x**4 - 2*x**2 + 1  # "W" shaped - good test case
    grad_f = lambda x: 4*x**3 - 4*x
    
    x = 3.0  # Start far from optimum
    m = 0
    v = 0
    
    history = []
    
    for t in range(1, 201):
        grad = grad_f(x)
        x, m, v = adam_step(x, grad, m, v, t, lr=0.1)
        history.append((t, f(x)))
        
        if abs(grad) < 1e-7:
            break
    
    print(f"Starting x: 3.0")
    print(f"Final x:    {x:.6f}")
    print(f"Final loss: {f(x):.6f}")
    print(f"Iterations: {t}")
    print(f"Final grad: {grad:.6e}")
    
    # Check: Adam finds the local minimum near x=1 (not the global minimum at x=3, which is higher)
    print(f"\nTrue local minima: x=-1 and x=1")
    print(f"Found minimum at: x={x:.6f}")

test_adam()
```

### Learning Rate Schedules

A fixed learning rate is suboptimal. Starting aggressive, then slowing down improves convergence. Here are the most common schedules:

```python
def learning_rate_schedule(step, initial_lr=0.001, schedule='cosine', **kwargs):
    """
    Learning rate scheduler.
    
    schedule options:
    - 'constant': always return initial_lr (default Adam behavior)
    - 'step': multiply by gamma every gamma_step steps
    - 'cosine': cosine annealing from initial_lr to 0
    - 'exponential': exponential decay per step
    """
    if schedule == 'constant' or schedule not in kwargs:
        return initial_lr
    
    if schedule == 'step':
        gamma = kwargs.get('gamma', 0.1)
        gamma_step = kwargs.get('gamma_step', 30)
        return initial_lr * (gamma ** (step // gamma_step))
    
    if schedule == 'cosine':
        steps = kwargs.get('steps', 100)
        min_lr = kwargs.get('min_lr', 1e-5)
        return min_lr + 0.5 * (initial_lr - min_lr) * (1 + np.cos(np.pi * step / steps))
    
    if schedule == 'exponential':
        decay = kwargs.get('decay', 0.95)
        return initial_lr * (decay ** step)
    
    return initial_lr

# Test all schedules
import matplotlib

steps = 100
schedules = {
    'constant': {'schedule': 'constant'},
    'step': {'schedule': 'step', 'gamma': 0.5, 'gamma_step': 20},
    'cosine': {'schedule': 'cosine', 'steps': steps},
    'exponential': {'schedule': 'exponential', 'decay': 0.95}
}

for name in schedules:
    lrs = [learning_rate_schedule(s, 0.01, **schedules[name]) for s in range(steps)]
    print(f"{name:15s}: lr[0]={lrs[0]:.4f}, lr[50]={max(lrs[50], 1e-8):.6e}, lr[99]={max(lrs[99], 1e-8):.6e}")

# Cosine annealing is the most popular because:
# 1. Smooth decay is better than step decay (no sudden lr drops)
# 2. Reaching lr=0 at the end is good for convergence
# 3. It's the default for PyTorch's lr_scheduler.cosine_with_restarts()
```

### Gradient Clipping

When gradients explode, training blows up. Gradient clipping caps the gradient norm to prevent this:

```python
def clip_gradients(grads, max_norm=1.0):
    """
    Clip gradients by norm to prevent exploding gradients.
    
    If ||grads|| > max_norm, scale all gradients so ||grads|| = max_norm.
    This preserves direction but limits magnitude.
    """
    grad_norm = np.sqrt(sum(np.sum(g**2) for g in grads))
    
    if grad_norm > max_norm:
        scale = max_norm / grad_norm
        clipped = [g * scale for g in grads]
    else:
        clipped = grads
    
    return clipped, grad_norm

# Example: simulate exploding gradients
grads_exploding = [np.random.normal(0, 10, (10, 10)) for _ in range(3)]
clipped, original_norm = clip_gradients(grads_exploding, max_norm=1.0)

print(f"Original gradient norm: {original_norm:.4f}")
clipped_norm = np.sqrt(sum(np.sum(g**2) for g in clipped))
print(f"Clipped gradient norm: {clipped_norm:.4f}")
print(f"Reduced by: {original_norm/max(clipped_norm, 1e-8):.1f}x")

# Gradient clipping is essential for:
# - Transformer models (long sequences → exploding gradients)
# - GANs (generative gradients → exploding gradients)
# - Reinforcement learning (reward scaling → exploding gradients)
# But it does not fix vanishing gradients — that requires architecture changes.
```

### Convex vs Non-Convex Optimization

Convex functions have one global minimum. Non-convex functions have many local minima. This distinction matters for understanding why ML training works:

```python
def is_convex(f, x0=-5, x1=5, n_points=100):
    """
    Heuristic test: if function is convex,
    the function value at any point should be above the chord.
    """
    x = np.linspace(x0, x1, n_points)
    y = f(x)
    
    # For convex: y(λx1 + (1-λ)x0) ≤ λf(x1) + (1-λ)f(x0)
    # We check if all points lie below the line connecting endpoints
    chord = np.linspace(f(x0), f(x1), n_points)
    
    return np.all(y <= chord)

# f(x) = x^2 is convex
print(f"x^2 is convex: {is_convex(lambda x: x**2)}")

# f(x) = x^4 - 3x^2 + 2 is NOT convex (it's the "W" function)
f_w = lambda x: x**4 - 3*x**2 + 2
print(f"x^4-3x^2+2 is convex: {is_convex(f_w)}")

# f(x) = e^x IS convex
print(f"e^x is convex: {is_convex(lambda x: np.exp(x))}")

# In ML:
# - Linear regression: convex (one global minimum)
# - Logistic regression: convex
# - Neural networks: NOT convex (many local minima, saddle points)
# - Yet: SGD finds good minima anyway — this is an open research question
# - The consensus: in high dimensions, most local minima have similar loss
# - So we don't worry about getting stuck in local minima (we worry about saddle points instead)
```

### Saddle Points: The Real Problem

In high-dimensional non-convex optimization, saddle points (where some directions go up, some go down) are more problematic than local minima. They have zero gradient everywhere (flat in all directions that matter locally).

```python
def saddle_point_test(f, grad_f, hess_f, x):
    """
    Identify saddle points: gradient is zero but not all eigenvalues of Hessian are positive.
    """
    g = grad_f(x)
    H = hess_f(x)
    
    # Gradient should be near zero at critical point
    gradient_magnitude = np.sqrt(np.sum(g**2))
    
    # Eigenvalues of Hessian tell us the curvature in different directions
    eigenvalues = np.linalg.eigvals(H)
    
    saddle = gradient_magnitude < 1e-7 and np.any(eigenvalues < 0)
    
    return {
        'gradient_magnitude': gradient_magnitude,
        'eigenvalues': eigenvalues,
        'is_saddle': saddle,
        'is_min': gradient_magnitude < 1e-7 and np.all(eigenvalues > 1e-7)
    }

def saddle_function(x, y):
    """Saddle surface: f(x,y) = x^2 - y^2"""
    return x**2 - y**2

def grad_saddle(x, y):
    return np.array([2*x, -2*y])

def hess_saddle(x, y):
    return np.array([[2, 0], [0, -2]])

# Analyze critical point at origin (0, 0) — this is a saddle!
result = saddle_point_test(saddle_function, grad_saddle, hess_saddle, [0, 0])
print(f"Critical point at (0,0): saddle={result['is_saddle']}, minimum={result['is_min']}")
print(f"Eigenvalues: {result['eigenvalues']}")
# Positive eigenvalue → direction where function increases
# Negative eigenvalue → direction where function decreases
# This is the definition of a saddle point!

# In practice: momentum helps escape saddle points because:
# 1. Different directions have different gradients (even if small)
# 2. Momentum accumulates in the direction of largest negative curvature
# 3. Adam's second moment creates direction-dependent learning rates
# This is why Adam beats vanilla SGD on non-convex problems
```

### Practical Applications in AI

#### Optimizer Comparison

```python
def optimizer_comparison(loss_func, grad_func, n_trials=10):
    """Compare optimizers on the same function."""
    results = {}
    
    for method in ['sgd', 'momentum', 'adam']:
        losses = []
        for trial in range(n_trials):
            x_init = np.random.rand() * 10 - 5  # Random start
            x = x_init
            m, v = 0, 0
            converged = False
            
            for t in range(1000):
                g = grad_func(x)
                
                if method == 'sgd':
                    x = x - 0.1 * g
                
                elif method == 'momentum':
                    m = 0.9 * m - 0.1 * g
                    x = x + m
                
                elif method == 'adam':
                    m = 0.9 * m + 0.1 * g
                    v = 0.999 * v + 0.01 * g**2
                    m_hat = m / (1 - 0.9**t)
                    v_hat = v / (1 - 0.999**t)
                    x = x - m_hat / (np.sqrt(v_hat) + 1e-8)
            
            losses.append(abs(x))
        
        results[method] = {
            'mean_loss': np.mean(losses),
            'std_loss': np.std(losses),
            'convergence_rate': np.mean([np.sqrt(np.sum((grad_func(x_init))**2))/np.mean(losses) 
                                         for x_init in np.random.randn(n_trials) * 5 for _ in range(1)][:1])
        }
    
    for method in results:
        r = results[method]
        print(f"{method:10s}: mean_optima={r['mean_loss']:.4f}, std={r['std_loss']:.4f}")
    
    # Adam generally wins because:
    # 1. Adaptive lr per parameter → works with different scales
    # 2. Momentum → faster convergence
    # 3. Bias correction → effective lr is correct early on
```

### Summary

Optimization in ML is about:
- **Gradients**: The derivative of loss w.r.t. each weight. The only direction that matters.
- **Learning rates**: The most important hyperparameter. Period.
- **Momentum**: Accumulates gradient history to accelerate and smooth.
- **Adam**: Combines momentum + adaptive learning rates. Default for most problems.
- **Learning rate schedules**: Start aggressive, slow down. Cosine annealing is the popular choice.
- **Gradient clipping**: Prevents explosion. Essential for transformers, GANs, RL.
- **Convexity**: Matters for understanding guarantees, not for practice. SGD works on non-convex problems because high-dimensional loss landscapes are benign.
- **Vanishing/exploding gradients**: The real enemy. Solved with good initialization (Xavier/He), normalization (batch norm), and architecture design (residual connections).

Build with gradients. Optimize with Adam. Schedule your learning rate. Clip when needed. The rest is engineering.
