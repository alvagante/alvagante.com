---
title: Dashboard
seo_title: Alvagante
description: Personal dashboard by Alessandro Franceschi with curated links, AI engineering notes, and daily AI-assisted news digests on AI, security, IT, technology, gaming, science, geopolitics, and economy.
body_class: home
---

{% assign source_count = 0 %}
{% for source_file in site.data.sources %}
  {% assign enabled_sources = source_file[1] | where: "enabled", true | size %}
  {% assign source_count = source_count | plus: enabled_sources %}
{% endfor %}

{% assign interests = site.data.link_topics | where: "slug", "interests" | first %}
{% assign digest_files = site.data.generated.news %}
{% if digest_files %}
  {% assign latest_pair = digest_files | sort | last %}
  {% assign latest = latest_pair[1] %}
  {% assign latest_date = latest.date | default: latest_pair[0] %}
  {% assign ranked_items = latest.items | sort: "relevance" | reverse %}
  {% assign latest_categories = latest.items | map: "category" | uniq | sort %}
{% endif %}

<section class="masthead" aria-label="Projects and AI Engineer notes">
  <div class="container masthead__grid">
    <div class="masthead__col">
      <div class="masthead__head">
        <h2 id="project-links-title">My projects</h2>
        <nav class="social-links" aria-label="Social profiles">
          <a href="https://github.com/alvagante/">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 12 .5Z"/>
          </svg>
          GitHub
        </a>
          <a href="https://www.linkedin.com/in/alessandrofranceschi/">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.32 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.53V9H7.1v11.45ZM22.23 0H1.76C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.76 24h20.47c.97 0 1.77-.77 1.77-1.73V1.73C24 .77 23.2 0 22.23 0Z"/>
          </svg>
          LinkedIn
        </a>
          <a href="https://x.com/alvagante">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41Z"/>
          </svg>
          X
        </a>
      </nav>
      </div>
      <ul class="compact-list">
        <li><a href="https://example42.com" target="_blank" rel="noopener">example42.com</a><span>Puppet, DevOps, infrastructure automation.</span></li>
        <li><a href="https://lab42.it" target="_blank" rel="noopener">lab42.it</a><span>Independent research on infrastructure, AI, and media.</span></li>
        <li><a href="https://lab42.it/smack" target="_blank" rel="noopener">Smack</a><span>What a Pro user wants to know about a Mac.</span></li>
        <li><a href="https://abnormalia.com" target="_blank" rel="noopener">abnormalia.com</a><span>AI slop with style and purpose. 100% Swamp generated</span></li>
        <li><a href="https://pabawi.example42.com" target="_blank" rel="noopener">pabawi.example42.com</a><span>Open source web command and control for classic infrastructures.</span></li>
        <li><a href="https://labrigatadeigeekestinti.com" target="_blank" rel="noopener">labrigatadeigeekestinti.com</a><span>Italian geek and technology podcast with a rotating crew.</span></li>
        <li><a href="https://openskills.info" target="_blank" rel="noopener">openskills.info</a><span>Mini-courses for every IT career path.</span></li>
      </ul>
    </div>
    <div class="masthead__col">
      <div class="masthead__head">
        <h2 id="home-blog-title">AI Engineer</h2>
        <a href="{{ '/ai-engineer/' | relative_url }}">Open section</a>
      </div>
      {% assign blog_posts = site.ai-blog | sort: 'date' | reverse %}
      {% if blog_posts.size > 0 %}
        <ul class="compact-list compact-list--dated">
          {% for post in blog_posts limit:5 %}
            <li>
              <time class="num" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%d %b %Y" }}</time>
              <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
            </li>
          {% endfor %}
        </ul>
      {% else %}
        <p class="empty">No AI engineer content published yet. Check back later or <a href="{{ '/ai-engineer/' | relative_url }}">browse the full section</a>.</p>
      {% endif %}
    </div>
  </div>
</section>

