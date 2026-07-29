(() => {
  const root = document.querySelector("[data-link-filters]");
  const list = document.querySelector("[data-link-list]");
  if (!root || !list) return;

  const controls = {
    search: root.querySelector("[data-filter-search]"),
    topic: root.querySelector("[data-filter-topic]"),
    category: root.querySelector("[data-filter-category]"),
    section: root.querySelector("[data-filter-section]"),
  };
  const cards = [...list.querySelectorAll("[data-link-card]")];
  const categories = [...root.querySelectorAll("[data-topic-option]")];
  const topicSections = [...list.querySelectorAll("[data-topic-section]")];
  const categorySections = [...list.querySelectorAll("[data-category-section]")];
  const empty = document.querySelector("[data-empty]");

  const normalize = (value) => (value || "").trim().toLowerCase();

  const updateCategoryOptions = () => {
    const topic = normalize(controls.topic.value);
    for (const option of categories) {
      option.hidden = Boolean(topic) && option.dataset.topicOption !== topic;
    }
    const selected = controls.category.selectedOptions[0];
    if (selected?.hidden) controls.category.value = "";
  };

  const apply = () => {
    updateCategoryOptions();

    const query = normalize(controls.search.value);
    const topic = normalize(controls.topic.value);
    const category = normalize(controls.category.value);
    const section = normalize(controls.section.value);
    let shown = 0;

    for (const card of cards) {
      const matches = (!query || card.dataset.search.includes(query)) &&
        (!topic || card.dataset.topic === topic) &&
        (!category || card.dataset.category === category) &&
        (!section || card.dataset.section.includes(section));
      card.hidden = !matches;
      if (matches) shown += 1;
    }

    for (const categorySection of categorySections) {
      categorySection.hidden = !categorySection.querySelector("[data-link-card]:not([hidden])");
    }

    for (const topicSection of topicSections) {
      topicSection.hidden = !topicSection.querySelector("[data-link-card]:not([hidden])");
    }

    if (empty) empty.hidden = shown !== 0;
  };

  Object.values(controls).forEach((control) => control.addEventListener("input", apply));
  apply();
})();

(() => {
  const root = document.querySelector("[data-news-filters]");
  const list = document.querySelector("[data-news-list]");
  if (!root || !list) return;

  const dateInput = root.querySelector("[data-news-date]");
  const empty = document.querySelector("[data-news-empty]");
  const datesEl = document.querySelector("[data-news-available-dates]");
  const availableDates = datesEl ? JSON.parse(datesEl.textContent) : [];
  const base = root.dataset.newsBase || "/news/";
  const cache = new Map();

  let currentBody = list.querySelector("[data-news-day-body]");

  const bindDay = (body) => {
    const buttons = [...body.querySelectorAll("[data-news-day-category]")];
    const items = [...body.querySelectorAll("[data-news-item]")];

    const selectCategory = (category) => {
      for (const button of buttons) {
        const active = button.dataset.newsDayCategory === category;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      }
      for (const item of items) {
        item.hidden = category !== "all" && item.dataset.newsCategory !== category;
      }
    };

    for (const button of buttons) {
      button.addEventListener("click", () => selectCategory(button.dataset.newsDayCategory || "all"));
    }
  };

  if (currentBody) bindDay(currentBody);

  const swapBody = (body) => {
    currentBody.replaceWith(body);
    currentBody = body;
    bindDay(currentBody);
  };

  const loadDate = async (date) => {
    if (!date) return;

    if (!availableDates.includes(date)) {
      if (empty) {
        empty.hidden = false;
        empty.textContent = "No digest found for the selected date.";
      }
      if (currentBody) currentBody.hidden = true;
      return;
    }

    if (empty) empty.hidden = true;
    if (currentBody) currentBody.hidden = false;

    if (date === currentBody?.dataset.newsDateValue) return;

    if (cache.has(date)) {
      swapBody(cache.get(date).cloneNode(true));
      return;
    }

    try {
      const response = await fetch(`${base}${date}/`);
      if (!response.ok) throw new Error(String(response.status));
      const html = await response.text();
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const body = parsed.querySelector("[data-news-day-body]");
      if (!body) throw new Error("missing digest content");
      cache.set(date, body.cloneNode(true));
      swapBody(body);
    } catch (error) {
      if (empty) {
        empty.hidden = false;
        empty.textContent = "Couldn't load that day's digest.";
      }
      if (currentBody) currentBody.hidden = true;
      console.error(error);
    }
  };

  dateInput.addEventListener("change", () => loadDate(dateInput.value));
})();

