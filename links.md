---
title: Links
permalink: /links/
---

{% assign total_links = 0 %}
{% for topic in site.data.link_topics %}
    {% if topic.slug == 'interests' and topic.children %}
      {% for child in topic.children %}
        {% if site.data.links[child.data_key][child.slug] %}
          {% for cat in site.data.links[child.data_key][child.slug] %}
            {% assign total_links = total_links | plus: cat[1].size %}
          {% endfor %}
        {% endif %}
      {% endfor %}
    {% elsif site.data.links[topic.slug] %}
      {% for category_pair in site.data.links[topic.slug] %}
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
      {% for child in site.data.link_topics[0].children %}
        {% if child.data_key %}
        <option value="{{ child.slug | escape }}">{{ child.title }}</option>
        {% endif %}
      {% endfor %}
      {% for topic in site.data.link_topics %}
        {% unless topic.slug == 'interests' %}
          {% if site.data.links[topic.slug] %}
          <option value="{{ topic.slug | escape }}">{{ topic.title }}</option>
          {% endif %}
        {% endunless %}
      {% endfor %}
    </select>
  </label>
  <label>
    <span>Category</span>
    <select data-filter-category>
      <option value="">All</option>
      {% for child in site.data.link_topics[0].children %}
        {% if child.data_key %}
        {% assign child_data = site.data.links[child.data_key][child.slug] %}
        {% if child_data %}
          {% for category_pair in child_data %}
            {% assign first_link = category_pair[1] | first %}
            <option value="{{ category_pair[0] | escape }}" data-topic-option="{{ child.slug | escape }}">{{ child.title }} / {{ first_link.category | default: category_pair[0] }}</option>
          {% endfor %}
        {% endif %}
        {% endif %}
      {% endfor %}
      {% for topic in site.data.link_topics %}
        {% unless topic.slug == 'interests' %}
          {% assign topic_data = site.data.links[topic.slug] %}
          {% if topic_data %}
            {% for category_pair in topic_data %}
              {% assign first_link = category_pair[1] | first %}
              <option value="{{ category_pair[0] | escape }}" data-topic-option="{{ topic.slug | escape }}">{{ topic.title }} / {{ first_link.category | default: category_pair[0] }}</option>
            {% endfor %}
          {% endif %}
        {% endunless %}
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
    {% if topic.slug == 'interests' and topic.children %}
      {% for child in topic.children %}
        {% assign child_data = site.data.links[child.data_key][child.slug] %}
        {% if child_data %}
        <section class="topic-section" data-topic-section="{{ child.slug | escape }}" id="{{ child.slug }}-{{ child.title | slugify }}">
          <header>
            <div>
              <p class="eyebrow">{{ child.slug }}</p>
              <h2>{{ child.title }}</h2>
            </div>
            <p>{{ child.description }}</p>
          </header>
          {% for category_pair in child_data %}
            {% assign first_link = category_pair[1] | first %}
            <section class="category-section" data-category-section="{{ category_pair[0] | escape }}">
              <div class="category-head">
                <h3>{{ first_link.category | default: category_pair[0] }}</h3>
                <span class="count">{{ category_pair[1].size }} links</span>
              </div>
              <div class="link-grid">
                {% for link in category_pair[1] %}
                  {% assign current_category_slug = category_pair[0] %}
                  {% include link-card.html link=link category_slug=current_category_slug topic_slug=child.slug %}
                {% endfor %}
              </div>
            </section>
          {% endfor %}
        </section>
        {% endif %}
      {% endfor %}
    {% elsif site.data.links[topic.slug] %}
      {% assign topic_data = site.data.links[topic.slug] %}
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
