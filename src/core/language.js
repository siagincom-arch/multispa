// Bot Multispa — Language Detection & Management
const { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } = require('../i18n');
const logger = require('./utils/logger');

// In-memory language store (per Telegram user)
const userLanguages = new Map();

/**
 * Detect language from text input
 * Simple detection based on character sets and common words
 */
function detectLanguage(text) {
    if (!text) return null;

    const lower = text.toLowerCase().trim();

    // Check for explicit language selection
    if (/^(latviešu|latvian|🇱🇻|lv)$/i.test(lower)) return 'lv';
    if (/^(русский|russian|🇷🇺|ru)$/i.test(lower)) return 'ru';
    if (/^(english|английский|angļu|🇬🇧|en)$/i.test(lower)) return 'en';

    // Detect by Latvian-specific characters
    if (/[āčēģīķļņšūž]/i.test(lower)) return 'lv';

    // Detect by Cyrillic characters (Russian)
    if (/[а-яё]/i.test(lower)) return 'ru';

    // Default to English for Latin characters
    if (/[a-z]/i.test(lower)) return 'en';

    return null;
}

/**
 * Get user's preferred language
 */
function getUserLanguage(userId) {
    return userLanguages.get(userId) || null;
}

/**
 * Set user's preferred language
 */
function setUserLanguage(userId, lang) {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
        userLanguages.set(userId, lang);
        logger.debug('Language set', { userId, lang });
    }
}

/**
 * Check if user has selected a language
 */
function hasLanguage(userId) {
    return userLanguages.has(userId);
}

module.exports = {
    detectLanguage,
    getUserLanguage,
    setUserLanguage,
    hasLanguage,
};
