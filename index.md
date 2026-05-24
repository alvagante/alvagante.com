---
title: Dashboard
---

{% assign total_links = 0 %}
{% assign category_count = 0 %}
{% for topic in site.data.link_topics %}
  {% assign topic_data = site.data.links[topic.slug] %}
  {% if topic_data %}
    {% for category_pair in topic_data %}
      {% assign total_links = total_links | plus: category_pair[1].size %}
      {% assign category_count = category_count | plus: 1 %}
    {% endfor %}
  {% endif %}
{% endfor %}
{% assign source_count = 0 %}
{% for source_file in site.data.sources %}
  {% assign enabled_sources = source_file[1] | where: "enabled", true | size %}
  {% assign source_count = source_count | plus: enabled_sources %}
{% endfor %}
{% assign first_category_key = "" %}
{% for topic in site.data.link_topics %}
  {% assign topic_data = site.data.links[topic.slug] %}
  {% if topic_data and first_category_key == "" %}
    {% for category_pair in topic_data limit: 1 %}
      {% assign first_category_key = topic.slug | append: "__" | append: category_pair[0] %}
    {% endfor %}
  {% endif %}
{% endfor %}

<section class="home-summary">
  <table class="home-summary__table">
    <tbody>
      <tr>
        <td class="home-summary__logo-cell">
          <img class="home-logo" src="{{ site.logo | relative_url }}" alt="Alvagante logo">
        </td>
        <td class="home-summary__stats-cell">
          <p class="eyebrow">My curation of links and daily news</p>
          <h1>Alvagante</h1>
          <div class="stats" aria-label="Site summary">
            <div><strong>{{ total_links }}</strong><span>curated links</span></div>
            <div><strong>{{ site.data.link_topics.size }}</strong><span>topics</span></div>
            <div><strong>{{ category_count }}</strong><span>categories</span></div>
            <div><strong>{{ source_count }}</strong><span>active sources</span></div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="topic-tree" data-home-link-picker>
    {% for topic in site.data.link_topics %}
      {% assign topic_data = site.data.links[topic.slug] %}
      {% if topic_data %}
        <details class="topic-tree__topic"{% if forloop.first %} open{% endif %}>
          <summary>
            <span>{{ topic.title }}</span>
            <span>{{ topic_data.size }} categories</span>
          </summary>
          <div class="topic-tree__categories">
            {% for category_pair in topic_data %}
              {% assign first_link = category_pair[1] | first %}
              {% assign category_key = topic.slug | append: "__" | append: category_pair[0] %}
              <button class="{% if category_key == first_category_key %}is-active{% endif %}" type="button" data-home-category="{{ category_key | escape }}" aria-pressed="{% if category_key == first_category_key %}true{% else %}false{% endif %}">
                <span>{{ first_link.category | default: category_pair[0] }}</span>
                <span>{{ category_pair[1].size }}</span>
              </button>
            {% endfor %}
          </div>
        </details>
      {% endif %}
    {% endfor %}
  </div>

  <div class="home-selected-links" data-home-link-results>
    {% for topic in site.data.link_topics %}
      {% assign topic_data = site.data.links[topic.slug] %}
      {% if topic_data %}
        {% for category_pair in topic_data %}
          {% assign first_link = category_pair[1] | first %}
          {% assign category_key = topic.slug | append: "__" | append: category_pair[0] %}
          <section class="home-category-panel" data-home-category-panel="{{ category_key | escape }}" {% unless category_key == first_category_key %}hidden{% endunless %}>
            <div class="section-head">
              <div>
                <p class="eyebrow">{{ topic.title }}</p>
                <h2>{{ first_link.category | default: category_pair[0] }}</h2>
              </div>
              <a href="{{ '/links/' | relative_url }}">Open directory</a>
            </div>
            <div class="link-grid">
              {% for link in category_pair[1] %}
                {% assign current_category_slug = category_pair[0] %}
                {% include link-card.html link=link category_slug=current_category_slug topic_slug=topic.slug %}
              {% endfor %}
            </div>
          </section>
        {% endfor %}
      {% endif %}
    {% endfor %}
  </div>
</section>

<section class="band">
  <div class="section-head">
    <h2>News of todat</h2>
    <a href="{{ '/news/' | relative_url }}">Open news</a>
  </div>
  {% assign digest_files = site.data.generated.news %}
  {% if digest_files %}
    {% assign latest_pair = digest_files | sort | last %}
    {% assign latest = latest_pair[1] %}
    {% assign latest_categories = latest.items | map: "category" | uniq | sort %}
    <div class="home-news" data-home-news>
      <div class="home-news__head">
        <div>
          <p class="meta">{{ latest.date | default: latest_pair[0] }}</p>
          <h3>{{ latest.items.size }} ranked items</h3>
        </div>
        <div class="news-controls__categories" aria-label="News of the day category filters">
          <button class="is-active" type="button" data-home-news-category="all" aria-pressed="true">All</button>
          {% for category in latest_categories %}
            <button type="button" data-home-news-category="{{ category | downcase | escape }}" aria-pressed="false">{{ category }}</button>
          {% endfor %}
        </div>
      </div>
      <div class="news-list">
        {% assign ranked_items = latest.items | sort: "relevance" | reverse %}
        {% for item in ranked_items %}
          {% include news-item.html item=item %}
        {% endfor %}
      </div>
    </div>
  {% else %}
    <p class="empty">No generated digest yet. Run <code>swamp workflow run daily-news</code> after configuring the model.</p>
  {% endif %}
</section>
