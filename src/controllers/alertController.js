const Alert = require('../models/Alert');
const User = require('../models/User');
const UserCrop = require('../models/UserCrop');
const { getWeatherData, calculatePestRisk } = require('../services/weatherService');
const { callAI, parseAIResponse } = require('../services/aiService');

// GET /api/alerts
exports.getAlerts = async (req, res) => {
    try {
        const { crop_id, location, risk_level } = req.query;

        const query = { is_active: true };

        if (crop_id) query.crop_id = crop_id;
        if (location) query.location = new RegExp(location, 'i'); // Case-insensitive search
        if (risk_level) query.risk_level = risk_level;

        const alerts = await Alert.find(query)
            .populate('crop_id', 'name name_hi')
            .sort({ created_at: -1 })
            .limit(20);

        res.json(alerts);
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/alerts/weather-forecast
exports.getWeatherForecast = async (req, res) => {
    try {
        const userId = req.userId;
        let location = req.query.location;

        // If no location provided, get from user profile
        if (!location && userId) {
            const user = await User.findById(userId).select('location');
            location = user?.location || 'Delhi, India'; // Default fallback
        }

        if (!location) {
            location = 'Delhi, India';
        }

        console.log('[Weather] Fetching weather for:', location);

        const weatherData = await getWeatherData(location);

        console.log('[Weather] Data received for:', weatherData.location);

        res.json({
            success: true,
            ...weatherData
        });
    } catch (error) {
        console.error('Weather forecast error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            // Return fallback data on error
            current: {
                temp: 28,
                humidity: 65,
                wind: 12,
                condition: 'Unknown',
                description: 'Weather data unavailable'
            },
            forecast: [],
            location: 'Unknown'
        });
    }
};

// GET /api/alerts/ai-alerts
exports.getAIAlerts = async (req, res) => {
    try {
        const userId = req.userId;
        let location = req.query.location;

        // Get user data
        const user = await User.findById(userId).select('location language');
        if (!location) {
            location = user?.location || 'Punjab, India';
        }

        // Get user's crops
        const userCrops = await UserCrop.find({ user_id: userId, is_active: true })
            .populate('crop_id', 'name name_hi')
            .lean();

        const cropNames = userCrops.map(uc => uc.crop_id?.name).filter(Boolean);

        // Get weather data
        let weatherData;
        try {
            weatherData = await getWeatherData(location);
        } catch (weatherError) {
            console.error('Weather fetch error, using defaults:', weatherError.message);
            weatherData = {
                current: { temp: 28, humidity: 65, condition: 'Clear' },
                forecast: []
            };
        }

        console.log('[AI Alerts] Generating for:', { location, crops: cropNames });

        // Generate AI-powered alerts
        const systemPrompt = `You are an expert agricultural advisor for Indian farmers. Generate pest and weather alerts based on current conditions.

IMPORTANT RULES:
1. Be specific and actionable
2. Consider the weather conditions provided
3. Focus on the crops the farmer is growing
4. Prioritize by risk level (high > medium > low)
5. Include practical recommendations`;

        const userPrompt = `Generate agricultural alerts for a farmer with the following conditions:

Location: ${location}
Crops: ${cropNames.length > 0 ? cropNames.join(', ') : 'General crops'}
Current Weather:
- Temperature: ${weatherData.current.temp}°C
- Humidity: ${weatherData.current.humidity}%
- Condition: ${weatherData.current.condition}

Weather Forecast:
${weatherData.forecast.map(f => `- ${f.day}: ${f.condition}, High ${f.high}°C, Low ${f.low}°C, Humidity ${f.humidity}%`).join('\n')}

Generate 3-5 relevant alerts in JSON format:
{
  "alerts": [
    {
      "type": "pest" or "weather" or "disease",
      "severity": "high" or "medium" or "low",
      "title": "Alert title",
      "description": "Brief description of the alert",
      "crop": "Affected crop or 'All Crops'",
      "date": "Today" or "Tomorrow" or "This Week",
      "actions": ["Action 1", "Action 2"]
    }
  ]
}`;

        const aiData = await callAI(systemPrompt, userPrompt, {
            model: 'openai/gpt-oss-120b',
            temperature: 0.7
        });

        const aiResponseText = aiData.choices?.[0]?.message?.content;

        let alerts = [];
        try {
            const parsed = parseAIResponse(aiResponseText);
            alerts = parsed.alerts || [];
        } catch (parseError) {
            console.error('Parse error:', parseError);
            // Fallback alerts based on weather
            alerts = generateFallbackAlerts(weatherData, cropNames, location);
        }

        console.log('[AI Alerts] Generated', alerts.length, 'alerts');

        res.json({
            success: true,
            alerts,
            location,
            weather: weatherData.current,
            forecast: weatherData.forecast,
            generatedAt: new Date()
        });
    } catch (error) {
        console.error('AI Alerts error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            alerts: []
        });
    }
};

