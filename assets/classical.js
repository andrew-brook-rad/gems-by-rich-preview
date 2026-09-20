/* Small behaviours for the Classical sections. Everything works without this
   file; it only removes a click or two. */

// Refine and sort selects submit their form as soon as they change.
document.addEventListener("change", (event) => {
  if (event.target.matches("[data-auto-submit]")) event.target.form?.requestSubmit();
});

// The WhatsApp card closes from its own × and from Escape.
document.addEventListener("click", (event) => {
  const close = event.target.closest("[data-wa-close]");
  if (close) close.closest("[data-wa-widget]").open = false;
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll("[data-wa-widget][open]").forEach((widget) => {
    widget.open = false;
    widget.querySelector("summary").focus();
  });
});

// Ring page thumbnails swap the main photograph in place.
document.addEventListener("click", (event) => {
  const thumb = event.target.closest("[data-ring-thumb]");
  if (!thumb || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const main = thumb.closest(".ring__gallery")?.querySelector("[data-ring-main]");
  if (!main) return;
  event.preventDefault();
  main.src = thumb.href;
  main.removeAttribute("srcset");
  main.alt = thumb.querySelector("img")?.alt || "";
  thumb.closest(".ring__thumbs").querySelectorAll("[aria-current]").forEach((a) => a.removeAttribute("aria-current"));
  thumb.setAttribute("aria-current", "true");
});
