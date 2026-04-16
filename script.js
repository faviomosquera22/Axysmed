const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.getElementById("nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const revealItems = document.querySelectorAll("[data-reveal]");
const leadForms = document.querySelectorAll("[data-lead-form]");
const trackedClicks = document.querySelectorAll("[data-track-click]");
const rotators = document.querySelectorAll("[data-rotator]");
const lightboxImages = document.querySelectorAll(".product-shot img, .incluya-shot");
const lightboxRotators = document.querySelectorAll(".showcase-rotator");

let lightboxState = null;

function postJson(url, payload, useKeepalive = false) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive: useKeepalive,
  });
}

function setHiddenField(form, name, value) {
  let input = form.querySelector(`input[type="hidden"][name="${name}"]`);

  if (!input) {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    form.appendChild(input);
  }

  input.value = value;
}

function buildLeadReturnUrl(product) {
  const url = new URL(window.location.href);
  url.searchParams.set("lead", "submitted");
  url.searchParams.set("product", String(product || "").toLowerCase());
  url.hash = "demo";
  return url.toString();
}

function showLeadSuccessFromQuery() {
  const url = new URL(window.location.href);

  if (url.searchParams.get("lead") !== "submitted") {
    return;
  }

  leadForms.forEach((form) => {
    const feedback = form.querySelector(".form-feedback");
    if (!feedback) {
      return;
    }

    feedback.textContent = "Solicitud enviada. Te contactaremos pronto.";
    feedback.classList.add("is-success");
    feedback.classList.remove("is-error");
    form.reset();
  });

  url.searchParams.delete("lead");
  url.searchParams.delete("product");
  history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

function trackClick(product, location) {
  if (!product || !location) {
    return;
  }

  postJson(
    "/api/track",
    {
      eventName: "CTA Clicked",
      product,
      location,
    },
    true
  ).catch(() => {});
}

function getOrCreateLightbox() {
  if (lightboxState) {
    return lightboxState;
  }

  const backdrop = document.createElement("div");
  backdrop.className = "lightbox";
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <div class="lightbox-backdrop" data-lightbox-close></div>
    <figure class="lightbox-panel" role="dialog" aria-modal="true" aria-label="Vista ampliada de imagen">
      <button type="button" class="lightbox-close" aria-label="Cerrar imagen" data-lightbox-close>×</button>
      <img class="lightbox-image" alt="" />
      <figcaption class="lightbox-caption"></figcaption>
    </figure>
  `;

  document.body.appendChild(backdrop);

  const image = backdrop.querySelector(".lightbox-image");
  const caption = backdrop.querySelector(".lightbox-caption");

  function closeLightbox() {
    backdrop.hidden = true;
    document.body.classList.remove("lightbox-open");
  }

  backdrop.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.hasAttribute("data-lightbox-close")) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !backdrop.hidden) {
      closeLightbox();
    }
  });

  lightboxState = { backdrop, image, caption, closeLightbox };
  return lightboxState;
}

function openLightbox(src, alt = "") {
  if (!src) {
    return;
  }

  const { backdrop, image, caption } = getOrCreateLightbox();
  image.src = src;
  image.alt = alt;
  caption.textContent = alt;
  backdrop.hidden = false;
  document.body.classList.add("lightbox-open");
}

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

trackedClicks.forEach((element) => {
  element.addEventListener("click", () => {
    trackClick(element.dataset.trackProduct, element.dataset.trackLocation);
  });
});

rotators.forEach((rotator) => {
  const images = Array.from(rotator.querySelectorAll(".rotator-image"));
  const interval = Number(rotator.dataset.interval || 2800);

  if (images.length < 2) {
    return;
  }

  let currentIndex = images.findIndex((image) => image.classList.contains("is-active"));

  if (currentIndex < 0) {
    currentIndex = 0;
    images[0].classList.add("is-active");
  }

  window.setInterval(() => {
    images[currentIndex].classList.remove("is-active");
    currentIndex = (currentIndex + 1) % images.length;
    images[currentIndex].classList.add("is-active");
  }, interval);
});

lightboxImages.forEach((image) => {
  image.classList.add("is-lightbox-trigger");
  image.tabIndex = 0;

  image.addEventListener("click", () => {
    openLightbox(image.currentSrc || image.src, image.alt);
  });

  image.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox(image.currentSrc || image.src, image.alt);
    }
  });
});

lightboxRotators.forEach((rotator) => {
  rotator.classList.add("is-lightbox-trigger");
  rotator.tabIndex = 0;

  const openActiveRotatorImage = () => {
    const activeImage =
      rotator.querySelector(".rotator-image.is-active") || rotator.querySelector(".rotator-image");

    if (!(activeImage instanceof HTMLImageElement)) {
      return;
    }

    openLightbox(activeImage.currentSrc || activeImage.src, activeImage.alt);
  };

  rotator.addEventListener("click", openActiveRotatorImage);
  rotator.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openActiveRotatorImage();
    }
  });
});

leadForms.forEach((form) => {
  const product = form.dataset.product || "Axysmed";
  const targetEmail = form.dataset.targetEmail || "axysmedtech@gmail.com";

  form.action = `https://formsubmit.co/${targetEmail}`;
  form.method = "POST";
  form.acceptCharset = "UTF-8";

  setHiddenField(form, "_captcha", "false");
  setHiddenField(form, "_template", "table");
  setHiddenField(form, "_subject", `Nuevo lead ${product}`);
  setHiddenField(form, "product", product);
  setHiddenField(form, "_next", buildLeadReturnUrl(product));

  form.addEventListener("submit", (event) => {
    const feedback = form.querySelector(".form-feedback");
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    const fields = {
      nombre: String(formData.get("nombre") || "").trim(),
      institucion: String(formData.get("institucion") || "").trim(),
      correo: String(formData.get("correo") || "").trim(),
      perfil: String(formData.get("perfil") || "").trim(),
      mensaje: String(formData.get("mensaje") || "").trim(),
      honey: String(formData.get("honey") || "").trim(),
    };

    const requiredFields = {
      nombre: fields.nombre,
      institucion: fields.institucion,
      correo: fields.correo,
      perfil: fields.perfil,
      mensaje: fields.mensaje,
    };

    if (Object.values(requiredFields).some((value) => !value)) {
      event.preventDefault();
      if (feedback) {
        feedback.textContent = "Completa todos los campos para continuar.";
        feedback.classList.add("is-error");
        feedback.classList.remove("is-success");
      }
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = product === "Vita" ? "Enviando solicitud..." : "Enviando demo...";
    }

    if (feedback) {
      feedback.textContent = "";
      feedback.classList.remove("is-error", "is-success");
    }

    setHiddenField(form, "_replyto", fields.correo);
    setHiddenField(form, "page", window.location.href);
  });
});

