// Test OpenRouter API Key
// Run this to verify your API key works
const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || 'YOUR_API_KEY_HERE';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function testApiKey() {
    console.log('Testing OpenRouter API Key...');
    console.log('API Key:', API_KEY.substring(0, 15) + '...');
    console.log('');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://upsc-prep.app',
                'X-Title': 'UPSC Prep Test',
            },
            body: JSON.stringify({
                model: 'google/gemini-3-flash-preview',
                messages: [
                    { role: 'user', content: 'Say "Hello World"' }
                ],
                max_tokens: 50,
            }),
        });

        console.log('Response Status:', response.status);
        console.log('Response OK:', response.ok);
        console.log('');

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ API Key Test Failed!');
            console.error('Error:', JSON.stringify(data, null, 2));
            return false;
        }

        console.log('✅ API Key Works!');
        console.log('Response:', data.choices?.[0]?.message?.content);
        return true;

    } catch (error) {
        console.error('❌ Request Failed!');
        console.error('Error:', error.message);
        return false;
    }
}

testApiKey();
