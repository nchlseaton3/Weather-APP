export default async function handler(req, res) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing server API key." });
  }

  const { location } = req.query;

  if (!location) {
    return res.status(400).json({ error: "Location is required." });
  }

  const isZip = /^\d{5}$/.test(location.trim());

  const params = new URLSearchParams({
    appid: apiKey,
    units: "imperial",
  });

  if (isZip) {
    params.set("zip", `${location},us`);
  } else {
    params.set("q", location);
  }

  try {
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`
    );

    if (!currentRes.ok) {
      return res
        .status(currentRes.status)
        .json({ error: "Current weather request failed." });
    }

    const current = await currentRes.json();

    const forecastParams = new URLSearchParams({
      appid: apiKey,
      units: "imperial",
      lat: current.coord.lat,
      lon: current.coord.lon,
    });

    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?${forecastParams.toString()}`
    );

    if (!forecastRes.ok) {
      return res
        .status(forecastRes.status)
        .json({ error: "Forecast request failed." });
    }

    const forecast = await forecastRes.json();

    return res.status(200).json({ current, forecast });
  } catch (error) {
    return res.status(500).json({ error: "Server request failed." });
  }
}