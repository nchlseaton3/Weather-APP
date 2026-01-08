
// CONFIG

// Put your OpenWeather API key here:
const API_KEY = "Your API Key Here";

// Base URLs
const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

// Use imperial for Fahrenheit (avoids Kelvin conversion)
const UNITS = "imperial"; // "metric" for Celsius, omit for Kelvin

// DOM
const locationInput = document.getElementById("locationInput");
const searchBtn = document.getElementById("searchBtn");
const statusEl = document.getElementById("status");

const weatherCard = document.getElementById("weatherCard");
const placeName = document.getElementById("placeName");
const desc = document.getElementById("desc");
const icon = document.getElementById("icon");
const currentTemp = document.getElementById("currentTemp");

const tempHigh = document.getElementById("tempHigh");
const tempLow = document.getElementById("tempLow");
const humidity = document.getElementById("humidity");

const forecastEl = document.getElementById("forecast");

// Helpers

// Optional Kelvin → Fahrenheit conversion if you ever use Kelvin endpoints:
// (K − 273.15) × 9/5 + 32
function kelvinToF(k) {
  return (k - 273.15) * (9 / 5) + 32;
}

function isZip(input) {
  // Basic: 5-digit US zip (you can expand this)
  return /^\d{5}$/.test(input.trim());
}

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? "#fb7185" : "rgba(255,255,255,0.68)";
}

function formatTemp(t) {
  return `${Math.round(t)}°${UNITS === "imperial" ? "F" : UNITS === "metric" ? "C" : ""}`;
}

function formatTimeFromDt(dtTxt) {
  // dtTxt example: "2026-01-06 12:00:00"
  const d = new Date(dtTxt.replace(" ", "T"));
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Fetch
async function fetchCurrentWeather(query) {
  const params = new URLSearchParams({
    appid: API_KEY,
    units: UNITS
  });

  if (isZip(query)) {
    // US zip default; add ",us" or remove if your class wants global
    params.set("zip", `${query},us`);
  } else {
    params.set("q", query);
  }

  const url = `${CURRENT_URL}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Current weather request failed (${res.status})`);
  }
  return res.json();
}

async function fetchForecast(lat, lon) {
  const params = new URLSearchParams({
    appid: API_KEY,
    units: UNITS,
    lat: lat,
    lon: lon
  });

  const url = `${FORECAST_URL}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Forecast request failed (${res.status})`);
  }
  return res.json();
}

// Render
function renderCurrent(data) {
  weatherCard.classList.remove("hidden");

  const city = data.name;
  const country = data.sys?.country ? `, ${data.sys.country}` : "";
  placeName.textContent = `${city}${country}`;

  const weather0 = data.weather?.[0];
  desc.textContent = weather0 ? weather0.description : "—";

  const temp = data.main?.temp;
  currentTemp.textContent = temp !== undefined ? formatTemp(temp) : "—";

  tempHigh.textContent = data.main?.temp_max !== undefined ? formatTemp(data.main.temp_max) : "—";
  tempLow.textContent = data.main?.temp_min !== undefined ? formatTemp(data.main.temp_min) : "—";
  humidity.textContent = data.main?.humidity !== undefined ? `${data.main.humidity}%` : "—";

  // Icon
  const iconCode = weather0?.icon;
  if (iconCode) {
    icon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    icon.classList.remove("hidden");
  } else {
    icon.classList.add("hidden");
  }
}

function renderForecast(forecastData) {
  forecastEl.innerHTML = "";

  // OpenWeather 5-day/3-hour gives list[]; show next 8 items (~24 hours)
  const next = forecastData.list?.slice(0, 8) || [];

  next.forEach(item => {
    const w = item.weather?.[0];
    const iconCode = w?.icon;

    const div = document.createElement("div");
    div.className = "forecast-item";
    div.innerHTML = `
      <div class="forecast-time">${formatTimeFromDt(item.dt_txt)}</div>
      ${iconCode ? `<img alt="icon" src="https://openweathermap.org/img/wn/${iconCode}@2x.png">` : ""}
      <div class="forecast-temp">${formatTemp(item.main.temp)}</div>
      <div class="forecast-desc">${w?.main ?? ""}</div>
    `;
    forecastEl.appendChild(div);
  });
}

// Main flow
async function handleSearch() {
  const query = locationInput.value.trim();
  if (!query) {
    setStatus("Enter a city or 5-digit zip code.", true);
    return;
  }
  if (!API_KEY || API_KEY.includes("PASTE_YOUR_API_KEY_HERE")) {
    setStatus("Add your OpenWeather API key in app.js before running.", true);
    return;
  }

  try {
    setStatus("Loading weather...");
    weatherCard.classList.add("hidden");

    const current = await fetchCurrentWeather(query);
    renderCurrent(current);

    const { lat, lon } = current.coord;
    const forecast = await fetchForecast(lat, lon);
    renderForecast(forecast);

    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Could not load weather. Check the city/zip and your API key.", true);
  }
}

searchBtn.addEventListener("click", handleSearch);
locationInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});
