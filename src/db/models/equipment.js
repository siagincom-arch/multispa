// Bot Multispa — Equipment Model
const supabase = require('../supabase');
const logger = require('../../core/utils/logger');

const Equipment = {
    /**
     * Get all equipment items
     */
    async getAll() {
        const { data, error } = await supabase
            .from('equipment')
            .select('*, prices(*)');
        if (error) {
            logger.error('Equipment.getAll error', { error: error.message });
            return [];
        }
        return data;
    },

    /**
     * Get equipment by category
     * @param {string} category - scaffolding | wall_formwork | slab_formwork
     */
    async getByCategory(category) {
        const { data, error } = await supabase
            .from('equipment')
            .select('*, prices(*)')
            .eq('category', category);
        if (error) {
            logger.error('Equipment.getByCategory error', { error: error.message, category });
            return [];
        }
        return data;
    },

    /**
     * Get equipment by ID
     */
    async getById(id) {
        const { data, error } = await supabase
            .from('equipment')
            .select('*, prices(*)')
            .eq('id', id)
            .single();
        if (error) {
            logger.error('Equipment.getById error', { error: error.message, id });
            return null;
        }
        return data;
    },
};

module.exports = Equipment;