showLeadSuccessFromQuery();

// Carousel functionality
class Carousel {
  constructor() {
    this.track = document.getElementById("carousel-track");
    this.prevBtn = document.getElementById("carousel-prev");
    this.nextBtn = document.getElementById("carousel-next");
    this.dots = document.querySelectorAll(".carousel-dot");
    this.currentSlide = 0;
    this.totalSlides = this.dots.length;
    this.itemsPerView = this.getItemsPerView();

    if (!this.track) return;

    this.init();
  }

  getItemsPerView() {
    if (window.innerWidth <= 720) return 1;
    if (window.innerWidth <= 980) return 1;
    return 2;
  }

  init() {
    this.prevBtn?.addEventListener("click", () => this.prev());
    this.nextBtn?.addEventListener("click", () => this.next());
    this.dots.forEach((dot) => {
      dot.addEventListener("click", (e) => this.goToSlide(parseInt(e.target.dataset.slide)));
    });

    window.addEventListener("resize", () => {
      this.itemsPerView = this.getItemsPerView();
      this.updateCarousel();
    });

    this.updateCarousel();
  }

  prev() {
    this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.updateCarousel();
  }

  next() {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    this.updateCarousel();
  }

  goToSlide(index) {
    this.currentSlide = Math.max(0, Math.min(index, this.totalSlides - 1));
    this.updateCarousel();
  }

  updateCarousel() {
    const cardWidth = 100 / this.itemsPerView;
    const offset = -this.currentSlide * cardWidth;
    this.track.style.transform = `translateX(${offset}%)`;

    this.dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === this.currentSlide);
    });
  }
}

// Initialize carousel when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new Carousel());
} else {
  new Carousel();
}
