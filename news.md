---
title: News
permalink: /news/
---

<section class="page-head">
  <div>
    <p class="eyebrow">Daily digests</p>
    <h1>News</h1>
  </div>
</section>

{% assign digests = site.data.generated.news %}
{% if digests %}
  {% assign sorted = digests | sort | reverse %}
  <section class="digest-index">
    {% for pair in sorted %}
      {% assign digest = pair[1] %}
      <article class="digest-day" id="{{ pair[0] }}">
        <header>
          <div>
            <p class="meta">{{ digest.generated_at | default: digest.date }}</p>
            <h2>{{ digest.date | default: pair[0] }}</h2>
          </div>
          <span class="count">{{ digest.items.size }} items</span>
        </header>
        {% assign categories = digest.items | map: "category" | uniq | sort %}
        {% for category in categories %}
          <h3>{{ category }}</h3>
          <div class="news-list">
            {% assign category_items = digest.items | where: "category", category | sort: "relevance" | reverse %}
            {% for item in category_items %}
              {% include news-item.html item=item %}
            {% endfor %}
          </div>
        {% endfor %}
      </article>
    {% endfor %}
  </section>
{% else %}
  <p class="empty">No generated digest yet.</p>
{% endif %}
