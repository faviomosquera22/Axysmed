const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.getElementById("nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const revealItems = document.querySelectorAll("[data-reveal]");
const leadForms = document.querySelectorAll("[data-lead-form]");
const trackedClicks = document.querySelectorAll("[data-track-click]");
const rotators = document.querySelectorAll("[data-rotator]");

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

leadForms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const product = form.dataset.product || "Axysmed";
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

    try {
      const response = await postJson("/api/lead-submit", {
        product,
        ...fields,
        page: window.location.href,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudo enviar la solicitud.");
      }

      if (feedback) {
        feedback.textContent = result.message || "Solicitud enviada. Te contactaremos pronto.";
        feedback.classList.add("is-success");
      }

      form.reset();
    } catch (error) {
      if (feedback) {
        feedback.textContent =
          error instanceof Error ? error.message : "No se pudo enviar la solicitud.";
        feedback.classList.add("is-error");
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = product === "Vita" ? "Agendar demo de Vita" : "Solicitar demo de Psyke";
      }
    }
  });
});
