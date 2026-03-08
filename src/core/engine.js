// Bot Multispa — Main Engine (Message Router)
const { t } = require('../i18n');
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
 * Handle callback data from inline buttons
 */
async function handleCallback(userId, data, lang, channel) {
    // Language selection
    if (data.startsWith('lang_')) {
        const selectedLang = data.replace('lang_', '');
        return selectLanguage(userId, selectedLang, channel);
    }

    // Equipment categories
    if (data === 'equipment') {
        setState(userId, STATES.EQUIPMENT_BROWSE);
        return consultation.getEquipmentCategories(lang);
    }

    // Equipment category selected
    if (data.startsWith('cat_')) {
        const category = data.replace('cat_', '');
        return consultation.getEquipmentInfo(category, lang);
    }

    // Prices
    if (data === 'prices') {
        return pricing.getPriceInfo(lang);
    }

    // Order (rent or buy)
    if (data === 'order') {
        return qualification.askRentOrBuy(userId, lang);
    }

    // Rent selected
    if (data === 'type_rent') {
        return qualification.handleRentSelected(userId, lang);
    }

    // Rent category selected → ask for details
    if (data.startsWith('rent_')) {
        const equipCat = data.replace('rent_', '');
        return qualification.handleRentCategory(userId, equipCat, lang);
    }

    // Has drawings?
    if (data === 'has_drawings_yes') {
        return qualification.handleHasDrawings(userId, lang);
    }

    if (data === 'has_drawings_no') {
        return qualification.handleNoDrawings(userId, lang);
    }

    // Purchase selected
    if (data === 'type_purchase') {
        return qualification.handlePurchaseSelected(userId, lang);
    }

    if (data.startsWith('buy_')) {
        const equipCat = data.replace('buy_', '');
        return qualification.handleBuyCategory(userId, equipCat, lang);
    }

    // FAQ
    if (data === 'faq') {
        const faqItems = await knowledge.getFAQ(lang);
        if (faqItems.length === 0) {
            return [{ text: '❓ ...', keyboard: getBackKeyboard(lang) }];
        }
        const faqText = faqItems.map(f => `❓ *${f.question}*\n${f.answer}`).join('\n\n');
        return [{
            text: faqText,
            keyboard: getBackKeyboard(lang),
        }];
    }

    // Contacts
    if (data === 'contacts') {
        return contacts.getCompanyContacts(lang);
    }

    // Working hours
    if (data === 'working_hours') {
        return contacts.getWorkingHours(lang);
    }

    // Specialist redirect
    if (data === 'specialist') {
        return contacts.redirectToSpecialist(lang);
    }

    // Delivery
    if (data === 'delivery') {
        return contacts.askForContacts(userId, lang);
    }

    // Upload drawing
    if (data === 'upload') {
        return documents.requestFileUpload(userId, lang);
    }

    // Back to main menu
    if (data === 'main_menu') {
        setState(userId, STATES.MAIN_MENU);
        return [{
            text: t(lang, 'main_menu'),
            keyboard: getMainMenuKeyboard(lang),
        }];
    }

    // Default
    return [{
        text: t(lang, 'main_menu'),
        keyboard: getMainMenuKeyboard(lang),
    }];
}

/**
 * Handle text input from main menu state
 */
async function handleMainMenuInput(userId, text, lang, channel) {
    if (!text) return [];

    // Log client message
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

    // If in contacts state, save contact info
    if (getState(userId) === STATES.CONTACTS) {
        return contacts.handleContactInput(userId, text, lang, channel);
    }

    // Recognize intent using intents module
    const { intent } = recognizeIntent(text);
    const action = intentToAction(intent);

    if (action) {
        // Log recognized intent
        if (client) {
            await DialogLogs.log({
                clientId: client.id,
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

// handleContactsInput moved to services/contacts.js

// handleFileUpload moved to services/documents.js

/**
 * Generate main menu keyboard
 */
function getMainMenuKeyboard(lang) {
    return {
        type: 'inline',
        buttons: [
            [{ text: t(lang, 'equipment'), data: 'equipment' }],
            [{ text: t(lang, 'prices'), data: 'prices' }],
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
