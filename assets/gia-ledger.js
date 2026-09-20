// The GIA ledger: the preferences rail filters the diamond selector's invented
// sample set (GIA-labelled examples only) and writes the choice into the URL.
import {
  DEFAULT_FILTERS,
  sampleDiamonds,
  filterDiamonds,
  readFilters,
  writeFilters,
} from "./diamond-model.js";

const CLARITY_GROUPS = {
  IF: ["FL", "IF"],
  VVS: ["VVS1", "VVS2"],
  VS: ["VS1", "VS2"],
  SI: ["SI1", "SI2"],
};
const FLUOR = {
  "": () => true,
  "none-faint": (d) => d.fluorescence === "None" || d.fluorescence === "Faint",
  None: (d) => d.fluorescence === "None",
};
// A curated starting point, shown until the visitor changes anything.
const OPENING = {
  shapes: ["Round", "Oval"],
  caratMin: 1,
  caratMax: 2,
  sort: "carat-desc",
};
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const number = (value) =>
  value === null || String(value).trim() === "" ? null : Number(value);

class GiaLedger extends HTMLElement {
  connectedCallback() {
    if (this.controller) return;
    this.controller = new AbortController();
    const { signal } = this.controller;
    this.form = this.querySelector("[data-ledger-form]");
    this.rows = this.querySelector("[data-ledger-rows]");
    this.sortSelect = this.querySelector("[data-ledger-sort]");
    this.shapes = Object.fromEntries(
      [...this.querySelector("[data-ledger-shapes]").content.children].map(
        (node) => [node.dataset.shape, node.innerHTML],
      ),
    );
    this.readURL();
    this.syncForm();
    this.render();
    this.querySelector("[data-ledger-fallback]").hidden = true;
    this.querySelector("[data-ledger-table]").hidden = false;
    this.form.addEventListener(
      "change",
      () => {
        this.readForm();
        this.render();
        this.writeURL();
      },
      { signal },
    );
    this.form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        this.readForm();
        this.render();
        this.writeURL();
      },
      { signal },
    );
    this.sortSelect.addEventListener(
      "change",
      () => {
        this.filters.sort = this.sortSelect.value;
        this.render();
        this.writeURL();
      },
      { signal },
    );
    window.addEventListener(
      "popstate",
      () => {
        this.readURL();
        this.syncForm();
        this.render();
      },
      { signal },
    );
  }

  disconnectedCallback() {
    this.controller?.abort();
    this.controller = null;
  }

  readURL() {
    const params = new URLSearchParams(location.search);
    const touched = [...params.keys()].some((key) => key.startsWith("ds_"));
    this.filters = touched
      ? readFilters(location.search)
      : { ...structuredClone(DEFAULT_FILTERS), ...OPENING };
    this.filters.lab = "GIA";
    const fluor = params.get("ds_fluor") || "";
    this.fluor = fluor in FLUOR ? fluor : "";
  }

  writeURL() {
    const url = writeFilters(this.filters, location.href);
    url.searchParams.delete("ds_lab");
    url.searchParams.delete("ds_fluor");
    if (this.fluor) url.searchParams.set("ds_fluor", this.fluor);
    history.replaceState(null, "", url);
  }

  readForm() {
    const data = new FormData(this.form);
    const filters = { ...structuredClone(DEFAULT_FILTERS), lab: "GIA" };
    filters.shapes = data.getAll("shapes");
    filters.colours = data.getAll("colours");
    filters.clarities = data
      .getAll("clarityGroup")
      .flatMap((group) => CLARITY_GROUPS[group] || []);
    filters.caratMin = number(data.get("caratMin"));
    filters.caratMax = number(data.get("caratMax"));
    filters.cut = data.get("cut") || "";
    filters.sort = this.sortSelect.value;
    this.filters = filters;
    this.fluor = data.get("fluor") in FLUOR ? data.get("fluor") : "";
  }

  syncForm() {
    const f = this.filters;
    for (const input of this.form.querySelectorAll('[name="shapes"]'))
      input.checked = f.shapes.includes(input.value);
    for (const input of this.form.querySelectorAll('[name="colours"]'))
      input.checked = f.colours.includes(input.value);
    for (const input of this.form.querySelectorAll('[name="clarityGroup"]'))
      input.checked = CLARITY_GROUPS[input.value].some((grade) =>
        f.clarities.includes(grade),
      );
    this.form.elements.caratMin.value = f.caratMin ?? "";
    this.form.elements.caratMax.value = f.caratMax ?? "";
    for (const input of this.form.querySelectorAll('[name="cut"]'))
      input.checked = input.value === f.cut;
    this.form.elements.fluor.value = this.fluor;
    this.sortSelect.value = f.sort;
  }

  summary() {
    const f = this.filters;
    const parts = [f.shapes.join(", ") || "Any shape"];
    if (f.caratMin !== null || f.caratMax !== null)
      parts.push(`${f.caratMin ?? "Any"}–${f.caratMax ?? "any"} ct`);
    if (f.colours.length) {
      const sorted = [...f.colours].sort();
      const run = sorted.every(
        (c, i) => i === 0 || c.charCodeAt(0) === sorted[i - 1].charCodeAt(0) + 1,
      );
      parts.push(
        run && sorted.length > 1
          ? `${sorted[0]}–${sorted[sorted.length - 1]}`
          : sorted.join(", "),
      );
    }
    const groups = Object.keys(CLARITY_GROUPS).filter((g) =>
      CLARITY_GROUPS[g].some((grade) => f.clarities.includes(grade)),
    );
    if (groups.length) parts.push(groups.join(", "));
    if (f.cut === "Excellent") parts.push("3EX");
    else if (f.cut) parts.push("VG or better");
    if (this.fluor) parts.push(this.fluor === "None" ? "No fluorescence" : "None or faint");
    return parts.join(" · ");
  }

  render() {
    const stones = filterDiamonds(sampleDiamonds, this.filters).filter(
      FLUOR[this.fluor],
    );
    this.rows.innerHTML = stones
      .map(
        (d) => `<tr>
  <td>${this.shapes[d.shape]}</td>
  <td class="ledger__shape">${escape(d.shape)}</td>
  <td>${d.carat.toFixed(2)} ct</td>
  <td>${escape(d.colour)}</td>
  <td>${escape(d.clarity)}</td>
  <td>${escape(d.cut ?? "—")}</td>
  <td>${escape(d.fluorescence)}</td>
  <td class="ledger__mm">${d.length.toFixed(2)} × ${d.width.toFixed(2)} × ${d.height.toFixed(2)} mm</td>
  <td class="ledger__lab">GIA</td>
  <td><a class="button" href="/pages/contact?interest=diamond&amp;shape=${encodeURIComponent(d.shape)}">Inquire</a></td>
</tr>`,
      )
      .join("");
    this.querySelector("[data-ledger-count]").innerHTML =
      `${stones.length} example stone${stones.length === 1 ? "" : "s"} match · <em>${escape(this.summary())}</em>`;
    this.querySelector("[data-ledger-empty]").hidden = stones.length > 0;
    this.querySelector("[data-ledger-table]").hidden = stones.length === 0;
  }
}

if (!customElements.get("gia-ledger"))
  customElements.define("gia-ledger", GiaLedger);
