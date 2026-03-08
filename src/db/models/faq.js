// Bot Multispa — FAQ Model
const supabase = require('../supabase');
const logger = require('../../core/utils/logger');

const FAQ = {
    /**
     * Get all FAQ items
     */
    async getAll() {
        const { data, error } = await supabase
            .from('faq')
            .select('*');
        if (error) {
            logger.error('FAQ.getAll error', { error: error.message });
            return [];
        }
        return data;
    },

    /**
     * Get FAQ by category
     */
    async getByCategory(category) {
        const { data, error } = await supabase
            .from('faq')
            .select('*')
            .eq('category', category);
        if (error) {
            logger.error('FAQ.getByCategory error', { error: error.message });
            return [];
        }
        return data;
    },

    /**
     * Search FAQ by keyword in a specific language
     */
    async search(keyword, lang = 'ru') {
        const questionField = `question_${lang}`;
        const answerField = `answer_${lang}`;

        const { data, error } = await supabase
            .from('faq')
            .select('*')
            .or(`${questionField}.ilike.%${keyword}%,${answerField}.ilike.%${keyword}%`);
        if (error) {
            logger.error('FAQ.search error', { error: error.message });
            return [];
        }
        return data;
    },
};

module.exports = FAQ;
