---
title: Links
permalink: /links/
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

<section class="page-head">
  <div>
    <p class="eyebrow">Directory</p>
    <h1>Useful Links</h1>
  </div>
  <span class="count">{{ total_links }} entries</span>
</section>

<section class="filters" data-link-filters>
  <label>
    <span>Search</span>
    <input type="search" placeholder="Search title, URL, notes, tags" data-filter-search>
  </label>
  <label>
    <span>Topic</span>
    <select data-filter-topic>
      <option value="">All</option>
      {% for topic in site.data.link_topics %}<option value="{{ topic.slug | escape }}">{{ topic.title }}</option>{% endfor %}
    </select>
  </label>
  <label>
    <span>Category</span>
    <select data-filter-category>
      <option value="">All</option>
      {% for topic in site.data.link_topics %}
        {% assign topic_data = site.data.links[topic.slug] %}
        {% if topic_data %}
          {% for category_pair in topic_data %}
            {% assign first_link = category_pair[1] | first %}
            <option value="{{ category_pair[0] | escape }}" data-topic-option="{{ topic.slug | escape }}">{{ topic.title }} / {{ first_link.category | default: category_pair[0] }}</option>
          {% endfor %}
        {% endif %}
      {% endfor %}
    </select>
  </label>
  <label>
    <span>Section</span>
    <input type="search" placeholder="Filter section" data-filter-section>
  </label>
</section>

<section class="link-directory" data-link-list>
  {% for topic in site.data.link_topics %}
    {% assign topic_data = site.data.links[topic.slug] %}
    {% if topic_data %}
      <section class="topic-section" data-topic-section="{{ topic.slug | escape }}">
        <header>
          <div>
            <p class="eyebrow">{{ topic.slug }}</p>
            <h2>{{ topic.title }}</h2>
          </div>
          <p>{{ topic.description }}</p>
        </header>
        {% for category_pair in topic_data %}
          {% assign first_link = category_pair[1] | first %}
          <section class="category-section" data-category-section="{{ category_pair[0] | escape }}">
            <div class="category-head">
              <h3>{{ first_link.category | default: category_pair[0] }}</h3>
              <span class="count">{{ category_pair[1].size }} links</span>
            </div>
            <div class="link-grid">
              {% for link in category_pair[1] %}
                {% assign current_category_slug = category_pair[0] %}
                {% include link-card.html link=link category_slug=current_category_slug topic_slug=topic.slug %}
              {% endfor %}
            </div>
          </section>
        {% endfor %}
      </section>
    {% endif %}
  {% endfor %}
</section>

<p class="empty" data-empty hidden>No matching links.</p>
