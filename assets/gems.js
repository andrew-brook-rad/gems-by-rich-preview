/* Shopify-hosted background films are mounted on demand, never autoplayed by HTML. */
class BackgroundFilm extends HTMLElement {
  connectedCallback() {
    if (this.controller) return;
    this.controller = new AbortController();
    const { signal } = this.controller;
    this.button = this.closest("[data-film-section]").querySelector(
      "[data-film-toggle]",
    );
    this.motion = matchMedia("(prefers-reduced-motion: reduce)");
    this.inView = false;
    this.wantsPlayback =
      this.dataset.autoplay === "true" &&
      !this.motion.matches &&
      !navigator.connection?.saveData;
    this.button.hidden = false;
    this.button.disabled = false;
    this.updateButton();
    this.button.addEventListener(
      "click",
      () => {
        this.wantsPlayback = !this.video || this.video.paused;
        this.syncPlayback();
      },
      { signal },
    );
    this.motion.addEventListener(
      "change",
      () => {
        if (this.motion.matches) this.wantsPlayback = false;
        this.syncPlayback();
      },
      { signal },
    );
    document.addEventListener("visibilitychange", () => this.syncPlayback(), {
      signal,
    });
    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.inView = entry.isIntersecting;
        this.syncPlayback();
      },
      { threshold: 0.05 },
    );
    this.observer.observe(this);
    this.syncPlayback();
  }

  mountVideo() {
    if (this.video) return;
    this.append(this.querySelector("template").content.cloneNode(true));
    this.video = this.querySelector("video");
    this.video.muted = true;
    const { signal } = this.controller;
    this.video.addEventListener(
      "playing",
      () => {
        this.setAttribute("data-playing", "");
        this.updateButton();
      },
      { signal },
    );
    this.video.addEventListener("pause", () => this.updateButton(), { signal });
    this.video.addEventListener(
      "error",
      () => {
        this.wantsPlayback = false;
        this.removeAttribute("data-playing");
        this.button.querySelector("[data-film-label]").textContent =
          "Film unavailable";
        this.button.disabled = true;
      },
      { signal },
    );
  }

  async syncPlayback() {
    const shouldPlay = this.wantsPlayback && this.inView && !document.hidden;
    if (!shouldPlay) {
      this.video?.pause();
      this.updateButton();
      return;
    }
    this.mountVideo();
    try {
      await this.video.play();
      // Visibility or user intent may have changed while play() was pending.
      if (!this.wantsPlayback || !this.inView || document.hidden)
        this.video.pause();
    } catch {
      // Autoplay can be blocked (for example iOS Low Power Mode). Keep the poster
      // and let the visitor explicitly start playback with the visible control.
      this.updateButton();
    }
  }

  updateButton() {
    if (!this.button || this.button.disabled) return;
    const playing = this.video && !this.video.paused;
    this.button.querySelector("[data-film-label]").textContent = playing
      ? "Pause film"
      : "Play film";
    this.button.querySelector("[data-film-icon]").textContent = playing
      ? "Ⅱ"
      : "▷";
  }

  disconnectedCallback() {
    this.wantsPlayback = false;
    this.video?.pause();
    this.controller?.abort();
    this.observer?.disconnect();
    this.controller = null;
    this.video?.remove();
    this.video = null;
    this.removeAttribute("data-playing");
  }
}

if (!customElements.get("background-film"))
  customElements.define("background-film", BackgroundFilm);

// Native details remain usable without JavaScript. Add escape and light dismissal.
document.addEventListener("click", (event) => {
  document.querySelectorAll("[data-mobile-nav][open]").forEach((menu) => {
    if (!menu.contains(event.target) || event.target.closest("a"))
      menu.open = false;
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll("[data-mobile-nav][open]").forEach((menu) => {
    menu.open = false;
    menu.querySelector("summary").focus();
  });
});

const diamondShapes = new Set([
  "Round",
  "Oval",
  "Emerald",
  "Pear",
  "Cushion",
  "Radiant",
]);

function applyDiamondPreference(shape, focus = false) {
  const form = document.querySelector(".enquiry-form");
  if (!form) return;
  const interest = form.querySelector("[data-enquiry-interest-select]");
  if (!interest) return; // Shopify may be showing the contact success state.
  interest.value = "Diamond sourcing";
  const field = form.querySelector("[data-enquiry-shape]");
  const context = form.querySelector("[data-enquiry-context]");
  const validShape = diamondShapes.has(shape) ? shape : "";
  field.value = validShape;
  field.disabled = !validShape;
  context.hidden = !validShape;
  form.querySelector("[data-enquiry-summary]").textContent = validShape
    ? `Your starting point: ${validShape.toLowerCase()} diamond`
    : "";
  if (focus) {
    document.querySelector("#enquire")?.scrollIntoView();
    form.querySelector('[autocomplete="name"]')?.focus({ preventScroll: true });
  }
}

function restoreDiamondPreference() {
  const query = new URLSearchParams(location.search);
  if (query.get("interest") !== "diamond") return;
  const shape = query.get("shape");
  applyDiamondPreference(shape);
  document
    .querySelectorAll('[data-diamond-preferences] input[name="shape"]')
    .forEach((input) => {
      if (diamondShapes.has(shape)) input.checked = input.value === shape;
    });
}

function setDiamondPreferenceURL(shape) {
  const url = new URL(location.href);
  url.searchParams.set("interest", "diamond");
  if (diamondShapes.has(shape)) url.searchParams.set("shape", shape);
  else url.searchParams.delete("shape");
  url.hash = "enquire";
  history.replaceState(null, "", url);
  applyDiamondPreference(shape, true);
}

document.addEventListener("submit", (event) => {
  if (!event.target.matches("[data-diamond-preferences]")) return;
  if (!document.querySelector(".enquiry-form [data-enquiry-interest-select]"))
    return;
  event.preventDefault();
  setDiamondPreferenceURL(new FormData(event.target).get("shape"));
});
document.addEventListener("click", (event) => {
  const guidance = event.target.closest('[data-enquiry-interest="diamond"]');
  if (
    guidance &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    document.querySelector(".enquiry-form [data-enquiry-interest-select]")
  ) {
    event.preventDefault();
    setDiamondPreferenceURL("");
  }
  if (event.target.closest("[data-clear-enquiry]")) {
    const url = new URL(location.href);
    url.searchParams.delete("shape");
    history.replaceState(null, "", url);
    applyDiamondPreference("");
    document.querySelector("[data-enquiry-interest-select]")?.focus();
  }
});
document.addEventListener("change", (event) => {
  if (
    !event.target.matches("[data-enquiry-interest-select]") ||
    event.target.value === "Diamond sourcing"
  )
    return;
  const form = event.target.form;
  form.querySelector("[data-enquiry-shape]").disabled = true;
  form.querySelector("[data-enquiry-context]").hidden = true;
  const url = new URL(location.href);
  url.searchParams.delete("shape");
  url.searchParams.delete("interest");
  history.replaceState(null, "", url);
});
restoreDiamondPreference();
document.addEventListener("shopify:section:load", restoreDiamondPreference);