// Generate fallback alerts when AI fails
function generateFallbackAlerts(weatherData, cropNames, location) {
    const alerts = [];
    const current = weatherData.current;

    // High humidity alert
    if (current.humidity > 70) {
        alerts.push({
            type: 'pest',
            severity: 'high',
            title: 'High Humidity - Fungal Disease Risk',
            description: `Humidity at ${current.humidity}% increases risk of fungal diseases. Monitor crops closely.`,
            crop: 'All Crops',
            location,
            date: 'Today',
            actions: [
                'Inspect plants for signs of fungal infection',
                'Ensure proper air circulation in fields',
                'Consider preventive fungicide application'
            ]
        });
    }

    // Hot weather alert
    if (current.temp > 38) {
        alerts.push({
            type: 'weather',
            severity: 'high',
            title: 'Heat Wave Warning',
            description: `Temperature at ${current.temp}°C. Protect crops from heat stress.`,
            crop: 'All Crops',
            location,
            date: 'Today',
            actions: [
                'Increase irrigation frequency',
                'Apply mulch to retain soil moisture',
                'Avoid midday spraying'
            ]
        });
    }

    // Check forecast for rain
    const rainyDays = weatherData.forecast.filter(f =>
        f.condition.toLowerCase().includes('rain')
    );

    if (rainyDays.length > 0) {
        alerts.push({
            type: 'weather',
            severity: 'medium',
            title: 'Rain Expected',
            description: `Rain forecasted for ${rainyDays.map(d => d.day).join(', ')}. Plan spray activities accordingly.`,
            crop: 'All Crops',
            location,
            date: rainyDays[0].day,
            actions: [
                'Complete any pending spray applications before rain',
                'Ensure drainage channels are clear',
                'Postpone fertilizer application if rain is imminent'
            ]
        });
    }

    // Pest activity alert based on optimal conditions
    const pestRisk = calculatePestRisk(current.humidity, current.temp, current.condition);
    if (pestRisk === 'High') {
        alerts.push({
            type: 'pest',
            severity: 'high',
            title: 'Favorable Conditions for Pest Activity',
            description: 'Current weather conditions are optimal for pest development. Increased monitoring recommended.',
            crop: cropNames.length > 0 ? cropNames[0] : 'All Crops',
            location,
            date: 'Today',
            actions: [
                'Scout fields for pest presence',
                'Check for aphids, whiteflies, and other common pests',
                'Install yellow sticky traps for monitoring'
            ]
        });
    }

    // Default monitoring alert if no other alerts
    if (alerts.length === 0) {
        alerts.push({
            type: 'pest',
            severity: 'low',
            title: 'Regular Monitoring Recommended',
            description: 'No immediate risks detected. Continue regular crop monitoring.',
            crop: 'All Crops',
            location,
            date: 'This Week',
            actions: [
                'Conduct weekly field inspections',
                'Check for early signs of pest damage',
                'Maintain field hygiene'
            ]
        });
    }

    return alerts;
}

module.exports = exports;
