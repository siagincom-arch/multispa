// Bot Multispa — Main Entry Point
const { createTelegramBot } = require('./channels/telegram');
const { createWebServer } = require('./channels/web');
const supabase = require('./db/supabase');
const logger = require('./core/utils/logger');
const config = require('./config');

// Supabase keep-alive: пингуем каждые 3 дня, чтобы проект не засыпал (лимит — 7 дней)
const KEEP_ALIVE_INTERVAL = 3 * 24 * 60 * 60 * 1000; // 3 дня в мс

function startSupabaseKeepAlive() {
    const ping = async () => {
        try {
            const { error } = await supabase.from('rental_rates').select('id').limit(1);
            if (error) {
                logger.warn('⚠️ Supabase keep-alive error', { error: error.message });
            } else {
                logger.info('💚 Supabase keep-alive ping OK');
            }
        } catch (e) {
            logger.error('❌ Supabase keep-alive failed', { error: e.message });
        }
    };

    // Первый пинг сразу при старте
    ping();
    // Далее каждые 4 дня
    const timer = setInterval(ping, KEEP_ALIVE_INTERVAL);
    timer.unref(); // не блокируем завершение процесса
    return timer;
}

async function main() {
    logger.info('🏗️ Bot Multispa starting...', {
        env: config.app.env,
    });

    // Start Web widget server (Express + Socket.io)
    const { httpServer, io } = createWebServer();
    logger.info('🌐 Web channel initialized');

    // Start Telegram bot
    const bot = createTelegramBot();

    // Start polling
    await bot.start({
        onStart: (botInfo) => {
            logger.info(`✅ Bot Multispa started! @${botInfo.username}`, {
                botId: botInfo.id,
                username: botInfo.username,
            });
        },
    });

    // Запускаем keep-alive пинг Supabase
    startSupabaseKeepAlive();
    logger.info('🔄 Supabase keep-alive scheduled (every 3 days)');

    // Graceful shutdown — stop bot and server before exiting
    const shutdown = async (signal) => {
        logger.info(`${signal} received, shutting down...`);
        try {
            await bot.stop();
            io.close();
            httpServer.close(() => {
                logger.info('Server closed');
                process.exit(0);
            });
            // Force exit if server doesn't close within 5 seconds
            setTimeout(() => process.exit(0), 5000).unref();
        } catch (err) {
            logger.error('Error during shutdown', { error: err.message });
            process.exit(1);
        }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
    logger.error('Fatal error', { error: err.message, stack: err.stack });
    process.exit(1);
});
