---
title: Sitemap
description: Human-readable index of Alvagante pages, link topics, and generated news digests.
permalink: /sitemap/
---

# Sitemap

## Pages

- [Home]({{ "/" | relative_url }})
- [Links]({{ "/links/" | relative_url }})
- [News]({{ "/news/" | relative_url }})
- [About]({{ "/about/" | relative_url }})
- [RSS]({{ "/rss.xml" | relative_url }})
- [LLMs]({{ "/llms.txt" | relative_url }})

## Link Topics

{% for topic in site.data.link_topics %}
{% if topic.children %}
### [{{ topic.title }}]({{ "/interests/" | relative_url }})

{% for child in topic.children %}
#### [{{ child.title }}]({{ "/" | append: child.slug | append: "/" | relative_url }})
{% assign child_data = site.data.links[child.data_key][child.slug] %}
{% if child_data %}
{% for category_pair in child_data %}
{% assign first_link = category_pair[1] | first %}
- [{{ first_link.category | default: category_pair[0] }}]({{ "/links/" | relative_url }}?topic={{ child.slug | url_encode }}&category={{ category_pair[0] | url_encode }})
{% endfor %}
{% endif %}
{% endfor %}
{% else %}
### [{{ topic.title }}]({{ "/links/" | relative_url }}?topic={{ topic.slug | url_encode }})

{% assign topic_data = site.data.links[topic.slug] %}
{% if topic_data %}
{% for category_pair in topic_data %}
{% assign first_link = category_pair[1] | first %}
- [{{ first_link.category | default: category_pair[0] }}]({{ "/links/" | relative_url }}?topic={{ topic.slug | url_encode }}&category={{ category_pair[0] | url_encode }})
{% endfor %}
{% endif %}
{% endif %}

{% endfor %}

## News Digests

{% assign digests = site.data.generated.news %}
{% for pair in digests %}
{% assign digest_date = pair.first %}
- [{{ digest_date }}]({{ "/news/" | relative_url }}#{{ digest_date }})
{% endfor %}
