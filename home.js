// Accessible product previews: click, arrow keys, Home and End.
const previewTabs = [...document.querySelectorAll("[data-preview-tab]")];
function selectPreview(tab, focus = false) {
  previewTabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute("aria-controls")).hidden =
      !selected;
  });
  if (focus) tab.focus();
}
previewTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectPreview(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % previewTabs.length;
    if (event.key === "ArrowLeft")
      next = (index - 1 + previewTabs.length) % previewTabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = previewTabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectPreview(previewTabs[next], true);
    }
  });
});
const year = document.getElementById("copyright-year");
if (year) year.textContent = new Date().getFullYear();