(() => {
  const root = document.querySelector("[data-topic-news-filters]");
  const list = document.querySelector("[data-topic-news-list]");
  if (!root || !list) return;

  const dateInput = root.querySelector("[data-news-date]");
  const empty = document.querySelector("[data-topic-news-empty]");
  const datesEl = document.querySelector("[data-topic-news-available-dates]");
  const availableDates = datesEl ? JSON.parse(datesEl.textContent) : [];
  const base = root.dataset.newsBase || "/news/";
  const category = root.dataset.topicCategory;
  const cache = new Map();

  let currentBody = list.querySelector("[data-news-day-body]");

  const setEmptyMessage = (message) => {
    if (!empty) return;
    empty.hidden = false;
    empty.textContent = message;
  };

  const filterToCategory = (body) => {
    const buttons = body.querySelector("[data-news-day-categories]");
    if (buttons) buttons.hidden = true;

    let visible = 0;
    for (const item of body.querySelectorAll("[data-news-item]")) {
      const match = item.dataset.newsCategory === category;
      item.hidden = !match;
      if (match) visible += 1;
    }
    return visible;
  };

  const applyCategoryFilter = (body) => {
    const visible = filterToCategory(body);
    if (visible === 0) {
      setEmptyMessage("No items for this topic on the selected date.");
      body.hidden = true;
    } else {
      if (empty) empty.hidden = true;
      body.hidden = false;
    }
  };

  if (currentBody) applyCategoryFilter(currentBody);

  const showBody = (body) => {
    currentBody.replaceWith(body);
    currentBody = body;
    applyCategoryFilter(currentBody);
  };

  const loadDate = async (date) => {
    if (!date) return;

    if (!availableDates.includes(date)) {
      setEmptyMessage("No digest found for the selected date.");
      if (currentBody) currentBody.hidden = true;
      return;
    }

    if (date === currentBody?.dataset.newsDateValue) return;

    if (cache.has(date)) {
      showBody(cache.get(date).cloneNode(true));
      return;
    }

    try {
      const response = await fetch(`${base}${date}/`);
      if (!response.ok) throw new Error(String(response.status));
      const html = await response.text();
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const body = parsed.querySelector("[data-news-day-body]");
      if (!body) throw new Error("missing digest content");
      cache.set(date, body.cloneNode(true));
      showBody(body);
    } catch (error) {
      setEmptyMessage("Couldn't load that day's digest.");
      if (currentBody) currentBody.hidden = true;
      console.error(error);
    }
  };

  dateInput.addEventListener("change", () => loadDate(dateInput.value));
})();

(() => {
  const picker = document.querySelector("[data-home-link-picker]");
  const results = document.querySelector("[data-home-link-results]");
  if (!picker || !results) return;

  const buttons = [...picker.querySelectorAll("[data-home-category]")];
  const panels = [...results.querySelectorAll("[data-home-category-panel]")];

  const selectCategory = (category) => {
    for (const button of buttons) {
      const active = button.dataset.homeCategory === category;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }

    for (const panel of panels) {
      panel.hidden = panel.dataset.homeCategoryPanel !== category;
    }
  };

  for (const button of buttons) {
    button.addEventListener("click", () => selectCategory(button.dataset.homeCategory));
  }
})();

(() => {
  const root = document.querySelector("[data-home-news]");
  if (!root) return;

  const buttons = [...root.querySelectorAll("[data-home-news-category]")];
  const items = [...root.querySelectorAll("[data-news-item]")];

  const selectCategory = (category) => {
    for (const button of buttons) {
      const active = button.dataset.homeNewsCategory === category;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }

    for (const item of items) {
      item.hidden = category !== "all" && item.dataset.newsCategory !== category;
    }
  };

  for (const button of buttons) {
    button.addEventListener("click", () => selectCategory(button.dataset.homeNewsCategory || "all"));
  }
})();
