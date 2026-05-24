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
  const categoryButtons = [...root.querySelectorAll("[data-news-category]")];
  const days = [...list.querySelectorAll("[data-news-day]")];
  const empty = document.querySelector("[data-news-empty]");
  let activeCategory = "all";

  const hasDate = (value) => days.some((day) => day.dataset.newsDateValue === value);

  if (!hasDate(dateInput.value) && dateInput.max && hasDate(dateInput.max)) {
    dateInput.value = dateInput.max;
  }

  const apply = () => {
    const selectedDate = dateInput.value;
    let shownItems = 0;

    for (const day of days) {
      const dateMatches = day.dataset.newsDateValue === selectedDate;
      const sections = [...day.querySelectorAll("[data-news-category-section]")];
      let visibleSections = 0;

      for (const section of sections) {
        const categoryMatches = activeCategory === "all" ||
          section.dataset.newsCategorySection === activeCategory;
        const visible = dateMatches && categoryMatches;
        section.hidden = !visible;
        if (visible) {
          visibleSections += 1;
          shownItems += section.querySelectorAll(".news-item").length;
        }
      }

      day.hidden = !dateMatches || visibleSections === 0;
    }

    if (empty) empty.hidden = shownItems !== 0;
  };

  dateInput.addEventListener("input", apply);
  for (const button of categoryButtons) {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.newsCategory || "all";
      for (const option of categoryButtons) {
        const isActive = option === button;
        option.classList.toggle("is-active", isActive);
        option.setAttribute("aria-pressed", String(isActive));
      }
      apply();
    });
  }

  apply();
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
