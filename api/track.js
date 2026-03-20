async function sendAnalyticsEvent(name, properties) {
  try {
    const { track } = await import("@vercel/analytics/server");
    await track(name, properties);
  } catch (error) {
    console.warn("analytics_unavailable", error instanceof Error ? error.message : String(error));
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { eventName, product, location } = req.body || {};

  if (!eventName || !product || !location) {
    return res.status(400).json({ ok: false, message: "Missing tracking fields" });
  }

  await sendAnalyticsEvent(eventName, {
    product: String(product).slice(0, 255),
    location: String(location).slice(0, 255),
  });

  console.info(
    JSON.stringify({
      type: "tracking",
      eventName,
      product,
      location,
      path: req.headers.referer || null,
      timestamp: new Date().toISOString(),
    })
  );

  return res.status(204).end();
};
