// Bot Multispa — Telegram Channel (grammY)
const { Bot, InlineKeyboard, GrammyError, HttpError } = require('grammy');
const config = require('../../config');
const { processMessage, handleStart } = require('../../core/engine');
const { getUserLanguage } = require('../../core/language');
const DialogLogs = require('../../db/models/dialog_logs');
const Clients = require('../../db/models/clients');
const logger = require('../../core/utils/logger');
const { authMiddleware } = require('./auth');

/**
 * Create and configure the Telegram bot
 */
function createTelegramBot() {
    if (!config.bot.token) {
        logger.error('BOT_TOKEN not set in .env');
        process.exit(1);
    }

    const bot = new Bot(config.bot.token);

    // Авторизация по Telegram User ID
    bot.use(authMiddleware);

    // Error handler
    bot.catch((err) => {
        const ctx = err.ctx;
        logger.error('Bot error', {
            error: err.error?.message || err.message,
            update_id: ctx?.update?.update_id,
        });

        if (err.error instanceof GrammyError) {
            logger.error('Telegram API error', { description: err.error.description });
        } else if (err.error instanceof HttpError) {
            logger.error('HTTP error', { error: err.error });
        }
    });

    // /start command
    bot.command('start', async (ctx) => {
        const userId = ctx.from.id;
        logger.info('/start', { userId, username: ctx.from.username });

        const responses = await handleStart(userId, 'telegram');
        await sendResponses(ctx, responses);
    });

    // /help command
    bot.command('help', async (ctx) => {
        const userId = ctx.from.id;
        const lang = getUserLanguage(userId) || 'ru';
        const { t } = require('../../i18n');

        await ctx.reply(t(lang, 'timeout_message'));
    });

    // Callback queries (inline button clicks)
    bot.on('callback_query:data', async (ctx) => {
        const userId = ctx.from.id;
        const data = ctx.callbackQuery.data;

        logger.debug('Callback', { userId, data });
        await ctx.answerCallbackQuery();

        const responses = await processMessage({
            userId,
            channel: 'telegram',
            callbackData: data,
        });

        await sendResponses(ctx, responses);
    });

    // Document/file uploads
    bot.on('message:document', async (ctx) => {
        const userId = ctx.from.id;
        const file = ctx.message.document;

        logger.info('File received', { userId, fileName: file.file_name, mimeType: file.mime_type });

        const responses = await processMessage({
            userId,
            channel: 'telegram',
            files: [{ name: file.file_name, mimeType: file.mime_type, fileId: file.file_id }],
        });

        await sendResponses(ctx, responses);
    });

    // Photo uploads
    bot.on('message:photo', async (ctx) => {
        const userId = ctx.from.id;
        const photo = ctx.message.photo;
        const largest = photo[photo.length - 1];

        logger.info('Photo received', { userId, fileId: largest.file_id });

        const responses = await processMessage({
            userId,
            channel: 'telegram',
            files: [{ name: 'photo.jpg', mimeType: 'image/jpeg', fileId: largest.file_id }],
        });

        await sendResponses(ctx, responses);
    });

    // Text messages
    bot.on('message:text', async (ctx) => {
        const userId = ctx.from.id;
        const text = ctx.message.text;

        logger.debug('Text message', { userId, text: text.substring(0, 100) });

        const responses = await processMessage({
            text,
            userId,
            channel: 'telegram',
        });

        await sendResponses(ctx, responses);
    });

    return bot;
}

/**
 * Send response messages with keyboards
 */
async function sendResponses(ctx, responses) {
    for (const response of responses) {
        const options = {};

        // Build keyboard if present
        if (response.keyboard) {
            if (response.keyboard.type === 'inline') {
                const keyboard = new InlineKeyboard();
                for (const row of response.keyboard.buttons) {
                    for (const btn of row) {
                        keyboard.text(btn.text, btn.data);
                    }
                    keyboard.row();
                }
                options.reply_markup = keyboard;
            }
        }

        options.parse_mode = 'HTML';

        try {
            await ctx.reply(response.text, options);
        } catch (err) {
            logger.error('Error sending response', { error: err.message });
        }
    }
}

module.exports = { createTelegramBot };
