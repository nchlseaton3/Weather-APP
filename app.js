const locationInput = document.getElementById("locationInput");
const searchBtn = document.getElementById("searchBtn");
const statusEl = document.getElementById("status");
const loadingEl = document.getElementById("loading");

const weatherCard = document.getElementById("weatherCard");
const placeName = document.getElementById("placeName");
const desc = document.getElementById("desc");
const icon = document.getElementById("icon");
const currentTemp = document.getElementById("currentTemp");

const tempHigh = document.getElementById("tempHigh");
const tempLow = document.getElementById("tempLow");
const humidity = document.getElementById("humidity");

const forecastEl = document.getElementById("forecast");

const UNITS = "imperial";

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? "#fb7185" : "rgba(255,255,255,0.68)";
}

function formatTemp(t) {
  return `${Math.round(t)}°${UNITS === "imperial" ? "F" : "C"}`;
}

function formatTimeFromDt(dtTxt) {
  const d = new Date(dtTxt.replace(" ", "T"));
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function renderCurrent(data) {
  weatherCard.classList.remove("hidden");

  // trigger animation
  setTimeout(() => {
    weatherCard.classList.add("show");
  }, 10);

  const city = data.name;
  const country = data.sys?.country ? `, ${data.sys.country}` : "";
  placeName.textContent = `${city}${country}`;

  const weather0 = data.weather?.[0];
  desc.textContent = weather0 ? weather0.description : "—";

  const temp = data.main?.temp;
  currentTemp.textContent = temp !== undefined ? formatTemp(temp) : "—";

  tempHigh.textContent =
    data.main?.temp_max !== undefined ? formatTemp(data.main.temp_max) : "—";
  tempLow.textContent =
    data.main?.temp_min !== undefined ? formatTemp(data.main.temp_min) : "—";
  humidity.textContent =
    data.main?.humidity !== undefined ? `${data.main.humidity}%` : "—";

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
  const next = forecastData.list?.slice(0, 8) || [];

  next.forEach((item) => {
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

async function handleSearch() {
  const query = locationInput.value.trim();

  if (!query) {
    setStatus("Enter a city or 5-digit zip code.", true);
    return;
  }

  try {
    setStatus("");
    weatherCard.classList.add("hidden");
    weatherCard.classList.remove("show");
    loadingEl.classList.remove("hidden");

    const res = await fetch(
      `/api/weather?location=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Could not load weather.");
    }

    renderCurrent(data.current);
    renderForecast(data.forecast);
  } catch (err) {
    console.error(err);
    setStatus("Could not load weather. Check the city/zip.", true);
  } finally {
    loadingEl.classList.add("hidden");
  }
}

searchBtn.addEventListener("click", handleSearch);
locationInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});
