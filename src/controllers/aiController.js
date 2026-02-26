const { callAI, callAIStream, parseAIResponse, callVisionAI } = require('../services/aiService');
const Crop = require('../models/Crop');
const Pest = require('../models/Pest');
const Advisory = require('../models/Advisory');
const AILog = require('../models/AILog');
const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');

// POST /api/ai/chat - Streaming support with SSE
exports.chat = async (req, res) => {
    try {
        const { message, context, conversation_id } = req.body;
        const userId = req.userId;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        // Get or create conversation
        let conversation;
        if (conversation_id) {
            conversation = await ChatConversation.findOne({
                _id: conversation_id,
                user_id: userId
            });
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversation not found'
                });
            }
        } else {
            // Create new conversation
            conversation = await ChatConversation.create({
                user_id: userId,
                title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
                crop_context: context?.crop,
                location: context?.location || 'Punjab, India',
                language: context?.language || 'en'
            });
        }

        // Load conversation history
        const conversationHistory = await ChatMessage.find({
            conversation_id: conversation._id
        })
            .sort({ created_at: 1 })
            .select('role content')
            .lean();

        // Save user message first
        await ChatMessage.create({
            conversation_id: conversation._id,
            user_id: userId,
            role: 'user',
            content: message
        });

        // Fetch relevant pest data for RAG (Retrieval Augmented Generation)
        let pestContext = '';
        const cropName = conversation.crop_context || context?.crop;

        if (cropName) {
            const cropData = await Crop.findOne({
                name: new RegExp(cropName, 'i')
            }).select('id name name_hi');

            if (cropData) {
                const pests = await Pest.find({ crop_id: cropData._id })
                    .select('name name_hi symptoms symptoms_hi damage damage_hi')
                    .populate({
                        path: 'crop_id',
                        select: 'name name_hi'
                    })
                    .lean();

                // Get advisories for these pests
                const pestIds = pests.map(p => p._id);
                const advisories = await Advisory.find({ pest_id: { $in: pestIds } })
                    .select('pest_id prevention prevention_hi mechanical mechanical_hi biological biological_hi chemical chemical_hi safety safety_hi')
                    .lean();

                // Merge advisories with pests
                const pestsWithAdvisories = pests.map(pest => {
                    const advisory = advisories.find(a => a.pest_id.toString() === pest._id.toString());
                    return { ...pest, advisories: advisory };
                });

                if (pestsWithAdvisories.length > 0) {
                    pestContext = `\n\nRelevant pest database for ${cropData.name}:\n${JSON.stringify(pestsWithAdvisories, null, 2)}`;
                }
            }
        }

        const preferredLanguage = conversation.language === 'hi' ? 'Hindi' : 'English';

        const systemPrompt = `You are KrishiRakshak AI (कृषि रक्षक AI), an expert agricultural pest management advisor for Indian farmers.

CRITICAL LANGUAGE RULE - THIS IS MANDATORY:
- If the user writes in Hindi/Hinglish (uses Devanagari script like "मेरी फसल" or Hindi words), you MUST respond ENTIRELY in Hindi using Devanagari script.
- If the user writes in English, respond in English.
- DETECT the language from the user's CURRENT message and match it exactly.
- User's preferred language setting: ${preferredLanguage}
- When responding in Hindi, use simple Hindi that farmers can understand. Mix common English agricultural terms if needed.
- Example Hindi response: "आपकी फसल में एफिड (माहू) कीट लग सकता है। इसके लिए नीम का तेल छिड़काव करें।"

You are having a CONVERSATION - remember what the farmer told you earlier.

ALWAYS follow IPM (Integrated Pest Management) sequence:
1. First: Prevention strategies (रोकथाम)
2. Second: Mechanical/physical methods (यांत्रिक तरीके)
3. Third: Biological control (जैविक नियंत्रण)
4. LAST RESORT: Chemical pesticides with safety warnings (रासायनिक - अंतिम उपाय)

Include safety warnings for any chemical recommendations.
Be concise but thorough. Use simple language farmers can understand.
Consider the farmer's location (${conversation.location}) and crop (${cropName || 'not specified'}).

${pestContext}

Recent spray history: ${JSON.stringify(context?.recentSprays || [])}

Format your response as JSON:
{
  "reply": "Your answer in the SAME LANGUAGE as the user's message (Hindi if they wrote Hindi, English if English)",
  "likelyPests": [{"name": "pest name (both English and Hindi if responding in Hindi)", "confidence": 0.8}],
  "actions": ["action 1 in user's language", "action 2"],
  "warnings": ["safety warning in user's language"],
  "followUpQuestions": ["follow-up question in user's language"]
}`;

        // Build conversation history for AI
        const messagesForAI = conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Add current message
        messagesForAI.push({
            role: 'user',
            content: message
        });

        // Setup SSE headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

        console.log('Starting stream for conversation:', conversation._id);

        // Send conversation ID immediately
        res.write(`data: ${JSON.stringify({ type: 'conversation_id', conversation_id: conversation._id })}\n\n`);

        let fullResponse = '';

        try {
            console.log('Calling AI stream...');
            // Collect full response first (don't stream raw JSON to client)
            for await (const chunk of callAIStream(systemPrompt, messagesForAI)) {
                fullResponse += chunk;
                console.log('Received chunk:', chunk.substring(0, 50));
                // Don't send chunks yet - wait for full response
            }

            console.log('Stream complete. Full response length:', fullResponse.length);

            // Parse final response
            let parsedResponse;
            try {
                parsedResponse = parseAIResponse(fullResponse);
            } catch (error) {
                parsedResponse = {
                    reply: fullResponse || 'I apologize, I could not process that request.',
                    likelyPests: [],
                    actions: [],
                    warnings: [],
                    followUpQuestions: []
                };
            }

            // Now stream the parsed reply text word by word for smooth display
            const replyText = parsedResponse.reply || '';
            const words = replyText.split(' ');

            for (let i = 0; i < words.length; i++) {
                const word = words[i] + (i < words.length - 1 ? ' ' : '');
                res.write(`data: ${JSON.stringify({ type: 'chunk', content: word })}\n\n`);
                // Small delay for smooth streaming effect
                await new Promise(resolve => setTimeout(resolve, 20));
            }

            // Save assistant message
            await ChatMessage.create({
                conversation_id: conversation._id,
                user_id: userId,
                role: 'assistant',
                content: parsedResponse.reply,
                metadata: {
                    likelyPests: parsedResponse.likelyPests || [],
                    actions: parsedResponse.actions || [],
                    warnings: parsedResponse.warnings || [],
                    followUpQuestions: parsedResponse.followUpQuestions || []
                }
            });

            // Update conversation
            await ChatConversation.findByIdAndUpdate(conversation._id, {
                $set: { last_message_at: new Date() },
                $inc: { message_count: 2 }  // User + assistant message
            });

            // Log AI interaction
            if (userId) {
                await AILog.create({
                    user_id: userId,
                    type: 'chat',
                    input_summary: message.substring(0, 200),
                    output_summary: parsedResponse.reply?.substring(0, 200)
                });
            }

            // Send metadata at the end
            res.write(`data: ${JSON.stringify({
                type: 'metadata',
                likelyPests: parsedResponse.likelyPests || [],
                actions: parsedResponse.actions || [],
                warnings: parsedResponse.warnings || [],
                followUpQuestions: parsedResponse.followUpQuestions || []
            })}\n\n`);

            // Send done signal
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            res.end();

        } catch (streamError) {
            console.error('Streaming error:', streamError);
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: streamError.message || 'Failed to stream response'
            })}\n\n`);
            res.end();
        }

    } catch (error) {
        console.error('AI Chat error:', error);

        // If headers not sent yet, send JSON error
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to process chat request'
            });
        } else {
            // Headers already sent (SSE started), send error in stream
            res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
            res.end();
        }
    }
};

// POST /api/ai/identify-image
exports.identifyImage = async (req, res) => {
    try {
        const { image, crop, language } = req.body;

        console.log('[AI Image] Request received:', {
            hasImage: !!image,
            imageLength: image?.length,
            crop,
            language
        });

        if (!image) {
            return res.status(400).json({ error: 'Image is required' });
        }

        // Fetch all pests for context (limit to reasonable number)
        const pests = await Pest.find()
            .select('name name_hi symptoms symptoms_hi tags')
            .populate('crop_id', 'name')
            .limit(100)
            .lean();

        const pestNames = pests.map(p => p.name).join(', ');
        const lang = language === 'hi' ? 'Hindi' : 'English';

        console.log(`[AI Image] Found ${pests.length} pests in database`);

        const systemPrompt = `You are an expert agricultural entomologist specializing in identifying insect pests in Indian crops.

