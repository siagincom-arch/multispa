// Bot Multispa — Main Engine (AI-first, no menu buttons)
const { t, SUPPORTED_LANGUAGES } = require('../i18n');
const { getUserLanguage, setUserLanguage, detectLanguage } = require('./language');
const { STATES, getState, setState, resetSession } = require('./dialog');
const Clients = require('../db/models/clients');
const DialogLogs = require('../db/models/dialog_logs');
const logger = require('./utils/logger');

// Services
const documents = require('./services/documents');
const contacts = require('./services/contacts');
const ai = require('./services/ai');

/**
 * Log client message and detect language
 */
async function withClientContext(userId, text, lang, channel) {
    const detectedLang = detectLanguage(text);
    if (detectedLang && detectedLang !== lang) {
        setUserLanguage(userId, detectedLang);
        lang = detectedLang;
    }

    const client = await Clients.findOrCreate(userId, channel);
    if (client) {
        await DialogLogs.log({
            clientId: client.id,
            channel,
            language: lang,
            message: text,
            role: 'client',
        });
    }

    return { lang, client };
}

/**
 * Process incoming message — all free text goes to AI
 */
async function processMessage({ text, userId, channel = 'telegram', files, callbackData }) {
    const state = getState(userId);
    const lang = getUserLanguage(userId);

    logger.debug('Processing message', { userId, state, text: text?.substring(0, 50), callbackData });

    // Handle callback data (language selection only)
    if (callbackData) {
        return handleCallback(userId, callbackData, lang, channel);
    }

    // Handle file uploads
    if (files && files.length > 0) {
        return documents.handleFileReceived(userId, files, lang, channel);
    }

    // Welcome state — detect language
    if (state === STATES.WELCOME) {
        return handleWelcome(userId, text, channel);
    }

    // Contacts state — collecting contact info
    if (state === STATES.CONTACTS) {
        const ctx = await withClientContext(userId, text, lang, channel);
        return contacts.handleContactInput(userId, text, ctx.lang, channel);
    }

    // All other text — send to AI
    return handleAIResponse(userId, text, lang, channel);
}

/**
 * Handle /start — welcome + language selection
 */
async function handleStart(userId, channel) {
    resetSession(userId);
    ai.clearHistory(userId);
    await Clients.findOrCreate(userId, channel);

    return [{
        text: t('ru', 'welcome') + '\n\n' + t('ru', 'choose_language'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: '🇱🇻 Latviešu', data: 'lang_lv' }],
                [{ text: '🇷🇺 Русский', data: 'lang_ru' }],
                [{ text: '🇬🇧 English', data: 'lang_en' }],
            ],
        },
    }];
}

/**
 * Handle welcome state — detect language from text
 */
async function handleWelcome(userId, text, channel) {
    const detected = detectLanguage(text);
    if (detected) {
        return selectLanguage(userId, detected, channel);
    }
    return handleStart(userId, channel);
}

/**
 * Select language and greet
 */
async function selectLanguage(userId, lang, channel) {
    setUserLanguage(userId, lang);
    setState(userId, STATES.MAIN_MENU);

    const client = await Clients.findOrCreate(userId, channel);
    if (client) {
        await Clients.updateLanguage(client.id, lang);
    }

    const greeting = await ai.generateResponse(t(lang, 'lang_selected'), lang, 'greet');

    return [{
        text: greeting || t(lang, 'lang_selected') + '\n\n' + t(lang, 'main_menu'),
    }];
}

/**
 * Handle callback data — only language selection remains
 */
async function handleCallback(userId, data, lang, channel) {
    if (typeof data !== 'string' || data.length > 64) {
        logger.warn('Invalid callback data', { userId, dataLength: data?.length });
        return [{ text: '...' }];
    }

    // Language selection
    if (data.startsWith('lang_')) {
        const value = data.slice(5);
        if (!SUPPORTED_LANGUAGES.includes(value)) {
            logger.warn('Invalid language callback', { userId, value });
            return handleStart(userId, channel);
        }
        return selectLanguage(userId, value, channel);
    }

    // Any other callback — ignore (no more menu buttons)
    logger.warn('Unknown callback data', { userId, data });
    return [{ text: '...' }];
}

/**
 * All free text goes through AI
 */
async function handleAIResponse(userId, text, lang, channel) {
    if (!text) return [];

    const ctx = await withClientContext(userId, text, lang, channel);
    lang = ctx.lang;

    const aiResponse = await ai.generateResponse(text, lang, null, userId);

    if (aiResponse) {
        if (ctx.client) {
            await DialogLogs.log({
                clientId: ctx.client.id,
                channel,
                language: lang,
                message: aiResponse,
                role: 'bot',
                intent: 'ai_response',
            });
        }
        return [{ text: aiResponse }];
    }

    // AI unavailable — simple fallback
    return [{ text: t(lang, 'main_menu') }];
}

module.exports = {
    processMessage,
    handleStart,
};
