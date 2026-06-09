---
title: Interests
permalink: /interests/
---

<section class="page-head">
  <div>
    <p class="eyebrow">Browse</p>
    <h1>Interests</h1>
    <p class="lede">Curated links across the topics that matter -- AI, security, IT, technology, science, and geopolitics.</p>
  </div>
</section>

<section class="link-directory" data-link-list>
  {% for child in site.data.link_topics[0].children %}
    {% assign topic_entry = child %}
    {% assign slug = child.slug %}
    {% assign topic_data = site.data.links.interests[slug] %}
    {% assign topic = child %}
    <section class="topic-section" data-topic-section="{{ slug | escape }}">
      <header>
        <div>
          <p class="eyebrow">{{ slug }}</p>
          <h2>{{ topic.title }}</h2>
        </div>
        <p>{{ topic.description }}</p>
      </header>
      {% if topic_data %}
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
                {% include link-card.html link=link category_slug=current_category_slug topic_slug=slug %}
              {% endfor %}
            </div>
          </section>
        {% endfor %}
      {% endif %}
    </section>
  {% endfor %}
</section>

<p class="empty" data-empty hidden>No matching links.</p>