Available pests in our database: ${pestNames}

Analyze the provided image and identify likely insect pest(s) affecting the crop/plant.

IMPORTANT:
1. Only identify pests that are visible or whose damage symptoms are clearly visible.
2. Provide confidence scores based on how certain you are.
3. List the top 3 most likely pests.
4. Include follow-up questions to confirm the identification.
5. Respond in ${lang}.

Respond in JSON format:
{
  "predictions": [
    {"name": "pest name in English", "nameHi": "pest name in Hindi", "confidence": 0.8, "symptoms": ["symptom 1", "symptom 2"]},
    {"name": "pest 2", "nameHi": "pest 2 hi", "confidence": 0.5, "symptoms": []}
  ],
  "observedSymptoms": ["what you see in the image"],
  "followUpQuestions": ["Do you see sticky honeydew?", "Are leaves curling?"],
  "cropDetected": "crop name if visible"
}`;

        const userPrompt = `Identify the pest in this ${crop || 'crop'} image. Focus on visible pests or damage symptoms.`;

        console.log('[AI Image] Calling Gemini Vision API...');

        // Call Gemini Vision AI
        const aiData = await callVisionAI(systemPrompt, image, userPrompt);
        const aiResponseText = aiData.choices?.[0]?.message?.content;

        console.log('[AI Image] AI response received:', aiResponseText?.substring(0, 200));

        // Parse response
        let parsedResponse;
        try {
            parsedResponse = parseAIResponse(aiResponseText);
            console.log('[AI Image] Parsed response:', JSON.stringify(parsedResponse).substring(0, 300));
        } catch (error) {
            console.error('[AI Image] Parse error:', error);
            parsedResponse = {
                predictions: [],
                observedSymptoms: [],
                followUpQuestions: [],
                error: 'Could not parse AI response'
            };
        }

        // Log AI interaction
        if (req.userId) {
            await AILog.create({
                user_id: req.userId,
                type: 'image',
                input_summary: `Image analysis for ${crop || 'unknown crop'}`,
                output_summary: JSON.stringify(parsedResponse.predictions?.slice(0, 3))
            });
        }

        console.log('[AI Image] Sending response with', parsedResponse.predictions?.length || 0, 'predictions');
        res.json(parsedResponse);
    } catch (error) {
        console.error('[AI Image] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to analyze image'
        });
    }
};

// POST /api/ai/symptom-check
exports.symptomCheck = async (req, res) => {
    try {
        const { crop, symptoms, severity, language } = req.body;

        if (!crop || !symptoms || !Array.isArray(symptoms)) {
            return res.status(400).json({ error: 'Crop and symptoms array are required' });
        }

        // Fetch pests for the specified crop
        const cropData = await Crop.findOne({
            name: new RegExp(crop, 'i')
        }).select('id name');

        let pestContext = '';
        if (cropData) {
            const pests = await Pest.find({ crop_id: cropData._id })
                .select('name name_hi symptoms symptoms_hi damage damage_hi season tags')
                .lean();

            // Get advisories
            const pestIds = pests.map(p => p._id);
            const advisories = await Advisory.find({ pest_id: { $in: pestIds } })
                .select('pest_id prevention mechanical biological chemical safety')
                .lean();

            // Merge
            const pestsWithAdvisories = pests.map(pest => {
                const advisory = advisories.find(a => a.pest_id.toString() === pest._id.toString());
                return { ...pest, advisories: advisory };
            });

            pestContext = JSON.stringify(pestsWithAdvisories, null, 2);
        }

        const lang = language === 'hi' ? 'Hindi' : 'English';

        const systemPrompt = `You are an expert agricultural entomologist. Based on the symptoms described, identify the most likely pests.

