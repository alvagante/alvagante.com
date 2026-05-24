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
          <p class="eyebrow">Links and daily news about the stuff that matters (to me)</p>
          <div class="home-title-row">
            <h1>Alvagante</h1>
            <nav class="social-links" aria-label="Social profiles">
              <a href="https://github.com/alvagante/" aria-label="GitHub profile">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 12 .5Z"/>
                </svg>
              </a>
              <a href="https://www.linkedin.com/in/alessandrofranceschi/" aria-label="LinkedIn profile">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.32 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.53V9H7.1v11.45ZM22.23 0H1.76C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.76 24h20.47c.97 0 1.77-.77 1.77-1.73V1.73C24 .77 23.2 0 22.23 0Z"/>
                </svg>
              </a>
              <a href="https://x.com/alvagante" aria-label="X profile">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41Z"/>
                </svg>
              </a>
            </nav>
          </div>
          <div class="stats" aria-label="Site summary">
            <div><strong>{{ total_links }}</strong><span>curated links</span></div>
            <div><strong>{{ site.data.link_topics.size }}</strong><span>topics</span></div>
            <div><strong>{{ category_count }}</strong><span>categories</span></div>
            <div><strong>{{ source_count }}</strong><span>active sources</span></div>
          </div>
          <section class="project-links" aria-labelledby="project-links-title">
            <h2 id="project-links-title">My projects</h2>
            <ul>
              <li><a href="https://example42.com" target="_blank" rel="noopener">example42.com</a><span>Puppet, DevOps, open source infrastructure automation, and consulting.</span></li>
              <li><a href="https://lab42.it" target="_blank" rel="noopener">lab42.it</a><span>Independent research and consulting across infrastructure, AI, and media.</span></li>
              <li><a href="https://pabawi.example42.com" target="_blank" rel="noopener">pabawi.example42.com</a><span>Open source web command and control for classic infrastructures.</span></li>
              <li><a href="https://labrigatadeigeekestinti.com" target="_blank" rel="noopener">labrigatadeigeekestinti.com</a><span>Italian geek and technology podcast with a rotating crew.</span></li>
            </ul>
          </section>
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
