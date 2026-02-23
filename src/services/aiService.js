const Groq = require('groq-sdk');
const NodeCache = require('node-cache');

// Initialize cache (TTL: 1 hour, check period: 10 minutes)
const responseCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Initialize Groq AI
const initializeGroq = () => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        console.warn('⚠️  GROQ_API_KEY not found in environment variables. AI features will be limited.');
        return null;
    }

    return new Groq({ apiKey });
};

const groq = initializeGroq();


/**
 * Call Groq AI with system prompt and conversation history (NON-STREAMING)
 * @param {string} systemPrompt - The system instruction
 * @param {string|Array} userContent - User message (string) or conversation history (array)
 * @param {object} options - Additional options
 * @returns {Promise<object>} - AI response
 */
async function callAI(systemPrompt, userContent, options = {}) {
    if (!groq) {
        throw new Error('Groq AI is not initialized. Please set GROQ_API_KEY in environment variables.');
    }

    const {
        model = 'openai/gpt-oss-120b',
        temperature = 0.7,
        maxOutputTokens = 8192,
        cacheKey = null
    } = options;

    // Check cache if key provided
    if (cacheKey) {
        const cached = responseCache.get(cacheKey);
        if (cached) {
            console.log('✓ Cache hit for:', cacheKey);
            return cached;
        }
    }

    try {
        // Prepare messages array
        let messages = [];

        // Handle conversation history or single message
        if (Array.isArray(userContent)) {
            // userContent is conversation history
            // Add system prompt as first message
            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }

            // Add conversation history
            messages = messages.concat(userContent.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            })));
        } else {
            // Single message with system prompt
            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }
            messages.push({
                role: 'user',
                content: userContent
            });
        }

        const completion = await groq.chat.completions.create({
            messages,
            model,
            temperature,
            max_tokens: maxOutputTokens,
            top_p: 1,
            stream: false
        });

        const text = completion.choices[0]?.message?.content || '';

        const aiResponse = {
            choices: [{
                message: {
                    content: text
                }
            }],
            model,
            usage: {
                promptTokens: completion.usage?.prompt_tokens || 0,
                completionTokens: completion.usage?.completion_tokens || 0,
                totalTokens: completion.usage?.total_tokens || 0
            }
        };

        // Cache the response if key provided
        if (cacheKey) {
            responseCache.set(cacheKey, aiResponse);
            console.log('✓ Cached response for:', cacheKey);
        }

        return aiResponse;
    } catch (error) {
        // Handle specific error codes
        if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('invalid_api_key')) {
            throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY.');
        }
        if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('quota')) {
            throw new Error('API quota exceeded. Please try again later or upgrade your plan.');
        }
        if (error.message?.includes('RATE_LIMIT_EXCEEDED') || error.message?.includes('rate_limit')) {
            throw new Error('Rate limit exceeded. Please try again in a moment.');
        }

        console.error('Groq AI error:', error);
        throw new Error(`AI service error: ${error.message}`);
    }
}

/**
 * Call Groq AI with STREAMING support
 * @param {string} systemPrompt - The system instruction
 * @param {string|Array} userContent - User message (string) or conversation history (array)
 * @param {object} options - Additional options
 * @returns {AsyncGenerator} - Stream of AI response chunks
 */
async function* callAIStream(systemPrompt, userContent, options = {}) {
    if (!groq) {
        throw new Error('Groq AI is not initialized. Please set GROQ_API_KEY in environment variables.');
    }

    const {
        model = 'openai/gpt-oss-120b',
        temperature = 0.7,
        maxOutputTokens = 8192
    } = options;

    try {
        // Prepare messages array
        let messages = [];

        // Handle conversation history or single message
        if (Array.isArray(userContent)) {
            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }

            messages = messages.concat(userContent.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            })));
        } else {
            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }
            messages.push({
                role: 'user',
                content: userContent
            });
        }

        const completion = await groq.chat.completions.create({
            messages,
            model,
            temperature,
            max_tokens: maxOutputTokens,
            top_p: 1,
            stream: true
        });

        // Yield chunks as they arrive
        for await (const chunk of completion) {
            const chunkText = chunk.choices[0]?.delta?.content || '';
            if (chunkText) {
                yield chunkText;
            }
        }
    } catch (error) {
        // Handle specific error codes
        if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('invalid_api_key')) {
            throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY.');
        }
        if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('quota')) {
            throw new Error('API quota exceeded. Please try again later or upgrade your plan.');
        }
        if (error.message?.includes('RATE_LIMIT_EXCEEDED') || error.message?.includes('rate_limit')) {
            throw new Error('Rate limit exceeded. Please try again in a moment.');
        }

        console.error('Groq AI streaming error:', error);
        throw new Error(`AI service error: ${error.message}`);
    }
}

