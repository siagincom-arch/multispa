// Bot Multispa — i18n Manager
const lv = require('./lv.json');
const ru = require('./ru.json');
const en = require('./en.json');

const translations = { lv, ru, en };
const SUPPORTED_LANGUAGES = ['lv', 'ru', 'en'];
const DEFAULT_LANGUAGE = 'ru';

/**
 * Get translation for a key in the specified language
 * @param {string} lang - Language code (lv, ru, en)
 * @param {string} key - Translation key
 * @returns {string} Translated text
 */
function t(lang, key) {
    const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
    return translations[language][key] || translations[DEFAULT_LANGUAGE][key] || key;
}

/**
 * Get all translations for a specific language
 * @param {string} lang - Language code
 * @returns {object} All translations for that language
 */
function getTranslations(lang) {
    const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
    return translations[language];
}

module.exports = {
    t,
    getTranslations,
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE,
};
