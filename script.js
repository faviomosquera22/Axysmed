const nav = document.getElementById("navbar");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.getElementById("nav-menu");
const navLinks = document.querySelectorAll(".nav-links a");
const revealItems = document.querySelectorAll(".reveal");
const contactForm = document.querySelector(".contact-form");
const carouselItems = document.querySelectorAll("[data-carousel]");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

window.addEventListener("scroll", () => {
  if (!nav) {
    return;
  }

  nav.classList.toggle("scrolled", window.scrollY > 30);
});

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

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector(".btn-form");
    if (!submitButton) {
      return;
    }

    submitButton.textContent = "Mensaje enviado";
    submitButton.style.background = "#00897B";

    window.setTimeout(() => {
      submitButton.textContent = "Enviar mensaje";
      submitButton.style.background = "";
      contactForm.reset();
    }, 3000);
  });
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

carouselItems.forEach((carousel) => {
  const track = carousel.querySelector(".showcase-carousel-track");
  const slides = Array.from(carousel.querySelectorAll(".showcase-slide"));
  const dotsRoot = carousel.querySelector(".showcase-carousel-dots");
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const autoplayDelay = Number(carousel.dataset.autoplay || 0);

  if (!track || slides.length === 0) {
    return;
  }

  let currentIndex = 0;
  let autoplayId = null;
  const dots = [];

  const updateCarousel = (nextIndex) => {
    currentIndex = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    slides.forEach((slide, index) => {
      slide.classList.toggle("is-active", index === currentIndex);
    });

    dots.forEach((dot, index) => {
      const isActive = index === currentIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  };

  const stopAutoplay = () => {
    if (autoplayId) {
      window.clearInterval(autoplayId);
      autoplayId = null;
    }
  };

  const startAutoplay = () => {
    stopAutoplay();

    if (prefersReducedMotion.matches || autoplayDelay <= 0 || slides.length < 2) {
      return;
    }

    autoplayId = window.setInterval(() => {
      updateCarousel(currentIndex + 1);
    }, autoplayDelay);
  };

  if (dotsRoot) {
    slides.forEach((slide, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "showcase-carousel-dot";
      dot.setAttribute("aria-label", `Ir a la imagen ${index + 1}`);
      dot.addEventListener("click", () => {
        updateCarousel(index);
        startAutoplay();
      });
      dotsRoot.appendChild(dot);
      dots.push(dot);
    });
  }

  prevButton?.addEventListener("click", () => {
    updateCarousel(currentIndex - 1);
    startAutoplay();
  });

  nextButton?.addEventListener("click", () => {
    updateCarousel(currentIndex + 1);
    startAutoplay();
  });

  carousel.addEventListener("mouseenter", stopAutoplay);
  carousel.addEventListener("mouseleave", startAutoplay);
  carousel.addEventListener("focusin", stopAutoplay);
  carousel.addEventListener("focusout", startAutoplay);

  updateCarousel(0);
  startAutoplay();
});