/**
 * Call Groq Vision API for image analysis
 * Note: Groq currently uses Llama 3.2 Vision models, but we'll use the specified model
 * and fallback to vision model if needed
 * @param {string} systemPrompt - The system instruction
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} userPrompt - User's question about the image
 * @param {object} options - Additional options
 * @returns {Promise<object>} - AI response
 */
async function callVisionAI(systemPrompt, imageBase64, userPrompt = 'Analyze this image', options = {}) {
    if (!groq) {
        throw new Error('Groq AI is not initialized. Please set GROQ_API_KEY in environment variables.');
    }

    const {
        model = 'meta-llama/llama-4-maverick-17b-128e-instruct', // Llama 4 Maverick for image analysis
        temperature = 0.4,
        maxOutputTokens = 8192
    } = options;

    try {
        console.log('[Vision AI] Processing image...');

        // Ensure the base64 has the proper data URI format
        let imageUrl = imageBase64;
        if (!imageUrl.startsWith('data:')) {
            // Add data URI prefix if not present
            imageUrl = `data:image/jpeg;base64,${imageBase64.replace(/^data:image\/\w+;base64,/, '')}`;
        }

        console.log('[Vision AI] Image details:', {
            model,
            imageUrlLength: imageUrl.length
        });

        // Groq vision API expects messages with content array
        const messages = [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: systemPrompt + '\n\n' + userPrompt
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageUrl
                        }
                    }
                ]
            }
        ];

        console.log('[Vision AI] Sending request to Groq...');
        const completion = await groq.chat.completions.create({
            messages,
            model,
            temperature,
            max_tokens: maxOutputTokens,
            top_p: 1
        });

        const text = completion.choices[0]?.message?.content || '';

        console.log('[Vision AI] Response received:', text.substring(0, 200));

        return {
            choices: [{
                message: {
                    content: text
                }
            }],
            model,
            usage: {
                promptTokens: completion.usage?.prompt_tokens || 0,
                completionTokens: completion.usage?.completion_tokens || 0,
                totalTokens: completion.usage?.total_tokens || 0
            }
        };
    } catch (error) {
        console.error('[Vision AI] Error:', error.message);
        console.error('[Vision AI] Full error:', error);
        throw new Error(`Vision AI error: ${error.message}`);
    }
}

/**
 * Parse AI response from JSON or plain text
 * @param {string} aiResponse - Raw AI response
 * @returns {object} - Parsed response object
 */
function parseAIResponse(aiResponse) {
    try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) ||
            aiResponse.match(/```\n?([\s\S]*?)\n?```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;

        return JSON.parse(jsonStr);
    } catch (error) {
        // Fallback to plain text
        return {
            reply: aiResponse,
            error: 'Could not parse structured response'
        };
    }
}

/**
 * Clear the response cache
 */
function clearCache() {
    responseCache.flushAll();
    console.log('✓ Response cache cleared');
}

/**
 * Get cache statistics
 */
function getCacheStats() {
    return {
        keys: responseCache.keys().length,
        hits: responseCache.getStats().hits,
        misses: responseCache.getStats().misses,
        ksize: responseCache.getStats().ksize,
        vsize: responseCache.getStats().vsize
    };
}

module.exports = {
    callAI,
    callAIStream,
    callVisionAI,
    parseAIResponse,
    clearCache,
    getCacheStats
};