Crop: ${crop}
Symptoms reported: ${symptoms.join(', ')}
Severity: ${severity || 'unknown'}

Pest database for this crop:
${pestContext}

IMPORTANT:
1. Match the symptoms to pests in the database.
2. Rank pests by how well their symptoms match.
3. Provide confidence scores.
4. Recommend immediate actions following IPM sequence.
5. Respond in ${lang}.

Respond in JSON format:
{
  "rankedPests": [
    {"name": "pest name", "nameHi": "Hindi name", "confidence": 0.9, "matchingSymptoms": ["symptom1", "symptom2"]},
    {"name": "pest 2", "nameHi": "Hindi name", "confidence": 0.6, "matchingSymptoms": []}
  ],
  "recommendedActions": [
    {"type": "prevention", "action": "action description"},
    {"type": "mechanical", "action": "action description"},
    {"type": "biological", "action": "action description"},
    {"type": "chemical", "action": "action description", "warning": "safety warning"}
  ],
  "urgency": "high|medium|low",
  "additionalNotes": "any other advice"
}`;

        // Call AI
        const aiData = await callAI(systemPrompt, `Analyze symptoms: ${symptoms.join(', ')}`);
        const aiResponseText = aiData.choices?.[0]?.message?.content;

        // Parse response
        let parsedResponse;
        try {
            parsedResponse = parseAIResponse(aiResponseText);
        } catch (error) {
            parsedResponse = {
                rankedPests: [],
                recommendedActions: [],
                urgency: 'medium',
                error: 'Could not parse AI response'
            };
        }

        // Log AI interaction
        if (req.userId) {
            await AILog.create({
                user_id: req.userId,
                type: 'symptom',
                input_summary: `${crop}: ${symptoms.slice(0, 3).join(', ')}`,
                output_summary: JSON.stringify(parsedResponse.rankedPests?.slice(0, 3))
            });
        }

        res.json(parsedResponse);
    } catch (error) {
        console.error('AI Symptom Check error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process symptom check'
        });
    }
};

// POST /api/ai/advisory - Generate comprehensive pest management advisory
exports.generateAdvisory = async (req, res) => {
    try {
        const { pest, crop, severity, symptoms, confidence } = req.body;

        if (!pest) {
            return res.status(400).json({ error: 'Pest name is required' });
        }

        console.log('[Advisory] Generating for:', { pest, crop, severity });

        const systemPrompt = `You are an expert agricultural advisor specializing in Integrated Pest Management (IPM) for Indian farmers. Provide detailed, actionable advice that farmers can immediately implement.

