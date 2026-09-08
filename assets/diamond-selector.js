import {
  DEFAULT_FILTERS,
  RANGE_LIMITS,
  SHAPES,
  sampleDiamonds,
  filterDiamonds,
  validateRanges,
  readFilters,
  writeFilters,
  describeFilters,
  money,
} from "./diamond-model.js";

const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const rangeText = (min, max, unit = "") =>
  [min, max].some((n) => n !== null && !Number.isFinite(n))
    ? "Check range"
    : min === null && max === null
      ? "Open"
      : `${min ?? "Any"}–${max ?? "any"}${unit}`;
const pair = (label, value) =>
  `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`;

class DiamondSelector extends HTMLElement {
  connectedCallback() {
    if (this.controller) return;
    this.controller = new AbortController();
    this.filters = readFilters(location.search);
    this.step = 0;
    this.limit = 8;
    this.form = this.querySelector("[data-selector-form]");
    this.shapes = Object.fromEntries(
      SHAPES.map((shape) => [
        shape,
        this.querySelector(`input[name="shapes"][value="${shape}"]`)
          .closest("label")
          .querySelector("svg").outerHTML,
      ]),
    );
    this.syncForm();
    this.refresh();
    const { signal } = this.controller;
    this.addEventListener(
      "change",
      (event) => {
        if (event.target.matches("[data-sort]"))
          this.filters.sort = event.target.value;
        else if (this.form.contains(event.target))
          this.filters = this.readForm();
        else return;
        this.limit = 8;
        this.refresh();
      },
      { signal },
    );
    this.form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        this.goTo(this.step + 1);
      },
      { signal },
    );
    this.addEventListener("click", (event) => this.handleClick(event), {
      signal,
    });
    this.querySelector("[data-selector-fallback]").hidden = true;
    this.querySelector("[data-selector-ui]").hidden = false;
    window.addEventListener(
      "popstate",
      () => {
        this.filters = readFilters(location.search);
        this.syncForm();
        this.limit = 8;
        this.refresh(false);
      },
      { signal },
    );
    const enquiry = document.querySelector(".enquiry-form");
    enquiry?.addEventListener(
      "change",
      (event) => {
        if (
          event.target.matches("[data-enquiry-interest-select]") &&
          event.target.value !== "Diamond sourcing"
        )
          this.clearBrief();
      },
      { signal },
    );
    document
      .querySelector("[data-clear-selector-brief]")
      ?.addEventListener("click", () => this.clearBrief(), { signal });
  }

  disconnectedCallback() {
    this.controller?.abort();
    this.controller = null;
  }

  readForm() {
    const data = new FormData(this.form);
    const filters = { ...this.filters };
    for (const key of ["shapes", "colours", "clarities"])
      filters[key] = data.getAll(key);
    for (const key of [
      "origin",
      "cut",
      "fluorescence",
      "lab",
      "polish",
      "symmetry",
    ])
      filters[key] = data.get(key);
    for (const name of Object.keys(RANGE_LIMITS))
      for (const suffix of ["Min", "Max"]) {
        const key = `${name}${suffix}`;
        const input = this.form.elements.namedItem(key);
        filters[key] = input.validity.badInput
          ? NaN
          : input.value === ""
            ? null
            : Number(input.value);
      }
    return filters;
  }

  syncForm() {
    for (const input of this.form.querySelectorAll("input, select")) {
      const value = this.filters[input.name];
      if (input.type === "checkbox")
        input.checked = value.includes(input.value);
      else if (input.type === "radio") input.checked = value === input.value;
      else input.value = value ?? "";
    }
    this.querySelector("[data-sort]").value = this.filters.sort;
  }

  refresh(updateURL = true) {
    this.errors = validateRanges(this.filters);
    this.querySelectorAll("[data-range-error]").forEach((el) => {
      el.hidden = true;
      el.textContent = "";
    });
    this.form
      .querySelectorAll("[aria-invalid]")
      .forEach((el) => el.removeAttribute("aria-invalid"));
    for (const error of this.errors) {
      const field = this.form.elements.namedItem(error.field);
      field.setAttribute("aria-invalid", "true");
      const output = field
        .closest("[data-range]")
        .querySelector("[data-range-error]");
      output.hidden = false;
      output.textContent = error.message;
    }
    this.matches = filterDiamonds(sampleDiamonds, this.filters);
    const f = this.filters;
    this.querySelector("[data-brief]").innerHTML =
      pair("Origin", f.origin) +
      pair("Shape", f.shapes.join(", ") || "Open to any") +
      pair("Carat", rangeText(f.caratMin, f.caratMax, " ct")) +
      pair(
        "Stone budget",
        [f.priceMin, f.priceMax].some((n) => n !== null && !Number.isFinite(n))
          ? "Check range"
          : f.priceMin === null && f.priceMax === null
            ? "Open"
            : `${f.priceMin === null ? "Any" : money(f.priceMin)}–${f.priceMax === null ? "any" : money(f.priceMax)}`,
      ) +
      pair("Colour", f.colours.join(", ") || "Open") +
      pair("Clarity", f.clarities.join(", ") || "Open") +
      (f.cut ? pair("Round cut", `${f.cut} or better`) : "") +
      (f.fluorescence ? pair("Fluorescence", f.fluorescence) : "") +
      (f.lab ? pair("Laboratory", f.lab) : "") +
      (f.polish ? pair("Polish", `${f.polish} or better`) : "") +
      (f.symmetry ? pair("Symmetry", `${f.symmetry} or better`) : "") +
      ["ratio", "table", "depth"]
        .filter((key) => f[`${key}Min`] !== null || f[`${key}Max`] !== null)
        .map((key) =>
          pair(
            { ratio: "L/W ratio", table: "Table %", depth: "Depth %" }[key],
            rangeText(f[`${key}Min`], f[`${key}Max`]),
          ),
        )
        .join("");
    this.querySelector("[data-match-count]").textContent = this.errors.length
      ? "Check the highlighted range to continue."
      : `${this.matches.length} sample ${this.matches.length === 1 ? "match" : "matches"} for your preferences`;
    this.querySelector("[data-results-count]").textContent =
      `${this.matches.length} sample matches`;
    this.renderResults();
    // An attached enquiry brief stays in sync when preferences change. A sample
    // selection is explicitly cleared so an old stone cannot contradict new filters.
    if (
      this.attached &&
      (this.errors.length ||
        this.attachedPreferences !== describeFilters(this.filters))
    )
      this.attachBrief(null, false);
    if (!this.errors.length && updateURL) {
      try {
        history.replaceState(
          history.state,
          "",
          writeFilters(this.filters, location.href),
        );
      } catch {
        /* Filtering still works in restricted embeds. */
      }
    }
  }

  renderResults() {
    this.querySelector("[data-empty]").hidden =
      this.matches.length > 0 || this.errors.length > 0;
    this.querySelector("[data-more]").hidden =
      this.limit >= this.matches.length || this.errors.length > 0;
    this.querySelector("[data-results]").innerHTML = this.matches
      .slice(0, this.limit)
      .map(
        (d) => `
      <article class="finder-result" data-diamond-id="${d.id}">
        <div class="finder-result__top"><div class="finder-result__shape" aria-hidden="true">${this.shapes[d.shape]}</div>
          <div><p class="eyebrow">${escape(d.origin)} · Sample ${d.id}</p><h3>${d.carat.toFixed(2)} ct ${d.shape}</h3><p class="finder-result__size">${d.length.toFixed(2)} × ${d.width.toFixed(2)} × ${d.height.toFixed(2)} mm</p></div>
          <p class="finder-result__price"><span>Illustrative price</span>${escape(money(d.examplePrice))}</p>
        </div>
        <dl class="finder-result__grades">${pair("Colour", d.colour)}${pair("Clarity", d.clarity)}${pair("Cut grade", d.cut || "Not assigned")}${pair("Fluorescence", d.fluorescence)}</dl>
        <details class="finder-result__details"><summary>Explore the details</summary><dl>${pair("Polish", d.polish)}${pair("Symmetry", d.symmetry)}${pair("L/W ratio", d.ratio.toFixed(2))}${pair("Table", `${d.table}%`)}${pair("Depth", `${d.depth}%`)}${pair("Sample lab field", d.lab)}</dl><p>Invented example ${d.id}. There is no grading report or real stone behind this listing.${d.cut ? "" : " Overall cut grades are not assigned to the fancy-shape examples."}</p></details>
        <button class="finder-result__discuss" type="button" data-choose="${d.id}">Discuss this example <span aria-hidden="true">↗</span></button>
      </article>`,
      )
      .join("");
  }

  goTo(step) {
    this.filters = this.readForm();
    this.refresh();
    if (this.errors.length) {
      const field = this.form.elements.namedItem(this.errors[0].field);
      this.showStep(Number(field.closest("[data-panel]").dataset.panel), false);
      const details = field.closest("details");
      if (details) details.open = true;
      field.focus();
      return;
    }
    this.showStep(Math.max(0, Math.min(3, step)));
  }

  showStep(step, focus = true) {
    this.step = step;
    this.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.hidden = Number(panel.dataset.panel) !== step;
    });
    this.querySelectorAll(".finder-steps [data-go-step]").forEach((button) => {
      if (Number(button.dataset.goStep) === step)
        button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    this.querySelector("[data-step-controls]").hidden = step === 3;
    this.querySelector("[data-previous]").hidden = step === 0;
    this.querySelector("[data-next]").innerHTML =
      `${["Continue to size & budget", "Continue to quality", "See sample matches"][Math.min(step, 2)]} <span aria-hidden="true">→</span>`;
    if (focus) {
      const title = this.querySelector(`[data-panel="${step}"] h2`);
      title.focus({ preventScroll: true });
      this.querySelector(".finder-steps").scrollIntoView({
        block: "start",
        behavior: "instant",
      });
    }
  }

  handleClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.hasAttribute("data-go-step"))
      this.goTo(Number(button.dataset.goStep));
    if (button.hasAttribute("data-previous")) this.goTo(this.step - 1);
    if (button.hasAttribute("data-clear-group")) {
      this.filters[button.dataset.clearGroup] = [];
      this.syncForm();
      this.refresh();
    }
    if (button.hasAttribute("data-grade-group")) {
      this.filters[button.dataset.gradeGroup] =
        button.dataset.grades.split(",");
      this.syncForm();
      this.refresh();
    }
    if (button.hasAttribute("data-carat-preset")) {
      [this.filters.caratMin, this.filters.caratMax] =
        button.dataset.caratPreset.split(",").map(Number);
      this.syncForm();
      this.refresh();
    }
    if (
      button.hasAttribute("data-reset") ||
      button.hasAttribute("data-broaden")
    ) {
      const { shapes, origin } = this.filters;
      this.filters = structuredClone(DEFAULT_FILTERS);
      if (button.hasAttribute("data-broaden"))
        Object.assign(this.filters, { shapes, origin });
      this.syncForm();
      this.limit = 8;
      this.refresh();
      this.showStep(button.hasAttribute("data-reset") ? 0 : 3);
    }
    if (button.hasAttribute("data-more")) {
      this.limit += 8;
      this.renderResults();
    }
    if (button.hasAttribute("data-choose")) {
      const diamond = this.matches.find((d) => d.id === button.dataset.choose);
      if (diamond) this.attachBrief(diamond);
    }
    if (button.hasAttribute("data-discuss")) {
      if (this.errors.length) this.goTo(3);
      else this.attachBrief();
    }
  }

  attachBrief(diamond = null, focus = true) {
    const form = document.querySelector(".enquiry-form");
    const interest = form?.querySelector("[data-enquiry-interest-select]");
    if (!interest) {
      document.querySelector("#enquire")?.scrollIntoView();
      return;
    }
    if (this.errors.length) {
      this.clearBrief();
      return;
    }
    const briefField = form.querySelector("[data-selector-brief-field]");
    const exampleField = form.querySelector("[data-selector-example-field]");
    if (!briefField || !exampleField) return;
    this.attached = true;
    this.attachedPreferences = describeFilters(this.filters);
    interest.value = "Diamond sourcing";
    briefField.disabled = false;
    briefField.value = describeFilters(this.filters);
    exampleField.disabled = !diamond;
    exampleField.value = diamond
      ? `ILLUSTRATIVE ONLY: ${diamond.id}; ${diamond.origin}; ${diamond.carat.toFixed(2)} ct ${diamond.shape}; ${diamond.colour}; ${diamond.clarity}; example price ${money(diamond.examplePrice)}. Not a real listing or quotation.`
      : "";
    const summary = form.querySelector("[data-selector-brief-summary]");
    summary.textContent = diamond
      ? `Example ${diamond.id} attached: ${diamond.carat.toFixed(2)} ct ${diamond.shape}. Sample only, not a real stone.`
      : `Your diamond preferences are attached. ${describeFilters(this.filters)}`;
    form.querySelector("[data-selector-brief-context]").hidden = false;
    if (focus) {
      document
        .querySelector("#enquire")
        .scrollIntoView({ behavior: "instant" });
      form
        .querySelector('[autocomplete="name"]')
        ?.focus({ preventScroll: true });
    }
  }

  clearBrief() {
    this.attached = false;
    const form = document.querySelector(".enquiry-form");
    form
      ?.querySelectorAll(
        "[data-selector-brief-field], [data-selector-example-field]",
      )
      .forEach((field) => {
        field.disabled = true;
        field.value = "";
      });
    const context = form?.querySelector("[data-selector-brief-context]");
    if (context) context.hidden = true;
  }
}

if (!customElements.get("diamond-selector"))
  customElements.define("diamond-selector", DiamondSelector);
