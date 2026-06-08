---
title: Probability & Statistics for Engineers
date: 2025-01-01
layout: post
category: play
collection: ai-blog
---
## Probability & Statistics for Engineers

Your Bayesian intuition is probably broken. Don't worry — most of us are engineers, not statisticians. But if you're building AI systems, probability isn't optional knowledge. It's the foundation of how models learn, decide, and fail.

This isn't a statistics course. This is a field guide to the probability concepts you'll actually use when building AI systems.

### The Distributions You'll Encounter

#### Uniform Distribution

The "I'm making this up" distribution. All values equally likely in range `[a, b]`.

```python
import numpy as np

# Generate 1000 samples from Uniform(0, 10)
samples = np.random.uniform(0, 10, 1000)
print(f"Mean: {samples.mean():.2f}, Std: {samples.std():.2f}")
# Mean ≈ 5, Std ≈ 2.89 (which is (b-a)/√12)
```

Useful for: initialization, random exploration, baseline models nobody uses.

#### Normal (Gaussian) Distribution

The "everything else is too hard" distribution. Centered at mean μ, spreads by variance σ².

```python
# 68-95-99.7 rule: most data clusters around the mean
normal_samples = np.random.normal(0, 1, 10000)
print(f"Within 1σ: {np.sum(np.abs(normal_samples) <= 1) / 10000 * 100:.1f}%")
print(f"Within 2σ: {np.sum(np.abs(normal_samples) <= 2) / 10000 * 100:.1f}%")
print(f"Within 3σ: {np.sum(np.abs(normal_samples) <= 3) / 10000 * 100:.1f}%")
```

Useful for: errors, noise, weights (almost always), the central limit theorem, and "I need to make something look scientific."

#### Bernoulli/Binomial Distribution

One coin flip → Bernoulli(n, p). N coin flips → Binomial(n, p). Where p is the probability of "success."

```python
coin = np.random.binomial(1, 0.5, 10)
print(f"Outcomes: {coin}, Heads: {coin.sum()}/10")
# Output: Outcomes: [0 1 0 1 1 1 0 0 1 1], Heads: 6/10
```

Useful for: classification models, spam detectors, anything that's a yes/no decision.

#### Poisson Distribution

Events happening over time. Lambda (λ) is the expected number of events per unit time.

```python
# Average customer arrivals: 3 per minute
customers = np.random.poisson(lam=3, size=100)
print(f"Average arrivals: {customers.mean():.2f} per minute")
```

Useful for: API request rates, error counts, anything where you care about "how many events" not "when exactly."

#### Exponential Distribution

Time between events. If arrivals are Poisson(λ), time between them is Exponential(λ).

```python
# Average wait time between customer arrivals: 10 seconds
wait_times = np.random.exponential(scale=10, size=100)
print(f"Avg wait: {wait_times.mean():.2f}s")
```

Useful for: latency modeling, timeout design, anything involving waiting.

### Bayes' Theorem

This is the single most useful formula in AI. Memorize it. Use it daily. It's not hard.

```
P(A|B) = P(B|A) × P(A) / P(B)
```

Translation:
- P(A) = prior (what I believed before)
- P(B|A) = likelihood (how likely B is if A is true)
- P(A|B) = posterior (what I believe after seeing B)

```python
def bayes(prior, likelihood, evidence):
    """The most important formula in AI, in 3 lines."""
    numerator = likelihood * prior
    posterior = numerator / evidence
    return posterior

# Example: Disease screening
# Prior: 1% of population has disease
# Likelihood: 90% test accuracy if positive
# Evidence: 10% of population tests positive
posterior = bayes(0.01, 0.90, 0.10)
print(f"Probability of disease given positive test: {posterior*100:.1f}%")
# ~9%. Not 90%. Because the disease is rare. Always consider the base rate.
```

This is why your model's 95% accuracy on an imbalanced dataset is meaningless. And why your "reliable" spam filter flags every email with "FREE" in it even though 90% of spam contains "FREE." Always check the base rate.

### Expectation and Variance

