// Bot Multispa — Inquiries Model
const supabase = require('../supabase');
const logger = require('../../core/utils/logger');

const Inquiries = {
    /**
     * Create a new inquiry
     */
    async create(inquiryData) {
        const { data, error } = await supabase
            .from('inquiries')
            .insert(inquiryData)
            .select()
            .single();
        if (error) {
            logger.error('Inquiries.create error', { error: error.message });
            return null;
        }
        logger.info('New inquiry created', { id: data.id, type: data.type });
        return data;
    },

    /**
     * Get inquiries by client ID
     */
    async getByClientId(clientId) {
        const { data, error } = await supabase
            .from('inquiries')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        if (error) {
            logger.error('Inquiries.getByClientId error', { error: error.message });
            return [];
        }
        return data;
    },

    /**
     * Update inquiry status
     */
    async updateStatus(inquiryId, status) {
        const { error } = await supabase
            .from('inquiries')
            .update({ status })
            .eq('id', inquiryId);
        if (error) {
            logger.error('Inquiries.updateStatus error', { error: error.message });
        }
    },
};

module.exports = Inquiries;
