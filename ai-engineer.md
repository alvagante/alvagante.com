---
layout: post
title: AI Engineer
permalink: /ai-engineer/
---

Deep dive into AI engineering — architecture, infrastructure, and practical guides for building, deploying, and maintaining AI systems.

<div class="blog-list">
{% assign posts = site.ai-blog | sort: "date" | reverse %}
{% for post in posts %}
  <article>
    <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%d %b, %Y" }}</time>
    — <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
  </article>
{% endfor %}
</div>
