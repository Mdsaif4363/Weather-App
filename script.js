// ============ Configuration ============
const API_KEY = "YOUR_OPENWEATHER_API_KEY"; // <-- Put your OpenWeatherMap API key here
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// ============ State & Elements ============
const els = {
  cityInput: document.getElementById("city-input"),
  getWeatherBtn: document.getElementById("get-weather-btn"),
  useLocationBtn: document.getElementById("use-location-btn"),
  unitToggleBtn: document.getElementById("unit-toggle-btn"),
  themeToggleBtn: document.getElementById("theme-toggle-btn"),
  clearHistoryBtn: document.getElementById("clear-history-btn"),

  loading: document.getElementById("loading"),
  error: document.getElementById("error-message"),

  weatherInfo: document.getElementById("weather-info"),
  cityName: document.getElementById("city-name"),
  updatedTime: document.getElementById("updated-time"),
  temperature: document.getElementById("temperature"),
  description: document.getElementById("description"),
  feelsLike: document.getElementById("feels-like"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),
  weatherIcon: document.getElementById("weather-icon"),

  forecastSection: document.getElementById("forecast-section"),
  forecastCards: document.getElementById("forecast-cards"),

  history: document.getElementById("history"),
  historyEmpty: document.getElementById("history-empty")
};

const state = {
  units: localStorage.getItem("units") || "metric", // metric or imperial
  theme: localStorage.getItem("theme") || "light",
  history: JSON.parse(localStorage.getItem("history") || "[]"), // array of city names
  lastCity: localStorage.getItem("lastCity") || null
};

// ============ Initialization ============
applyTheme(state.theme);
updateUnitToggleText();
renderHistory();

els.getWeatherBtn.addEventListener("click", () => {
  const city = els.cityInput.value.trim();
  if (city) searchByCity(city);
});

els.cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const city = els.cityInput.value.trim();
    if (city) searchByCity(city);
  }
});

els.useLocationBtn.addEventListener("click", () => {
  getByGeolocation();
});

els.unitToggleBtn.addEventListener("click", () => {
  state.units = state.units === "metric" ? "imperial" : "metric";
  localStorage.setItem("units", state.units);
  updateUnitToggleText();
  // Re-fetch current city if available
  if (state.lastCity) searchByCity(state.lastCity);
});

els.themeToggleBtn.addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("theme", state.theme);
  applyTheme(state.theme);
});

if (els.clearHistoryBtn) {
  els.clearHistoryBtn.addEventListener("click", () => {
    if (!state.history.length) return;
    if (!confirm("Clear all recent searches?")) return;
    state.history = [];
    localStorage.setItem("history", JSON.stringify(state.history));
    renderHistory();
  });
}

// Delegated clicks: history chip navigate or remove
document.addEventListener("click", (e) => {
  // Remove button on chip
  const removeBtn = e.target.closest(".chip-remove");
  if (removeBtn) {
    const city = removeBtn.dataset.city;
    if (city) {
      removeCityFromHistory(city);
    }
    e.stopPropagation();
    return;
  }

  // Clicking chip itself triggers search
  const chip = e.target.closest(".history-chip");
  if (chip && chip.dataset.city) {
    const city = chip.dataset.city;
    searchByCity(city);
  }
});

// Auto-load last city or try geolocation
if (state.lastCity) {
  searchByCity(state.lastCity);
} else if (navigator.geolocation) {
  // Try geolocation on first visit for convenience (no blocking if denied)
  navigator.geolocation.getCurrentPosition(
    pos => searchByCoords(pos.coords.latitude, pos.coords.longitude),
    () => {} // ignore errors silently on initial load
  );
}

// ============ UI Helpers ============
function setLoading(isLoading) {
  els.loading.classList.toggle("hidden", !isLoading);
  els.getWeatherBtn.disabled = isLoading;
  els.useLocationBtn.disabled = isLoading;
  els.unitToggleBtn.disabled = isLoading;
}

function showError(message) {
  els.error.textContent = message || "An error occurred. Please try again.";
  els.error.classList.remove("hidden");
}

