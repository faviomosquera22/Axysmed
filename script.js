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
