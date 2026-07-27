---
title: News
seo_title: Daily AI-Assisted News Digest
description: Daily AI-assisted digest of news from selected feeds across AI, security, IT, technology, gaming, science, geopolitics, and economy.
permalink: /news/
---

<section class="page-head">
  <div>
    <p class="eyebrow">Daily digests</p>
    <h1>News</h1>
    <p class="lede">A daily, AI-assisted briefing ranked from selected sources. Pick a date or narrow it by topic.</p>
  </div>
</section>

{% assign digests = site.data.generated.news %}
{% if digests %}
  {% assign sorted_digests = digests | sort %}
  {% assign first_pair = sorted_digests | first %}
  {% assign latest_pair = sorted_digests | last %}
  {% assign first_date = first_pair[0] %}
  {% assign latest_date = latest_pair[0] %}

  <section class="news-controls" data-news-filters>
    <label>
      <span>Date</span>
      <input type="date" value="{{ latest_date }}" min="{{ first_date }}" max="{{ latest_date }}" data-news-date>
    </label>
    <div class="news-controls__categories" aria-label="News category filters" data-news-categories>
      <button class="is-active" type="button" data-news-category="all" aria-pressed="true">All</button>
      {% for source_file in site.data.sources %}
        {% assign source = source_file[1] | first %}
        {% if source.category %}
          <button type="button" data-news-category="{{ source.category | downcase | escape }}" aria-pressed="false">{{ source.category }}</button>
        {% endif %}
      {% endfor %}
    </div>
  </section>

  <p class="empty" data-news-empty hidden>No digest found for the selected filters.</p>

  <section class="digest-index" data-news-list>
    {% for pair in sorted_digests reversed %}
      {% assign digest_date = pair.first %}
      {% assign digest = pair.last %}
      <article class="digest-day" id="{{ digest_date }}" data-news-day data-news-date-value="{{ digest_date }}">
        <header>
          <div>
            <p class="meta">{{ digest.generated_at | default: digest.date }}</p>
            <h2>{{ digest.date | default: digest_date }}</h2>
          </div>
          <span class="count">{{ digest.items.size }} items</span>
        </header>
        {% assign categories = digest.items | map: "category" | uniq | sort %}
        {% for category in categories %}
          <section class="news-category" data-news-category-section="{{ category | downcase | escape }}">
            <h3>{{ category }}</h3>
            <div class="news-list">
              {% assign category_items = digest.items | where: "category", category | sort: "relevance" | reverse %}
              {% for item in category_items %}
                {% include news-item.html item=item %}
              {% endfor %}
            </div>
          </section>
        {% endfor %}
      </article>
    {% endfor %}
  </section>
{% else %}
  <p class="empty">No generated digest yet.</p>
{% endif %}
