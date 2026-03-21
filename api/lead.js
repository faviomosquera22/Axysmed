const FORM_ENDPOINT = "https://formsubmit.co/ajax/axysmedtech@gmail.com";

async function sendAnalyticsEvent(name, properties) {
  try {
    const { track } = await import("@vercel/analytics/server");
    await track(name, properties);
  } catch (error) {
    console.warn("analytics_unavailable", error instanceof Error ? error.message : String(error));
  }
}

function normalize(value) {
  return String(value || "").trim();
}

function getFormSubmitHeaders(page, req) {
  const headers = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };

  const normalizedPage = normalize(page);
  if (normalizedPage) {
    try {
      const pageUrl = new URL(normalizedPage);
      headers.Origin = pageUrl.origin;
      headers.Referer = pageUrl.toString();
      return headers;
    } catch (error) {
      console.warn("invalid_page_url", error instanceof Error ? error.message : String(error));
    }
  }

  const forwardedProto = normalize(req.headers["x-forwarded-proto"]) || "https";
  const forwardedHost = normalize(req.headers["x-forwarded-host"] || req.headers.host);

  if (forwardedHost) {
    headers.Origin = `${forwardedProto}://${forwardedHost}`;
    headers.Referer = `${forwardedProto}://${forwardedHost}`;
  }

  return headers;
}

function getProviderMessage(message) {
  const normalizedMessage = normalize(message).toLowerCase();

  if (normalizedMessage.includes("needs activation")) {
    return "El formulario necesita activación en FormSubmit. Revisa el correo de axysmedtech@gmail.com y haz clic en 'Activate Form'.";
  }

  if (normalizedMessage.includes("open this page through a web server")) {
    return "FormSubmit rechazó el origen del formulario. Verifica que la solicitud salga desde el dominio publicado.";
  }

  return "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const {
    product,
    nombre,
    institucion,
    correo,
    perfil,
    mensaje,
    page,
    honey,
  } = req.body || {};

  if (normalize(honey)) {
    return res.status(200).json({ ok: true });
  }

  const lead = {
    product: normalize(product),
    nombre: normalize(nombre),
    institucion: normalize(institucion),
    correo: normalize(correo),
    perfil: normalize(perfil),
    mensaje: normalize(mensaje),
    page: normalize(page),
  };

  if (Object.values(lead).some((value) => !value)) {
    return res.status(400).json({ ok: false, message: "Faltan campos obligatorios." });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(lead.correo)) {
    return res.status(400).json({ ok: false, message: "El correo no es válido." });
  }

  const payload = new FormData();
  payload.append("name", lead.nombre);
  payload.append("email", lead.correo);
  payload.append("organization", lead.institucion);
  payload.append("profile", lead.perfil);
  payload.append("product", lead.product);
  payload.append("message", lead.mensaje);
  payload.append("page", lead.page);
  payload.append("_subject", `Nuevo lead ${lead.product}`);
  payload.append("_replyto", lead.correo);
  payload.append("_template", "table");
  payload.append("_captcha", "false");

  try {
    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: getFormSubmitHeaders(lead.page, req),
      body: payload,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false || result.success === "false") {
      throw new Error(result.message || "No se pudo enviar el lead.");
    }

    await sendAnalyticsEvent("Lead Submitted", {
      product: lead.product.slice(0, 255),
      profile: lead.perfil.slice(0, 255),
    });

    console.info(
      JSON.stringify({
        type: "lead",
        product: lead.product,
        profile: lead.perfil,
        organization: lead.institucion,
        page: lead.page,
        timestamp: new Date().toISOString(),
      })
    );

    return res.status(200).json({
      ok: true,
      message: "Solicitud enviada correctamente.",
    });
  } catch (error) {
    const providerMessage = getProviderMessage(error instanceof Error ? error.message : String(error));

    console.error(
      JSON.stringify({
        type: "lead_error",
        product: lead.product,
        page: lead.page,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })
    );

    return res.status(502).json({
      ok: false,
      message: providerMessage || "No pudimos enviar la solicitud. Intenta de nuevo en unos minutos.",
    });
  }
};
