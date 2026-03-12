// Bot Multispa — Main Engine (Message Router)
const { t, SUPPORTED_LANGUAGES } = require('../i18n');
const { getUserLanguage, setUserLanguage, detectLanguage } = require('./language');
const { STATES, getState, setState, setData, getData, getAllData, resetSession } = require('./dialog');
const { recognizeIntent, intentToAction } = require('./intents');
const knowledge = require('./knowledge');
const Clients = require('../db/models/clients');
const Inquiries = require('../db/models/inquiries');
const DialogLogs = require('../db/models/dialog_logs');
const logger = require('./utils/logger');

// Services
const consultation = require('./services/consultation');
const qualification = require('./services/qualification');
const pricing = require('./services/pricing');
const documents = require('./services/documents');
const contacts = require('./services/contacts');

/**
 * Detect language from text and log client message (shared logic)
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
 * Process incoming message and return response(s)
 * @param {object} msg - Unified message: { text, userId, channel, files }
 * @returns {object[]} - Array of responses: [{ text, keyboard?, type }]
 */
async function processMessage({ text, userId, channel = 'telegram', files, callbackData }) {
    const state = getState(userId);
    const lang = getUserLanguage(userId);

    logger.debug('Processing message', { userId, state, text: text?.substring(0, 50), callbackData });

    // Handle callback data from inline keyboards
    if (callbackData) {
        return handleCallback(userId, callbackData, lang, channel);
    }

    // Handle file uploads
    if (files && files.length > 0) {
        return documents.handleFileReceived(userId, files, lang, channel);
    }

    // State machine
    switch (state) {
        case STATES.WELCOME:
            return handleWelcome(userId, text, channel);

        case STATES.AWAITING_AREA:
            return handleAreaInput(userId, text, lang, channel);

        case STATES.LANGUAGE_SELECTED:
        case STATES.MAIN_MENU:
            return handleMainMenuInput(userId, text, lang, channel);

        case STATES.CONTACTS:
            return handleContactsInput(userId, text, lang, channel);

        default:
            return handleMainMenuInput(userId, text, lang, channel);
    }
}

/**
 * Handle /start — send welcome message
 */
