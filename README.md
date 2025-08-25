# Weather App

A lightweight, responsive weather application using OpenWeatherMap that supports geolocation, light/dark themes, Celsius/Fahrenheit units, a 5-day forecast, and removable recent searches. No build tools needed—just static HTML/CSS/JS.

## Demo

- Open `index.html` locally or serve via a static server (recommended for geolocation).
- Example screenshot(s): add your own in a `[/Screenshot](https://ik.imagekit.io/77nsbwefl/Screenshot%202025-08-25%20155511.png?updatedAt=1756118139011) ` folder and reference here.

## Features

- Search weather by city
- Use My Location via browser geolocation (HTTPS or localhost required)
- Unit toggle: Celsius ↔ Fahrenheit (persists in localStorage)
- Theme toggle: Light ↔ Dark (persists in localStorage)
- Current weather details: temperature, description, feels like, humidity, wind, sunrise, sunset
- 5-day forecast with daily min/max and icons
- Recent searches with:
  - Click to search again
  - Remove individual chips (×)
  - Clear all
- Loading spinner and friendly error messages
- Responsive, accessible UI (keyboard navigation and ARIA labels)

## Tech Stack

- HTML5, CSS3 (vanilla)
- JavaScript (vanilla)
- OpenWeatherMap API

## Project Structure



. ├─ index.html # App markup ├─ style.css # Styles (light/dark themes, responsive) └─ script.js # App logic, API requests, UI updates, history


## Prerequisites

- OpenWeatherMap API key (free): https://openweathermap.org/
- For geolocation to work: serve over HTTPS or use localhost (most browsers block geolocation on file://)

## Setup

1. Get an API key from OpenWeatherMap.
2. Open `script.js` and set your key:
   ```js
   const API_KEY = "YOUR_OPENWEATHER_API_KEY";


Tip: Because this app is client-side, your key is visible to users. In your OpenWeather account, restrict the key to your domain(s) to reduce abuse.

Open index.html in a browser to try it out.
For geolocation support, use a local web server:
VS Code: “Live Server” extension
Python 3: python -m http.server 5173
Node: npx serve . or npx http-server -p 5173

Usage

Enter a city (e.g., “London”, “Paris”) and click “Get Weather” or press Enter.
Click “Use My Location” to fetch weather using geolocation.
“Switch to °F/°C” toggles units and re-fetches the current city.
“Dark Mode/Light Mode” toggles theme.

Recent Searches:
Click a chip to search again
Click × on a chip to remove it
Click “Clear All” to remove the entire history

Keyboard shortcuts:

In the city input: Enter submits the search.
On a recent search chip: Enter/Space triggers search; the × button is clickable/focusable to remove.

API Details

Base URL: https://api.openweathermap.org/data/2.5

Endpoints used:

Current weather: /weather?q={city}&appid={API_KEY}&units={metric|imperial}
Forecast (3-hourly): /forecast?q={city}&appid={API_KEY}&units={metric|imperial}

Notes:

Units: metric = °C and m/s, imperial = °F and mph
Icons: https://openweathermap.org/img/wn/{iconCode}@2x.png
Forecast is reduced to one representative entry per day (closest to 12:00) and daily min/max computed from all entries of that day.

Persistence

localStorage keys:
units (“metric” | “imperial”)
theme (“light” | “dark”)
history (JSON array of city names)
lastCity (last successful city name)

Accessibility

Buttons and interactive elements include aria-labels.
History chips are keyboard-focusable; Enter/Space activates search.
Live regions:
Loading uses role="status" and aria-live="polite".
Errors use role="alert".

Troubleshooting

“Please set your OpenWeatherMap API key”:
Make sure you replaced YOUR_OPENWEATHER_API_KEY in script.js.
Geolocation denied/not working:
Ensure you’re on HTTPS or http://localhost.
Browser settings may block geolocation—allow location access when prompted.
404 City not found:
Check spelling; try “City, CountryCode” (e.g., “Paris, FR”).
Rate limits:
Free OpenWeather plans have limits (e.g., 60 requests/min). Avoid rapid toggling and repeated queries.

Customization

Colors and themes: modify CSS variables in style.css:
Dark theme defaults in :root
Light theme overrides in body.light
Maximum history items: adjust the cap (8) in script.js in persistCity.
Forecast length: change pickDaily(byDate, 5) to show more/less days.

Security Note

This is a client-side demo. API keys in the browser are public. For production, consider a small proxy backend to keep your key secret and add rate limiting.

Roadmap Ideas

Air quality and precipitation probability
Hourly forecast chart (e.g., Chart.js)
Favorite cities pinning and reordering
Multi-language support
PWA/offline caching

License

MIT — feel free to use and modify. Add your name/company to the LICENSE file if needed.
