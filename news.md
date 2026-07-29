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
  {% assign latest = latest_pair[1] %}
  {% assign news_day_docs = site.news_days | sort: "digest_date" %}
  {% capture available_dates_csv %}{% for doc in news_day_docs %}{{ doc.digest_date }}{% unless forloop.last %},{% endunless %}{% endfor %}{% endcapture %}
  {% assign available_dates = available_dates_csv | split: "," %}

  <section class="news-controls" data-news-filters data-news-base="{{ '/news/' | relative_url }}">
    <label>
      <span>Date</span>
      <input type="date" value="{{ latest_date }}" min="{{ first_date }}" max="{{ latest_date }}" data-news-date>
    </label>
  </section>

  <script type="application/json" data-news-available-dates>{{ available_dates | jsonify }}</script>

  <p class="empty" data-news-empty hidden>No digest found for the selected date.</p>

  <section class="digest-index" data-news-list>
    {% include news-day.html date=latest_date generated_at=latest.generated_at items=latest.items %}
  </section>
{% else %}
  <p class="empty">No generated digest yet.</p>
{% endif %}
