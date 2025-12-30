#!/usr/bin/env node

/**
 * Test script for Essay Evaluation API
 * Tests the Gemini 3 Pro integration directly
 */

const API_URL = 'http://localhost:3000/api/mobile/essay/evaluate';

const sampleEssay = {
    topic: 'Climate Change and India\'s Response',
    answerText: `Climate change is one of the most pressing challenges facing humanity today. India, as a developing nation with a large population, faces unique challenges in addressing this global crisis while ensuring economic growth and development.

India has taken several steps to combat climate change. The country has committed to achieving net-zero emissions by 2070 and has set ambitious renewable energy targets. The International Solar Alliance, initiated by India, demonstrates leadership in promoting clean energy globally.

However, challenges remain. India's dependence on coal for energy, rapid urbanization, and agricultural practices contribute significantly to greenhouse gas emissions. The country also faces severe impacts of climate change, including extreme weather events, water scarcity, and threats to agriculture.

To address these challenges, India needs a multi-pronged approach. This includes accelerating the transition to renewable energy, promoting sustainable urban development, implementing climate-smart agriculture, and strengthening disaster preparedness. International cooperation and climate finance are also crucial for India's climate action.

In conclusion, while India has made significant progress in addressing climate change, much more needs to be done. A balanced approach that ensures both environmental sustainability and economic development is essential for India's future.`
};

async function testEssayEvaluation() {
    console.log('🧪 Testing Essay Evaluation API...\n');
    console.log('📝 Essay Topic:', sampleEssay.topic);
    console.log('📊 Word Count:', sampleEssay.answerText.split(/\s+/).length, 'words\n');

    try {
        console.log('🚀 Sending request to:', API_URL);
        console.log('⏳ Please wait... (this may take 10-15 seconds)\n');

        const startTime = Date.now();

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sampleEssay)
        });

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ API Error:', error);
            return;
        }

        const data = await response.json();

        console.log('✅ Success! Response received in', duration, 'seconds\n');
        console.log('━'.repeat(60));
        console.log('📊 EVALUATION RESULTS');
        console.log('━'.repeat(60));
        console.log('\n🎯 Score:', data.evaluation.score, '/ 100');
        console.log('🤖 Model:', data.model);
        console.log('🧠 Reasoning Used:', data.reasoning_used ? 'Yes' : 'No');
        console.log('📝 Word Count:', data.wordCount);

        console.log('\n💬 Examiner\'s Remark:');
        console.log('   ', data.evaluation.examinerRemark);

        console.log('\n✨ Strengths:');
        data.evaluation.strengths.forEach((s, i) => {
            console.log(`   ${i + 1}. ${s}`);
        });

        console.log('\n⚠️  Areas to Improve:');
        data.evaluation.weaknesses.forEach((w, i) => {
            console.log(`   ${i + 1}. ${w}`);
        });

        console.log('\n💡 Action Plan:');
        data.evaluation.improvementPlan.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p}`);
        });

        if (data.evaluation.rewrittenIntro) {
            console.log('\n📖 Improved Introduction:');
            console.log('   ', data.evaluation.rewrittenIntro);
        }

        if (data.evaluation.rewrittenConclusion) {
            console.log('\n🎬 Improved Conclusion:');
            console.log('   ', data.evaluation.rewrittenConclusion);
        }

        if (data.evaluation.detailedFeedback) {
            console.log('\n📋 Detailed Analysis:');
            Object.entries(data.evaluation.detailedFeedback).forEach(([key, value]) => {
                const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                console.log(`\n   ${label}:`);
                console.log(`   ${value}`);
            });
        }

        console.log('\n' + '━'.repeat(60));
        console.log('✅ Test completed successfully!');
        console.log('━'.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('\n💡 Make sure:');
        console.error('   1. Admin panel is running on http://localhost:3000');
        console.error('   2. OpenRouter API key is configured');
        console.error('   3. Internet connection is available\n');
    }
}

// Run the test
testEssayEvaluation();
