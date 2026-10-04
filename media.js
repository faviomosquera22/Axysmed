// Keep only one walkthrough playing, including videos inside product tabs.
const productVideos = [...document.querySelectorAll(".product-video")];
productVideos.forEach((video) => {
  video.addEventListener("play", () => {
    productVideos.forEach((other) => {
      if (other !== video) other.pause();
    });
  });
});
const previewPanels = document.querySelectorAll(".product-preview");
const videoVisibilityObserver = new MutationObserver(() => {
  productVideos.forEach((video) => {
    if (video.closest("[hidden]")) video.pause();
  });
});
previewPanels.forEach((panel) =>
  videoVisibilityObserver.observe(panel, {
    attributes: true,
    attributeFilter: ["hidden"],
  }),
);
