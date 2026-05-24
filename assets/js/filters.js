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
