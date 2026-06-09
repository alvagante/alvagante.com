---
title: Skills for Vibe-Coding AI Engineers
date: 2026-06-09
layout: post
category: play
collection: ai-blog
---
## Skills for Vibe-Coding AI Engineers

Vibe coding is a real job now. You don't just write code — you orchestrate a model that writes code, you verify the outputs, debug the edge cases the model missed, and ship something that works. Here's what actually matters.

### 1. Prompt Engineering (The Practical Kind)

Not the "write a perfect prompt" memes. The kind where you learn what works.

```python
"""
What actually matters about prompts:
1. Context density > prompt length
   → \"Fix the race condition in worker_pool.py:47-89 where two threads write to the same socket\" works.
   → \"Look at the code and find problems\" does not.
2. Constraints beat verbosity
   → \"Return only the file diffs, no explanations\" saves tokens and time.
   → \"Be helpful\" wastes tokens and gets you essays you didn't ask for.
3. Few-shot examples > abstract descriptions
   → Give the model 2 examples of what good output looks like.
   → It will generate output in that style. Always.
4. System prompts for style, user prompts for data
   → System: \"You are a backend engineer. Return only diffs.\"
   → User: \"Here is the code and the bug report.\"
5. Temperature matters more than you think
   → 0 for code generation (you want consistency).
   → 0.7 for brainstorming architecture (you want options).
   → The model is deterministic at 0. It's your friend.
"""
```

### 2. Code Review at Speed

You're not writing every line. You're reviewing every line someone (or something) wrote. That's a different skill.

```python
"""
Code review checklist for vibe-coded output:

Structure / Logic:
  [ ] Does the code do what it claims? (Run it / read the diff)
  [ ] Are edge cases handled? (Empty input, large input, network failure)
  [ ] Are error paths tested or at least plausible?

Integration:
  [ ] Dependencies: are the right packages imported? (Model says 'import foo' but forgets 'pip install foo')
  [ ] Config: does it read from env vars / .env instead of hardcoding secrets?
  [ ] APIs: do the endpoint signatures match what the model assumes?

Performance:
  [ ] N+1 queries? (Model generates them in loops. Always check.)
  [ ] Memory: loading entire datasets into RAM?
  [ ] Sync where async matters?

Security:
  [ ] SQL injection? (Model sometimes forgets parameterization)
  [ ] Secret leakage in logs?
  [ ] Unvalidated input reaching sensitive code?

Ship it when: you understand every line, the tests pass, and you'd bet your name on it.
"""
```

### 3. Debugging When You Didn't Write the Code

The hardest skill. The model outputs code that looks right but doesn't work. You have to find out why.

```python
"""
Debugging vibe-coded code, in order:
1. Read the error message. Seriously. Most people skip this.
   → \"TypeError: list object is not iterable\" means exactly what it says.
   
2. Add print statements or debugger breakpoints.
   → The model is not going to add better error handling than you are.
   → You have to see what the code actually does, not what it looks like it does.

3. Create a minimal repro case.
   → \"Does the bug persist with 1 input instead of 1000?\"
   → Isolate the variable. Change one thing at a time.
   
4. Ask the model to debug your debugging.
   → Paste the error, the relevant diff, and what you've tried.
   → \"Here's the error and what I've checked so far. What might I be missing?\"
   → This is faster than guessing.
   
5. Verify the model's fix before applying.
   → Models suggest fixes confidently. Sometimes wrong.
   → Read the fix. Understand it. Then apply it.
"""
```

### 4. Architecture Judgment

The model can generate patterns. You need to know which pattern fits which problem.

```python
"""
Architectural decisions that vibe coding gets right (and wrong):

GETS RIGHT:
- CRUD APIs (fastAPI, Flask, Express — all straightforward)
- Simple ETL pipelines (fetch data, transform, load)
- Basic auth flows (JWT, OAuth2 boilerplate is well-represented in training)
- Frontend forms and lists (React/Vue/Svelte boilerplate is everywhere)
- Basic ML pipelines (train model, export weights, serve predictions)

GETS WRONG:
- Concurrency patterns (race conditions are invisible in generated code)
- State management at scale (the model shows you the simple version)
- Distributed systems (it doesn't understand failure modes you haven't described)
- Complex business logic (model hallucinates domain rules it can't know)
- Security-sensitive code (it doesn't understand threat models)

Your job: know the difference. Generate the easy stuff. Architect the hard stuff.
"""
```

### 5. Tool Ecology

Knowing the right tools speeds up the loop. The model accelerates everything, but only if you know what to ask it to build.

```python
"""
The vibe coder's toolkit (essential, not aspirational):

Dev:
  - A good terminal (tmux for session management, fzf for search)
  - IDE with LSP (you still need autocomplete even when another model writes)
  - Docker (spin up databases, services, environments in seconds)
  
Testing:
  - pytest + coverage (model-generated tests are incomplete; you verify)
  - A way to run the model's code in isolation (fast feedback loop)
  
Data:
  - sqlite3 (you don't need postgres for everything — the model loves sqlite)
  - jq (for verifying API responses from the terminal)
  - curl/HTTPie (for testing endpoints the model built)
  
Monitoring:
  - Structured logging (json lines, not print statements)
  - A way to track latency and cost (model outputs vary; monitor it)
  
Deployment:
  - GitHub Actions (CI/CD the model can configure)
  - A hosting platform that matches complexity (fly.io, render, AWS — pick one)
  
The rest is noise. Pick your stack. Master it. Ship.
"""
```

### 6. The Meta-Skills

These aren't technical. They keep you from losing your mind.

```python
"""
Meta-skills you didn't expect to need but now can't live without:

1. Patience
   → The model will generate code that looks perfect and fails on line 47.
   → It will be right 95% of the time. The 5% is where your value lives.
   
2. Imposter syndrome management
   → You are not \"faking it.\" You're doing things no one could do 3 years ago.
   → Vibe coding requires the same engineering judgment. You just apply it upstream.
   
3. Systematic verification
   → Don't trust the code. Trust the tests. Trust the logs. Trust the model outputs only after verification.
   → Every output is a draft. You are the last line of defense.
   
4. Continuous learning
   → The model's capabilities shift monthly. Your skills need to keep pace.
   → Read what changed. Experiment. Discard what doesn't work. Keep what does.
   
5. Saying \"no\" to the model
   → Sometimes the right answer is: \"that's not the right approach. Let me think about it.\"
   → The model is a tool. Not an oracle. Not a replacement for thinking.
"""
```

### Summary

Vibe coding is not \"let AI do everything.\" It's \"use AI to go faster, keep your engineering judgment sharp.\"

- **Prompt engineering**: write constraints, give examples, use system prompts.
- **Code review**: understand every line the model generates. Test everything.
- **Debugging**: read errors, isolate variables, verify fixes.
- **Architecture judgment**: know what the model gets right and where you need to step in.
- **Tool ecology**: a small, well-mastered toolkit beats a large, half-learned one.
- **Meta-skills**: patience, verification, learning, and knowing when to stop.

The model handles the boilerplate. You handle the judgment. Ship fast, but ship what works.