<section class="front" aria-labelledby="front-title">
  <div class="container front__grid">
    <div class="front__text">
      <h1 id="front-title">News of today</h1>
      <p class="lead">Ranked from {{ source_count }} feeds across {{ interests.children.size }} topics, rebuilt every morning.</p>
      <div class="actions">
        <a class="btn btn--primary" href="{{ '/news/' | relative_url }}">Open the full digest</a>
        <a class="btn" href="{{ '/rss.xml' | relative_url }}">RSS feed</a>
      </div>
    </div>

    {% if latest %}
      <div class="sheet front__sheet">
        <div class="sheet__head">
          <h2>Front page</h2>
          <time class="num" datetime="{{ latest_date | date: '%Y-%m-%d' }}">{{ latest_date | date: "%-d %b %Y" }}</time>
        </div>
        <table class="ledger">
          <caption class="visually-hidden">The highest ranked story in each topic today</caption>
          <thead>
            <tr><th scope="col">Topic</th><th scope="col">Story</th><th scope="col" class="num">Score</th></tr>
          </thead>
          <tbody>
            {% for category in latest_categories %}
              {% assign lead_item = ranked_items | where: "category", category | first %}
              <tr>
                <th scope="row">{{ category }}</th>
                <td>
                  <a href="{{ lead_item.url }}" target="_blank" rel="noopener noreferrer">{% if lead_item.source_favicon %}<img class="source-favicon" src="{{ lead_item.source_favicon | escape }}" alt="" width="16" height="16" loading="lazy">{% endif %}{{ lead_item.title | default: lead_item.url }}</a>
                </td>
                <td class="num">{% include score.html value=lead_item.relevance %}</td>
              </tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
    {% endif %}
  </div>
</section>

<section class="stories" aria-labelledby="stories-title">
  <div class="container">
    <div class="split-head">
      <h2 id="stories-title">Every story, by topic</h2>
      <p class="lead">{{ latest.items.size | default: 0 }} items from today's digest, highest score first.</p>
    </div>

    {% if latest %}
      <div class="home-news" data-home-news>
        <div class="home-news__topics" role="group" aria-label="Filter stories by topic">
          <button class="is-active" type="button" data-home-news-category="all" aria-pressed="true" aria-controls="home-news-list">
            <span data-home-news-label>All topics</span><span class="num">{{ latest.items.size }}</span>
          </button>
          {% for category in latest_categories %}
            {% assign category_items = latest.items | where: "category", category %}
            <button type="button" data-home-news-category="{{ category | downcase | escape }}" aria-pressed="false" aria-controls="home-news-list">
              <span data-home-news-label>{{ category }}</span><span class="num">{{ category_items.size }}</span>
            </button>
          {% endfor %}
        </div>

        <div class="home-news__head">
          <h3 data-home-news-heading>All topics</h3>
          <p class="home-news__status" role="status" data-home-news-status>{{ latest.items.size }} items, ranked by relevance</p>
        </div>

        <ol class="story-list" id="home-news-list">
          {% for item in ranked_items %}
            <li class="story" data-news-item data-news-category="{{ item.category | downcase | escape }}">
              <span class="story__topic">{{ item.category }}</span>
              <a class="story__title" href="{{ item.url }}" target="_blank" rel="noopener noreferrer">{{ item.title | default: item.url }}</a>
              <span class="story__source">{% if item.source_favicon %}<img class="source-favicon" src="{{ item.source_favicon | escape }}" alt="" width="16" height="16" loading="lazy">{% endif %}{{ item.source }}</span>
              <time class="story__date num" datetime="{{ item.published_at | date_to_xmlschema }}">{{ item.published_at | date: "%b %-d" }}</time>
              <span class="story__score num">{% include score.html value=item.relevance %}</span>
            </li>
          {% endfor %}
        </ol>
      </div>
    {% else %}
      <p class="empty">No generated digest yet. Run <code>swamp workflow run daily-news</code> after configuring the model.</p>
    {% endif %}
  </div>
</section>

{% assign total_links = 0 %}
{% assign category_count = 0 %}
<section class="directory" aria-labelledby="directory-title">
  <div class="container">
    <div class="split-head">
      <h2 id="directory-title">The link directory</h2>
      <a class="btn" href="{{ '/links/' | relative_url }}">Open the directory</a>
    </div>
    <table class="ledger directory__table">
      <caption class="visually-hidden">Curated links by topic</caption>
      <thead>
        <tr>
          <th scope="col">Topic</th>
          <th scope="col" class="directory__about">What it covers</th>
          <th scope="col" class="num">Categories</th>
          <th scope="col" class="num">Links</th>
        </tr>
      </thead>
      <tbody>
        {% for child in interests.children %}
          {% assign child_data = site.data.links[child.data_key][child.slug] %}
          {% assign child_links = 0 %}
          {% for cat_pair in child_data %}
            {% assign child_links = child_links | plus: cat_pair[1].size %}
          {% endfor %}
          {% assign total_links = total_links | plus: child_links %}
          {% assign category_count = category_count | plus: child_data.size %}
          <tr>
            <th scope="row"><a href="{{ '/' | append: child.slug | append: '/' | relative_url }}">{{ child.title }}</a></th>
            <td class="directory__about">{{ child.description }}</td>
            <td class="num">{{ child_data.size }}</td>
            <td class="num">{{ child_links }}</td>
          </tr>
        {% endfor %}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">All topics</th>
          <td class="directory__about"></td>
          <td class="num">{{ category_count }}</td>
          <td class="num">{{ total_links }}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</section>