These tell you what to expect and how much it will vary. Engineers obsess over means and neglect variance. That's a mistake.

```python
# Expectation: weighted average
# Variance: how much it spreads
mean = np.mean(samples)
variance = np.var(samples)
std = np.std(samples)

print(f"Mean: {mean:.2f}")
print(f"Variance: {variance:.2f}")
print(f"Standard Deviation: {std:.2f}")

# The key insight: two models can have the same mean
# but very different variance. One is reliable. The other isn't.
# In production, variance kills more models than bias.

model_a = np.random.normal(0, 0.1, 10000)  # Predicts 0 ± 0.1
model_b = np.random.normal(0, 10, 10000)     # Predicts 0 ± 10

print(f"Both have mean ~0, but stds are {model_a.std():.2f} vs {model_b.std():.2f}")
print("Same mean doesn't mean same quality. Variance matters in production.")
```

### Maximum Likelihood Estimation (MLE)

MLE is how models "learn." Given data, find the parameters that make the data most likely.

```python
def mle_normal_mean(data):
    """MLE for the mean of a normal distribution."""
    return np.mean(data)

def mle_normal_variance(data):
    """MLE for variance (biased estimator)."""
    return np.sum((data - np.mean(data))**2) / len(data)

# For a normal distribution, the MLE is just:
# μ̂ = sample mean
# σ̂² = sample variance (biased — MLE uses N, not N-1)
```

This is how neural networks "learn." Minimizing loss is MLE in disguise. Cross-entropy loss = MLE for classification. MSE = MLE for regression. Understanding this unifies everything.

### Maximum A Posteriori (MAP)

MAP adds prior knowledge to MLE. Instead of "what parameters explain the data?", MAP asks "what parameters explain the data, given what I already know?"

```python
def map_normal(mean_prior, var_prior, data, var_likelihood):
    """MAP estimate for mean of normal distribution with normal prior."""
    n = len(data)
    # MAP mean is a weighted combo of prior mean and data mean
    # More data → trust data more. More prior certainty → trust prior more.
    precision_prior = 1 / var_prior
    precision_data = n / var_likelihood
    
    weighted_mean = (precision_prior * mean_prior + precision_data * np.mean(data))
    weighted_var = 1 / (precision_prior + precision_data)
    
    return weighted_mean, weighted_var

# Example: estimating average customer spend
prior_spend = 50  # From market research
prior_uncertainty = 100  # Wide confidence
customer_data = [45, 52, 48, 51, 49]  # From your first 10 customers

est, var = map_normal(prior_spend, prior_uncertainty, customer_data, 10)
print(f"MAP estimate: {est:.1f}, uncertainty: {var**0.5:.1f}")
```

MAP is Bayesian regularization. L2 regularization = MAP with Gaussian prior. Dropout = Bayesian approximation. There's a reason you keep using regularization — it has mathematical foundations.

### Hypothesis Testing

You've run an A/B test. Variant B looks better. Are you sure? Or just unlucky?

```python
def t_test(group_a, group_b):
    """Two-sample t-test for A/B testing.
    
    Returns: (t-statistic, p-value)
    p < 0.05: probably different (95% confidence)
    p < 0.01: definitely different (99% confidence)
    """
    from scipy import stats
    
    t_stat, p_value = stats.ttest_ind(group_a, group_b)
    return t_stat, p_value

# Example: conversion rates
control = np.random.binomial(1, 0.05, 10000)  # 5% base rate
variant = np.random.binomial(1, 0.052, 10000)  # 5.2% improvement

t_stat, p_value = t_test(control, variant)
print(f"t-statistic: {t_stat:.2f}, p-value: {p_value:.4f}")
# If p < 0.05, the improvement is statistically significant
# If p > 0.05, the improvement might just be noise

# Common mistake: checking p-values multiple times until significant
# This is p-hacking. It's dishonest. Don't do it.
```

### The Central Limit Theorem (CLT)

The CLT is the "why statistics works" explanation. It states that the average of any distribution converges to normal as sample size grows.