CRITICAL GUIDELINES:
1. Follow IPM hierarchy: Prevention → Cultural → Biological → Chemical (last resort)
2. Recommendations must be specific and actionable
3. Include safety warnings for all chemical methods
4. Consider Indian farming context and local availability
5. Be practical and cost-effective`;

        const userPrompt = `Generate a pest management advisory for:
        
Pest: ${pest}
Crop: ${crop || 'general crops'}
Severity: ${severity || 'moderate'}
Observed Symptoms: ${symptoms && symptoms.length > 0 ? symptoms.join(', ') : 'not specified'}
Confidence Level: ${confidence ? Math.round(confidence) + '%' : 'unknown'}

IMPORTANT: Keep each point SHORT and CONCISE (max 8-10 words per point). No lengthy explanations.

Provide advisory with these sections:

1. SUMMARY: 1-2 sentence overview only

2. CHEMICAL CONTROL: 5 short points (e.g., "Apply neem oil spray weekly")

3. BIOLOGICAL CONTROL: 5 short points (e.g., "Introduce ladybugs as natural predators")

4. CULTURAL CONTROL: 5 short points (e.g., "Remove infected plant debris daily")

5. PREVENTION: 5 short points (e.g., "Use resistant crop varieties")

6. MONITORING: 5 short points (e.g., "Inspect plants twice weekly")

