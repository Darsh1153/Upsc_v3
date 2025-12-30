/**
 * Essay Service - Future Supabase Integration
 * 
 * This file contains functions for syncing essay data with Supabase.
 * Currently, the app uses local storage only (AsyncStorage).
 * Uncomment and configure these functions when you're ready to enable cloud sync.
 */

import { supabase } from '../lib/supabase';
import { saveEssayAttempt, getEssayAttempts } from '../utils/storage';

/**
 * Save essay to Supabase (Future Implementation)
 * @param {Object} essayData - Essay data to save
 * @returns {Promise<Object>} Saved essay with evaluation
 */
export const saveEssayToCloud = async (essayData) => {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.log('No user logged in, saving locally only');
            return await saveEssayAttempt(essayData);
        }

        // Save essay to Supabase
        const { data: essay, error: essayError } = await supabase
            .from('essays')
            .insert({
                user_id: user.id,
                topic: essayData.topic,
                answer_text: essayData.answerText,
                word_count: essayData.wordCount,
                score: essayData.score,
            })
            .select()
            .single();

        if (essayError) throw essayError;

        // Save evaluation to Supabase
        const { data: evaluation, error: evalError } = await supabase
            .from('essay_evaluations')
            .insert({
                essay_id: essay.id,
                examiner_remark: essayData.evaluation.examinerRemark,
                strengths: essayData.evaluation.strengths,
                weaknesses: essayData.evaluation.weaknesses,
                improvement_plan: essayData.evaluation.improvementPlan,
                rewritten_intro: essayData.evaluation.rewrittenIntro,
                rewritten_conclusion: essayData.evaluation.rewrittenConclusion,
                detailed_feedback: essayData.evaluation.detailedFeedback,
            })
            .select()
            .single();

        if (evalError) throw evalError;

        // Also save locally for offline access
        await saveEssayAttempt(essayData);

        return { essay, evaluation };
    } catch (error) {
        console.error('Error saving essay to cloud:', error);
        // Fallback to local storage
        return await saveEssayAttempt(essayData);
    }
};

/**
 * Fetch essays from Supabase (Future Implementation)
 * @returns {Promise<Array>} Array of essays with evaluations
 */
export const fetchEssaysFromCloud = async () => {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.log('No user logged in, fetching from local storage');
            return await getEssayAttempts();
        }

        // Fetch essays with evaluations
        const { data, error } = await supabase
            .from('essays')
            .select(`
        *,
        essay_evaluations (*)
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data to match local storage format
        const essays = data.map(essay => ({
            id: essay.id,
            topic: essay.topic,
            answerText: essay.answer_text,
            score: essay.score,
            wordCount: essay.word_count,
            evaluation: essay.essay_evaluations[0] ? {
                examinerRemark: essay.essay_evaluations[0].examiner_remark,
                strengths: essay.essay_evaluations[0].strengths,
                weaknesses: essay.essay_evaluations[0].weaknesses,
                improvementPlan: essay.essay_evaluations[0].improvement_plan,
                rewrittenIntro: essay.essay_evaluations[0].rewritten_intro,
                rewrittenConclusion: essay.essay_evaluations[0].rewritten_conclusion,
                detailedFeedback: essay.essay_evaluations[0].detailed_feedback,
            } : null,
            createdAt: essay.created_at,
        }));

        return essays;
    } catch (error) {
        console.error('Error fetching essays from cloud:', error);
        // Fallback to local storage
        return await getEssayAttempts();
    }
};

/**
 * Delete essay from Supabase (Future Implementation)
 * @param {string} essayId - ID of essay to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteEssayFromCloud = async (essayId) => {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.log('No user logged in');
            return false;
        }

        // Delete essay (cascade will delete evaluation)
        const { error } = await supabase
            .from('essays')
            .delete()
            .eq('id', essayId)
            .eq('user_id', user.id);

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error deleting essay from cloud:', error);
        return false;
    }
};

/**
 * Sync local essays to cloud (Future Implementation)
 * Call this when user logs in to sync offline data
 */
export const syncLocalEssaysToCloud = async () => {
    try {
        const localEssays = await getEssayAttempts();

        if (localEssays.length === 0) {
            console.log('No local essays to sync');
            return;
        }

        console.log(`Syncing ${localEssays.length} local essays to cloud...`);

        for (const essay of localEssays) {
            // Only sync essays that don't have a UUID (local-only essays)
            if (essay.id.startsWith('essay_')) {
                await saveEssayToCloud({
                    topic: essay.topic,
                    answerText: essay.answerText,
                    score: essay.score,
                    wordCount: essay.wordCount,
                    evaluation: essay.evaluation,
                });
            }
        }

        console.log('Sync complete!');
    } catch (error) {
        console.error('Error syncing essays to cloud:', error);
    }
};

/**
 * Get essay statistics (Future Implementation)
 * @returns {Promise<Object>} Essay statistics
 */
export const getEssayStatistics = async () => {
    try {
        const essays = await fetchEssaysFromCloud();

        if (essays.length === 0) {
            return {
                totalEssays: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0,
                totalWords: 0,
            };
        }

        const scores = essays.map(e => e.score).filter(s => s !== null);
        const totalWords = essays.reduce((sum, e) => sum + (e.wordCount || 0), 0);

        return {
            totalEssays: essays.length,
            averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
            highestScore: scores.length > 0 ? Math.max(...scores) : 0,
            lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
            totalWords,
        };
    } catch (error) {
        console.error('Error getting essay statistics:', error);
        return {
            totalEssays: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            totalWords: 0,
        };
    }
};

// Export all functions
export default {
    saveEssayToCloud,
    fetchEssaysFromCloud,
    deleteEssayFromCloud,
    syncLocalEssaysToCloud,
    getEssayStatistics,
};
