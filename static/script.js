function buildAdvice(data) {
    const uvi = data.uvi;
    const risk = data.uv_risk || "Unavailable";
  
    if (uvi === null || uvi === undefined) {
      return "Weather data is available, but UV data is currently unavailable. Basic sun protection is still recommended for longer outdoor time.";
    }
  
    if (uvi <= 2) {
      return "UV is low. Basic protection is usually enough, but sunglasses are still a good idea.";
    } else if (uvi <= 5) {
      return "UV is moderate. Use sunscreen and think about shade during longer outdoor time.";
    } else if (uvi <= 8) {
      return "UV is high. Wear sunscreen, a hat, sunglasses, and try to reduce direct exposure.";
    } else if (uvi <= 11) {
      return "UV is very high. Strong protection is important and shade breaks are recommended.";
    }
    return "UV is extreme. Limit direct sun exposure where possible and use full protection.";
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
    document.getElementById("resultUvRisk").textContent = data.uv_risk || "--";
  
    const icon = document.getElementById("weatherIcon");
    if (data.icon) {
      icon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
      icon.style.display = "block";
    } else {
      icon.style.display = "none";
    }
  
    const advice = buildAdvice(data);
    document.getElementById("adviceBox").textContent = advice;
  
    const badge = document.getElementById("heroUvBadge");
    badge.textContent =
      data.uvi === null || data.uvi === undefined ? "UV --" : `UV ${data.uvi}`;
  
    document.getElementById("heroReminder").textContent = advice;
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