Format as JSON:
{
  "summary": "Brief 1-2 sentence overview",
  "chemicalControl": ["point1", "point2", "point3", "point4", "point5"],
  "biologicalControl": ["point1", "point2", "point3", "point4", "point5"],
  "culturalControl": ["point1", "point2", "point3", "point4", "point5"],
  "prevention": ["point1", "point2", "point3", "point4", "point5"],
  "monitoring": ["point1", "point2", "point3", "point4", "point5"]
}`;

        // Call Groq AI with fallback
        let advisory;
        try {
            const aiData = await callAI(systemPrompt, userPrompt, {
                model: 'openai/gpt-oss-120b',  // Changed back to original model
                temperature: 0.6
            });

            const aiResponseText = aiData.choices?.[0]?.message?.content;

            console.log('[Advisory] AI response received');

            // Parse response
            try {
                advisory = parseAIResponse(aiResponseText);
            } catch (parseError) {
                console.error('[Advisory] Parse error:', parseError);
                advisory = null;
            }
        } catch (aiError) {
            console.error('[Advisory] AI call failed:', aiError.message);
            advisory = null;
        }

        // Use fallback if AI failed or response couldn't be parsed
        if (!advisory || !advisory.summary) {
            console.log('[Advisory] Using fallback advisory');
            advisory = {
                summary: `Integrated Pest Management advisory for ${pest}. Follow IPM principles starting with prevention and cultural controls before considering chemical options.`,
                chemicalControl: [
                    "Apply recommended insecticides as per label instructions",
                    "Rotate pesticide types to prevent resistance development",
                    "Use appropriate PPE during application",
                    "Follow pre-harvest intervals strictly"
                ],
                biologicalControl: [
                    "Encourage natural predators like ladybugs and lacewings",
                    "Use neem-based bio-pesticides if available",
                    "Introduce parasitic wasps for biological control",
                    "Maintain habitat for beneficial insects"
                ],
                culturalControl: [
                    "Remove and destroy infected plant parts immediately",
                    "Practice crop rotation with non-host crops",
                    "Maintain proper plant spacing for air circulation",
                    "Use clean planting material from certified sources"
                ],
                prevention: [
                    "Conduct weekly field scouts for early detection",
                    "Use resistant or tolerant crop varieties when available",
                    "Maintain field hygiene and sanitation",
                    "Monitor weather conditions favorable for pest outbreak"
                ],
                monitoring: [
                    "Inspect plants at least twice weekly for pest presence",
                    "Use yellow sticky traps for monitoring populations",
                    "Keep detailed records of pest sightings and damage",
                    "Set economic threshold levels before treatment decisions"
                ]
            };
        }

        // Log AI interaction (don't let logging errors crash the response)
        try {
            if (req.userId) {
                await AILog.create({
                    user_id: req.userId,
                    type: 'advisory',
                    input_summary: `Advisory for ${pest || 'unknown pest'} on ${crop || 'unknown crop'}`,
                    output_summary: advisory.summary?.substring(0, 200) || 'Fallback advisory'
                });
            }
        } catch (logError) {
            console.error('[Advisory] AILog error (non-fatal):', logError.message);
        }

        console.log('[Advisory] Sending advisory response');
        res.json({ success: true, advisory });
    } catch (error) {
        console.error('[Advisory] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate advisory'
        });
    }
};


// GET /api/ai/weather-alerts
exports.generateWeatherAlerts = async (req, res) => { res.json({ success: true, message: 'To be implemented' }); };
// Append this to the end of aiController.js

// GET /api/ai/weather-alerts - Generate weather-based pest alerts
exports.generateWeatherAlerts = async (req, res) => {
    try {
        const userId = req.userId;

        // Get user profile for location
        const User = require('../models/User');
        const user = await User.findById(userId).select('location name');

        if (!user || !user.location) {
            return res.status(400).json({
                error: 'User location not set. Please update your profile.'
            });
        }

        console.log('[Weather Alerts] Generating for location:', user.location);

        // Fetch weather data
        const { getCurrentWeather, getWeatherForecast, calculatePestRisk } = require('../services/weatherService');

        const currentWeather = await getCurrentWeather(user.location);
        const forecast = await getWeatherForecast(user.location);

        // Add pest risk to forecast
        const forecastWithRisk = forecast.map(day => ({
            ...day,
            pestRisk: calculatePestRisk(day)
        }));

        console.log('[Weather Alerts] Weather data fetched successfully');

        // Get user crops for context
        const UserCrop = require('../models/UserCrop');
        const userCrops = await UserCrop.find({ user_id: userId })
            .populate('crop_id', 'name name_hi')
            .limit(10);

        const cropNames = userCrops.map(uc => uc.crop_id.name).filter(Boolean);

        // Prepare AI prompt
        const systemPrompt = `You are an expert agricultural meteorologist and entomologist specializing in weather-based pest forecasting for Indian agriculture.`;

        const userPrompt = `Generate pest alerts for ${currentWeather.city}. Current: ${currentWeather.temp}Â°C, ${currentWeather.humidity}% humidity. Crops: ${cropNames.join(', ') || 'general'}. Respond with JSON: {"alerts": [{"type":"pest","severity":"high","title":"","description":"","pest":"","crop":"","actions":[],"timing":""}]}`;

        // Call AI
        const aiData = await callAI(systemPrompt, userPrompt, {
            model: 'openai/gpt-oss-120b',
            temperature: 0.5
        });

        let alertData;
        try {
            alertData = parseAIResponse(aiData.choices?.[0]?.message?.content);
        } catch {
            alertData = { alerts: [] };
        }

        res.json({
            success: true,
            weather: {
                current: currentWeather,
                forecast: forecastWithRisk
            },
            alerts: alertData.alerts || [],
            location: {
                city: currentWeather.city,
                region: user.location
            }
        });
    } catch (error) {
        console.error('[Weather Alerts] Error:', error);
        res.status(500).json({
            error: error.message
        });
    }
};
