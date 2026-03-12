import os
import requests
from flask import Flask, render_template, jsonify, request, redirect, url_for, session
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

app.secret_key = "sunsafe-secret-key"
SITE_PASSWORD = "TA06"

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")


def get_uv_risk_level(uvi: float) -> str:
    if uvi <= 2:
        return "Low"
    elif uvi <= 5:
        return "Moderate"
    elif uvi <= 8:
        return "High"
    elif uvi <= 11:
        return "Very High"
    return "Extreme"


@app.route("/")
def home():
    if not session.get("logged_in"):
        return redirect(url_for("login"))
    return render_template("index.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    error = None

    if request.method == "POST":
        password = request.form.get("password")

        if password == SITE_PASSWORD:
            session["logged_in"] = True
            return redirect(url_for("home"))
        else:
            error = "Incorrect password"

    return render_template("login.html", error=error)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/api/weather-by-city")
def weather_by_city():
    city = request.args.get("city", "").strip()

    if not city:
        return jsonify({"error": "City name is required."}), 400

    if not OPENWEATHER_API_KEY:
        return jsonify({"error": "API key is missing in .env file."}), 500

    try:
        geo_url = "http://api.openweathermap.org/geo/1.0/direct"
        geo_params = {
            "q": city,
            "limit": 1,
            "appid": OPENWEATHER_API_KEY
        }

        geo_response = requests.get(geo_url, params=geo_params, timeout=10)
        geo_data = geo_response.json()

        if not geo_data:
            return jsonify({"error": "City not found."}), 404

        lat = geo_data[0]["lat"]
        lon = geo_data[0]["lon"]
        resolved_city = geo_data[0]["name"]
        country = geo_data[0].get("country", "")

        return fetch_weather_and_uv(lat, lon, resolved_city, country)

    except requests.RequestException:
        return jsonify({"error": "Failed to connect to OpenWeather API."}), 500


@app.route("/api/weather-by-coords")
def weather_by_coords():
    lat = request.args.get("lat", "").strip()
    lon = request.args.get("lon", "").strip()

    if not lat or not lon:
        return jsonify({"error": "Latitude and longitude are required."}), 400

    if not OPENWEATHER_API_KEY:
        return jsonify({"error": "API key is missing in .env file."}), 500

    try:
        lat_float = float(lat)
        lon_float = float(lon)
    except ValueError:
        return jsonify({"error": "Invalid coordinates."}), 400

    return fetch_weather_and_uv(lat_float, lon_float)


def fetch_weather_and_uv(lat, lon, city_name=None, country_code=None):
    try:
        weather_url = "https://api.openweathermap.org/data/2.5/weather"
        weather_params = {
            "lat": lat,
            "lon": lon,
            "appid": OPENWEATHER_API_KEY,
            "units": "metric"
        }

        weather_response = requests.get(weather_url, params=weather_params, timeout=10)
        weather_data = weather_response.json()

        if weather_response.status_code != 200:
            message = weather_data.get("message", "Unable to fetch weather data.")
            return jsonify({"error": f"OpenWeather error: {message}"}), weather_response.status_code

        onecall_url = "https://api.openweathermap.org/data/3.0/onecall"
        onecall_params = {
            "lat": lat,
            "lon": lon,
            "exclude": "minutely,hourly,daily,alerts",
            "appid": OPENWEATHER_API_KEY,
            "units": "metric"
        }

        uv_response = requests.get(onecall_url, params=onecall_params, timeout=10)
        uv_data = uv_response.json()

        uvi = None
        uv_risk = "Unavailable"

        if uv_response.status_code == 200:
            uvi = uv_data.get("current", {}).get("uvi")
            if uvi is not None:
                uv_risk = get_uv_risk_level(float(uvi))

        result = {
            "city": city_name or weather_data.get("name", "Unknown"),
            "country": country_code or weather_data.get("sys", {}).get("country", ""),
            "temperature": weather_data["main"]["temp"],
            "feels_like": weather_data["main"]["feels_like"],
            "description": weather_data["weather"][0]["description"],
            "humidity": weather_data["main"]["humidity"],
            "wind_speed": weather_data["wind"]["speed"],
            "icon": weather_data["weather"][0]["icon"],
            "lat": lat,
            "lon": lon,
            "uvi": uvi,
            "uv_risk": uv_risk
        }

        return jsonify(result)

    except requests.RequestException:
        return jsonify({"error": "Failed to connect to OpenWeather API."}), 500


if __name__ == "__main__":
    app.run(debug=True)