function clearError() {
  els.error.classList.add("hidden");
}

function applyTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  document.body.classList.toggle("dark", theme === "dark");
  els.themeToggleBtn.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}

function updateUnitToggleText() {
  const next = state.units === "metric" ? "°F" : "°C";
  els.unitToggleBtn.textContent = `Switch to ${next}`;
}

function getTempUnitSymbol() {
  return state.units === "metric" ? "°C" : "°F";
}

function getWindUnitLabel() {
  return state.units === "metric" ? "m/s" : "mph";
}

function formatTimeFromUTC(utcSeconds, timezoneOffsetSeconds) {
  // Create city-local time by adding its offset to UTC timestamp
  const ms = (utcSeconds + timezoneOffsetSeconds) * 1000;
  const d = new Date(ms);
  // Use UTC formatter since we already adjusted by offset
  return d.toUTCString().replace(" GMT", "");
}

// ============ Data Fetching ============
async function searchByCity(city) {
  if (!API_KEY || API_KEY === "YOUR_OPENWEATHER_API_KEY") {
    showError("Please set your OpenWeatherMap API key in script.js.");
    return;
  }
  clearError();
  setLoading(true);
  try {
    const [weather, forecast] = await Promise.all([
      fetchJson(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${state.units}`),
      fetchJson(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${state.units}`)
    ]);

    updateWeatherUI(weather);
    updateForecastUI(forecast);
    persistCity(weather.name);
  } catch (err) {
    console.error(err);
    if (err?.status === 404) {
      showError("City not found. Please try again.");
    } else {
      showError("Failed to fetch weather. Check your network and try again.");
    }
    els.weatherInfo.classList.add("hidden");
    els.forecastSection.classList.add("hidden");
  } finally {
    setLoading(false);
  }
}

async function searchByCoords(lat, lon) {
  if (!API_KEY || API_KEY === "YOUR_OPENWEATHER_API_KEY") {
    showError("Please set your OpenWeatherMap API key in script.js.");
    return;
  }
  clearError();
  setLoading(true);
  try {
    const [weather, forecast] = await Promise.all([
      fetchJson(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${state.units}`),
      fetchJson(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${state.units}`)
    ]);

    updateWeatherUI(weather);
    updateForecastUI(forecast);
    persistCity(weather.name);
  } catch (err) {
    console.error(err);
    showError("Failed to fetch weather for your location.");
    els.weatherInfo.classList.add("hidden");
    els.forecastSection.classList.add("hidden");
  } finally {
    setLoading(false);
  }
}

function getByGeolocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }
  clearError();
  setLoading(true);
  navigator.geolocation.getCurrentPosition(
    pos => {
      searchByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    err => {
      console.error(err);
      showError("Unable to retrieve your location. Please allow location access or search by city.");
      setLoading(false);
    }
  );
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// ============ UI Updates ============
function updateWeatherUI(data) {
  const { name, sys, main, weather, wind, dt, timezone } = data;
  const icon = weather?.[0]?.icon || "01d";
  const desc = weather?.[0]?.description || "";

  els.cityName.textContent = `${name}${sys?.country ? ", " + sys.country : ""}`;
  els.updatedTime.textContent = `Updated: ${formatTimeFromUTC(dt, timezone)}`;

  els.weatherIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  els.weatherIcon.alt = desc;

  els.temperature.textContent = `${Math.round(main.temp)}${getTempUnitSymbol()}`;
  els.description.textContent = desc;

  els.feelsLike.textContent = `${Math.round(main.feels_like)}${getTempUnitSymbol()}`;
  els.humidity.textContent = `${main.humidity}%`;
  els.wind.textContent = `${Math.round(wind.speed)} ${getWindUnitLabel()}`;

  if (sys?.sunrise && sys?.sunset) {
    els.sunrise.textContent = formatTimeFromUTC(sys.sunrise, timezone);
    els.sunset.textContent = formatTimeFromUTC(sys.sunset, timezone);
  } else {
    els.sunrise.textContent = "-";
    els.sunset.textContent = "-";
  }

  els.weatherInfo.classList.remove("hidden");
}

function updateForecastUI(forecast) {
  // forecast.list is in 3-hour increments; choose one entry per day near 12:00
  const list = forecast?.list || [];
  if (!list.length) {
    els.forecastSection.classList.add("hidden");
    els.forecastCards.innerHTML = "";
    return;
  }

  const byDate = groupForecastByDate(list);
  const days = pickDaily(byDate, 5); // up to 5 days

  els.forecastCards.innerHTML = days.map(d => renderForecastCard(d)).join("");
  els.forecastSection.classList.remove("hidden");
}

function groupForecastByDate(list) {
  return list.reduce((acc, item) => {
    const dateStr = item.dt_txt.split(" ")[0]; // YYYY-MM-DD
    acc[dateStr] ||= [];
    acc[dateStr].push(item);
    return acc;
  }, {});
}

function pickDaily(byDate, limit) {
  const dates = Object.keys(byDate).sort();
  const results = [];

  for (const date of dates) {
    const entries = byDate[date];
    let best = entries[0];
    const targetHour = 12;
    let bestDiff = Infinity;
    for (const e of entries) {
      const hour = parseInt(e.dt_txt.split(" ")[1].split(":")[0], 10);
      const diff = Math.abs(hour - targetHour);
      if (diff < bestDiff) {
        best = e;
        bestDiff = diff;
      }
    }
    results.push({
      date,
      tempMin: Math.round(Math.min(...entries.map(x => x.main.temp_min))),
      tempMax: Math.round(Math.max(...entries.map(x => x.main.temp_max))),
      icon: best.weather?.[0]?.icon || "01d",
      desc: best.weather?.[0]?.description || ""
    });
    if (results.length >= limit) break;
  }

  return results;
}

function renderForecastCard(day) {
  const unit = getTempUnitSymbol();
  const dateObj = new Date(day.date);
  const weekday = dateObj.toLocaleDateString(undefined, { weekday: "short" });
  const monthDay = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return `
    <div class="forecast-card">
      <div class="date">${weekday} • ${monthDay}</div>
      <img class="icon" src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.desc}">
      <div class="minmax">
        <strong>${day.tempMax}${unit}</strong> / ${day.tempMin}${unit}
      </div>
      <div class="desc">${day.desc}</div>
    </div>
  `;
}

// ============ History ============
function persistCity(city) {
  state.lastCity = city;
  localStorage.setItem("lastCity", city);

  const normalized = city.trim();
  const existingIdx = state.history.findIndex(c => c.toLowerCase() === normalized.toLowerCase());
  if (existingIdx !== -1) {
    state.history.splice(existingIdx, 1);
  }
  state.history.unshift(normalized);
  if (state.history.length > 8) state.history.pop();
  localStorage.setItem("history", JSON.stringify(state.history));
  renderHistory();
}

function removeCityFromHistory(city) {
  const idx = state.history.findIndex(c => c.toLowerCase() === city.toLowerCase());
  if (idx !== -1) {
    state.history.splice(idx, 1);
    localStorage.setItem("history", JSON.stringify(state.history));
    renderHistory();
  }
}

function renderHistory() {
  if (!state.history.length) {
    els.history.innerHTML = "";
    els.historyEmpty.classList.remove("hidden");
    return;
  }
  els.historyEmpty.classList.add("hidden");

  els.history.innerHTML = state.history
    .map(city => {
      const safe = escapeHtml(city);
      return `
        <div class="history-chip" data-city="${safe}" title="Search ${safe}" role="button" tabindex="0" aria-label="Search ${safe}">
          <span class="chip-text">${safe}</span>
          <button class="chip-remove" aria-label="Remove ${safe}" title="Remove" data-city="${safe}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
    })
    .join("");

  // Keyboard support: Enter on chip triggers search
  els.history.querySelectorAll(".history-chip").forEach(chip => {
    chip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const city = chip.dataset.city;
        if (city) searchByCity(city);
      }
    });
  });
}

// ============ Utilities ============
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[s]));
}
