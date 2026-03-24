// Bot Multispa — Rental Rates Model
const supabase = require('../supabase');
const logger = require('../../core/utils/logger');

/** In-memory cache: { category -> { rate, period } } */
let cache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 минут

const RentalRates = {
    /**
     * Получить все ставки из Supabase (с кэшем)
     * @returns {Promise<Object>} { scaffolding_modular: { rate, period }, ... }
     */
    async getAll() {
        if (cache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
            return cache;
        }

        const { data, error } = await supabase
            .from('rental_rates')
            .select('category, rate, period');

        if (error) {
            logger.error('RentalRates.getAll error', { error: error.message });
            // Если кэш есть — вернуть устаревший, лучше чем ничего
            if (cache) return cache;
            return {};
        }

        const map = {};
        for (const row of data) {
            map[row.category] = { rate: parseFloat(row.rate), period: row.period };
        }

        cache = map;
        cacheTimestamp = Date.now();
        logger.info('Rental rates loaded from Supabase', { count: data.length });
        return map;
    },

    /**
     * Получить ставку по категории
     * @param {string} category
     * @returns {Promise<{rate: number, period: string}|null>}
     */
    async getByCategory(category) {
        const all = await this.getAll();
        return all[category] || null;
    },

    /** Сбросить кэш (например после обновления) */
    invalidateCache() {
        cache = null;
        cacheTimestamp = 0;
    },
};

module.exports = RentalRates;
