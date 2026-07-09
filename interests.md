---
title: Interests
description: Curated topic directories for AI, security, IT, technology, science, and geopolitics, each with hand-picked resources and related digest items.
permalink: /interests/
---

<section class="page-head">
  <div>
    <p class="eyebrow">Browse</p>
    <h1>Interests</h1>
    <p class="lede">Curated links across the topics that matter -- AI, security, IT, technology, science, and geopolitics.</p>
  </div>
</section>

<section class="topic-section">
  <header>
    <div>
      <p class="eyebrow">Topics</p>
      <h2>Interest Pages</h2>
    </div>
    <p>Open a focused page for links and digest items on each topic.</p>
  </header>

  <div class="compact-grid">
    {% for child in site.data.link_topics[0].children %}
      {% assign topic_data = site.data.links[child.data_key][child.slug] %}
      {% assign total_links = 0 %}
      {% if topic_data %}
        {% for category_pair in topic_data %}
          {% assign total_links = total_links | plus: category_pair[1].size %}
        {% endfor %}
      {% endif %}
      <article class="link-card">
        <div>
          <p class="eyebrow">{{ child.slug }}</p>
          <h2><a href="{{ '/' | append: child.slug | append: '/' | relative_url }}">{{ child.title }}</a></h2>
        </div>
        <p class="description">{{ child.description }}</p>
        <div class="chips">
          <span>{{ topic_data.size | default: 0 }} categories</span>
          <span>{{ total_links }} links</span>
        </div>
      </article>
    {% endfor %}
  </div>
</section>
