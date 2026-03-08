// Bot Multispa — Pricing Service
// Информация о ценах и тарифах

const { t } = require('../../i18n');
const logger = require('../utils/logger');

/**
 * Показать ценовую информацию
 * @param {string} lang
 * @returns {object[]}
 */
function getPriceInfo(lang) {
    return [{
        text: t(lang, 'prices_info'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'order'), data: 'order' }],
                [{ text: t(lang, 'back'), data: 'main_menu' }],
            ],
        },
    }];
}

module.exports = {
    getPriceInfo,
};
