// Bot Multispa — Supabase Connection
const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const logger = require('../core/utils/logger');

if (!config.supabase.url || !config.supabase.key) {
    logger.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(config.supabase.url, config.supabase.key);

logger.info('Supabase client initialized', { url: config.supabase.url });

module.exports = supabase;