```python
# Start with uniform distribution (not normal!)
uniform_samples = np.random.uniform(0, 1, 100000)

# Take averages of 30 samples at a time
averages = [np.mean(uniform_samples[i:i+30]) for i in range(0, len(uniform_samples), 30)]

# Now the averages are approximately normal, even though the original data isn't
from scipy import stats
t_stat, p_value = stats.shapiro(averages)
print(f"CLT: Averages of uniform converge to normal? p={p_value:.4f}")
print("If p > 0.05, we can't reject the hypothesis that they're normal")

# This is why models generalize. Why sample means converge.
# Why A/B testing works. CLT is the backbone of inference.
```

### Confidence Intervals

A point estimate tells you "the mean is 5." A confidence interval tells you "the mean is 5, and we're 95% sure it's between 4.2 and 5.8." The latter is actionable. The former is not.

```python
def confidence_interval(data, confidence=0.95):
    """Calculate confidence interval for the mean."""
    from scipy import stats
    
    n = len(data)
    mean = np.mean(data)
    sem = stats.sem(data)  # standard error of the mean
    margin = stats.sem(data) * stats.t.ppf((1 + confidence) / 2, n-1)
    
    return (mean - margin, mean + margin)

samples = np.random.normal(50, 10, 1000)
lower, upper = confidence_interval(samples)
print(f"95% CI: [{lower:.2f}, {upper:.2f}]")
print(f"Width: {upper - lower:.2f}")
print(f"More samples → narrower CI. Fewer samples → wider CI. Trade-off.")
```

### Mutual Information

How much knowing A tells you about B? Mutual information measures this. High MI = A and B are related. Low MI = they're independent. High MI with a label = good feature.

```python
def mutual_information(X, Y, n_bins=10):
    """Estimate mutual information between X and Y."""
    # Joint distribution
    joint = np.histogram2d(X, Y, bins=n_bins)[0]
    joint = joint / joint.sum()
    
    marginal_x = np.sum(joint, axis=1)
    marginal_y = np.sum(joint, axis=0)
    
    # MI formula: Σ p(x,y) * log(p(x,y) / (p(x) * p(y)))
    mi = 0
    for i in range(n_bins):
        for j in range(n_bins):
            if joint[i, j] > 0 and marginal_x[i] > 0 and marginal_y[j] > 0:
                mi += joint[i, j] * np.log2(joint[i, j] / (marginal_x[i] * marginal_y[j]))
    
    return mi

# Example: feature relevance
feature = np.random.normal(0, 1, 1000)
related_label = feature + np.random.normal(0, 0.1, 1000)  # Strong relationship
unrelated_label = np.random.normal(0, 1, 1000)              # No relationship

mi_related = mutual_information(feature, related_label)
mi_unrelated = mutual_information(feature, unrelated_label)

print(f"MI(feature, related_label): {mi_related:.2f} bits")
print(f"MI(feature, unrelated_label): {mi_unrelated:.2f} bits")
print("Higher MI = better feature. Use it for feature selection.")
```

### Information Entropy

Entropy measures uncertainty. High entropy = high uncertainty = high information gain. A fair coin has maximum entropy. A biased coin has lower entropy. An AI that says "maybe" has maximum entropy; an AI that never says "I don't know" has zero entropy and is wrong.

```python
def entropy(probabilities):
    """Calculate Shannon entropy."""
    return -sum(p * np.log2(p) for p in probabilities if p > 0)

# Fair coin
fair = entropy([0.5, 0.5])
print(f"Fair coin entropy: {fair:.1f} bits")

# Biased coin
biased = entropy([0.9, 0.1])
print(f"Biased coin entropy: {biased:.1f} bits")

# Perfect prediction
certain = entropy([1.0, 0.0])
print(f"Certain event entropy: {certain:.1f} bits")

# Cross-entropy: how different two distributions are
def cross_entropy(p, q):
    """Cross-entropy between true distribution p and predicted q."""
    return -sum(p[i] * np.log2(q[i] + 1e-10) for i in range(len(p)))

k = entropy([0.5, 0.5])
ce = cross_entropy([0.5, 0.5], [0.6, 0.4])
print(f"\nTrue distribution: [0.5, 0.5]")
print(f"Predicted: [0.6, 0.4]")
print(f"Cross-entropy: {ce:.3f} bits (ideal = {k:.3f} bits)")
print("Lower cross-entropy = better predictions. Cross-entropy loss is just this.")
```