async function handleStart(userId, channel) {
    resetSession(userId);

    // Find or create client
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
 * Handle welcome state
 */
async function handleWelcome(userId, text, channel) {
    // Try to detect language from text
    const detected = detectLanguage(text);
    if (detected) {
        return selectLanguage(userId, detected, channel);
    }

    // If language not detected, ask again
    return handleStart(userId, channel);
}

/**
 * Select language and show main menu
 */
async function selectLanguage(userId, lang, channel) {
    setUserLanguage(userId, lang);
    setState(userId, STATES.MAIN_MENU);

    // Update client language in DB
    const client = await Clients.findOrCreate(userId, channel);
    if (client) {
        await Clients.updateLanguage(client.id, lang);
    }

    return [{
        text: t(lang, 'lang_selected'),
    }, {
        text: t(lang, 'main_menu'),
        keyboard: getMainMenuKeyboard(lang),
    }];
}

/**
 * Callback handlers — exact match
 */
const callbackHandlers = {
    equipment: (userId, lang) => {
        setState(userId, STATES.EQUIPMENT_BROWSE);
        return consultation.getEquipmentCategories(lang);
    },
    consultation: (userId, lang) => {
        setState(userId, STATES.CONSULTATION);
        return consultation.getConsultationHelp(lang);
    },
    compare_scaffolding: (_userId, lang) => consultation.getScaffoldingComparison(lang),
    compare_formwork: (_userId, lang) => consultation.getFormworkComparison(lang),
    estimate_price: (userId, lang) => pricing.askEstimateCategory(userId, lang),
    prices: (_userId, lang) => pricing.getPriceInfo(lang),
    order: (userId, lang) => qualification.askRentOrBuy(userId, lang),
    type_rent: (userId, lang) => qualification.handleRentSelected(userId, lang),
    has_drawings_yes: (userId, lang) => qualification.handleHasDrawings(userId, lang),
    has_drawings_no: (userId, lang) => qualification.handleNoDrawings(userId, lang),
    type_purchase: (userId, lang) => qualification.handlePurchaseSelected(userId, lang),
    contacts: (_userId, lang) => contacts.getCompanyContacts(lang),
    working_hours: (_userId, lang) => contacts.getWorkingHours(lang),
    specialist: (_userId, lang) => contacts.redirectToSpecialist(lang),
    delivery: (userId, lang) => contacts.askForContacts(userId, lang),
    upload: (userId, lang) => documents.requestFileUpload(userId, lang),
    main_menu: (userId, lang) => {
        setState(userId, STATES.MAIN_MENU);
        return [{ text: t(lang, 'main_menu'), keyboard: getMainMenuKeyboard(lang) }];
    },
};

/**
 * Callback handlers — prefix match (order matters: checked top to bottom)
 */
const prefixHandlers = [
    {
        prefix: 'lang_',
        handler: (userId, value, lang, channel) => {
            if (!SUPPORTED_LANGUAGES.includes(value)) {
                logger.warn('Invalid language callback', { userId, value });
                return [{ text: t(lang || 'ru', 'main_menu'), keyboard: getMainMenuKeyboard(lang || 'ru') }];
            }
            return selectLanguage(userId, value, channel);
        },
    },
    {
        prefix: 'cat_',
        handler: (_userId, value, lang) => consultation.getEquipmentInfo(value, lang),
    },
    {
        prefix: 'est_',
        handler: (userId, value, lang) => pricing.askForArea(userId, value, lang),
    },
    {
        prefix: 'rent_',
        handler: (userId, value, lang) => qualification.handleRentCategory(userId, value, lang),
    },
    {
        prefix: 'buy_',
        handler: (userId, value, lang) => qualification.handleBuyCategory(userId, value, lang),
    },
];

/**
 * Handle callback data from inline buttons
 */
async function handleCallback(userId, data, lang, channel) {
    // Limit callback data length (Telegram allows 64 bytes, web has no limit)
    if (typeof data !== 'string' || data.length > 64) {
        logger.warn('Invalid callback data', { userId, dataLength: data?.length });
        return [{ text: t(lang || 'ru', 'main_menu'), keyboard: getMainMenuKeyboard(lang || 'ru') }];
    }

    // Exact match handlers
    const exactHandler = callbackHandlers[data];
    if (exactHandler) {
        return exactHandler(userId, lang, channel);
    }

    // Prefix match handlers
    for (const { prefix, handler } of prefixHandlers) {
        if (data.startsWith(prefix)) {
            const value = data.slice(prefix.length);
            return handler(userId, value, lang, channel);
        }
    }

    // FAQ — requires async, handled separately
    if (data === 'faq') {
        const faqItems = await knowledge.getFAQ(lang);
        if (faqItems.length === 0) {
            return [{ text: '❓ ...', keyboard: getBackKeyboard(lang) }];
        }
        const faqText = faqItems.map(f => `❓ *${f.question}*\n${f.answer}`).join('\n\n');
        return [{ text: faqText, keyboard: getBackKeyboard(lang) }];
    }

    // Unknown callback — return to main menu
    logger.warn('Unknown callback data', { userId, data });
    return [{ text: t(lang || 'ru', 'main_menu'), keyboard: getMainMenuKeyboard(lang || 'ru') }];
}

/**
 * Handle text input when awaiting area (m²) for price estimate
 */
async function handleAreaInput(userId, text, lang, channel) {
    if (!text) return [];

    const ctx = await withClientContext(userId, text, lang, channel);
    return pricing.handleAreaInput(userId, text, ctx.lang);
}

/**
 * Handle text input from main menu state
 */
async function handleMainMenuInput(userId, text, lang, channel) {
    if (!text) return [];

    const ctx = await withClientContext(userId, text, lang, channel);
    lang = ctx.lang;

    // If in contacts state, save contact info
    if (getState(userId) === STATES.CONTACTS) {
        return contacts.handleContactInput(userId, text, lang, channel);
    }

    // Recognize intent using intents module
    const { intent } = recognizeIntent(text);
    const action = intentToAction(intent);

    if (action) {
        // Log recognized intent
        if (ctx.client) {
            await DialogLogs.log({
                clientId: ctx.client.id,
                channel,
                language: lang,
                message: `[intent: ${intent}]`,
                role: 'bot',
                intent,
            });
        }
        return handleCallback(userId, action, lang, channel);
    }

    // Default: show main menu
    return [{
        text: t(lang, 'main_menu'),
        keyboard: getMainMenuKeyboard(lang),
    }];
}

/**
 * Handle contacts input (delegates to contacts service)
 */
async function handleContactsInput(userId, text, lang, channel) {
    if (!text) return [];

    const ctx = await withClientContext(userId, text, lang, channel);
    return contacts.handleContactInput(userId, text, ctx.lang, channel);
}

/**
 * Generate main menu keyboard
 */
function getMainMenuKeyboard(lang) {
    return {
        type: 'inline',
        buttons: [
            [{ text: t(lang, 'consultation'), data: 'consultation' }],
            [{ text: t(lang, 'equipment'), data: 'equipment' }],
            [{ text: t(lang, 'prices'), data: 'prices' }],
            [{ text: t(lang, 'estimate_price'), data: 'estimate_price' }],
            [{ text: t(lang, 'order'), data: 'order' }],
            [{ text: t(lang, 'upload_drawing'), data: 'upload' }],
            [{ text: t(lang, 'faq'), data: 'faq' }],
            [{ text: t(lang, 'contacts'), data: 'contacts' }],
            [{ text: t(lang, 'working_hours'), data: 'working_hours' }],
        ],
    };
}

/**
 * Generate back keyboard
 */
function getBackKeyboard(lang) {
    return {
        type: 'inline',
        buttons: [
            [{ text: t(lang, 'back'), data: 'main_menu' }],
        ],
    };
}

module.exports = {
    processMessage,
    handleStart,
};
