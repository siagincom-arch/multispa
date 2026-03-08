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
    createWebServer();
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
}

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Shutting down...');
    process.exit(0);
});

main().catch((err) => {
    logger.error('Fatal error', { error: err.message, stack: err.stack });
    process.exit(1);
});
