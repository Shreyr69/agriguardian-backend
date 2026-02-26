const axios = require('axios');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get current weather data for a location
 * @param {string} location - City name or "City, Country" format
 * @returns {Promise<Object>} Current weather data
 */
async function getCurrentWeather(location) {
    try {
        if (!OPENWEATHER_API_KEY) {
            throw new Error('OpenWeather API key not configured');
        }

        const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
            params: {
                q: location,
                appid: OPENWEATHER_API_KEY,
                units: 'metric'
            }
        });

        const data = response.data;
        return {
            temp: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            wind: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
            condition: data.weather[0].main,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            pressure: data.main.pressure,
            visibility: data.visibility / 1000, // Convert to km
            clouds: data.clouds.all,
            sunrise: new Date(data.sys.sunrise * 1000),
            sunset: new Date(data.sys.sunset * 1000),
            city: data.name,
            country: data.sys.country
        };
    } catch (error) {
        console.error('Weather API error:', error.response?.data || error.message);
        throw new Error(`Failed to fetch weather: ${error.response?.data?.message || error.message}`);
    }
}

/**
 * Get 5-day weather forecast for a location
 * @param {string} location - City name or "City, Country" format
 * @returns {Promise<Array>} Forecast data
 */
async function getForecast(location) {
    try {
        if (!OPENWEATHER_API_KEY) {
            throw new Error('OpenWeather API key not configured');
        }

        const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
            params: {
                q: location,
                appid: OPENWEATHER_API_KEY,
                units: 'metric',
                cnt: 40 // 5 days * 8 (3-hour intervals)
            }
        });

        // Group by day and get daily summary
        const dailyForecasts = {};
        const today = new Date().toDateString();

        response.data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateStr = date.toDateString();

            // Skip today
            if (dateStr === today) return;

            if (!dailyForecasts[dateStr]) {
                dailyForecasts[dateStr] = {
                    date: date,
                    temps: [],
                    humidity: [],
                    conditions: [],
                    rain: 0
                };
            }

            dailyForecasts[dateStr].temps.push(item.main.temp);
            dailyForecasts[dateStr].humidity.push(item.main.humidity);
            dailyForecasts[dateStr].conditions.push(item.weather[0].main);
            if (item.rain && item.rain['3h']) {
                dailyForecasts[dateStr].rain += item.rain['3h'];
            }
        });

        // Process into daily forecasts
        const forecasts = Object.values(dailyForecasts).slice(0, 4).map(day => {
            const temps = day.temps;
            const avgHumidity = Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length);

            // Most common condition
            const conditionCounts = {};
            day.conditions.forEach(c => {
                conditionCounts[c] = (conditionCounts[c] || 0) + 1;
            });
            const mainCondition = Object.keys(conditionCounts).reduce((a, b) =>
                conditionCounts[a] > conditionCounts[b] ? a : b
            );

            // Calculate pest risk based on weather conditions
            const pestRisk = calculatePestRisk(avgHumidity, Math.max(...temps), mainCondition);

            return {
                day: getDayName(day.date),
                date: day.date.toISOString().split('T')[0],
                high: Math.round(Math.max(...temps)),
                low: Math.round(Math.min(...temps)),
                humidity: avgHumidity,
                condition: mainCondition,
                rain: Math.round(day.rain * 10) / 10,
                pestRisk: pestRisk
            };
        });

        return forecasts;
    } catch (error) {
        console.error('Forecast API error:', error.response?.data || error.message);
        throw new Error(`Failed to fetch forecast: ${error.response?.data?.message || error.message}`);
    }
}

/**
 * Calculate pest risk based on weather conditions
 * @param {number} humidity - Average humidity %
 * @param {number} temp - Maximum temperature
 * @param {string} condition - Weather condition
 * @returns {string} Risk level: 'Low', 'Medium', or 'High'
 */
function calculatePestRisk(humidity, temp, condition) {
    let riskScore = 0;

    // High humidity increases pest risk
    if (humidity > 80) riskScore += 3;
    else if (humidity > 60) riskScore += 2;
    else if (humidity > 40) riskScore += 1;

    // Optimal temperature range for pests (20-32°C)
    if (temp >= 25 && temp <= 32) riskScore += 3;
    else if (temp >= 20 && temp < 25) riskScore += 2;
    else if (temp > 32 && temp < 38) riskScore += 1;

    // Weather conditions affect pest activity
    if (condition === 'Clear' || condition === 'Sunny') riskScore += 1;
    if (condition === 'Rain' || condition === 'Thunderstorm') riskScore -= 1;
    if (condition === 'Clouds') riskScore += 0.5;

    // Determine risk level
    if (riskScore >= 5) return 'High';
    if (riskScore >= 3) return 'Medium';
    return 'Low';
}

/**
 * Get day name from date
 */
function getDayName(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return days[date.getDay()];
}

/**
 * Get complete weather data including current and forecast
 * @param {string} location - City name
 * @returns {Promise<Object>} Complete weather data
 */
async function getWeatherData(location) {
    try {
        const [current, forecast] = await Promise.all([
            getCurrentWeather(location),
            getForecast(location)
        ]);

        return {
            current,
            forecast,
            location: current.city + ', ' + current.country,
            fetchedAt: new Date()
        };
    } catch (error) {
        console.error('getWeatherData error:', error);
        throw error;
    }
}

module.exports = {
    getCurrentWeather,
    getForecast,
    getWeatherData,
    calculatePestRisk
};
