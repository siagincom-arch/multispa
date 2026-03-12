// Bot Multispa — Main Entry Point
const { createTelegramBot } = require('./channels/telegram');
const { createWebServer } = require('./channels/web');
const logger = require('./core/utils/logger');
const config = require('./config');

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
