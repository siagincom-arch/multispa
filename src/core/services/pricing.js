// Bot Multispa — Pricing Service
// Информация о ценах, ориентировочный расчёт стоимости аренды
// Ставки загружаются из Supabase (таблица rental_rates)

const { t } = require('../../i18n');
const { setState, setData, getData, STATES } = require('../dialog');
const RentalRates = require('../../db/models/rental_rates');
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
                [{ text: t(lang, 'estimate_price'), data: 'estimate_price' }],
                [{ text: t(lang, 'order'), data: 'order' }],
                [{ text: t(lang, 'back'), data: 'main_menu' }],
            ],
        },
    }];
}

/**
 * Показать выбор категории для расчёта
 * @param {string} userId
 * @param {string} lang
 * @returns {object[]}
 */
function askEstimateCategory(userId, lang) {
    return [{
        text: t(lang, 'ask_estimate_category'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'modular_scaffolding'), data: 'est_scaffolding_modular' }],
                [{ text: t(lang, 'frame_scaffolding'), data: 'est_scaffolding_frame' }],
                [{ text: t(lang, 'wall_formwork'), data: 'est_wall_formwork' }],
                [{ text: t(lang, 'slab_formwork'), data: 'est_slab_formwork' }],
                [{ text: t(lang, 'back'), data: 'main_menu' }],
            ],
        },
    }];
}

/**
 * Запросить площадь для расчёта
 * @param {string} userId
 * @param {string} category — тип оборудования для расчёта
 * @param {string} lang
 * @returns {object[]}
 */
function askForArea(userId, category, lang) {
    setData(userId, 'estimate_category', category);
    setState(userId, STATES.AWAITING_AREA);
    return [{
        text: t(lang, 'ask_area'),
    }];
}

/**
 * Обработать ввод площади и рассчитать ориентировочную цену
 * Ставки загружаются из Supabase
 * @param {string} userId
 * @param {string} text — текст с числом (площадь в м²)
 * @param {string} lang
 * @returns {Promise<object[]>}
 */
async function handleAreaInput(userId, text, lang) {
    // Извлечь число из текста
    const areaMatch = text.replace(',', '.').match(/[\d.]+/);
    if (!areaMatch) {
        return [{
            text: t(lang, 'invalid_area'),
        }];
    }

    const area = parseFloat(areaMatch[0]);
    if (isNaN(area) || area <= 0) {
        return [{
            text: t(lang, 'invalid_area'),
        }];
    }

    const category = getData(userId, 'estimate_category');
    const priceData = await RentalRates.getByCategory(category);

    if (!priceData) {
        logger.warn('Unknown estimate category', { category });
        return askEstimateCategory(userId, lang);
    }

    const total = (area * priceData.rate).toFixed(2);

    // Выбрать шаблон в зависимости от категории
    const templateKey = `estimate_result_${category}`;
    let resultText = t(lang, templateKey);
    resultText = resultText.replace('{area}', area).replace('{total}', total);

    // Добавить дисклеймер
    resultText += t(lang, 'price_estimate_disclaimer');

    // Выйти из состояния ожидания площади
    setState(userId, STATES.MAIN_MENU);

    return [{
        text: resultText,
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'order'), data: 'order' }],
                [{ text: t(lang, 'contact_specialist'), data: 'specialist' }],
                [{ text: t(lang, 'back'), data: 'main_menu' }],
            ],
        },
    }];
}

module.exports = {
    getPriceInfo,
    askEstimateCategory,
    askForArea,
    handleAreaInput,
};
