// Bot Multispa — Qualification Service
// Квалификация клиента: сбор данных для заявки (тип, оборудование, чертежи, сроки)

const { t } = require('../../i18n');
const { setData, getData, setState, STATES } = require('../dialog');
const logger = require('../utils/logger');

/**
 * Начать процесс заказа — спросить аренда или покупка
 * @param {string} userId
 * @param {string} lang
 * @returns {object[]}
 */
function askRentOrBuy(userId, lang) {
    setState(userId, STATES.INTEREST);
    return [{
        text: t(lang, 'ask_rent_or_buy'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'rental'), data: 'type_rent' }],
                [{ text: t(lang, 'purchase'), data: 'type_purchase' }],
                [{ text: t(lang, 'back'), data: 'main_menu' }],
            ],
        },
    }];
}

/**
 * Обработка выбора: аренда — показать категории
 * @param {string} userId
 * @param {string} lang
 * @returns {object[]}
 */
function handleRentSelected(userId, lang) {
    setData(userId, 'type', 'rent');
    setState(userId, STATES.RENT_DETAILS);
    return [{
        text: t(lang, 'ask_construction_type'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'scaffolding'), data: 'rent_scaffolding' }],
                [{ text: t(lang, 'wall_formwork'), data: 'rent_wall_formwork' }],
                [{ text: t(lang, 'slab_formwork'), data: 'rent_slab_formwork' }],
                [{ text: t(lang, 'back'), data: 'order' }],
            ],
        },
    }];
}

/**
 * Обработка выбора: покупка — показать категории
 * @param {string} userId
 * @param {string} lang
 * @returns {object[]}
 */
function handlePurchaseSelected(userId, lang) {
    setData(userId, 'type', 'purchase');
    setState(userId, STATES.BUY_DETAILS);
    return [{
        text: t(lang, 'ask_equipment_type'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'scaffolding'), data: 'buy_scaffolding' }],
                [{ text: t(lang, 'wall_formwork'), data: 'buy_wall_formwork' }],
                [{ text: t(lang, 'slab_formwork'), data: 'buy_slab_formwork' }],
                [{ text: t(lang, 'back'), data: 'order' }],
            ],
        },
    }];
}

/**
 * Обработка выбора категории для аренды — спросить про чертежи
 * @param {string} userId
 * @param {string} category
 * @param {string} lang
 * @returns {object[]}
 */
function handleRentCategory(userId, category, lang) {
    setData(userId, 'equipment_category', category);
    return [{
        text: t(lang, 'ask_has_drawings'),
        keyboard: {
            type: 'inline',
            buttons: [
                [{ text: t(lang, 'yes'), data: 'has_drawings_yes' }],
                [{ text: t(lang, 'no'), data: 'has_drawings_no' }],
            ],
        },
    }];
}

/**
 * Обработка выбора категории для покупки — спросить количество
 * @param {string} userId
 * @param {string} category
 * @param {string} lang
 * @returns {object[]}
 */
function handleBuyCategory(userId, category, lang) {
    setData(userId, 'equipment_category', category);
    return [{
        text: t(lang, 'ask_quantity'),
    }];
}

/**
 * Обработка ответа «Есть чертежи» — запросить файл
 * @param {string} userId
 * @param {string} lang
 * @returns {object[]}
 */
function handleHasDrawings(userId, lang) {
    setData(userId, 'has_drawings', true);
    setState(userId, STATES.AWAITING_FILE);
    return [{
        text: t(lang, 'upload_drawing') + '\n📎',
    }];
}

/**
 * Обработка ответа «Нет чертежей» — спросить срок
 * @param {string} userId
 * @param {string} lang
 * @returns {object[]}
 */
function handleNoDrawings(userId, lang) {
    setData(userId, 'has_drawings', false);
    return [{
        text: t(lang, 'ask_duration'),
    }];
}

module.exports = {
    askRentOrBuy,
    handleRentSelected,
    handlePurchaseSelected,
    handleRentCategory,
    handleBuyCategory,
    handleHasDrawings,
    handleNoDrawings,
};