KL divergence is cross-entropy minus entropy. It measures how much information is lost when you approximate one distribution with another. It's always non-negative. Zero means the distributions are identical. Use KL divergence for model comparison, not as a metric — it's unbounded above.

### Practical Applications in AI

#### Model Calibration

```python
def calibration_curve(y_true, y_pred, n_bins=10):
    """
    Check if your model's confidence matches its accuracy.
    A model that says "I'm 90% sure" should be right 90% of the time.
    If it's right 70% of the time, it's overconfident.
    """
    bins = np.linspace(0, 1, n_bins + 1)
    bin_accuracies = []
    bin_confidences = []
    
    for i in range(n_bins):
        mask = (y_pred >= bins[i]) & (y_pred < bins[i+1])
        if mask.sum() > 0:
            bin_accuracies.append(y_true[mask].mean())
            bin_confidences.append(y_pred[mask].mean())
    
    # Plot calibration curve
    import matplotlib.pyplot as plt
    plt.figure(figsize=(8, 6))
    plt.plot([0, 1], [0, 1], 'k--', label='Perfect')
    plt.plot(bin_confidences, bin_accuracies, 'o-', label='Model')
    plt.xlabel('Predicted Confidence')
    plt.ylabel('Actual Accuracy')
    plt.legend()
    plt.title('Model Calibration')
    plt.grid(True)
    
    # Calculate ECE (Expected Calibration Error)
    ece = sum(abs(np.mean(y_true[mask]) - np.mean(y_pred[mask])) * mask.sum() / len(y_true)
             for i in range(n_bins) 
             if (mask := (y_pred >= bins[i]) & (y_pred < bins[i+1])).sum() > 0)
    
    return ece
```

#### Sampling for Uncertainty

```python
def monte_carlo_dropout(x, model, n_samples=100):
    """
    Monte Carlo dropout estimates model uncertainty by running inference
    multiple times with dropout active. If predictions vary a lot,
    the model doesn't know what it's saying.
    """
    predictions = np.array([model(x) for _ in range(n_samples)])
    mean_pred = predictions.mean(axis=0)
    std_pred = predictions.std(axis=0)
    
    return mean_pred, std_pred  # Predict + uncertainty estimate
```

### Common Mistakes

1. **Confusing correlation with causation**: Your model learned spam detection from email length because spammers write longer emails. Length doesn't cause spam. The model thinks it does. Deploy it, and it'll block all your vacation photos.

2. **Ignoring base rates**: Your model has 99% accuracy on a disease dataset with 1% prevalence. A model that predicts "everyone is healthy" also has 99% accuracy. Accuracy is useless on imbalanced data. Use precision, recall, F1, or ROC-AUC.

3. **Overfitting to training distribution**: Your model works on your test set because you accidentally split by date/train/test. Deploy it, and it fails because the real-world distribution is different. Always check your split strategy.

4. **P-hacking**: Testing 20 different metrics until one is significant at p < 0.05. It's statistically invalid. Pick your metrics before you test.

5. **Ignoring uncertainty**: Your model outputs a single number. But it has uncertainty. Use quantile regression, Monte Carlo sampling, or ensembles to estimate it. Uncertainty-aware models catch failure before users do.

### Summary

Probability isn't optional for AI engineers because:
- **Learning is estimation**: Every model learns parameters that maximize likelihood.
- **Prediction is probability**: Every output is a distribution, not a point.
- **Evaluation is hypothesis testing**: A/B tests, confidence intervals, Bayesian updates.
- **Generalization is CLT**: The central limit theorem is why training on samples generalizes to the population.
- **Uncertainty is entropy**: Information theory quantifies what a model knows and doesn't know.

Build AI systems with probability. Otherwise, you're just training a random oracle and calling it a product.
