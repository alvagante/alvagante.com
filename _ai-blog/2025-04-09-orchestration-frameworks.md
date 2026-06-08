---
title: Orchestration Frameworks
date: 2025-04-09
layout: post
category: play
collection: ai-blog
---
## Orchestration Frameworks

LangChain is a dependency tree. LlamaIndex is RAG-specific. DSPy is the weird one that might actually work. Here's when to use which.

### The Orchestration Landscape

Orchestration frameworks are libraries that help you connect LLMs to tools, databases, and other services. They're called "orchestrators" because they let you manage the flow of data between components.

The problem: "orchestration" is just "function calling with more features." Every framework is doing the same thing — making it easier to call APIs from a model output. Each has different trade-offs.

```python
"""
Orchestration frameworks, compared:

1. LangChain
   - Most popular, most criticized
   - Pros: huge ecosystem, community support, lots of documentation
   - Cons: bloated, confusing API, too many abstractions
   - Verdict: Use if you need the ecosystem. Otherwise, avoid.

2. LlamaIndex
   - RAG-specific
   - Pros: excellent RAG primitives, data connectors, query engines
   - Cons: not great for non-RAG tasks
   - Verdict: Use for RAG. Not for general orchestration.

3. DSPy
   - Compile-time optimization framework
   - Pros: teaches the model to use tools automatically, learns prompt structure
   - Cons: steep learning curve, limited ecosystem
   - Verdict: Use for structured prompting and tool use

4. AutoGen (Microsoft)
   - Multi-agent framework
   - Pros: great for multi-agent scenarios, built-in tool use
   - Cons: complex, fragile for production
   - Verdict: Use for multi-agent experimentation.

5. CrewAI
   - Role-playing agents
   - Pros: easy to get started, good documentation
   - Cons: limited flexibility, hard to debug
   - Verdict: Use for simple multi-agent tasks.

6. Build your own
   - The best option for most teams
   - Pros: full control, no dependency bloat, predictable behavior
   - Cons: you're doing the work
   - Verdict: The default for production. Don't be afraid of it.
"""
```

### Why Most Frameworks Are Bad for Production

```python
"""
Framework anti-patterns:

1. Abstraction leakage: Every abstraction leaks eventually. You'll need the raw API anyway.
2. Dependency bloat: LangChain pulls in 37 dependencies. Do you need all of them?
3. Performance costs: Extra layers = slower responses = more tokens = more cost
4. Debugging: "Where is the bug? In my code? In the framework? In a dependency?"
5. Version hell: frameworks change APIs constantly. Update = rewrite.

Rule of thumb: build your own orchestration for production. Use frameworks for prototyping.
"""
```

### Building Your Own Orchestration (It's Simple)

```python
import requests
from typing import List, Dict, Callable

class SimpleOrchestrator:
    """
    A minimal orchestration layer.
    This is all you need for most AI systems.
    """
    
    def __init__(self):
        self.tools = {}  # tool_name → (description, function)
    
    def register_tool(self, name: str, description: str, func: Callable):
        """Register a tool the model can call."""
        self.tools[name] = {
            "name": name,
            "description": description,
            "func": func,
        }
    
    def get_tools_spec(self) -> List[Dict]:
        """Get the function spec for the model."
        return [
            {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": {},  # You'd add a schema here
            }
            for tool in self.tools.values()
        ]
    
    def execute_tool(self, tool_name: str, arguments: Dict):
        """Execute a tool with given arguments."""
        if tool_name not in self.tools:
            raise ValueError(f"Tool {tool_name} not found")
        
        return self.tools[tool_name]["func"](**arguments)

# Example: register a weather tool
weather_lookup = {
    "san_francisco": {"temp": 72, "condition": "foggy"},
    "london": {"temp": 55, "condition": "rainy"},
    "tokyo": {"temp": 80, "condition": "sunny"},
}

def get_weather(city: str):
    return weather_lookup.get(city.lower(), {"error": "City not found"})

orch = SimpleOrchestrator()
orch.register_tool("get_weather", "Get weather for a city", get_weather)

# Now pass the tools to the model. The model will call them.
tools_spec = orchestrator.get_tools_spec()

# This is LangChain's FunctionCallingAgent, minus 37 dependencies.
# No framework is needed. You're writing function call logic with 10 lines of code.
```

### When Frameworks Are Worth It

```python
"""
Use a framework when:

1. You're prototyping: frameworks let you move fast
2. You need the ecosystem: LangChain's tool integrations are real
3. Your team has no AI experience: frameworks provide structure
4. You're doing something the framework already solves for

Don't use a framework when:

1. You're in production: build your own orchestration
2. You need performance: extra layers cost latency
3. You need control: frameworks hide complexity you need to understand
4. You're building a core business component: frameworks lock you in

Build your own. Test it. Keep it simple. Frameworks are for exploration, not production.
"""
```

### DSPy: The Framework That's Actually Useful

DSPy (from Stanford) is different because it doesn't just orchestrate — it OPTIMIZES. It finds the best prompt structure and parameters automatically.

```python
"""
DSPy (Declarative Self-improving Python):
- Define the task as a function (not a prompt)
- DSPy optimizes the prompt automatically
- It "compiles" your function into an optimized prompt
- No more hand-tuning prompts

Example:
    class QA(dspy.Signature):
        """Answer questions based on context."""
        context = dspy.InputField()
        question = dspy.InputField()
        answer = dspy.OutputField()
    
    qna = dspy.Predict(QA)
    
    # DSPy optimizes the prompt for this signature to maximize accuracy
    # You don't write the prompt. DSPy generates and tunes it.

When to use DSPy:
- You have a small dataset you can optimize on
- You need consistent output quality across many inputs
- You're tired of prompt engineering

When NOT to use DSPy:
- Your task doesn't have an optimization objective
- You need human-readable prompts (DSPy-generated prompts are opaque)
- You're doing real-time tasks where compilation is too slow
"""
```

### Summary

Orchestration frameworks:
- **LangChain**: ecosystem over everything. Great for prototyping, bad for production.
- **LlamaIndex**: RAG-specific. Excellent for data connectors and query engines.
- **DSPy**: compiles prompts. Great for optimizing prompt structure.
- **AutoGen/CrewAI**: multi-agent frameworks. Good for exploration, fragile for production.
- **Build your own**: the best option for production. 10 lines of code = orchestrator.

Build your own orchestration for production. Use frameworks for prototyping. The code is simpler than you think.
