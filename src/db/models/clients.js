// Bot Multispa — Clients Model
const supabase = require('../supabase');
const logger = require('../../core/utils/logger');

const Clients = {
    /**
     * Find or create a client by Telegram ID
     */
    async findOrCreate(telegramId, channel = 'telegram') {
        // Try to find existing client
        const { data: existing } = await supabase
            .from('clients')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();

        if (existing) return existing;

        // Create new client
        const { data, error } = await supabase
            .from('clients')
            .insert({ telegram_id: telegramId, channel })
            .select()
            .single();

        if (error) {
            logger.error('Clients.findOrCreate error', { error: error.message, telegramId });
            return null;
        }
        logger.info('New client created', { telegramId, id: data.id });
        return data;
    },

    /**
     * Update client language preference
     */
    async updateLanguage(clientId, language) {
        const { error } = await supabase
            .from('clients')
            .update({ language })
            .eq('id', clientId);
        if (error) {
            logger.error('Clients.updateLanguage error', { error: error.message, clientId });
        }
    },

    /**
     * Update client contact info
     */
    async updateContacts(clientId, { name, phone, email }) {
        const updates = {};
        if (name) updates.name = name;
        if (phone) updates.phone = phone;
        if (email) updates.email = email;

        const { error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', clientId);
        if (error) {
            logger.error('Clients.updateContacts error', { error: error.message, clientId });
        }
    },
};

module.exports = Clients;
