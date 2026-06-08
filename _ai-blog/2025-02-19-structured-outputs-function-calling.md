---
title: Structured Outputs & Function Calling
date: 2025-02-19
layout: post
category: play
collection: ai-blog
---
## Structured Outputs & Function Calling

JSON is a schema. Functions are APIs. Here's how to make LLMs use them reliably (and why they won't do it if you ask them nicely).

### The Core Problem

LLMs output text. APIs need structured data. Bridging this gap is the #1 practical challenge in AI systems engineering. It sounds simple ("just parse the JSON"). It isn't.

```python
# The "simple" approach that fails:
def naive_structured_output(prompt):
    """Naive approach: ask LLM for JSON, parse the result."""
    text = get_llm_response(f"Return ONLY a JSON object. {prompt}")
    return json.loads(text)  # Often fails because:
    # 1. LLM adds markdown (```json ... ```)
    # 2. LLM adds explanatory text before JSON
    # 3. LLM uses single quotes instead of double
    # 4. LLM forgets a comma
    # 5. LLM outputs a number in quotes
```

### JSON Mode is Not Magic

"JSON mode" is a feature in many APIs that forces the model to output JSON. But:
- It enforces well-formedness, not schema compliance
- The model still needs to "understand" the schema
- It doesn't prevent hallucinated keys

```python
# JSON mode helps with:
# - Syntax correctness (valid JSON)
# - Removing markdown wrapping
# - Preventing explanatory text

# But JSON mode does NOT help with:
# - Schema compliance ("you asked for {name, age}" but model returns {name, age, color"})
# - Type correctness ("age" should be int, not string)
# - Missing required fields
# - Extra fields not in your schema

# So: JSON mode + validation = the reliable approach
# Parse the JSON (handle markdown, single quotes, etc.)
# Validate against your schema (Pydantic, jsonschema)
# Reject and retry if validation fails
```

### Function Calling: The Right Way

Function calling lets you define API-like functions that the model can call. It's not "prompting for JSON." It's a structured interface.

```python
from openai import OpenAI

client = OpenAI(api_key="...")

# Define functions the model can call
functions = [
    {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City and state, e.g. San Francisco, CA"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature unit"
                }
            },
            "required": ["location"]
        }
    }
]

# First call: model decides to call get_weather
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "What's the weather in San Francisco?"}],
    functions=functions
)

# Model returns:
# {
#   "name": "get_weather",
#   "arguments": '{"location": "San Francisco, CA", "unit": "fahrenheit"}'
# }

# Second call: you call the function, get the result, send it back
weather = get_weather("San Francisco, CA", "fahrenheit")

response2 = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "user", "content": "What's the weather in San Francisco?"},
        {"role": "assistant", "content": None, "function_call": {
            "name": "get_weather",
            "arguments": '{"location": "San Francisco, CA", "unit": "fahrenheit"}'
        }},
        {"role": "function", "name": "get_weather", "content": str(weather)}
    ],
    functions=functions
)

# The model now has the function's return value and can summarize it
# "The weather in San Francisco is 72°F with clear skies"
```

### Schema Design for LLMs

Writing schemas that LLMs can actually use is different from writing schemas for code. Here's what matters:

```python
# GOOD schema design for LLMs:
good_schema = {
    "name": "create_ticket",
    "description": "Create a new bug ticket. Use this when the user reports a bug.",
    "parameters": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": "Brief description of the bug"
            },
            "description": {
                "type": "string",
                "description": "Detailed description including steps to reproduce"
            },
            "priority": {
                "type": "string",
                "enum": ["low", "medium", "high", "critical"],
                "description": "Priority level"
            },
            "component": {
                "type": "string",
                "description": "Which component is affected (frontend, backend, database, API)"
            }
        },
        "required": ["title", "description", "priority"]
    }
}

# BAD schema design for LLMs:
bad_schema = {
    "name": "create_ticket",  # No description → model doesn't know WHEN to call
    "parameters": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},  # No description → model might guess wrong
            "desc": {"type": "string"},   # Wrong name → model might output "description"
            "pri": {"type": "string"},    # Abbreviated → model might use "high" not "high"
            "comp_id": {"type": "integer"}  # Integer → model might output "frontend" (string)
        },
        "required": ["title"]  # "desc" is required but not in "required" → model gets confused
    }
}

# Key principles for LLM-friendly schemas:
# 1. Every field has a clear description
# 2. Every enum has an explanation (not just the values)
# 3. Use "required" to indicate what's mandatory
# 4. Keep it simple. Complex schemas confuse models.
# 5. Prefer enums over free-text when you have limited options
# 6. Use clear, unambiguous names (not abbreviations)
```

### Handling Common Failure Modes

LLMs will make mistakes with structured output. Here's how to handle them:

```python
import json
import re

def robust_json_parse(text):
    """
    Parse JSON from LLM output, handling common failure modes.
    
    Common failures:
    - Markdown wrapping (```json ... ```)
    - Single quotes instead of double quotes
    - Trailing commas
    - Extra text after JSON
    """
    # Step 1: Extract JSON from markdown
    json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL)
    if json_match:
        text = json_match.group(1).strip()
    else:
        # Step 2: Extract first JSON object
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            text = match.group(0)
        else:
            raise ValueError("No JSON found in output")
    
    # Step 3: Fix unescaped newlines (common in multi-line strings)
    text = text.replace('\n', '\\n')
    
    # Step 4: Try to parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Step 5: Remove trailing commas (common LLM mistake)
        text = re.sub(r',\s*([}\]])', r'\1', text)
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse JSON: {e}")

# Validation: use Pydantic or jsonschema to validate the parsed JSON
from pydantic import BaseModel, ValidationError

class WeatherRequest(BaseModel):
    location: str
    unit: str = "fahrenheit"

def validate_weather_response(raw_json):
    try:
        return WeatherRequest(**raw_json)
    except ValidationError as e:
        # Return the error to the model so it can self-correct
        return f"Invalid response. Please fix: {str(e)}"
```

### Function Calling vs. Structured Output Prompting

When to use which?

```python
"""
Function Calling:
- You have a well-defined set of actions (APIs, tools)
- The model needs to decide WHICH tool to use and with WHAT parameters
- The tool outputs are deterministic (weather API, search API, DB query)
- You have control over the tool functions

Structured Output Prompting:
- You just need structured data (no tools needed)
- The output format is complex or variable
- You're not calling external APIs
- Example: generating config files, reports, analysis results

Use function calling when the model needs to ACT on the world.
Use structured output when the model needs to RETURN structured data.
Don't mix them (that's just over-engineering).
"""
```

### Practical Tips for Reliable Structured Output

1. **Always validate**: Even with "JSON mode," validate output before trusting it.
2. **Retry on failure**: If validation fails, send the error back to the model and ask it to try again. Most models correct themselves on the second try.
3. **Keep schemas simple**: Complex schemas break LLMs. Split complex objects into smaller ones.
4. **Use enums over free text**: When you can, use enums with clear descriptions. Models are better at choosing from options than generating from scratch.
5. **Include examples**: Few-shot examples improve structured output by 20-30% on complex schemas.
6. **Test with bad inputs**: How does your schema handle edge cases? Null inputs? Special characters? Unicode?

### Summary

Structured output is the bridge between text generation and API integration:
- Function calling for tools and API use
- JSON schema for structured data
- Validation for reliability
- Retry for handling failures

Build reliable systems with structured output. Test with bad inputs. Validate everything. Don't trust the model's output — verify it.
