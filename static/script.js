function buildAdvice(data) {
  const uvi = data.uvi;
  const risk = data.uv_risk || "Unavailable";

  if (uvi === null || uvi === undefined) {
    return "Weather data is available, but UV data is currently unavailable. Basic sun protection is still recommended for longer outdoor time.";
  }

  if (uvi <= 2) {
    return `<strong>Clothing recommendation</strong><br>
    UV is low. Basic protection is usually enough, but sunglasses are still a good idea.`;

  } else if (uvi <= 5) {
    return `Clothing recommendation:<br>
UV is moderate. Wear sunscreen, light clothing, and consider staying in shade during long outdoor time.`;

  } else if (uvi <= 7) {
    return `Clothing recommendation:<br>
UV is high. Wear sunscreen, a hat, sunglasses, and protective clothing. Reduce direct sun exposure.`;

  } else if (uvi <= 10) {
    return `Clothing recommendation:<br>
UV is very high. Strong sun protection needed. Wear long sleeves, hat, sunglasses, and stay in shade when possible.`;
  }

  return `Clothing recommendation:<br>
UV is extreme. Full protection required. Wear long sleeves, hat, sunglasses, sunscreen, and avoid direct sun exposure.`;
}

function updateWeatherUI(data) {
  const cityText = data.country ? `${data.city}, ${data.country}` : data.city;

  document.getElementById("resultCity").textContent = cityText;
  document.getElementById("resultDesc").textContent = data.description;
  document.getElementById("resultTemp").textContent = `${data.temperature} °C`;
  document.getElementById("resultFeelsLike").textContent = `${data.feels_like} °C`;
  document.getElementById("resultHumidity").textContent = `${data.humidity} %`;
  document.getElementById("resultWind").textContent = `${data.wind_speed} m/s`;
  document.getElementById("resultUvi").textContent =
    data.uvi === null || data.uvi === undefined ? "--" : data.uvi;
  const uvRiskElement = document.getElementById("resultUvRisk");
  const uvRisk = data.uv_risk || "--";

  uvRiskElement.textContent = uvRisk;
  uvRiskElement.className = "";

  if (uvRisk === "Low") {
    uvRiskElement.classList.add("uv-low");
  } else if (uvRisk === "Moderate") {
    uvRiskElement.classList.add("uv-moderate");
  } else if (uvRisk === "High") {
    uvRiskElement.classList.add("uv-high");
  } else if (uvRisk === "Very High") {
    uvRiskElement.classList.add("uv-very-high");
  } else if (uvRisk === "Extreme") {
    uvRiskElement.classList.add("uv-extreme");
  }

  const icon = document.getElementById("weatherIcon");
  if (data.icon) {
    icon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
    icon.style.display = "block";
  } else {
    icon.style.display = "none";
  }

  const advice = buildAdvice(data);
  document.getElementById("adviceBox").innerHTML = advice;

  const badge = document.getElementById("heroUvBadge");
  badge.textContent =
    data.uvi === null || data.uvi === undefined ? "UV --" : `UV ${data.uvi}`;

  // 先恢复成基础圆形样式
  badge.className = "uv-badge";

  // 再根据 UV risk 叠加颜色 class
  if (uvRisk === "Low") {
    badge.classList.add("uv-badge-low");
  } else if (uvRisk === "Moderate") {
    badge.classList.add("uv-badge-moderate");
  } else if (uvRisk === "High") {
    badge.classList.add("uv-badge-high");
  } else if (uvRisk === "Very High") {
    badge.classList.add("uv-badge-very-high");
  } else if (uvRisk === "Extreme") {
    badge.classList.add("uv-badge-extreme");
  }
  document.getElementById("heroReminder").innerHTML = advice;
  document.getElementById("statusBox").textContent = "Weather and UV data loaded successfully.";
}

async function getWeatherByCity() {
  const cityInput = document.getElementById("cityInput");
  const city = cityInput.value.trim();
  const statusBox = document.getElementById("statusBox");

  if (!city) {
    statusBox.textContent = "Please enter a city name.";
    return;
  }

  statusBox.textContent = "Loading weather and UV data...";

  try {
    const response = await fetch(`/api/weather-by-city?city=${encodeURIComponent(city)}`);
    const data = await response.json();

    if (!response.ok) {
      statusBox.textContent = data.error || "Something went wrong.";
      return;
    }

    updateWeatherUI(data);
  } catch (error) {
    statusBox.textContent = "Could not connect to the server.";
    console.error(error);
  }
}

function useMyLocation() {
  const statusBox = document.getElementById("statusBox");

  if (!navigator.geolocation) {
    statusBox.textContent = "Geolocation is not supported by your browser.";
    return;
  }

  statusBox.textContent = "Getting your location...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      statusBox.textContent = "Loading weather and UV data for your location...";

      try {
        const response = await fetch(`/api/weather-by-coords?lat=${lat}&lon=${lon}`);
        const data = await response.json();

        if (!response.ok) {
          statusBox.textContent = data.error || "Something went wrong.";
          return;
        }

        updateWeatherUI(data);
      } catch (error) {
        statusBox.textContent = "Could not connect to the server.";
        console.error(error);
      }
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        statusBox.textContent = "Location access was denied.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        statusBox.textContent = "Location information is unavailable.";
      } else if (error.code === error.TIMEOUT) {
        statusBox.textContent = "Location request timed out.";
      } else {
        statusBox.textContent = "An unknown geolocation error occurred.";
      }
    }
  );
}
