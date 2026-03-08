// Bot Multispa — Dialog Logs Model
const supabase = require('../supabase');
const logger = require('../../core/utils/logger');

const DialogLogs = {
    /**
     * Log a message (client or bot)
     */
    async log({ clientId, channel = 'telegram', language, message, role, intent }) {
        const { error } = await supabase
            .from('dialog_logs')
            .insert({
                client_id: clientId,
                channel,
                language,
                message,
                role,
                intent,
            });
        if (error) {
            logger.error('DialogLogs.log error', { error: error.message });
        }
    },

    /**
     * Get dialog history for a client
     */
    async getHistory(clientId, limit = 50) {
        const { data, error } = await supabase
            .from('dialog_logs')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: true })
            .limit(limit);
        if (error) {
            logger.error('DialogLogs.getHistory error', { error: error.message });
            return [];
        }
        return data;
    },
};

module.exports = DialogLogs;
