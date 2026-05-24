---
title: Dashboard
---

{% assign total_links = 0 %}
{% for topic in site.data.link_topics %}
  {% assign topic_data = site.data.links[topic.slug] %}
  {% if topic_data %}
    {% for category_pair in topic_data %}
      {% assign total_links = total_links | plus: category_pair[1].size %}
    {% endfor %}
  {% endif %}
{% endfor %}
{% assign source_count = site.data.news_sources | where: "enabled", true | size %}

<section class="hero">
  <div class="hero-copy">
    <img class="hero-logo" src="{{ site.logo | relative_url }}" alt="Alvagante logo">
    <p class="eyebrow">Personal curation</p>
    <h1>Alvagante</h1>
    <p class="lede">A compact directory of useful tools, references, and daily news signals.</p>
  </div>
  <div class="stats" aria-label="Site summary">
    <div><strong>{{ total_links }}</strong><span>curated links</span></div>
    <div><strong>{{ site.data.link_topics.size }}</strong><span>topics</span></div>
    <div><strong>{{ source_count }}</strong><span>active sources</span></div>
  </div>
</section>

<section class="band">
  <div class="section-head">
    <h2>Useful Links</h2>
    <a href="{{ '/links/' | relative_url }}">Open directory</a>
  </div>
  <div class="compact-grid">
    {% assign shown_links = 0 %}
    {% for topic in site.data.link_topics %}
      {% assign topic_data = site.data.links[topic.slug] %}
      {% if topic_data %}
        {% for category_pair in topic_data %}
          {% for link in category_pair[1] %}
            {% if shown_links < 6 %}
              {% assign current_category_slug = category_pair[0] %}
              {% include link-card.html link=link compact=true category_slug=current_category_slug topic_slug=topic.slug %}
              {% assign shown_links = shown_links | plus: 1 %}
            {% endif %}
          {% endfor %}
        {% endfor %}
      {% endif %}
    {% endfor %}
  </div>
</section>

<section class="band">
  <div class="section-head">
    <h2>Latest Digest</h2>
    <a href="{{ '/news/' | relative_url }}">Open news</a>
  </div>
  {% assign digest_files = site.data.generated.news %}
  {% if digest_files %}
    {% assign latest_pair = digest_files | sort | last %}
    {% assign latest = latest_pair[1] %}
    <div class="digest-preview">
      <div>
        <p class="meta">{{ latest.date | default: latest_pair[0] }}</p>
        <h3>{{ latest.items.size }} ranked items</h3>
      </div>
      <div class="news-list">
        {% for item in latest.items limit: 4 %}
          {% include news-item.html item=item %}
        {% endfor %}
      </div>
    </div>
  {% else %}
    <p class="empty">No generated digest yet. Run <code>swamp workflow run daily-news</code> after configuring the model.</p>
  {% endif %}
</section>
